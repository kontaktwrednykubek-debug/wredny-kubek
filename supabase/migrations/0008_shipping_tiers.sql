-- Progi cenowe dla metod wysyłki wg ilości sztuk w zamówieniu.
-- Jeśli brak tierów dla danej metody → używana jest shipping_methods.price_grosze.
CREATE TABLE IF NOT EXISTS public.shipping_method_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_method_id uuid NOT NULL REFERENCES public.shipping_methods(id) ON DELETE CASCADE,
  min_quantity integer NOT NULL DEFAULT 1,
  price_grosze integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shipping_method_id, min_quantity),
  CONSTRAINT shipping_method_tiers_qty_check CHECK (min_quantity >= 1),
  CONSTRAINT shipping_method_tiers_price_check CHECK (price_grosze >= 0)
);

ALTER TABLE public.shipping_method_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shipping_method_tiers: read all" ON public.shipping_method_tiers;
CREATE POLICY "shipping_method_tiers: read all" ON public.shipping_method_tiers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "shipping_method_tiers: admin write" ON public.shipping_method_tiers;
CREATE POLICY "shipping_method_tiers: admin write" ON public.shipping_method_tiers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
