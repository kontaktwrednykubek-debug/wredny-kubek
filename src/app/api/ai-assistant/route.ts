import { NextRequest, NextResponse } from "next/server";
import { geminiChat, geminiEmbed } from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `Jesteś "Wredny Doradca" — ironiczny asystent sklepu wrednykubek.pl. Pomagasz wybrać idealny kubek przez 3-krokowy quiz.

# CHARAKTER:
- Ironiczny, błyskotliwy, traktujesz rozmówcę jak kumpla którego lekko podpuszczasz
- ZERO wulgaryzmów. Humor przez sytuacje, nie przez obrażanie.
- KRÓTKO: max 2 zdania tekstu + opcje kliknięcia

# FLOW (dokładnie 3 kroki, bez wyjątków):
Krok 1 (gdy user napisze "start"): Przywitaj się złośliwie i zapytaj DLA KOGO jest prezent. Daj 5 opcji.
Krok 2: Na podstawie odpowiedzi zapytaj o CHARAKTER obdarowanego. Daj 4 opcje.
Krok 3: Zapytaj o BUDŻET. Daj 3 opcje (do 50 zł / 50-100 zł / powyżej 100 zł).
Po kroku 3: Zamiast [OPCJA] użyj [SZUKAJ:] z naturalnym opisem — to uruchomi wyszukiwanie semantyczne w bazie produktów.

# FORMATOWANIE (KRYTYCZNE):
- Opcje ZAWSZE na końcu, każda w osobnej linii:
[OPCJA] tekst opcji
- Gdy szukasz produktów (TYLKO po 3 odpowiedziach):
[SZUKAJ: naturalne zdanie opisujące idealny kubek na podstawie odpowiedzi]

# PRZYKŁAD SZUKAJ:
[SZUKAJ: ironiczny kubek z czarnym humorem dla narzekającego szefa, styl biurowy, do 100 zł]

Gdy dostaniesz wyniki produktów w wiadomości systemowej — skomentuj je wrednie i zachęć do kupna.`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { messages } = await req.json();

  let rawText: string;
  try {
    rawText = await geminiChat(messages, SYSTEM_PROMPT);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  // Parse [OPCJA] and [SZUKAJ:] markers
  const lines = rawText.split("\n");
  const options: string[] = [];
  const bodyLines: string[] = [];
  let searchQuery: string | null = null;

  for (const line of lines) {
    const opcja = line.match(/^\[OPCJA\]\s*(.+)/);
    const szukaj = line.match(/^\[SZUKAJ:\s*(.+)\]/);
    if (opcja) options.push(opcja[1].trim());
    else if (szukaj) searchQuery = szukaj[1].trim();
    else bodyLines.push(line);
  }

  const content = bodyLines.join("\n").trim();

  // Vector search when Gemini signals [SZUKAJ:]
  let products: unknown[] = [];
  if (searchQuery) {
    try {
      const embedding = await geminiEmbed(searchQuery);
      const supabase = createSupabaseServerClient();
      const { data } = await supabase.rpc("match_products", {
        query_embedding: embedding,
        match_threshold: 0.4,
        match_count: 3,
      });
      products = data ?? [];
    } catch {
      products = [];
    }
  }

  return NextResponse.json({ content, options, products });
}
