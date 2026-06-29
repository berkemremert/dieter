import { z } from 'zod';

export const planSchema = z.object({
  title: z.string().min(1, 'Plan başlığı zorunlu'),
  client_id: z.string().nullable().optional(),
  is_template: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

export type PlanFormData = z.infer<typeof planSchema>;

export const mealSlotSchema = z.object({
  slot_type: z.enum(['main', 'snack']).default('main'),
  label: z.string().min(1, 'Öğün adı zorunlu'),
  time_of_day: z.string().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
});

export type MealSlotFormData = z.infer<typeof mealSlotSchema>;

export const mealItemSchema = z.object({
  food_id: z.string().min(1, 'Yiyecek seçimi zorunlu'),
  quantity: z.coerce.number().positive('Miktar 0\'dan büyük olmalı'),
  unit: z.string().default('g'),
  notes: z.string().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
});

export type MealItemFormData = z.infer<typeof mealItemSchema>;
