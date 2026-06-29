-- ═══════════════════════════════════════════════════════
-- Dieter — Initial Schema
-- ═══════════════════════════════════════════════════════

-- Enable pg_trgm for fuzzy text search on food names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Enums ──────────────────────────────────────────────
CREATE TYPE food_source AS ENUM ('fatsecret', 'usda', 'manual', 'dish');
CREATE TYPE meal_slot_type AS ENUM ('main', 'snack');

-- ─── Dietitians ─────────────────────────────────────────
CREATE TABLE dietitians (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  clinic_name TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Clients ────────────────────────────────────────────
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietitian_id UUID NOT NULL REFERENCES dietitians(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birthdate DATE,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  goal TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Food Categories ────────────────────────────────────
CREATE TABLE food_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0
);

-- ─── Foods ──────────────────────────────────────────────
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source food_source NOT NULL DEFAULT 'manual',
  external_id TEXT,
  dietitian_id UUID REFERENCES dietitians(id) ON DELETE CASCADE,
  category_id UUID REFERENCES food_categories(id),
  serving_size NUMERIC NOT NULL DEFAULT 100,
  serving_unit TEXT NOT NULL DEFAULT 'g',
  base_unit_grams NUMERIC,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbohydrate NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  fiber NUMERIC,
  sugar NUMERIC,
  saturated_fat NUMERIC,
  sodium NUMERIC,
  cholesterol NUMERIC,
  glycemic_index INT,
  allergen_tags TEXT[],
  image_url TEXT,
  is_shared_candidate BOOLEAN DEFAULT false,
  source_attribution TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, external_id)
);

-- ─── Extended Nutrients ─────────────────────────────────
CREATE TABLE food_nutrients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  vitamin_a NUMERIC,
  vitamin_c NUMERIC,
  vitamin_d NUMERIC,
  vitamin_e NUMERIC,
  vitamin_k NUMERIC,
  vitamin_b1 NUMERIC,
  vitamin_b2 NUMERIC,
  vitamin_b3 NUMERIC,
  vitamin_b6 NUMERIC,
  vitamin_b12 NUMERIC,
  folate NUMERIC,
  calcium NUMERIC,
  iron NUMERIC,
  potassium NUMERIC,
  magnesium NUMERIC,
  zinc NUMERIC,
  UNIQUE(food_id)
);

-- ─── Dish Ingredients ───────────────────────────────────
CREATE TABLE dish_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  ingredient_food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'g'
);

-- ─── Diet Plans ─────────────────────────────────────────
CREATE TABLE diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietitian_id UUID NOT NULL REFERENCES dietitians(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  is_template BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Plan Days ──────────────────────────────────────────
CREATE TABLE plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  label TEXT,
  notes TEXT
);

-- ─── Meal Slots ─────────────────────────────────────────
CREATE TABLE meal_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
  slot_type meal_slot_type NOT NULL DEFAULT 'main',
  label TEXT NOT NULL,
  time_of_day TIME,
  sort_order INT DEFAULT 0
);

-- ─── Meal Items ─────────────────────────────────────────
CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES meal_slots(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'g',
  notes TEXT,
  sort_order INT DEFAULT 0
);

-- ─── Indexes ────────────────────────────────────────────
CREATE INDEX idx_clients_dietitian ON clients(dietitian_id);
CREATE INDEX idx_foods_source ON foods(source);
CREATE INDEX idx_foods_dietitian ON foods(dietitian_id);
CREATE INDEX idx_foods_name_trgm ON foods USING gin(name gin_trgm_ops);
CREATE INDEX idx_foods_category ON foods(category_id);
CREATE INDEX idx_diet_plans_dietitian ON diet_plans(dietitian_id);
CREATE INDEX idx_diet_plans_client ON diet_plans(client_id);
CREATE INDEX idx_diet_plans_template ON diet_plans(is_template);
CREATE INDEX idx_plan_days_plan ON plan_days(plan_id);
CREATE INDEX idx_meal_slots_day ON meal_slots(day_id);
CREATE INDEX idx_meal_items_slot ON meal_items(slot_id);
CREATE INDEX idx_meal_items_food ON meal_items(food_id);
CREATE INDEX idx_dish_ingredients_dish ON dish_ingredients(dish_food_id);
