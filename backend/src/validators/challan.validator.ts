import { z } from 'zod';

const challanItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const createChallanSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid(),
    items: z.array(challanItemSchema).min(1, 'At least one item is required'),
  }),
});

export const updateChallanSchema = z.object({
  body: z.object({
    items: z.array(challanItemSchema).min(1, 'At least one item is required'),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listChallansSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    status: z.enum(['Draft', 'Confirmed', 'Cancelled']).optional(),
    customer_id: z.string().uuid().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
  }),
});
