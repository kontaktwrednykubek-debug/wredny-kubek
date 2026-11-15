import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/discount/requireAdmin";

export const runtime = "nodejs";

const patchSchema = z.object({
  active: z.boolean(),
});

/** GET /api/admin/scratch-batches/[id] — lista kodów z puli (do podglądu / eksportu). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from("discount_codes")
    .select("id, code, times_used, active")
    .eq("scratch_batch_id", params.id)
    .order("code", { ascending: true })
    .limit(5000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

/** PATCH /api/admin/scratch-batches/[id] — włącz/wyłącz całą pulę (wraz z kodami). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { error: bErr } = await auth.supabase
    .from("scratch_batches")
    .update({ active: parsed.data.active })
    .eq("id", params.id);
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });

  const { error: cErr } = await auth.supabase
    .from("discount_codes")
    .update({ active: parsed.data.active })
    .eq("scratch_batch_id", params.id);
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/scratch-batches/[id] — usuń pulę i wszystkie jej kody. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  // Kody usuwają się kaskadowo (FK on delete cascade); zamówienia zachowują
  // kwotę rabatu (discount_code_id → NULL).
  const { error } = await auth.supabase.from("scratch_batches").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
