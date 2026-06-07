import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { geminiEmbed } from "@/lib/gemini";

export async function POST() {
  // 1. Verify Gemini key works before doing anything
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }
  try {
    await geminiEmbed("test");
  } catch (e) {
    return NextResponse.json({ error: `Gemini API key invalid: ${String(e)}` }, { status: 500 });
  }

  // 2. Use service role client — bypasses RLS for UPDATE
  const supabase = createSupabaseServiceClient();

  const { data: products, error } = await supabase
    .from("shop_products")
    .select("id, title, description, body, category, categories")
    .is("embedding", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!products?.length) return NextResponse.json({ updated: 0, message: "Wszystkie produkty mają już embeddingi" });

  let updated = 0;
  const errors: string[] = [];

  for (const p of products) {
    try {
      const text = [
        p.title,
        p.description,
        p.body,
        ...(Array.isArray(p.categories) ? p.categories : [p.category]),
      ]
        .filter(Boolean)
        .join(" ");

      const embedding = await geminiEmbed(text);

      const { error: upErr } = await supabase
        .from("shop_products")
        .update({ embedding })
        .eq("id", p.id);

      if (upErr) errors.push(`${p.title}: ${upErr.message}`);
      else updated++;

      await new Promise((r) => setTimeout(r, 250));
    } catch (e) {
      errors.push(`${p.title}: ${String(e)}`);
    }
  }

  return NextResponse.json({ updated, total: products.length, errors });
}
