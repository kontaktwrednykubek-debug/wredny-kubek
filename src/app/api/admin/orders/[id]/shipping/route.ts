import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  shippingTrackingNumber: z.string().min(3).max(60).optional(),
  shippingLabelUrl: z.string().url().optional(),
  shippingLabelStatus: z
    .enum(["REQUESTED", "GENERATED", "PRINTED", "VOIDED"])
    .optional(),
});

/**
 * PATCH /api/admin/orders/[id]/shipping
 * Pozwala adminowi zaktualizować numer listu przewozowego oraz URL etykiety.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const p = parsed.data;
  const update: Record<string, unknown> = {};
  if (p.shippingTrackingNumber !== undefined)
    update.shipping_tracking_number = p.shippingTrackingNumber;
  if (p.shippingLabelUrl !== undefined)
    update.shipping_label_url = p.shippingLabelUrl;
  if (p.shippingLabelStatus !== undefined)
    update.shipping_label_status = p.shippingLabelStatus;

  const { error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
