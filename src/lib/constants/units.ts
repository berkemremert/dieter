/**
 * Turkish unit definitions with default gram conversion factors.
 * Units with `baseGrams: null` are food-specific — the conversion is stored per food.
 */
export interface UnitDefinition {
  readonly value: string;
  readonly label: string;
  readonly baseGrams: number | null;
}

export const UNITS: readonly UnitDefinition[] = [
  { value: 'g', label: 'gram', baseGrams: 1 },
  { value: 'ml', label: 'ml', baseGrams: 1 },
  { value: 'su_bardagi', label: 'Su Bardağı', baseGrams: 200 },
  { value: 'yemek_kasigi', label: 'Yemek Kaşığı', baseGrams: 15 },
  { value: 'tatli_kasigi', label: 'Tatlı Kaşığı', baseGrams: 10 },
  { value: 'cay_kasigi', label: 'Çay Kaşığı', baseGrams: 5 },
  { value: 'adet', label: 'Adet', baseGrams: null },
  { value: 'dilim', label: 'Dilim', baseGrams: null },
  { value: 'porsiyon', label: 'Porsiyon', baseGrams: null },
] as const;

/**
 * Get the gram conversion factor for a unit.
 * If the unit has a fixed factor, return it.
 * If it's food-specific (null), use the provided food-level override.
 */
export function getGramsForUnit(
  unitValue: string,
  foodBaseUnitGrams?: number | null,
): number | null {
  const unit = UNITS.find((u) => u.value === unitValue);
  if (!unit) return null;
  if (unit.baseGrams !== null) return unit.baseGrams;
  return foodBaseUnitGrams ?? null;
}

/**
 * Get unit label by value.
 */
export function getUnitLabel(unitValue: string): string {
  const unit = UNITS.find((u) => u.value === unitValue);
  return unit?.label ?? unitValue;
}
