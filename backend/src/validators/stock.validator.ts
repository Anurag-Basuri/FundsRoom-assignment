import { z } from 'zod';

export const createMovementSchema = z.object({
  body: z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    movement_type: z.enum(['IN', 'OUT']),
    reason: z.string().min(1).max(255),
  }),
});

export const listMovementsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    product_id: z.string().uuid().optional(),
    movement_type: z.enum(['IN', 'OUT']).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
  }),
});
