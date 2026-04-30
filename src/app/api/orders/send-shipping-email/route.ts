import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const shipping = order.shipping_info as any;
  const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/account/zamowienia?highlight=${order.id}`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "zamowienia@wrednykubek.pl",
      to: userProfile.email,
      subject: "🎉 Twoje zamówienie zostało wysłane!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">
            Dziękujemy za zamówienie! 🎉
          </h1>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Cześć <strong>${shipping.fullName || 'Klient'}</strong>,
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Twoje zamówienie <strong>#${order.id.slice(0, 8)}</strong> zostało już wysłane! 📦
          </p>
          
          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #333; font-size: 18px; margin-top: 0;">Szczegóły zamówienia:</h2>
            <p style="color: #666; margin: 10px 0;">
              <strong>Produkt:</strong> ${order.product_id} × ${order.quantity}
            </p>
            <p style="color: #666; margin: 10px 0;">
              <strong>Sposób dostawy:</strong> ${shipping.shippingMethodName || '—'}
            </p>
            ${shipping.parcelCode ? `
              <p style="color: #666; margin: 10px 0;">
                <strong>Kod paczkomatu:</strong> ${shipping.parcelCode}
              </p>
            ` : ''}
            <p style="color: #666; margin: 10px 0;">
              <strong>Adres:</strong> ${shipping.address}, ${shipping.zip} ${shipping.city}
            </p>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Możesz sprawdzić status swojego zamówienia, klikając poniższy przycisk:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}" 
               style="display: inline-block; background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Sprawdź status zamówienia
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5; margin-top: 30px;">
            Lub skopiuj ten link do przeglądarki:<br>
            <a href="${trackingUrl}" style="color: #0066cc; word-break: break-all;">${trackingUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; line-height: 1.5;">
            Jeśli masz jakiekolwiek pytania, skontaktuj się z nami.<br>
            Pozdrawiamy,<br>
            <strong>Zespół Wredny Kubek</strong>
          </p>
        </div>
      `,
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
