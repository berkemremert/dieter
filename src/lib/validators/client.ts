import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'Ad Soyad zorunlu'),
  birthdate: z.string().nullable().optional(),
  height_cm: z.coerce.number().positive().nullable().optional(),
  weight_kg: z.coerce.number().positive().nullable().optional(),
  goal: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
