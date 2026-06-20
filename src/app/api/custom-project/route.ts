import { NextResponse } from "next/server";
import { Resend } from "resend";
import { resolveResendFrom } from "@/lib/email/sendOrderEmail";

export const runtime = "nodejs";

const MAX_FILES = 6;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB / plik
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
];

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );

/**
 * POST /api/custom-project — zgłoszenie indywidualnego projektu na kubek.
 * Klient wysyła grafikę/pomysł + opis; trafia mailem do sklepu (z załącznikami),
 * a klient dostaje potwierdzenie. Publiczne (multipart/form-data).
 */
export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if (!apiKey || !adminEmail) {
    return NextResponse.json(
      { error: "Wysyłka jest chwilowo niedostępna. Napisz do nas bezpośrednio." },
      { status: 503 },
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  // Honeypot — boty wypełniają ukryte pole.
  if (String(form.get("website") ?? "").trim()) {
    return NextResponse.json({ ok: true });
  }

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();

  if (!name || !email || !description) {
    return NextResponse.json(
      { error: "Uzupełnij imię, e-mail i opis projektu." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Podaj prawidłowy adres e-mail." }, { status: 400 });
  }

  const files = form
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Możesz załączyć maksymalnie ${MAX_FILES} plików.` },
      { status: 400 },
    );
  }

  const attachments: { filename: string; content: Buffer }[] = [];
  for (const f of files) {
    if (f.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Plik „${f.name}" jest za duży (max 10 MB).` },
        { status: 400 },
      );
    }
    if (f.type && !ALLOWED.includes(f.type)) {
      return NextResponse.json(
        { error: `Niedozwolony typ pliku: „${f.name}". Dozwolone: zdjęcia i PDF.` },
        { status: 400 },
      );
    }
    attachments.push({
      filename: f.name || "zalacznik",
      content: Buffer.from(await f.arrayBuffer()),
    });
  }

  const resend = new Resend(apiKey);
  const from = resolveResendFrom();

  const fileList = attachments.length
    ? attachments.map((a) => `<li>${esc(a.filename)}</li>`).join("")
    : "<li><em>brak załączników</em></li>";

  const adminHtml = `
    <h2>Nowe zgłoszenie projektu na kubek</h2>
    <p><strong>Imię:</strong> ${esc(name)}</p>
    <p><strong>E-mail:</strong> ${esc(email)}</p>
    <p><strong>Telefon:</strong> ${esc(phone || "—")}</p>
    <p><strong>Opis projektu:</strong></p>
    <p style="white-space:pre-wrap">${esc(description)}</p>
    <p><strong>Załączniki (${attachments.length}):</strong></p>
    <ul>${fileList}</ul>
  `;

  try {
    // 1) Mail do sklepu z załącznikami (reply-to = klient).
    await resend.emails.send({
      from,
      replyTo: email,
      to: [adminEmail],
      subject: `Nowy projekt na kubek od: ${name}`,
      html: adminHtml,
      text: `Projekt na kubek\nImię: ${name}\nE-mail: ${email}\nTelefon: ${phone || "—"}\n\n${description}\n\nZałączniki: ${attachments.map((a) => a.filename).join(", ") || "brak"}`,
      attachments,
    });

    // 2) Potwierdzenie dla klienta (bez załączników).
    await resend.emails.send({
      from,
      replyTo: adminEmail,
      to: [email],
      subject: "Dostaliśmy Twój projekt — zaraz się nim zajmiemy ☕",
      html: `
        <h2>Cześć ${esc(name)}!</h2>
        <p>Dziękujemy za przesłanie pomysłu na kubek. Już go mamy. 🎨</p>
        <p>Nasz grafik przygotuje wizualizację i wycenę, a my odezwiemy się na ten
        adres e-mail. <strong>Nic nie płacisz</strong>, dopóki nie zaakceptujesz
        projektu.</p>
        <p>Do usłyszenia,<br/>Zespół Wredny Kubek</p>
      `,
      text: `Cześć ${name}! Dziękujemy za przesłanie pomysłu na kubek. Przygotujemy wizualizację i wycenę i odezwiemy się mailem. Nic nie płacisz, dopóki nie zaakceptujesz projektu. — Zespół Wredny Kubek`,
    });
  } catch (e) {
    console.error("[custom-project] Resend error:", e);
    return NextResponse.json(
      { error: "Nie udało się wysłać. Spróbuj ponownie za chwilę." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
