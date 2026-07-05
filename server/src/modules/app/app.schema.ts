import { z } from 'zod';

export const createAppSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(255).optional(),
    fromPatterns: z.array(z.string().min(1).max(255)).optional(),
    subjectPattern: z.string().max(255).optional(),
    codeRegex: z.string().max(100).optional(),
});

export const updateAppSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(255).optional(),
    fromPatterns: z.array(z.string().min(1).max(255)).optional(),
    subjectPattern: z.string().max(255).optional(),
    codeRegex: z.string().max(100).optional(),
    status: z.enum(['ACTIVE', 'DISABLED']).optional(),
});

export const listAppSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(['ACTIVE', 'DISABLED']).optional(),
    keyword: z.string().optional(),
});

export type CreateAppInput = z.infer<typeof createAppSchema>;
export type UpdateAppInput = z.infer<typeof updateAppSchema>;
export type ListAppInput = z.infer<typeof listAppSchema>;
