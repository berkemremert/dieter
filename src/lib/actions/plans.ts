'use server';

import { createClient } from '@/lib/supabase/server';
import { planSchema, type PlanFormData } from '@/lib/validators/plan';
import type { DietPlan, DietPlanWithDetails } from '@/lib/types/database';

export async function getPlans(isTemplate?: boolean): Promise<DietPlan[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let q = supabase
    .from('diet_plans')
    .select('*')
    .eq('dietitian_id', user.id)
    .order('updated_at', { ascending: false });

  if (isTemplate !== undefined) {
    q = q.eq('is_template', isTemplate);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPlanWithDetails(id: string): Promise<DietPlanWithDetails | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch plan
  const { data: plan, error: planError } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('id', id)
    .eq('dietitian_id', user.id)
    .single();

  if (planError || !plan) return null;

  // Fetch client if exists
  let client = null;
  if (plan.client_id) {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', plan.client_id)
      .single();
    client = data;
  }

  // Fetch days
  const { data: days } = await supabase
    .from('plan_days')
    .select('*')
    .eq('plan_id', id)
    .order('day_number');

  if (!days || days.length === 0) {
    return { ...plan, client, days: [] };
  }

  // Fetch slots for all days
  const dayIds = days.map((d) => d.id);
  const { data: slots } = await supabase
    .from('meal_slots')
    .select('*')
    .in('day_id', dayIds)
    .order('sort_order');

  // Fetch items for all slots
  const slotIds = (slots ?? []).map((s) => s.id);
  const { data: items } = slotIds.length > 0
    ? await supabase
        .from('meal_items')
        .select('*')
        .in('slot_id', slotIds)
        .order('sort_order')
    : { data: [] };

  // Fetch foods for all items
  const foodIds = [...new Set((items ?? []).map((i) => i.food_id))];
  const { data: foods } = foodIds.length > 0
    ? await supabase
        .from('foods')
        .select('*')
        .in('id', foodIds)
    : { data: [] };

  const foodMap = new Map((foods ?? []).map((f) => [f.id, f]));

  // Assemble the full structure
  const itemsWithFood = (items ?? []).map((item) => ({
    ...item,
    food: foodMap.get(item.food_id)!,
  }));

  const slotsWithItems = (slots ?? []).map((slot) => ({
    ...slot,
    items: itemsWithFood.filter((i) => i.slot_id === slot.id),
  }));

  const daysWithSlots = days.map((day) => ({
    ...day,
    slots: slotsWithItems.filter((s) => s.day_id === day.id),
  }));

  return { ...plan, client, days: daysWithSlots };
}

export async function createPlanAction(
  formData: PlanFormData,
): Promise<{ success: boolean; plan?: DietPlan; error?: string }> {
  const parsed = planSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('diet_plans')
    .insert({
      dietitian_id: user.id,
      ...parsed.data,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Create a default first day
  await supabase.from('plan_days').insert({
    plan_id: data.id,
    day_number: 1,
    label: 'Gün 1',
  });

  return { success: true, plan: data };
}

export async function createPlanFromTemplate(
  templateId: string,
  clientId: string,
  newTitle: string,
): Promise<{ success: boolean; plan?: DietPlan; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Fetch the full template
  const template = await getPlanWithDetails(templateId);
  if (!template) return { success: false, error: 'Template not found' };

  // Create the new plan
  const { data: newPlan, error: planError } = await supabase
    .from('diet_plans')
    .insert({
      dietitian_id: user.id,
      client_id: clientId,
      title: newTitle,
      is_template: false,
      notes: template.notes,
    })
    .select()
    .single();

  if (planError || !newPlan) return { success: false, error: planError?.message };

  // Deep-clone days → slots → items
  for (const day of template.days) {
    const { data: newDay } = await supabase
      .from('plan_days')
      .insert({
        plan_id: newPlan.id,
        day_number: day.day_number,
        label: day.label,
        notes: day.notes,
      })
      .select()
      .single();

    if (!newDay) continue;

    for (const slot of day.slots) {
      const { data: newSlot } = await supabase
        .from('meal_slots')
        .insert({
          day_id: newDay.id,
          slot_type: slot.slot_type,
          label: slot.label,
          time_of_day: slot.time_of_day,
          sort_order: slot.sort_order,
        })
        .select()
        .single();

      if (!newSlot) continue;

      if (slot.items.length > 0) {
        await supabase.from('meal_items').insert(
          slot.items.map((item) => ({
            slot_id: newSlot.id,
            food_id: item.food_id,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes,
            sort_order: item.sort_order,
          })),
        );
      }
    }
  }

  return { success: true, plan: newPlan };
}

export async function updatePlanAction(
  id: string,
  formData: Partial<PlanFormData>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('diet_plans')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('dietitian_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deletePlanAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('diet_plans')
    .delete()
    .eq('id', id)
    .eq('dietitian_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addDay(
  planId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the current max day_number
  const { data: maxDay } = await supabase
    .from('plan_days')
    .select('day_number')
    .eq('plan_id', planId)
    .order('day_number', { ascending: false })
    .limit(1)
    .single();

  const nextDayNum = (maxDay?.day_number ?? 0) + 1;

  const { error } = await supabase.from('plan_days').insert({
    plan_id: planId,
    day_number: nextDayNum,
    label: `Gün ${nextDayNum}`,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeDay(
  dayId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('plan_days').delete().eq('id', dayId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function duplicateDay(
  dayId: string,
  planId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Fetch the source day
  const { data: sourceDay } = await supabase
    .from('plan_days')
    .select('*')
    .eq('id', dayId)
    .single();

  if (!sourceDay) return { success: false, error: 'Day not found' };

  // Get max day number
  const { data: maxDay } = await supabase
    .from('plan_days')
    .select('day_number')
    .eq('plan_id', planId)
    .order('day_number', { ascending: false })
    .limit(1)
    .single();

  const nextDayNum = (maxDay?.day_number ?? 0) + 1;

  // Create new day
  const { data: newDay, error: dayError } = await supabase
    .from('plan_days')
    .insert({
      plan_id: planId,
      day_number: nextDayNum,
      label: `${sourceDay.label} (kopya)`,
      notes: sourceDay.notes,
    })
    .select()
    .single();

  if (dayError || !newDay) return { success: false, error: dayError?.message };

  // Clone slots and items
  const { data: slots } = await supabase
    .from('meal_slots')
    .select('*')
    .eq('day_id', dayId)
    .order('sort_order');

  for (const slot of slots ?? []) {
    const { data: newSlot } = await supabase
      .from('meal_slots')
      .insert({
        day_id: newDay.id,
        slot_type: slot.slot_type,
        label: slot.label,
        time_of_day: slot.time_of_day,
        sort_order: slot.sort_order,
      })
      .select()
      .single();

    if (!newSlot) continue;

    const { data: items } = await supabase
      .from('meal_items')
      .select('*')
      .eq('slot_id', slot.id)
      .order('sort_order');

    if (items && items.length > 0) {
      await supabase.from('meal_items').insert(
        items.map((item) => ({
          slot_id: newSlot.id,
          food_id: item.food_id,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
          sort_order: item.sort_order,
        })),
      );
    }
  }

  return { success: true };
}

export async function addMealSlot(
  dayId: string,
  slotType: 'main' | 'snack',
  label: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: maxSlot } = await supabase
    .from('meal_slots')
    .select('sort_order')
    .eq('day_id', dayId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextSort = (maxSlot?.sort_order ?? 0) + 1;

  const { error } = await supabase.from('meal_slots').insert({
    day_id: dayId,
    slot_type: slotType,
    label,
    sort_order: nextSort,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeMealSlot(
  slotId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('meal_slots').delete().eq('id', slotId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addMealItem(
  slotId: string,
  foodId: string,
  quantity: number,
  unit: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: maxItem } = await supabase
    .from('meal_items')
    .select('sort_order')
    .eq('slot_id', slotId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextSort = (maxItem?.sort_order ?? 0) + 1;

  const { error } = await supabase.from('meal_items').insert({
    slot_id: slotId,
    food_id: foodId,
    quantity,
    unit,
    sort_order: nextSort,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateMealItem(
  itemId: string,
  data: { quantity?: number; unit?: string; notes?: string },
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('meal_items').update(data).eq('id', itemId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeMealItem(
  itemId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('meal_items').delete().eq('id', itemId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function savePlanAsTemplate(
  planId: string,
): Promise<{ success: boolean; error?: string }> {
  const template = await getPlanWithDetails(planId);
  if (!template) return { success: false, error: 'Plan not found' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: newPlan, error: planError } = await supabase
    .from('diet_plans')
    .insert({
      dietitian_id: user.id,
      client_id: null,
      title: `${template.title} (şablon)`,
      is_template: true,
      notes: template.notes,
    })
    .select()
    .single();

  if (planError || !newPlan) return { success: false, error: planError?.message };

  // Deep-clone all days/slots/items
  for (const day of template.days) {
    const { data: newDay } = await supabase
      .from('plan_days')
      .insert({
        plan_id: newPlan.id,
        day_number: day.day_number,
        label: day.label,
        notes: day.notes,
      })
      .select()
      .single();

    if (!newDay) continue;

    for (const slot of day.slots) {
      const { data: newSlot } = await supabase
        .from('meal_slots')
        .insert({
          day_id: newDay.id,
          slot_type: slot.slot_type,
          label: slot.label,
          time_of_day: slot.time_of_day,
          sort_order: slot.sort_order,
        })
        .select()
        .single();

      if (!newSlot) continue;

      if (slot.items.length > 0) {
        await supabase.from('meal_items').insert(
          slot.items.map((item) => ({
            slot_id: newSlot.id,
            food_id: item.food_id,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes,
            sort_order: item.sort_order,
          })),
        );
      }
    }
  }

  return { success: true };
}
