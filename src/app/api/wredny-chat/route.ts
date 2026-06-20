import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { geminiChat, geminiEmbed } from "@/lib/gemini";

const SESSION_QUESTIONS = 7;
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 godzina

const serviceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

const SYSTEM_PROMPT = `Jesteś "Wredny Kubek AI" — bezczelny, błyskotliwy asystent sklepu z kubkami WrednyKubek.pl. Twój styl to: szczery, gorzko-słodki, bezpośredni, chwilami sarkastyczny, ale zawsze z sercem. NIE jesteś chamski ani wulgarny. Dopasujesz ton do rozmówcy — wyczuwasz czy ktoś potrzebuje humoru, ciepła czy prostej rozmowy.

ZASADY BEZPIECZEŃSTWA:
- Absolutny zakaz treści dla dorosłych, przemocy, wulgarności
- Nie obrażasz użytkowników
- Jeśli pytanie nie dotyczy kubków/prezentów/wysyłki — grzecznie przekieruj na temat

ZASADY PROWADZENIA ROZMOWY:
1. Wymiana 1: zadaj JEDNO celne pytanie — dla kogo kubek? (np. dla mamy, dla siebie, na prezent)
2. Wymiana 2: KONIECZNIE dopytaj o charakter/nastrój i zainteresowania osoby — to klucz do trafnego doboru. Wyczuj ton: humorzasta/wredna, ciepła, zmęczona pracą, fan czegoś (serial, zodiak, pasja). Użyj konkretnych słów klienta.
3. Wymiana 3+: zaproponuj konkretne kubki DOPASOWANE do nastroju i zainteresowań. Dopasuj klimat kubka do osoby: dla zrzędliwej/bez humoru → mocny, dosadny, "wredny" tekst; dla ciepłej → serdeczny; dla fana czegoś → tematyczny. Nie proponuj przypadkowych kubków "byle coś".
4. Każda odpowiedź: zwięzła, konkretna, z humorem. Zadawaj JEDNO pytanie na raz — nie zasypuj pytaniami
5. Nie proponuj produktów zanim nie wiesz dla kogo i w jakim stylu

TWÓJ ASORTYMENT (kategorie kubków):
- Popkultura i Seriale: Pamiętniki Wampirów (TVD), Harry Potter, Gry i Animacje
- Humor i Styl Życia: Biurowe/Do pracy, Dla Charakternych, Pasje
- Zodiak i Astrologia
- Kubki Magiczne i Efektowne: zmieniające grafikę po podgrzaniu, Brokatowe/Ombre/Lustrzane
- Mystery Box (niespodzianka), Personalizacja i Okazje (urodziny, ślub, imieniny)
- Kierownik tego cyrku (dla szefów, menedżerów, przepracowanych)

DANE TECHNICZNE KUBKÓW:
- Pojemność: standardowe 330 ml, duże 440–500 ml (jumbo)
- Materiał: ceramika wysokiej jakości
- Bezpieczne do zmywarki i mikrofalówki
- Nadruk sublimacyjny — trwały, nie schodzi przy myciu
- Kubki magiczne: grafika pojawia się dopiero po nalaniu gorącego napoju
- Kubki brokatowe/ombre/lustrzane: efekty wizualne, idealne na prezent
- Podstawa antypoślizgowa, ergonomiczny uchwyt

WYSYŁKA I REALIZACJA ZAMÓWIEŃ:
- Czas realizacji: 1–14 dni roboczych (zależnie od natężenia sprzedaży i personalizacji)
- Kubki z gotowym nadrukiem: zazwyczaj 3–5 dni roboczych
- Kubki z personalizacją: 7–14 dni roboczych
- Dostawcy: InPost Paczkomat, kurier DPD door-to-door
- Koszt dostawy: od 12 zł (Paczkomat), od 15 zł (kurier)
- Darmowa wysyłka od 150 zł wartości zamówienia
- Śledzenie przesyłki online po jej nadaniu
- Dostawa do całej Polski; wysyłka zagraniczna — zapytaj o wycenę

PRYWATNOŚĆ: Przypomnij użytkownikowi NA POCZĄTKU pierwszej wiadomości (tylko raz): "Ta rozmowa jest prywatna i nie jest nigdzie rejestrowana."

CEL: Pomagaj w wyborze kubka, odpowiadaj na pytania o wysyłkę i parametry produktów. Zawsze kończ konkretną rekomendacją lub zachętą do zakupu.`;

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  // 1. Sprawdź autentykację
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // 2. Wczytaj body wcześnie — farewell nie wymaga tokenu
  const body = await req.json().catch(() => ({} as { messages: Message[]; message: string; action?: string }));
  const { messages, message, action } = body;

  // Specjalna akcja: generuj pożegnanie (nie dekrementuje, nie wymaga tokenu)
  if (action === "farewell") {
    const history: Message[] = Array.isArray(messages) ? messages.slice(-10) : [];
    const farewellPrompt = `Na podstawie poniższej rozmowy z klientem wygeneruj krótkie, ciepłe pożegnanie (max 2 zdania).
Ton: z humorem, nawiązujący do tego czego szukał klient. Wyciągnij pozytywne słowa/temat z rozmowy i użyj ich.
Zaproś do sklepu. Bez oferty Premium czy limitów. Bądź wrednie miły.`;
    try {
      const farewell = await geminiChat(history, farewellPrompt);
      return NextResponse.json({ farewell });
    } catch {
      return NextResponse.json({ farewell: "Było mi wrednie miło pogadać! Zajrzyj do sklepu — kubek na Ciebie czeka. ☕" });
    }
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 });
  }

  // 3. Sprawdź / zresetuj sesję godzinową
  const service = serviceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("ai_questions_left, ai_session_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  const now = new Date();
  const expiresAt = profile?.ai_session_expires_at ? new Date(profile.ai_session_expires_at) : null;
  const sessionActive = expiresAt !== null && expiresAt > now;
  let questionsLeft = profile?.ai_questions_left ?? 0;

  if (!sessionActive) {
    // Nowa sesja — reset licznika i ustaw wygaśnięcie za 1h
    const newExpiry = new Date(now.getTime() + SESSION_DURATION_MS).toISOString();
    await service.from("profiles").update({
      ai_questions_left: SESSION_QUESTIONS,
      ai_session_expires_at: newExpiry,
    }).eq("id", user.id);
    questionsLeft = SESSION_QUESTIONS;
  } else if (questionsLeft <= 0) {
    const minutesLeft = Math.ceil((expiresAt!.getTime() - now.getTime()) / 60000);
    return NextResponse.json({ error: "session_exhausted", minutesLeft }, { status: 403 });
  }

  // 4. Zmniejsz licznik
  const { error: updateError } = await service
    .from("profiles")
    .update({ ai_questions_left: questionsLeft - 1 })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "counter_error" }, { status: 500 });
  }

  // 5. Wywołaj Gemini
  const history: Message[] = Array.isArray(messages) ? messages.slice(-10) : [];
  const allMessages: Message[] = [...history, { role: "user", content: message }];

  let reply: string;
  try {
    reply = await geminiChat(allMessages, SYSTEM_PROMPT);
  } catch {
    await service.from("profiles").update({ ai_questions_left: questionsLeft }).eq("id", user.id);
    return NextResponse.json({ error: "ai_error" }, { status: 500 });
  }

  // 6. Wyszukaj pasujące produkty — dopiero od 3. wymiany (min 2 poprzednie wiadomości użytkownika)
  const priorUserMsgs = history.filter((m) => m.role === "user").length;
  let products: unknown[] = [];
  if (priorUserMsgs >= 2) {
  try {
    // Zapytanie budujemy GŁÓWNIE z wypowiedzi KLIENTA (dla kogo, jaki humor,
    // jakie zainteresowania) — to najlepiej oddaje intencję. Odpowiedź AI
    // (sarkastyczna, rozwlekła) dodajemy tylko lekko, bo zaszumia wektor.
    const userText = [...history.filter((m) => m.role === "user"), { content: message }]
      .map((m) => m.content)
      .join(". ")
      .slice(0, 500);
    const searchText = `${userText} ${reply.slice(0, 120)}`.slice(0, 600);
    const embedding = await geminiEmbed(searchText);
    // Próg podniesiony 0.50 → 0.62: pokazujemy tylko naprawdę pasujące kubki.
    // Gdy nic nie przekroczy progu — lepiej nie proponować nic niż coś losowego.
    let { data } = await service.rpc("match_products", {
      query_embedding: embedding,
      match_threshold: 0.62,
      match_count: 3,
    });
    // Fallback: jeśli rygorystyczny próg nic nie zwróci, spróbuj raz luźniej,
    // ale nadal wyżej niż dawne 0.50, i tylko 2 najlepsze.
    if (!data || data.length === 0) {
      const retry = await service.rpc("match_products", {
        query_embedding: embedding,
        match_threshold: 0.55,
        match_count: 2,
      });
      data = retry.data;
    }
    products = (data ?? []).map((p: { slug: string; title: string; description: string; price_grosze: number; images: unknown }) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      price_grosze: p.price_grosze,
      image: Array.isArray(p.images) ? (p.images[0] ?? null) : null,
    }));
  } catch {
    products = [];
  }
  } // end priorUserMsgs >= 2

  return NextResponse.json({
    reply,
    products,
    questionsLeft: questionsLeft - 1,
  });
}

// GET — sprawdź status sesji
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ questionsLeft: 0, authenticated: false });

  const service = serviceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("ai_questions_left, ai_session_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  const now = new Date();
  const expiresAt = profile?.ai_session_expires_at ? new Date(profile.ai_session_expires_at) : null;
  const sessionActive = expiresAt !== null && expiresAt > now;
  const questionsLeft = profile?.ai_questions_left ?? 0;

  // Sesja wygasła lub nie istnieje → traktuj jak świeżą (użytkownik ma dostęp)
  const effectiveLeft = sessionActive ? questionsLeft : SESSION_QUESTIONS;
  const minutesLeft = (sessionActive && questionsLeft <= 0 && expiresAt)
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / 60000)
    : null;

  return NextResponse.json({
    questionsLeft: effectiveLeft,
    authenticated: true,
    minutesLeft,
  });
}
