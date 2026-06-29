/**
 * Allergen tag definitions (Turkish labels).
 */
export interface AllergenDefinition {
  readonly value: string;
  readonly label: string;
}

export const ALLERGENS: readonly AllergenDefinition[] = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'lactose', label: 'Laktoz' },
  { value: 'nuts', label: 'Kuruyemiş' },
  { value: 'egg', label: 'Yumurta' },
  { value: 'soy', label: 'Soya' },
  { value: 'fish', label: 'Balık' },
  { value: 'shellfish', label: 'Kabuklu Deniz Ürünü' },
  { value: 'sesame', label: 'Susam' },
  { value: 'celery', label: 'Kereviz' },
  { value: 'mustard', label: 'Hardal' },
  { value: 'sulfite', label: 'Sülfit' },
] as const;

/**
 * Food category definitions (Turkish labels).
 * These must match the seeded categories in the database.
 */
export interface CategoryDefinition {
  readonly value: string;
  readonly label: string;
}

export const FOOD_CATEGORIES: readonly CategoryDefinition[] = [
  { value: 'et_tavuk', label: 'Et & Tavuk' },
  { value: 'balik_deniz', label: 'Balık & Deniz Ürünleri' },
  { value: 'sut_urunleri', label: 'Süt Ürünleri' },
  { value: 'yumurta', label: 'Yumurta' },
  { value: 'sebze', label: 'Sebze' },
  { value: 'meyve', label: 'Meyve' },
  { value: 'tahil_baklagil', label: 'Tahıl & Baklagil' },
  { value: 'ekmek_unlu', label: 'Ekmek & Unlu Mamul' },
  { value: 'yag_sos', label: 'Yağ & Sos' },
  { value: 'icecek', label: 'İçecek' },
  { value: 'tatli_atistirmalik', label: 'Tatlı & Atıştırmalık' },
  { value: 'kuruyemis', label: 'Kuruyemiş' },
  { value: 'diger', label: 'Diğer' },
] as const;
