import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { geminiChat } from "@/lib/gemini";

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

ZASADY LIMITU ROZMOWY I OPTYMALIZACJI:
1. Użytkownik ma ŚCISŁY LIMIT pytań w tej sesji — nie przeciągaj rozmowy
2. Bądź precyzyjny i szybki. Nie zadawaj otwartych pytań ogólnych
3. Maksymalnie w 2–3 wymianie zdań wyciągnij: [Dla kogo prezent?] [Jaki ma charakter/humor?] [Jaki styl/kategoria?] i zaproponuj kubki
4. Każda odpowiedź: zwięzła, konkretna, z humorem. Bez lania wody

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

  // 2. Sprawdź licznik pytań
  const service = serviceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("ai_questions_left")
    .eq("id", user.id)
    .maybeSingle();

  const questionsLeft = profile?.ai_questions_left ?? 0;

  if (questionsLeft <= 0) {
    return NextResponse.json({ error: "no_questions_left" }, { status: 403 });
  }

  // 3. Pobierz historię rozmowy i nową wiadomość
  const { messages, message } = await req.json().catch(() => ({} as { messages: Message[]; message: string }));
  if (!message?.trim()) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 });
  }

  // 4. Zmniejsz licznik (transakcyjnie)
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

  try {
    const reply = await geminiChat(allMessages, SYSTEM_PROMPT);
    return NextResponse.json({
      reply,
      questionsLeft: questionsLeft - 1,
    });
  } catch {
    // Zwróć token z powrotem przy błędzie Gemini
    await service
      .from("profiles")
      .update({ ai_questions_left: questionsLeft })
      .eq("id", user.id);
    return NextResponse.json({ error: "ai_error" }, { status: 500 });
  }
}

// GET — sprawdź ile pytań zostało
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ questionsLeft: 0, authenticated: false });

  const service = serviceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("ai_questions_left")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    questionsLeft: profile?.ai_questions_left ?? 0,
    authenticated: true,
  });
}
