-- Drop the foreign key from foods table
ALTER TABLE foods DROP CONSTRAINT IF EXISTS foods_category_id_fkey;

-- Change the food_categories primary key from UUID to TEXT
ALTER TABLE food_categories DROP CONSTRAINT IF EXISTS food_categories_pkey;
ALTER TABLE food_categories ALTER COLUMN id TYPE TEXT;
ALTER TABLE food_categories ADD PRIMARY KEY (id);

-- Change the foods table category_id from UUID to TEXT
ALTER TABLE foods ALTER COLUMN category_id TYPE TEXT;

-- Re-add the foreign key
ALTER TABLE foods ADD CONSTRAINT foods_category_id_fkey FOREIGN KEY (category_id) REFERENCES food_categories(id);

-- Clear existing categories to avoid unique constraint violations
TRUNCATE food_categories CASCADE;

-- Seed the categories
INSERT INTO food_categories (id, name, sort_order) VALUES
  ('et_tavuk', 'Et & Tavuk', 1),
  ('balik_deniz', 'Balık & Deniz Ürünleri', 2),
  ('sut_urunleri', 'Süt Ürünleri', 3),
  ('yumurta', 'Yumurta', 4),
  ('sebze', 'Sebze', 5),
  ('meyve', 'Meyve', 6),
  ('tahil_baklagil', 'Tahıl & Baklagil', 7),
  ('ekmek_unlu', 'Ekmek & Unlu Mamul', 8),
  ('yag_sos', 'Yağ & Sos', 9),
  ('icecek', 'İçecek', 10),
  ('tatli_atistirmalik', 'Tatlı & Atıştırmalık', 11),
  ('kuruyemis', 'Kuruyemiş', 12),
  ('diger', 'Diğer', 13)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
