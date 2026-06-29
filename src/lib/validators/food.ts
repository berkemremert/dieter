import { z } from 'zod';

export const foodSchema = z.object({
  name: z.string().min(1, 'Yiyecek adı zorunlu'),
  source: z.enum(['manual', 'dish', 'fatsecret', 'usda']).default('manual'),
  category_id: z.string().nullable().optional(),
  serving_size: z.coerce.number().positive().default(100),
  serving_unit: z.string().default('g'),
  base_unit_grams: z.coerce.number().positive().nullable().optional(),
  calories: z.coerce.number().min(0, 'Kalori 0 veya üzeri olmalı'),
  protein: z.coerce.number().min(0).default(0),
  carbohydrate: z.coerce.number().min(0).default(0),
  fat: z.coerce.number().min(0).default(0),
  fiber: z.coerce.number().min(0).nullable().optional(),
  sugar: z.coerce.number().min(0).nullable().optional(),
  saturated_fat: z.coerce.number().min(0).nullable().optional(),
  sodium: z.coerce.number().min(0).nullable().optional(),
  cholesterol: z.coerce.number().min(0).nullable().optional(),
  glycemic_index: z.coerce.number().int().min(0).max(100).nullable().optional(),
  allergen_tags: z.array(z.string()).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  is_shared_candidate: z.boolean().default(false),
  source_attribution: z.string().nullable().optional(),
});

export type FoodFormData = z.infer<typeof foodSchema>;

export const dishIngredientSchema = z.object({
  ingredient_food_id: z.string().min(1),
  quantity: z.coerce.number().positive('Miktar 0\'dan büyük olmalı'),
  unit: z.string().default('g'),
});

export type DishIngredientFormData = z.infer<typeof dishIngredientSchema>;

export const foodNutrientsSchema = z.object({
  vitamin_a: z.coerce.number().min(0).nullable().optional(),
  vitamin_c: z.coerce.number().min(0).nullable().optional(),
  vitamin_d: z.coerce.number().min(0).nullable().optional(),
  vitamin_e: z.coerce.number().min(0).nullable().optional(),
  vitamin_k: z.coerce.number().min(0).nullable().optional(),
  vitamin_b1: z.coerce.number().min(0).nullable().optional(),
  vitamin_b2: z.coerce.number().min(0).nullable().optional(),
  vitamin_b3: z.coerce.number().min(0).nullable().optional(),
  vitamin_b6: z.coerce.number().min(0).nullable().optional(),
  vitamin_b12: z.coerce.number().min(0).nullable().optional(),
  folate: z.coerce.number().min(0).nullable().optional(),
  calcium: z.coerce.number().min(0).nullable().optional(),
  iron: z.coerce.number().min(0).nullable().optional(),
  potassium: z.coerce.number().min(0).nullable().optional(),
  magnesium: z.coerce.number().min(0).nullable().optional(),
  zinc: z.coerce.number().min(0).nullable().optional(),
});

export type FoodNutrientsFormData = z.infer<typeof foodNutrientsSchema>;
