/**
 * Pure nutrient calculation functions.
 * These are the most bug-prone part of a diet planning app — keep them pure and well-tested.
 */

import type { Food, MealItemWithFood, MealSlotWithItems, PlanDayWithSlots } from '@/lib/types/database';
import { getGramsForUnit } from '@/lib/constants/units';

// ─── Types ──────────────────────────────────────────────

export interface NutrientTotals {
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
  fiber: number;
  sugar: number;
  saturatedFat: number;
  sodium: number;
  cholesterol: number;
}

export const EMPTY_NUTRIENTS: NutrientTotals = {
  calories: 0,
  protein: 0,
  carbohydrate: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  saturatedFat: 0,
  sodium: 0,
  cholesterol: 0,
};

// ─── Core calculations ─────────────────────────────────

/**
 * Scale a food's nutrients by quantity and unit.
 * All foods store nutrients per their `serving_size` in `serving_unit`.
 * This function converts the requested quantity+unit to grams,
 * then scales nutrients proportionally.
 *
 * Example: food has 165 kcal per 100g serving.
 *   calculateServingNutrients(food, 200, 'g') → 330 kcal
 *   calculateServingNutrients(food, 1, 'su_bardagi') → 330 kcal (1 su bardağı = 200g)
 */
export function calculateServingNutrients(
  food: Food,
  quantity: number,
  unit: string,
): NutrientTotals {
  if (quantity <= 0) return { ...EMPTY_NUTRIENTS };

  // Get grams for the requested unit
  const requestedGrams = getGramsForUnit(unit, food.base_unit_grams);
  // Get grams for the food's own serving unit
  const foodServingGrams = getGramsForUnit(food.serving_unit, food.base_unit_grams);

  // If either conversion is unknown, fall back to treating quantity as a multiplier of the serving
  let scale: number;
  if (requestedGrams !== null && foodServingGrams !== null && foodServingGrams > 0) {
    const totalGrams = quantity * requestedGrams;
    const foodTotalGrams = food.serving_size * foodServingGrams;
    scale = totalGrams / foodTotalGrams;
  } else {
    // Fallback: treat quantity as number of servings
    scale = quantity / food.serving_size;
  }

  return {
    calories: round(food.calories * scale),
    protein: round(food.protein * scale),
    carbohydrate: round(food.carbohydrate * scale),
    fat: round(food.fat * scale),
    fiber: round((food.fiber ?? 0) * scale),
    sugar: round((food.sugar ?? 0) * scale),
    saturatedFat: round((food.saturated_fat ?? 0) * scale),
    sodium: round((food.sodium ?? 0) * scale),
    cholesterol: round((food.cholesterol ?? 0) * scale),
  };
}

/**
 * Calculate total nutrients for a dish from its ingredients.
 * Each ingredient has a quantity+unit referencing an existing food.
 *
 * Returns nutrients for the ENTIRE batch. To get per-serving,
 * divide by the number of servings (totalBatchGrams / servingSizeGrams).
 */
export function calculateDishNutrients(
  ingredients: { food: Food; quantity: number; unit: string }[],
): NutrientTotals {
  return ingredients.reduce<NutrientTotals>((totals, ingredient) => {
    const itemNutrients = calculateServingNutrients(
      ingredient.food,
      ingredient.quantity,
      ingredient.unit,
    );
    return addNutrients(totals, itemNutrients);
  }, { ...EMPTY_NUTRIENTS });
}

/**
 * Calculate per-serving nutrients for a dish.
 * totalBatchGrams: total weight of all ingredients combined
 * servingGrams: weight of one serving
 */
export function calculateDishPerServing(
  batchNutrients: NutrientTotals,
  totalBatchGrams: number,
  servingGrams: number,
): NutrientTotals {
  if (totalBatchGrams <= 0 || servingGrams <= 0) return { ...EMPTY_NUTRIENTS };
  const scale = servingGrams / totalBatchGrams;
  return scaleNutrients(batchNutrients, scale);
}

