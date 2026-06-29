'use server';

import { createClient } from '@/lib/supabase/server';
import { foodSchema, type FoodFormData } from '@/lib/validators/food';
import type { Food, FoodWithNutrients } from '@/lib/types/database';

export async function searchFoods(
  query: string,
  categoryId?: string,
): Promise<Food[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let q = supabase
    .from('foods')
    .select('*')
    .or(`dietitian_id.is.null,dietitian_id.eq.${user.id}`)
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20);

  if (categoryId) {
    q = q.eq('category_id', categoryId);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFood(id: string): Promise<FoodWithNutrients | null> {
  const supabase = await createClient();

  const { data: food, error } = await supabase
    .from('foods')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  const { data: nutrients } = await supabase
    .from('food_nutrients')
    .select('*')
    .eq('food_id', id)
    .single();

  return { ...food, nutrients: nutrients ?? null };
}

export async function createFoodAction(
  formData: FoodFormData,
): Promise<{ success: boolean; food?: Food; error?: string }> {
  const parsed = foodSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('foods')
    .insert({
      ...parsed.data,
      dietitian_id: user.id,
      source: parsed.data.source || 'manual',
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, food: data };
}

export async function updateFoodAction(
  id: string,
  formData: Partial<FoodFormData>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('foods')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('dietitian_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteFoodAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('foods')
    .delete()
    .eq('id', id)
    .eq('dietitian_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getMyFoods(): Promise<Food[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('dietitian_id', user.id)
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}
