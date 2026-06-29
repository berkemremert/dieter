/**
 * Database type definitions for the Dieter application.
 * These mirror the Supabase schema exactly.
 */

// ─── Enums ──────────────────────────────────────────────

export type FoodSource = 'fatsecret' | 'usda' | 'manual' | 'dish';
export type MealSlotType = 'main' | 'snack';

// ─── Tables ─────────────────────────────────────────────

export interface Dietitian {
  id: string;
  display_name: string;
  clinic_name: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DietitianInsert {
  id: string;
  display_name: string;
  clinic_name?: string | null;
  logo_url?: string | null;
}

export interface DietitianUpdate {
  display_name?: string;
  clinic_name?: string | null;
  logo_url?: string | null;
}

// ─── Client ─────────────────────────────────────────────

export interface Client {
  id: string;
  dietitian_id: string;
  name: string;
  birthdate: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInsert {
  dietitian_id: string;
  name: string;
  birthdate?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal?: string | null;
  notes?: string | null;
}

export interface ClientUpdate {
  name?: string;
  birthdate?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal?: string | null;
  notes?: string | null;
}

// ─── Food Category ──────────────────────────────────────

export interface FoodCategory {
  id: string;
  name: string;
  sort_order: number;
}

// ─── Food ───────────────────────────────────────────────

export interface Food {
  id: string;
  name: string;
  source: FoodSource;
  external_id: string | null;
  dietitian_id: string | null;
  category_id: string | null;
  serving_size: number;
  serving_unit: string;
  base_unit_grams: number | null;
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  saturated_fat: number | null;
  sodium: number | null;
  cholesterol: number | null;
  glycemic_index: number | null;
  allergen_tags: string[] | null;
  image_url: string | null;
  is_shared_candidate: boolean;
  source_attribution: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodInsert {
  name: string;
  source?: FoodSource;
  external_id?: string | null;
  dietitian_id?: string | null;
  category_id?: string | null;
  serving_size?: number;
  serving_unit?: string;
  base_unit_grams?: number | null;
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
  fiber?: number | null;
  sugar?: number | null;
  saturated_fat?: number | null;
  sodium?: number | null;
  cholesterol?: number | null;
  glycemic_index?: number | null;
  allergen_tags?: string[] | null;
  image_url?: string | null;
  is_shared_candidate?: boolean;
  source_attribution?: string | null;
}

export interface FoodUpdate {
  name?: string;
  category_id?: string | null;
  serving_size?: number;
  serving_unit?: string;
  base_unit_grams?: number | null;
  calories?: number;
  protein?: number;
  carbohydrate?: number;
  fat?: number;
  fiber?: number | null;
  sugar?: number | null;
  saturated_fat?: number | null;
  sodium?: number | null;
  cholesterol?: number | null;
  glycemic_index?: number | null;
  allergen_tags?: string[] | null;
  image_url?: string | null;
  is_shared_candidate?: boolean;
  source_attribution?: string | null;
}

// ─── Food Nutrients (extended) ──────────────────────────

export interface FoodNutrients {
  id: string;
  food_id: string;
  vitamin_a: number | null;
  vitamin_c: number | null;
  vitamin_d: number | null;
  vitamin_e: number | null;
  vitamin_k: number | null;
  vitamin_b1: number | null;
  vitamin_b2: number | null;
  vitamin_b3: number | null;
  vitamin_b6: number | null;
  vitamin_b12: number | null;
  folate: number | null;
  calcium: number | null;
  iron: number | null;
  potassium: number | null;
  magnesium: number | null;
  zinc: number | null;
}

export interface FoodNutrientsInsert {
  food_id: string;
  vitamin_a?: number | null;
  vitamin_c?: number | null;
  vitamin_d?: number | null;
  vitamin_e?: number | null;
  vitamin_k?: number | null;
  vitamin_b1?: number | null;
  vitamin_b2?: number | null;
  vitamin_b3?: number | null;
  vitamin_b6?: number | null;
  vitamin_b12?: number | null;
  folate?: number | null;
  calcium?: number | null;
  iron?: number | null;
  potassium?: number | null;
  magnesium?: number | null;
  zinc?: number | null;
}

// ─── Dish Ingredients ───────────────────────────────────

export interface DishIngredient {
  id: string;
  dish_food_id: string;
  ingredient_food_id: string;
  quantity: number;
  unit: string;
}

export interface DishIngredientInsert {
  dish_food_id: string;
  ingredient_food_id: string;
  quantity: number;
  unit?: string;
}

// ─── Diet Plan ──────────────────────────────────────────

export interface DietPlan {
  id: string;
  dietitian_id: string;
  client_id: string | null;
  title: string;
  is_template: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DietPlanInsert {
  dietitian_id: string;
  client_id?: string | null;
  title: string;
  is_template?: boolean;
  notes?: string | null;
}

export interface DietPlanUpdate {
  client_id?: string | null;
  title?: string;
  is_template?: boolean;
  notes?: string | null;
}

// ─── Plan Day ───────────────────────────────────────────

export interface PlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  label: string | null;
  notes: string | null;
}

export interface PlanDayInsert {
  plan_id: string;
  day_number: number;
  label?: string | null;
  notes?: string | null;
}

export interface PlanDayUpdate {
  day_number?: number;
  label?: string | null;
  notes?: string | null;
}

// ─── Meal Slot ──────────────────────────────────────────

export interface MealSlot {
  id: string;
  day_id: string;
  slot_type: MealSlotType;
  label: string;
  time_of_day: string | null;
  sort_order: number;
}

export interface MealSlotInsert {
  day_id: string;
  slot_type?: MealSlotType;
  label: string;
  time_of_day?: string | null;
  sort_order?: number;
}

export interface MealSlotUpdate {
  slot_type?: MealSlotType;
  label?: string;
  time_of_day?: string | null;
  sort_order?: number;
}

// ─── Meal Item ──────────────────────────────────────────

export interface MealItem {
  id: string;
  slot_id: string;
  food_id: string;
  quantity: number;
  unit: string;
  notes: string | null;
  sort_order: number;
}

export interface MealItemInsert {
  slot_id: string;
  food_id: string;
  quantity?: number;
  unit?: string;
  notes?: string | null;
  sort_order?: number;
}

export interface MealItemUpdate {
  food_id?: string;
  quantity?: number;
  unit?: string;
  notes?: string | null;
  sort_order?: number;
}

// ─── Joined / composite types for queries ───────────────

export interface MealItemWithFood extends MealItem {
  food: Food;
}

export interface MealSlotWithItems extends MealSlot {
  items: MealItemWithFood[];
}

export interface PlanDayWithSlots extends PlanDay {
  slots: MealSlotWithItems[];
}

export interface DietPlanWithDetails extends DietPlan {
  client: Client | null;
  days: PlanDayWithSlots[];
}

export interface FoodWithNutrients extends Food {
  nutrients: FoodNutrients | null;
}

export interface DishFoodWithIngredients extends Food {
  ingredients: (DishIngredient & { ingredient_food: Food })[];
}

export interface ClientWithPlans extends Client {
  plans: DietPlan[];
}
