import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { geminiEmbed } from "@/lib/gemini";

export async function POST() {
  const supabase = createSupabaseServerClient();

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

      if (upErr) errors.push(`${p.id}: ${upErr.message}`);
      else updated++;

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      errors.push(`${p.id}: ${String(e)}`);
    }
  }

  return NextResponse.json({ updated, total: products.length, errors });
}
