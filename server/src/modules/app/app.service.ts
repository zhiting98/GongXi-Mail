import prisma from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../../plugins/error.js';
import type { CreateAppInput, UpdateAppInput, ListAppInput } from './app.schema.js';

function parseJsonArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string' && v.length > 0);
}

export const appService = {
    async list(input: ListAppInput) {
        const { page, pageSize, status, keyword } = input;
        const skip = (page - 1) * pageSize;

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (keyword) {
            where.OR = [
                { name: { contains: keyword } },
                { description: { contains: keyword } },
            ];
        }

        const [list, total] = await Promise.all([
            prisma.app.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    fromPatterns: true,
                    subjectPattern: true,
                    codeRegex: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    creator: { select: { username: true } },
                },
                skip,
                take: pageSize,
                orderBy: { id: 'desc' },
            }),
            prisma.app.count({ where }),
        ]);

        return {
            list: list.map((item) => ({
                ...item,
                fromPatterns: parseJsonArray(item.fromPatterns),
                createdByName: item.creator?.username,
            })),
            total,
            page,
            pageSize,
        };
    },

    async create(input: CreateAppInput, createdBy: number) {
        const exists = await prisma.app.findUnique({ where: { name: input.name } });
        if (exists) {
            throw new AppError('DUPLICATE_APP', 'App name already exists', 400);
        }

        const app = await prisma.app.create({
            data: {
                name: input.name,
                description: input.description || null,
                fromPatterns: input.fromPatterns?.length ? input.fromPatterns : undefined,
                subjectPattern: input.subjectPattern || null,
                codeRegex: input.codeRegex || null,
                createdBy,
            },
            select: {
                id: true,
                name: true,
                description: true,
                fromPatterns: true,
                subjectPattern: true,
                codeRegex: true,
                status: true,
                createdAt: true,
            },
        });

        return {
            ...app,
            fromPatterns: parseJsonArray(app.fromPatterns),
        };
    },

    async getById(id: number) {
        const app = await prisma.app.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                fromPatterns: true,
                subjectPattern: true,
                codeRegex: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                creator: { select: { username: true } },
            },
        });

        if (!app) {
            throw new AppError('NOT_FOUND', 'App not found', 404);
        }

        return {
            ...app,
            fromPatterns: parseJsonArray(app.fromPatterns),
            createdByName: app.creator?.username,
        };
    },

    async getByName(name: string) {
        const app = await prisma.app.findUnique({
            where: { name },
            select: {
                id: true,
                name: true,
                fromPatterns: true,
                subjectPattern: true,
                codeRegex: true,
                status: true,
            },
        });

        if (!app) return null;

        return {
            ...app,
            fromPatterns: parseJsonArray(app.fromPatterns),
        };
    },

    async update(id: number, input: UpdateAppInput) {
        const exists = await prisma.app.findUnique({ where: { id } });
        if (!exists) {
            throw new AppError('NOT_FOUND', 'App not found', 404);
        }

        if (input.name && input.name !== exists.name) {
            const dup = await prisma.app.findUnique({ where: { name: input.name } });
            if (dup) {
                throw new AppError('DUPLICATE_APP', 'App name already exists', 400);
            }
        }

        const data: Record<string, unknown> = {};
        if (input.name !== undefined) data.name = input.name;
        if (input.description !== undefined) data.description = input.description || null;
        if (input.fromPatterns !== undefined) data.fromPatterns = input.fromPatterns.length ? input.fromPatterns : null;
        if (input.subjectPattern !== undefined) data.subjectPattern = input.subjectPattern || null;
        if (input.codeRegex !== undefined) data.codeRegex = input.codeRegex || null;
        if (input.status !== undefined) data.status = input.status;

        const app = await prisma.app.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                description: true,
                fromPatterns: true,
                subjectPattern: true,
                codeRegex: true,
                status: true,
                updatedAt: true,
            },
        });

        return {
            ...app,
            fromPatterns: parseJsonArray(app.fromPatterns),
        };
    },

    async delete(id: number) {
        const exists = await prisma.app.findUnique({ where: { id } });
        if (!exists) {
            throw new AppError('NOT_FOUND', 'App not found', 404);
        }

        await prisma.app.delete({ where: { id } });
        return { success: true };
    },

    async listRegistrations(input: { page: number; pageSize: number; emailId?: number }) {
        const { page, pageSize, emailId } = input;
        const skip = (page - 1) * pageSize;

        const where: Prisma.AppRegistrationWhereInput = {};
        if (emailId) where.emailAccountId = emailId;

        const [list, total] = await Promise.all([
            prisma.appRegistration.findMany({
                where,
                select: {
                    id: true,
                    createdAt: true,
                    app: { select: { id: true, name: true } },
                    emailAccount: { select: { id: true, email: true } },
                    apiKey: { select: { id: true, name: true, keyPrefix: true } },
                },
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.appRegistration.count({ where }),
        ]);

        return {
            list: list.map((r) => ({
                id: r.id,
                appId: r.app.id,
                appName: r.app.name,
                emailId: r.emailAccount.id,
                email: r.emailAccount.email,
                apiKeyId: r.apiKey.id,
                apiKeyName: r.apiKey.name,
                createdAt: r.createdAt,
            })),
            total,
            page,
            pageSize,
        };
    },
};
