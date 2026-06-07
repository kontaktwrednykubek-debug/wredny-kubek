import { NextRequest, NextResponse } from "next/server";
import { geminiChat, geminiEmbed } from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const COMMENT_PROMPT = `Jesteś "Wredny Doradca" — ironiczny asystent sklepu wrednykubek.pl.
Dostałeś 3 odpowiedzi quizu (dla kogo, styl życia, charakter) i listę znalezionych kubków.
Napisz KRÓTKI (1-2 zdania), złośliwy-ale-miły komentarz po polsku, który pasuje do wyboru klienta.
Zero wulgaryzmów. Nie wymieniaj nazw kubków — to zrobi UI. Zakończ zachętą do kupna.`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { forWhom, style, character } = await req.json();

  // Build semantic search query from 3 quiz answers
  const searchQuery = `kubek prezent ${forWhom} ${style} ${character} humor`;

  // 1. Embed the search query
  let products: unknown[] = [];
  try {
    const embedding = await geminiEmbed(searchQuery);
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.rpc("match_products", {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 3,
    });
    products = data ?? [];
  } catch {
    products = [];
  }

  // 2. Gemini writes a witty comment about the results
  let comment = "Znalazłem coś odpowiedniego. Nie dziękuj.";
  try {
    const userMsg = `Dla kogo: ${forWhom}. Styl: ${style}. Charakter: ${character}. Liczba znalezionych kubków: ${products.length}.`;
    comment = await geminiChat(
      [{ role: "user", content: userMsg }],
      COMMENT_PROMPT,
    );
  } catch {
    // fallback comment stays
  }

  return NextResponse.json({ comment, products });
}
