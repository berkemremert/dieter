'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteFood(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Verify the user owns this food (optional but good for safety)
  const { data: food } = await supabase.from('foods').select('dietitian_id').eq('id', id).single();
  
  if (food && food.dietitian_id !== user.id) {
    return { success: false, error: 'Sadece kendi eklediğiniz yiyecekleri silebilirsiniz.' };
  }

  const { error } = await supabase.from('foods').delete().eq('id', id);

  if (error) {
    if (error.code === '23503') { // foreign_key_violation
      return { success: false, error: 'Bu yiyecek bir planda kullanıldığı için silinemez.' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/foods');
  return { success: true };
}
