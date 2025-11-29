import { z } from 'zod';

// Client validation schemas
const baseClientSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
});

export const createClientSchema = baseClientSchema.extend({
  contactPerson: z.string().min(1, 'Contact person name is required').optional(),
});

export const updateClientSchema = baseClientSchema.partial();

// User validation schemas
const baseUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role: z.enum(['CA', 'CLIENT'], {
    errorMap: () => ({ message: 'Role must be CA or CLIENT' }),
  }),
  clientId: z.string().uuid('Invalid client ID format').optional(),
  pan: z.string().optional(),
  aadhar: z.string().optional(),
  address: z.string().optional(),
});

export const createUserSchema = baseUserSchema.refine(
  (data) => {
    // If role is USER, clientId is required
    if (data.role === 'CLIENT' && !data.clientId) {
      return false;
    }
    return true;
  },
  {
    message: 'Client is required for CLIENT role',
    path: ['clientId'],
  }
);

export const updateUserSchema = baseUserSchema.partial().refine(
  (data) => {
    // If role is being updated to USER, clientId must be provided
    if (data.role === 'CLIENT' && !data.clientId) {
      return false;
    }
    return true;
  },
  {
    message: 'Client is required for CLIENT role',
    path: ['clientId'],
  }
);

