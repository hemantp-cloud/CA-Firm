import { z } from 'zod';

/**
 * Schema for creating a new trainee
 */
export const createTraineeSchema = z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    pan: z.string().optional(),
    aadhar: z.string().optional(),
    address: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    twoFactorEnabled: z.boolean().optional().default(false),
    mustChangePassword: z.boolean().optional().default(true),
});

/**
 * Schema for updating an existing trainee
 */
export const updateTraineeSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().optional().nullable(),
    pan: z.string().optional().nullable(),
    aadhar: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    twoFactorEnabled: z.boolean

        ().optional(),
});

/**
 * Schema for assigning clients to a trainee
 */
export const assignClientsSchema = z.object({
    clientIds: z.array(z.string().uuid('Invalid client ID')).min(1, 'At least one client ID is required'),
    notes: z.string().optional(),
});

/**
 * Schema for unassigning clients from a trainee
 */
export const unassignClientsSchema = z.object({
    clientIds: z.array(z.string().uuid('Invalid client ID')).min(1, 'At least one client ID is required'),
});

export type CreateTraineeInput = z.infer<typeof createTraineeSchema>;
export type UpdateTraineeInput = z.infer<typeof updateTraineeSchema>;
export type AssignClientsInput = z.infer<typeof assignClientsSchema>;
export type UnassignClientsInput = z.infer<typeof unassignClientsSchema>;
