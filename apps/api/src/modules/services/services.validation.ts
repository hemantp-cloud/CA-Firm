import { z } from 'zod';
import { ServiceType, ServiceStatus } from '@prisma/client';

export const createServiceSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  userId: z.string().uuid('Invalid user ID'),
  type: z.nativeEnum(ServiceType, {
    errorMap: () => ({ message: 'Invalid service type' }),
  }),
  title: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  financialYear: z.string().optional(),
  period: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  feeAmount: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }
    return val || null;
  }),
  notes: z.string().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const updateServiceStatusSchema = z.object({
  status: z.nativeEnum(ServiceStatus, {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
});

