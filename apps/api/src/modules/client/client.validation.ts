import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const uploadClientDocumentSchema = z.object({
  documentType: z.string().min(1, 'Document type is required'),
  serviceId: z.string().uuid('Invalid service ID').optional(),
  description: z.string().optional(),
});

export const recordClientPaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
});

export const updateClientProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().optional(),
  pan: z.string().optional(),
  aadhar: z.string().optional(),
  address: z.string().optional(),
});

