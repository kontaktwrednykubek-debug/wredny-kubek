-- Hierarchiczna tabela kategorii sklepu (parent_id => podkategorie).
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text DEFAULT '',
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  image_url text,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS categories_slug_idx ON public.categories(slug);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories: read all" ON public.categories;
CREATE POLICY "categories: read all" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories: admin write" ON public.categories;
CREATE POLICY "categories: admin write" ON public.categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.categories (slug, name, description, sort_order) VALUES
  ('popkultura-i-seriale',         'Popkultura i Seriale',     'Kubki inspirowane filmami, serialami i grami.',                10),
  ('zodiak-i-astrologia',          'Zodiak i Astrologia',      'Kubki z grafikami znaków zodiaku.',                            20),
  ('humor-i-styl-zycia',           'Humor i Styl Życia',       'Charakterne kubki z mocnymi napisami.',                        30),
  ('kubki-magiczne-i-efektowne',   'Kubki Magiczne i Efektowne','Kubki magiczne, brokatowe, ombre, lustrzane.',                40),
  ('mystery-box',                  'Mystery Box',              'Kubki niespodzianki — kup w ciemno!',                          50),
  ('personalizacja-i-okazje',      'Personalizacja i Okazje',  'Kubki z imieniem i na specjalne okazje.',                      60),
  ('kierownik-tego-cyrku',         'Kierownik tego cyrku',     'Bestsellery: Kierownik / Kierowniczka tego cyrku.',            70)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, parent_id, sort_order)
SELECT 'pamietniki-wampirow', 'Pamiętniki Wampirów (TVD)', id, 10
FROM public.categories WHERE slug = 'popkultura-i-seriale'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, parent_id, sort_order)
SELECT 'harry-potter', 'Harry Potter', id, 20
FROM public.categories WHERE slug = 'popkultura-i-seriale'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, parent_id, sort_order)
SELECT 'gry-i-animacje', 'Gry i Animacje', id, 30
FROM public.categories WHERE slug = 'popkultura-i-seriale'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, parent_id, sort_order)
SELECT 'biurowe', 'Biurowe / Do pracy', id, 10
FROM public.categories WHERE slug = 'humor-i-styl-zycia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, parent_id, sort_order)
SELECT 'charakterne', 'Dla Charakternych', id, 20
FROM public.categories WHERE slug = 'humor-i-styl-zycia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, parent_id, sort_order)
SELECT 'pasje', 'Pasje', id, 30
FROM public.categories WHERE slug = 'humor-i-styl-zycia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, parent_id, sort_order)
SELECT 'magiczne', 'Magiczne (zmieniające grafikę)', id, 10
FROM public.categories WHERE slug = 'kubki-magiczne-i-efektowne'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, parent_id, sort_order)
SELECT 'brokatowe-ombre-lustrzane', 'Brokatowe / Ombre / Lustrzane', id, 20
FROM public.categories WHERE slug = 'kubki-magiczne-i-efektowne'
ON CONFLICT (slug) DO NOTHING;
