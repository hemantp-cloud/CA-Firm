import { z } from 'zod';

export const createClientUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  pan: z.string().optional(),
  aadhar: z.string().optional(),
  address: z.string().optional(),
});

export const updateClientUserSchema = createClientUserSchema.partial();

export const updateClientProfileSchema = z.object({
  name: z.string().min(1, 'Company name is required').optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
});

