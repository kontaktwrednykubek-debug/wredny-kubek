import { NextRequest, NextResponse } from "next/server";
import { geminiChat, geminiEmbed } from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const COMMENT_PROMPT = `Jesteś "Wredny Doradca" — ironiczny asystent sklepu wrednykubek.pl.
Dostałeś 3 odpowiedzi quizu (dla kogo, styl życia, charakter) i listę znalezionych kubków.
Napisz KRÓTKI (1-2 zdania), złośliwy-ale-miły komentarz po polsku, który pasuje do wyboru klienta.
Zero wulgaryzmów. Nie wymieniaj nazw kubków — to zrobi UI. Zakończ zachętą do kupna.`;

// Map quiz answers to DB category slugs
const CATEGORY_MAP: Record<string, string[]> = {
  "Dla taty": ["kierownik-tego-cyrku", "pasje", "charakterne"],
  "Dla mamy": ["personalizacja-i-okazje", "charakterne"],
  "Dla dziadka / babci": ["charakterne", "pasje"],
  "Dla dziecka": ["zodiak-i-astrologia", "merch"],
  "Dla szefa / szefowej": ["kierownik-tego-cyrku"],
  "Dla kumpla z pracy": ["kierownik-tego-cyrku", "charakterne", "pasje"],
  "Dla siebie": ["mystery-box", "charakterne", "zodiak-i-astrologia"],
  "Ironista / sarkasta": ["charakterne", "kierownik-tego-cyrku"],
  "Wesoły pozytywiak": ["personalizacja-i-okazje", "zodiak-i-astrologia"],
  "Poważny i skupiony": ["kierownik-tego-cyrku"],
  "Romantyczny / wrażliwy": ["personalizacja-i-okazje", "pamietniki-wampirow"],
  "Chroniczny marudzący": ["charakterne", "kierownik-tego-cyrku", "pasje"],
};

function getCategoriesFromAnswers(forWhom: string, character: string): string[] {
  const a = CATEGORY_MAP[forWhom] ?? [];
  const b = CATEGORY_MAP[character] ?? [];
  return [...new Set([...a, ...b])];
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { forWhom, style, character } = await req.json();
  const supabase = createSupabaseServerClient();

  // 1. Try vector search first
  let products: unknown[] = [];
  let isFallback = false;

  try {
    const searchQuery = `kubek prezent ${forWhom} ${style} ${character} humor`;
    const embedding = await geminiEmbed(searchQuery);
    const { data } = await supabase.rpc("match_products", {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 6,
    });
    products = data ?? [];
  } catch {
    products = [];
  }

  // 2. Fallback: category-based query when no vector results
  if (products.length === 0) {
    isFallback = true;
    const cats = getCategoriesFromAnswers(forWhom, character);

    let query = supabase
      .from("shop_products")
      .select("id, slug, title, description, price_grosze, images, category")
      .eq("is_published", true)
      .limit(6);

    if (cats.length > 0) {
      query = query.in("category", cats);
    }

    const { data: catData } = await query.order("created_at", { ascending: false });

    if (!catData || catData.length === 0) {
      // Last resort: any 6 published products
      const { data: any6 } = await supabase
        .from("shop_products")
        .select("id, slug, title, description, price_grosze, images, category")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);
      products = any6 ?? [];
    } else {
      products = catData;
    }
  }

  // 3. Gemini writes witty comment
  let comment = "Znalazłem coś dla Ciebie. Nie dziękuj — i tak wiem, że wybierzesz źle.";
  try {
    const userMsg = `Dla kogo: ${forWhom}. Styl: ${style}. Charakter: ${character}. Znaleziono: ${products.length} kubków${isFallback ? " (dopasowanie po kategorii)" : " (dopasowanie semantyczne)"}.`;
    comment = await geminiChat([{ role: "user", content: userMsg }], COMMENT_PROMPT);
  } catch {
    // keep fallback comment
  }

  return NextResponse.json({ comment, products, isFallback });
}
