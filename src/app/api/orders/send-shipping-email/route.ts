import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ShippingNotificationEmail } from "@/emails/ShippingNotificationEmail";
import { resolveResendFrom, resolveResendTo } from "@/lib/email/sendOrderEmail";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Sprawdź, czy użytkownik jest adminem
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { orderId, trackingNumber } = await req.json();

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  if (!trackingNumber || typeof trackingNumber !== "string" || !trackingNumber.trim()) {
    return NextResponse.json(
      { error: "Numer przesyłki jest wymagany" },
      { status: 400 },
    );
  }

  const cleanTrackingNumber = trackingNumber.trim();

  // Pobierz dane zamówienia
  const { data: order } = await supabase
    .from("orders")
    .select("id, product_id, quantity, shipping_info, user_id, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Pobierz email — najpierw z profilu (zalogowani), potem z shipping_info (goście)
  let userEmail: string | null = null;
  if (order.user_id) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .maybeSingle();
    userEmail = userProfile?.email ?? null;
  }
  if (!userEmail) {
    const shippingEarly = (order.shipping_info ?? {}) as Record<string, string>;
    userEmail = shippingEarly.email ?? null;
  }

  if (!userEmail) {
    return NextResponse.json(
      { error: "Brak adresu e-mail klienta — ani w profilu, ani w danych dostawy zamówienia." },
      { status: 404 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 503 }
    );
  }

  const resend = new Resend(apiKey);
  const shipping = order.shipping_info as any;
  const customerName = shipping.fullName || "Klient";
  const firstName = customerName.split(" ")[0];
  
  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://wrednykubek.pl";
  const logoUrl = `${appUrl}/wk.svg`;
  const orderUrl = `${appUrl}/account/zamowienia/${orderId}`;

  const from = resolveResendFrom();

  console.log("[shipping-email] Wysyłka:", {
    from,
    to: userEmail,
    orderId: order.id,
  });

  try {
    const emailComponent = ShippingNotificationEmail({
      customerName,
      orderId: order.id,
      trackingNumber: cleanTrackingNumber,
      logoUrl,
      orderUrl,
    });

    const [html, text] = await Promise.all([
      render(emailComponent),
      render(emailComponent, { plainText: true }),
    ]);

    const result = await resend.emails.send({
      from,
      replyTo: from,
      to: resolveResendTo(userEmail),
      subject: `${firstName}, Twój Wredny Kubek właśnie zwiał z magazynu! 🏃💨`,
      html,
      text,
    });

    if (result.error) {
      console.error("[shipping-email] Resend error:", result.error);
      return NextResponse.json(
        {
          error: result.error.message,
          details: result.error,
          hint: "W sandbox Resend możesz wysłać mail TYLKO na email konta Resend (kontakt.wrednykubek@gmail.com). Zweryfikuj domenę w Resend, aby wysyłać na dowolne adresy.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error("[shipping-email] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    );
  }
}
