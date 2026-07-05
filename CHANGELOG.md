# 更新日志

## 2026-07-05 — 应用（App）概念与验证码自动提取

### 新增功能

#### 应用管理
- **新增 `App` 数据模型**：支持配置应用名称、发件人匹配（多个）、主题关键词、验证码正则
- **新增 `AppRegistration` 数据模型**：记录邮箱→应用绑定关系，`@@unique([appId, emailAccountId])` 确保同一邮箱+同一应用全局唯一
- **新增 `/admin/apps` 管理页面**：应用 CRUD + 注册记录查看
- **邮箱管理页新增「注册应用」按钮**：点击弹窗查看该邮箱注册过哪些应用（序号、应用名、使用时间）

#### API 增强
- **`/api/get-email` 新增 `app` 参数**：分配邮箱时跳过该应用已用过的邮箱，分配后自动写入 AppRegistration
- **`/api/mail_text` 新增 `mailbox` 参数**：支持指定 `inbox` / `junk` 文件夹
- **`/api/mail_text` 新增 `app` 参数**：自动按应用配置的 fromPatterns + subjectPattern（AND 逻辑）匹配验证邮件，用 codeRegex 提取验证码；`match` 参数优先于 app 配置
- **`/api/mail_new` 新增 `app` 参数**（预留）

#### 其他
- **批量导入邮箱优化**：bodyLimit 从 1MB 提升至 10MB，新增 10000 条上限校验
- **生成 `API.md`** 完整接口文档

### 修改文件

| 文件 | 操作 |
|------|------|
| `server/prisma/schema.prisma` | 新增 App + AppRegistration 模型，关联 Admin/ApiKey/EmailAccount |
| `server/src/modules/app/app.schema.ts` | 新建 — Zod 校验 |
| `server/src/modules/app/app.service.ts` | 新建 — CRUD + getByName + listRegistrations |
| `server/src/modules/app/app.routes.ts` | 新建 — `/admin/apps` 路由 |
| `server/src/app.ts` | 注册 app 路由 + bodyLimit 10MB |
| `server/src/modules/mail/mail.schema.ts` | mailRequestSchema 加 `app` 字段 |
| `server/src/modules/mail/mail.routes.ts` | get-email/mail_text/mail_new 支持 app；mail_text 支持 mailbox；app 配置匹配逻辑 |
| `server/src/modules/mail/pool.service.ts` | getUnusedEmail 支持 appName 过滤；新增 markAppUsed |
| `server/src/modules/email/email.schema.ts` | importEmailSchema 加 10000 条上限校验 |
| `server/src/modules/email/email.service.ts` | list() 返回 apps 字段 |
| `web/src/pages/apps/index.tsx` | 新建 — 应用管理页（列表 + 注册记录 Tab） |
| `web/src/pages/emails/index.tsx` | 新增注册应用按钮+弹窗；复选框列宽缩小至 40px |
| `web/src/pages/api-keys/index.tsx` | pageSize 1000 → 100 修复 |
| `web/src/pages/api-docs/index.tsx` | 更新 app/mailbox 参数文档 |
| `web/src/api/index.ts` | 新增 appApi |
| `web/src/App.tsx` | 新增 /apps 路由 |
| `web/src/layouts/MainLayout.tsx` | 侧边栏新增「应用管理」菜单 |
| `API.md` | 新建 — 完整 API 文档 |
