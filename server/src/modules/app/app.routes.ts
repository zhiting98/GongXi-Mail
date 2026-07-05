import { type FastifyPluginAsync } from 'fastify';
import { appService } from './app.service.js';
import { createAppSchema, updateAppSchema, listAppSchema } from './app.schema.js';
import { z } from 'zod';

const listRegistrationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
});

const appRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', fastify.authenticateJwt);

    // 列表
    fastify.get('/', async (request) => {
        const input = listAppSchema.parse(request.query);
        const result = await appService.list(input);
        return { success: true, data: result };
    });

    // 创建
    fastify.post('/', async (request) => {
        const input = createAppSchema.parse(request.body);
        const app = await appService.create(input, request.user!.id);
        request.log.info({
            systemEvent: true,
            action: 'app.create',
            actorId: request.user?.id ?? null,
            actorUsername: request.user?.username ?? null,
            appId: app.id,
            name: app.name,
        }, '新增应用');
        return { success: true, data: app };
    });

    // 详情
    fastify.get('/:id', async (request) => {
        const { id } = request.params as { id: string };
        const app = await appService.getById(parseInt(id));
        return { success: true, data: app };
    });

    // 更新
    fastify.put('/:id', async (request) => {
        const { id } = request.params as { id: string };
        const input = updateAppSchema.parse(request.body);
        const app = await appService.update(parseInt(id), input);
        request.log.info({
            systemEvent: true,
            action: 'app.update',
            actorId: request.user?.id ?? null,
            actorUsername: request.user?.username ?? null,
            appId: app.id,
            name: app.name,
        }, '修改应用');
        return { success: true, data: app };
    });

    // 删除
    fastify.delete('/:id', async (request) => {
        const { id } = request.params as { id: string };
        await appService.delete(parseInt(id));
        request.log.info({
            systemEvent: true,
            action: 'app.delete',
            actorId: request.user?.id ?? null,
            actorUsername: request.user?.username ?? null,
            appId: parseInt(id),
        }, '删除应用');
        return { success: true, data: { message: 'App deleted' } };
    });

    // 注册记录列表（支持按邮箱筛选）
    fastify.get('/registrations', async (request) => {
        const input = listRegistrationSchema.parse(request.query);
        const query = request.query as Record<string, string>;
        const emailId = query.emailId ? parseInt(query.emailId) : undefined;
        const result = await appService.listRegistrations({ ...input, emailId });
        return { success: true, data: result };
    });
};

export default appRoutes;
