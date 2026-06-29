-- ═══════════════════════════════════════════════════════
-- Dieter — Row Level Security Policies
-- ═══════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE dietitians ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dish_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

-- ─── Dietitians ─────────────────────────────────────────
-- Users can only see and edit their own profile
CREATE POLICY "dietitians_select_own"
  ON dietitians FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY "dietitians_insert_own"
  ON dietitians FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "dietitians_update_own"
  ON dietitians FOR UPDATE
  USING (id = (SELECT auth.uid()));

-- ─── Clients ────────────────────────────────────────────
CREATE POLICY "clients_select_own"
  ON clients FOR SELECT
  USING (dietitian_id = (SELECT auth.uid()));

CREATE POLICY "clients_insert_own"
  ON clients FOR INSERT
  WITH CHECK (dietitian_id = (SELECT auth.uid()));

CREATE POLICY "clients_update_own"
  ON clients FOR UPDATE
  USING (dietitian_id = (SELECT auth.uid()));

CREATE POLICY "clients_delete_own"
  ON clients FOR DELETE
  USING (dietitian_id = (SELECT auth.uid()));

-- ─── Food Categories ────────────────────────────────────
-- Readable by all authenticated users (seeded data)
CREATE POLICY "food_categories_select_all"
  ON food_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─── Foods ──────────────────────────────────────────────
-- Users see: global foods (no owner) + their own manual/dish foods
CREATE POLICY "foods_select"
  ON foods FOR SELECT
  USING (
    dietitian_id IS NULL
    OR dietitian_id = (SELECT auth.uid())
  );

CREATE POLICY "foods_insert_own"
  ON foods FOR INSERT
  WITH CHECK (dietitian_id = (SELECT auth.uid()));

CREATE POLICY "foods_update_own"
  ON foods FOR UPDATE
  USING (dietitian_id = (SELECT auth.uid()));

CREATE POLICY "foods_delete_own"
  ON foods FOR DELETE
  USING (dietitian_id = (SELECT auth.uid()));

-- ─── Food Nutrients ─────────────────────────────────────
-- Readable if the parent food is readable (same logic via join)
CREATE POLICY "food_nutrients_select"
  ON food_nutrients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM foods
      WHERE foods.id = food_nutrients.food_id
        AND (foods.dietitian_id IS NULL OR foods.dietitian_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "food_nutrients_insert"
  ON food_nutrients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM foods
      WHERE foods.id = food_nutrients.food_id
        AND foods.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "food_nutrients_update"
  ON food_nutrients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM foods
      WHERE foods.id = food_nutrients.food_id
        AND foods.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "food_nutrients_delete"
  ON food_nutrients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM foods
      WHERE foods.id = food_nutrients.food_id
        AND foods.dietitian_id = (SELECT auth.uid())
    )
  );

-- ─── Dish Ingredients ───────────────────────────────────
CREATE POLICY "dish_ingredients_select"
  ON dish_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM foods
      WHERE foods.id = dish_ingredients.dish_food_id
        AND (foods.dietitian_id IS NULL OR foods.dietitian_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "dish_ingredients_insert"
  ON dish_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM foods
      WHERE foods.id = dish_ingredients.dish_food_id
        AND foods.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "dish_ingredients_delete"
  ON dish_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM foods
      WHERE foods.id = dish_ingredients.dish_food_id
        AND foods.dietitian_id = (SELECT auth.uid())
    )
  );

-- ─── Diet Plans ─────────────────────────────────────────
CREATE POLICY "diet_plans_select_own"
  ON diet_plans FOR SELECT
  USING (dietitian_id = (SELECT auth.uid()));

CREATE POLICY "diet_plans_insert_own"
  ON diet_plans FOR INSERT
  WITH CHECK (dietitian_id = (SELECT auth.uid()));

CREATE POLICY "diet_plans_update_own"
  ON diet_plans FOR UPDATE
  USING (dietitian_id = (SELECT auth.uid()));

CREATE POLICY "diet_plans_delete_own"
  ON diet_plans FOR DELETE
  USING (dietitian_id = (SELECT auth.uid()));

-- ─── Plan Days ──────────────────────────────────────────
-- Access through parent diet_plan ownership
CREATE POLICY "plan_days_select"
  ON plan_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diet_plans
      WHERE diet_plans.id = plan_days.plan_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "plan_days_insert"
  ON plan_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diet_plans
      WHERE diet_plans.id = plan_days.plan_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "plan_days_update"
  ON plan_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM diet_plans
      WHERE diet_plans.id = plan_days.plan_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "plan_days_delete"
  ON plan_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM diet_plans
      WHERE diet_plans.id = plan_days.plan_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );

-- ─── Meal Slots ─────────────────────────────────────────
CREATE POLICY "meal_slots_select"
  ON meal_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plan_days
      JOIN diet_plans ON diet_plans.id = plan_days.plan_id
      WHERE plan_days.id = meal_slots.day_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "meal_slots_insert"
  ON meal_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plan_days
      JOIN diet_plans ON diet_plans.id = plan_days.plan_id
      WHERE plan_days.id = meal_slots.day_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "meal_slots_update"
  ON meal_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM plan_days
      JOIN diet_plans ON diet_plans.id = plan_days.plan_id
      WHERE plan_days.id = meal_slots.day_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "meal_slots_delete"
  ON meal_slots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM plan_days
      JOIN diet_plans ON diet_plans.id = plan_days.plan_id
      WHERE plan_days.id = meal_slots.day_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );

-- ─── Meal Items ─────────────────────────────────────────
CREATE POLICY "meal_items_select"
  ON meal_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_slots
      JOIN plan_days ON plan_days.id = meal_slots.day_id
      JOIN diet_plans ON diet_plans.id = plan_days.plan_id
      WHERE meal_slots.id = meal_items.slot_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "meal_items_insert"
  ON meal_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_slots
      JOIN plan_days ON plan_days.id = meal_slots.day_id
      JOIN diet_plans ON diet_plans.id = plan_days.plan_id
      WHERE meal_slots.id = meal_items.slot_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "meal_items_update"
  ON meal_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal_slots
      JOIN plan_days ON plan_days.id = meal_slots.day_id
      JOIN diet_plans ON diet_plans.id = plan_days.plan_id
      WHERE meal_slots.id = meal_items.slot_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "meal_items_delete"
  ON meal_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_slots
      JOIN plan_days ON plan_days.id = meal_slots.day_id
      JOIN diet_plans ON diet_plans.id = plan_days.plan_id
      WHERE meal_slots.id = meal_items.slot_id
        AND diet_plans.dietitian_id = (SELECT auth.uid())
    )
  );
