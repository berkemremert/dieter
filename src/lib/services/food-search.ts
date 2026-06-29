/**
 * External food search integration service.
 * Handles FatSecret and USDA API calls with caching.
 */

import type { FoodInsert } from '@/lib/types/database';

// ─── FatSecret ──────────────────────────────────────────

interface FatSecretToken {
  access_token: string;
  expires_at: number;
}

let fatSecretToken: FatSecretToken | null = null;

async function getFatSecretToken(): Promise<string> {
  // Reuse token if still valid (with 60s buffer)
  if (fatSecretToken && fatSecretToken.expires_at > Date.now() + 60_000) {
    return fatSecretToken.access_token;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('FatSecret credentials not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FatSecret token error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  fatSecretToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return fatSecretToken.access_token;
}

interface FatSecretFood {
  food_id: string;
  food_name: string;
  food_description: string;
  brand_name?: string;
  food_type?: string;
}

export async function searchFatSecret(query: string): Promise<FoodInsert[]> {

  try {
    const token = await getFatSecretToken();

    const params = new URLSearchParams({
      method: 'foods.search',
      search_expression: query,
      format: 'json',
      max_results: '10',
      region: 'TR',
      language: 'tr',
    });

    const response = await fetch(
      `https://platform.fatsecret.com/rest/server.api?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      console.error('FatSecret search error:', response.status);
      return [];
    }

    const data = await response.json();
    const foods: FatSecretFood[] = data?.foods?.food ?? [];

    if (!Array.isArray(foods)) {
      // Sometimes FatSecret returns a single object instead of an array
      return foods ? [parseFatSecretFood(foods as unknown as FatSecretFood)] : [];
    }

    return foods.map(parseFatSecretFood);
  } catch (error) {
    console.error('FatSecret search failed:', error);
    return [];
  }
}

function parseFatSecretFood(food: FatSecretFood): FoodInsert {
  // FatSecret food_description format: "Per 100g - Calories: 165kcal | Fat: 3.60g | Carbs: 0.00g | Protein: 31.02g"
  const desc = food.food_description || '';
  const calories = parseNutrient(desc, /Calories:\s*([\d.]+)/);
  const fat = parseNutrient(desc, /Fat:\s*([\d.]+)/);
  const carbs = parseNutrient(desc, /Carbs:\s*([\d.]+)/);
  const protein = parseNutrient(desc, /Protein:\s*([\d.]+)/);

  // Try to extract serving size
  const servingMatch = desc.match(/Per\s+(\d+)(g|ml)/i);
  const servingSize = servingMatch ? parseFloat(servingMatch[1]) : 100;
  const servingUnit = servingMatch ? servingMatch[2] : 'g';

  return {
    name: food.food_name,
    source: 'fatsecret',
    external_id: food.food_id,
    calories,
    protein,
    carbohydrate: carbs,
    fat,
    serving_size: servingSize,
    serving_unit: servingUnit,
    source_attribution: food.brand_name
      ? `FatSecret — ${food.brand_name}`
      : 'FatSecret',
  };
}

function parseNutrient(desc: string, pattern: RegExp): number {
  const match = desc.match(pattern);
  return match ? parseFloat(match[1]) : 0;
}

// ─── USDA ───────────────────────────────────────────────

interface USDAFood {
  fdcId: number;
  description: string;
  dataType?: string;
  foodNutrients?: {
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }[];
}

export async function searchUSDA(query: string): Promise<FoodInsert[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    console.warn('USDA API key not configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      query,
      pageSize: '10',
      dataType: 'Foundation,SR Legacy',
    });

    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?${params.toString()}`,
    );

    if (!response.ok) {
      console.error('USDA search error:', response.status);
      return [];
    }

    const data = await response.json();
    const foods: USDAFood[] = data?.foods ?? [];

    return foods.map(parseUSDAFood);
  } catch (error) {
    console.error('USDA search failed:', error);
    return [];
  }
}

function parseUSDAFood(food: USDAFood): FoodInsert {
  const nutrients = food.foodNutrients ?? [];

  function getNutrient(nutrientId: number): number {
    const n = nutrients.find((n) => n.nutrientId === nutrientId);
    return n ? Math.round(n.value * 10) / 10 : 0;
  }

  return {
    name: food.description,
    source: 'usda',
    external_id: String(food.fdcId),
    calories: getNutrient(1008),    // Energy (kcal)
    protein: getNutrient(1003),     // Protein
    carbohydrate: getNutrient(1005), // Carbohydrate
    fat: getNutrient(1004),          // Total lipid (fat)
    fiber: getNutrient(1079) || null,        // Fiber
    sugar: getNutrient(2000) || null,        // Total sugars
    saturated_fat: getNutrient(1258) || null, // Saturated fatty acids
    sodium: getNutrient(1093) || null,        // Sodium
    cholesterol: getNutrient(1253) || null,   // Cholesterol
    serving_size: 100,
    serving_unit: 'g',
    source_attribution: 'USDA FoodData Central',
  };
}
