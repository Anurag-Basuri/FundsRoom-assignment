import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(160),
    sku: z.string().min(1).max(60),
    category: z.string().max(80).optional().nullable(),
    unit_price: z.number().min(0, 'Unit price must be non-negative'),
    current_stock: z.number().int().min(0).optional(),
    min_stock_alert: z.number().int().min(0).optional(),
    location: z.string().max(120).optional().nullable(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(160).optional(),
    sku: z.string().min(1).max(60).optional(),
    category: z.string().max(80).optional().nullable(),
    unit_price: z.number().min(0).optional(),
    min_stock_alert: z.number().int().min(0).optional(),
    location: z.string().max(120).optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    search: z.string().optional(),
    category: z.string().optional(),
    low_stock: z.string().optional(),
  }),
});
