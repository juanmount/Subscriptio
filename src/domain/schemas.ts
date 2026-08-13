import { z } from 'zod';

export const FREQUENCIES = ['monthly', 'yearly', 'quarterly', 'semiannual', 'weekly'] as const;

export const SubscriptionFormSchema = z.object({
  providerId: z.number().int().positive().optional(),
  customName: z.string().min(1, 'El nombre es requerido').optional(),
  planId: z.number().int().positive().optional(),
  customPlanName: z.string().optional(),
  priceInput: z
    .string()
    .min(1, 'El precio es requerido')
    .refine(
      (v) => {
        const n = parseFloat(v.replace(',', '.'));
        return !isNaN(n) && n > 0;
      },
      { message: 'Ingresá un precio válido mayor a 0' },
    ),
  currencyCode: z.string().min(3).max(3),
  frequency: z.enum(FREQUENCIES),
  nextRenewalDate: z.number().int().optional(),
  categoryId: z.number().int().positive().optional(),
  cardId: z.number().int().positive().optional(),
  creditsIncluded: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  dataOrigin: z.enum(['manual', 'suggested', 'screenshot', 'connected']),
});

export type SubscriptionFormValues = z.infer<typeof SubscriptionFormSchema>;
