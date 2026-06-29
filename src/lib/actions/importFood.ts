'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import type { FoodInsert } from '@/lib/types/database';

export async function importExternalFood(food: FoodInsert): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    if (!food.source || !food.external_id) {
      return { success: false, error: 'Invalid external food' };
    }

    // Check if it already exists
    const { data: existing } = await adminSupabase
      .from('foods')
      .select('id')
      .eq('source', food.source)
      .eq('external_id', food.external_id)
      .maybeSingle();

    if (existing) {
      return { success: true, id: existing.id };
    }

    // Insert it
    const { data: newFood, error } = await adminSupabase
      .from('foods')
      .upsert(
        { ...food, dietitian_id: null },
        { onConflict: 'source,external_id', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (error || !newFood) {
      return { success: false, error: error?.message || 'Failed to import food' };
    }

    return { success: true, id: newFood.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
