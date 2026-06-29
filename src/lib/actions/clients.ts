'use server';

import { createClient } from '@/lib/supabase/server';
import { clientSchema, type ClientFormData } from '@/lib/validators/client';
import type { Client, ClientWithPlans } from '@/lib/types/database';

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('dietitian_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClient(id: string): Promise<ClientWithPlans | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('dietitian_id', user.id)
    .single();

  if (error) return null;

  const { data: plans } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('client_id', id)
    .order('updated_at', { ascending: false });

  return { ...client, plans: plans ?? [] };
}

export async function createClientAction(
  formData: ClientFormData,
): Promise<{ success: boolean; client?: Client; error?: string }> {
  const parsed = clientSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('clients')
    .insert({
      dietitian_id: user.id,
      ...parsed.data,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, client: data };
}

export async function updateClientAction(
  id: string,
  formData: Partial<ClientFormData>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('clients')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('dietitian_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteClientAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('dietitian_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
