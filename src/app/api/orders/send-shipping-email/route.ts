import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ShippingNotificationEmail } from "@/emails/ShippingNotificationEmail";

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

  const { orderId } = await req.json();

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  // Pobierz dane zamówienia
  const { data: order } = await supabase
    .from("orders")
    .select("id, product_id, quantity, shipping_info, user_id, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Pobierz email użytkownika z profilu
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", order.user_id)
    .single();
  
  if (!userProfile?.email) {
    return NextResponse.json({ error: "User email not found" }, { status: 404 });
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
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const logoUrl = `${appUrl}/wk.svg`;

  const from =
    process.env.RESEND_FROM_EMAIL && !process.env.RESEND_FROM_EMAIL.includes("xxx")
      ? process.env.RESEND_FROM_EMAIL
      : "Wredny Kubek <onboarding@resend.dev>";

  try {
    const html = await render(
      ShippingNotificationEmail({
        customerName,
        orderId: order.id,
        logoUrl,
      })
    );

    await resend.emails.send({
      from,
      to: userProfile.email,
      subject: `${firstName}, Twój Wredny Kubek właśnie zwiał z magazynu! 🏃💨`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
