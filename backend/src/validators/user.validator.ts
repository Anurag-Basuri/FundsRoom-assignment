import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['Admin', 'Sales', 'Warehouse', 'Accounts']),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email('Invalid email address').optional(),
    role: z.enum(['Admin', 'Sales', 'Warehouse', 'Accounts']).optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
