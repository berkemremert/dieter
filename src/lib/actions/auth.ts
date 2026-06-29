'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function createDietitianProfile(id: string, displayName: string, clinicName: string | null) {
  const adminSupabase = createAdminClient();
  
  // We use the admin client to safely insert the profile bypassing RLS,
  // since RLS sometimes prevents inserts immediately after signup due to session propagation delay.
  const { error } = await adminSupabase.from('dietitians').insert({
    id,
    display_name: displayName,
    clinic_name: clinicName,
  });

  if (error) {
    console.error('Failed to create dietitian profile via server action:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
