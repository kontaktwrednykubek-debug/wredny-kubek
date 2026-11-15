import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/discount/requireAdmin";

export const runtime = "nodejs";

// Zdrapki: procent / kwota zawsze „od drugiego kubka" (min. 2 szt.).
const SCRATCH_TYPES = ["second_percent", "second_fixed", "free_shipping", "gift"] as const;

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(SCRATCH_TYPES),
  value: z.number().int().positive().nullable().optional(),
  gift_description: z.string().trim().max(500).nullable().optional(),
  prefix: z
    .string()
    .trim()
    .max(10)
    .regex(/^[A-Za-z0-9]*$/, "Prefiks: tylko litery i cyfry")
    .nullable()
    .optional(),
  count: z.number().int().min(1).max(2000),
  /** sequential = kolejne numery (1001, 1002…), random = losowe XXXX-XXXX */
  mode: z.enum(["sequential", "random"]).optional(),
  start_number: z.number().int().min(1).max(999_999_999).optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().nullable().optional(),
  min_order_grosze: z.number().int().nonnegative().nullable().optional(),
  active: z.boolean().optional(),
});

// Bez znaków mylących się na zdrapce (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomChunk(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

function generateCode(prefix: string | null): string {
  const body = `${randomChunk(4)}-${randomChunk(4)}`;
  return prefix ? `${prefix.toUpperCase()}-${body}` : body;
}

/** GET /api/admin/scratch-batches — pule zdrapek z licznikami (admin). */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from("scratch_batches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

/** POST /api/admin/scratch-batches — utworzenie puli + wygenerowanie N unikalnych kodów. */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nieprawidłowe dane formularza.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const needsPercent = input.type === "second_percent";
  const needsFixed = input.type === "second_fixed";
  if (needsPercent && (!input.value || input.value < 1 || input.value > 100)) {
    return NextResponse.json({ error: "Wartość procentowa musi być 1-100." }, { status: 400 });
  }
  if (needsFixed && (!input.value || input.value < 1)) {
    return NextResponse.json({ error: "Kwota rabatu musi być > 0 zł." }, { status: 400 });
  }
  if (input.type === "gift" && !input.gift_description) {
    return NextResponse.json({ error: "Opisz, co jest gratisem." }, { status: 400 });
  }

  // Kody numerowane: sprawdzamy, czy cały zakres jest wolny, ZANIM utworzymy pulę.
  let sequentialCodes: string[] | null = null;
  if (input.mode === "sequential") {
    if (!input.start_number) {
      return NextResponse.json({ error: "Podaj pierwszy numer kodu." }, { status: 400 });
    }
    sequentialCodes = Array.from({ length: input.count }, (_, i) => String(input.start_number! + i));
    const taken: string[] = [];
    for (let i = 0; i < sequentialCodes.length; i += 500) {
      const { data } = await auth.supabase
        .from("discount_codes")
        .select("code")
        .in("code", sequentialCodes.slice(i, i + 500));
      for (const r of data ?? []) taken.push((r as { code: string }).code);
    }
    if (taken.length > 0) {
      const list = taken.sort((a, b) => Number(a) - Number(b));
      return NextResponse.json(
        {
          error: `Te numery już istnieją: ${list.slice(0, 10).join(", ")}${
            list.length > 10 ? ` (i ${list.length - 10} więcej)` : ""
          }. Zacznij od innego numeru.`,
        },
        { status: 409 },
      );
    }
  }

  const value = needsPercent || needsFixed ? input.value ?? null : null;
  const prefix = input.prefix ? input.prefix.toUpperCase() : null;
  const validFrom = input.valid_from ?? new Date().toISOString();

  const { data: batch, error: batchErr } = await auth.supabase
    .from("scratch_batches")
    .insert({
      name: input.name,
      type: input.type,
      value,
      gift_description: input.type === "gift" ? input.gift_description : null,
      prefix: sequentialCodes ? null : prefix,
      valid_from: validFrom,
      valid_until: input.valid_until ?? null,
      min_order_grosze: input.min_order_grosze ?? null,
      active: input.active ?? true,
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (batchErr || !batch) {
    return NextResponse.json(
      { error: batchErr?.message ?? "Nie udało się utworzyć puli." },
      { status: 500 },
    );
  }

  // Generujemy unikalne kody. Kolizja z istniejącym kodem w bazie jest
  // praktycznie niemożliwa (31^8 kombinacji), ale i tak ponawiamy wstawienie.
  const baseRow = {
    type: input.type,
    value,
    gift_description: input.type === "gift" ? input.gift_description : null,
    valid_from: validFrom,
    valid_until: input.valid_until ?? null,
    max_uses: 1,
    min_order_grosze: input.min_order_grosze ?? null,
    one_per_user: false,
    active: input.active ?? true,
    scratch_batch_id: batch.id,
    created_by: auth.user.id,
  };

  if (sequentialCodes) {
    const rows = sequentialCodes.map((code) => ({ ...baseRow, code }));
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await auth.supabase.from("discount_codes").insert(rows.slice(i, i + 500));
      if (error) {
        // Ktoś zajął numer w międzyczasie — wycofujemy całą pulę.
        await auth.supabase.from("scratch_batches").delete().eq("id", batch.id);
        return NextResponse.json(
          { error: `Nie udało się zapisać kodów: ${error.message}` },
          { status: 500 },
        );
      }
    }
    return NextResponse.json({ item: batch });
  }

  let remaining = input.count;
  for (let attempt = 0; attempt < 5 && remaining > 0; attempt++) {
    const codes = new Set<string>();
    while (codes.size < remaining) codes.add(generateCode(prefix));

    // Odrzuć te, które już istnieją w bazie.
    const { data: existing } = await auth.supabase
      .from("discount_codes")
      .select("code")
      .in("code", Array.from(codes));
    for (const e of existing ?? []) codes.delete((e as { code: string }).code);

    const rows = Array.from(codes).map((code) => ({ ...baseRow, code }));
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await auth.supabase.from("discount_codes").insert(chunk);
      if (!error) remaining -= chunk.length;
      else console.warn("[admin/scratch-batches] insert chunk failed, retrying:", error.message);
    }
  }

  if (remaining > 0) {
    return NextResponse.json(
      {
        error: `Utworzono pulę, ale nie udało się wygenerować ${remaining} kodów.`,
        item: batch,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ item: batch });
}
