-- ═══════════════════════════════════════════════════════
-- Dieter — Seed Food Categories
-- ═══════════════════════════════════════════════════════

INSERT INTO food_categories (name, sort_order) VALUES
  ('Et & Tavuk', 1),
  ('Balık & Deniz Ürünleri', 2),
  ('Süt Ürünleri', 3),
  ('Yumurta', 4),
  ('Sebze', 5),
  ('Meyve', 6),
  ('Tahıl & Baklagil', 7),
  ('Ekmek & Unlu Mamul', 8),
  ('Yağ & Sos', 9),
  ('İçecek', 10),
  ('Tatlı & Atıştırmalık', 11),
  ('Kuruyemiş', 12),
  ('Diğer', 99)
ON CONFLICT (name) DO NOTHING;