/**
 * Calculate total nutrients for a meal (all items in a meal slot).
 */
export function calculateMealTotals(items: MealItemWithFood[]): NutrientTotals {
  return items.reduce<NutrientTotals>((totals, item) => {
    const itemNutrients = calculateServingNutrients(item.food, item.quantity, item.unit);
    return addNutrients(totals, itemNutrients);
  }, { ...EMPTY_NUTRIENTS });
}

/**
 * Calculate total nutrients for a day (all meal slots).
 */
export function calculateDayTotals(slots: MealSlotWithItems[]): NutrientTotals {
  return slots.reduce<NutrientTotals>((totals, slot) => {
    const mealTotals = calculateMealTotals(slot.items);
    return addNutrients(totals, mealTotals);
  }, { ...EMPTY_NUTRIENTS });
}

/**
 * Calculate total nutrients for an entire plan (all days).
 */
export function calculatePlanTotals(days: PlanDayWithSlots[]): NutrientTotals {
  return days.reduce<NutrientTotals>((totals, day) => {
    const dayTotals = calculateDayTotals(day.slots);
    return addNutrients(totals, dayTotals);
  }, { ...EMPTY_NUTRIENTS });
}

/**
 * Calculate daily average nutrients for a plan.
 */
export function calculatePlanDailyAverage(days: PlanDayWithSlots[]): NutrientTotals {
  if (days.length === 0) return { ...EMPTY_NUTRIENTS };
  const totals = calculatePlanTotals(days);
  return scaleNutrients(totals, 1 / days.length);
}

// ─── Helpers ────────────────────────────────────────────

/**
 * Add two nutrient totals together.
 */
export function addNutrients(a: NutrientTotals, b: NutrientTotals): NutrientTotals {
  return {
    calories: round(a.calories + b.calories),
    protein: round(a.protein + b.protein),
    carbohydrate: round(a.carbohydrate + b.carbohydrate),
    fat: round(a.fat + b.fat),
    fiber: round(a.fiber + b.fiber),
    sugar: round(a.sugar + b.sugar),
    saturatedFat: round(a.saturatedFat + b.saturatedFat),
    sodium: round(a.sodium + b.sodium),
    cholesterol: round(a.cholesterol + b.cholesterol),
  };
}

/**
 * Scale all nutrient values by a factor.
 */
export function scaleNutrients(nutrients: NutrientTotals, factor: number): NutrientTotals {
  return {
    calories: round(nutrients.calories * factor),
    protein: round(nutrients.protein * factor),
    carbohydrate: round(nutrients.carbohydrate * factor),
    fat: round(nutrients.fat * factor),
    fiber: round(nutrients.fiber * factor),
    sugar: round(nutrients.sugar * factor),
    saturatedFat: round(nutrients.saturatedFat * factor),
    sodium: round(nutrients.sodium * factor),
    cholesterol: round(nutrients.cholesterol * factor),
  };
}

/**
 * Round a number to 1 decimal place.
 */
function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Calculate macronutrient percentages (protein/carbs/fat as % of calories).
 */
export function calculateMacroPercentages(nutrients: NutrientTotals): {
  proteinPct: number;
  carbPct: number;
  fatPct: number;
} {
  const totalCalFromMacros =
    nutrients.protein * 4 + nutrients.carbohydrate * 4 + nutrients.fat * 9;

  if (totalCalFromMacros === 0) {
    return { proteinPct: 0, carbPct: 0, fatPct: 0 };
  }

  return {
    proteinPct: Math.round(((nutrients.protein * 4) / totalCalFromMacros) * 100),
    carbPct: Math.round(((nutrients.carbohydrate * 4) / totalCalFromMacros) * 100),
    fatPct: Math.round(((nutrients.fat * 9) / totalCalFromMacros) * 100),
  };
}
