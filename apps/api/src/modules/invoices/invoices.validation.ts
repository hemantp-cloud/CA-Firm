import { z } from 'zod';

export const createInvoiceSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  clientId: z.string().uuid('Invalid client ID').optional(),
  serviceId: z.string().uuid('Invalid service ID').optional(),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Description is required'),
      quantity: z.union([z.number(), z.string()]).transform((val) => {
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? 1 : parsed;
        }
        return val || 1;
      }),
      unitPrice: z.union([z.number(), z.string()]).transform((val) => {
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? 0 : parsed;
        }
        return val || 0;
      }),
      taxRate: z.union([z.number(), z.string()]).optional().transform((val) => {
        if (val === undefined) return undefined;
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? undefined : parsed;
        }
        return val;
      }),
    })
  ).min(1, 'At least one item is required'),
  discount: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (val === undefined) return 0;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val || 0;
  }),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  items: z.array(
    z.object({
      description: z.string().min(1, 'Description is required'),
      quantity: z.union([z.number(), z.string()]).transform((val) => {
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? 1 : parsed;
        }
        return val || 1;
      }),
      unitPrice: z.union([z.number(), z.string()]).transform((val) => {
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? 0 : parsed;
        }
        return val || 0;
      }),
      taxRate: z.union([z.number(), z.string()]).optional().transform((val) => {
        if (val === undefined) return undefined;
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? undefined : parsed;
        }
        return val;
      }),
    })
  ).min(1, 'At least one item is required').optional(),
});

