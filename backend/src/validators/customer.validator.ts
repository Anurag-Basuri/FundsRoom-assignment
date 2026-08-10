import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    mobile: z.string().min(7).max(20),
    email: z.string().email().optional().nullable(),
    business_name: z.string().max(160).optional().nullable(),
    gst_number: z.string().max(20).optional().nullable(),
    customer_type: z.enum(['Retail', 'Wholesale', 'Distributor']),
    address: z.string().optional().nullable(),
    status: z.enum(['Lead', 'Active', 'Inactive']).optional(),
    follow_up_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    mobile: z.string().min(7).max(20).optional(),
    email: z.string().email().optional().nullable(),
    business_name: z.string().max(160).optional().nullable(),
    gst_number: z.string().max(20).optional().nullable(),
    customer_type: z.enum(['Retail', 'Wholesale', 'Distributor']).optional(),
    address: z.string().optional().nullable(),
    status: z.enum(['Lead', 'Active', 'Inactive']).optional(),
    follow_up_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const addFollowUpSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Note is required'),
    follow_up_date: z.string().optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listCustomersSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    search: z.string().optional(),
    status: z.enum(['Lead', 'Active', 'Inactive']).optional(),
    customer_type: z.enum(['Retail', 'Wholesale', 'Distributor']).optional(),
  }),
});
