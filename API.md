# GongXi Mail API 文档

## 认证方式

所有 `/api/*` 接口需携带 API Key，支持三种传递方式：

| 方式 | 示例 |
|------|------|
| Header（推荐） | `X-API-Key: sk_xxx` |
| Bearer Token | `Authorization: Bearer sk_xxx` |
| Query 参数 | `?api_key=sk_xxx` |

## 通用响应格式

```json
// 成功
{ "success": true, "data": { ... } }

// 失败
{ "success": false, "error": { "code": "ERROR_CODE", "message": "描述" } }
```

---

## 接口列表

### 1. 获取邮箱地址

从邮箱池中分配一个未使用的邮箱。支持按分组筛选和按应用去重。

```
GET/POST /api/get-email
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| app | string | 否 | 应用名称，该应用已用过的邮箱不会被再次分配 |
| group | string | 否 | 分组名称，仅从该分组中分配 |

**示例：**

```bash
# 为指定应用分配邮箱（该应用不会分配到已用过的邮箱）
curl -X POST "http://localhost:3000/api/get-email" \
  -H "X-API-Key: sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"app": "Neko API"}'

# 按分组分配
curl -X POST "http://localhost:3000/api/get-email" \
  -H "X-API-Key: sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"app": "Neko API", "group": "hotmail"}'
```

**成功响应：**
```json
{
  "success": true,
  "data": { "email": "example@outlook.com", "id": 1 }
}
```

**错误响应：**
```json
{
  "success": false,
  "error": { "code": "NO_UNUSED_EMAIL", "message": "No unused emails available for app 'Neko API'. Used: 100/100" }
}
```

---

### 2. 获取邮件文本（脚本友好）

返回 `text/plain` 格式，适合脚本直接读取。支持按应用配置自动匹配邮件并提取验证码。

```
GET/POST /api/mail_text
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| mailbox | string | 否 | 文件夹：`inbox`（默认）/ `junk` |
| app | string | 否 | 应用名称，使用应用配置的 fromPatterns/subjectPattern 匹配邮件，codeRegex 提取验证码 |
| match | string | 否 | 正则表达式，传了则优先于 app 配置的正则 |

**示例：**

```bash
# 方式一：使用 app 配置自动提取验证码（推荐，无需传正则）
curl "http://localhost:3000/api/mail_text?email=example@outlook.com&app=Neko+API&mailbox=junk" \
  -H "X-API-Key: sk_xxx"

# 方式二：手动指定正则
curl "http://localhost:3000/api/mail_text?email=example@outlook.com&match=\d{6}" \
  -H "X-API-Key: sk_xxx"

# 方式三：app + 覆盖正则
curl "http://localhost:3000/api/mail_text?email=example@outlook.com&app=Neko+API&match=\d{8}" \
  -H "X-API-Key: sk_xxx"
```

**成功响应：** `537084`

**错误响应：** `Error: No match found`

---

### 3. 获取最新邮件

```
GET/POST /api/mail_new
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| mailbox | string | 否 | 文件夹：`inbox`（默认）/ `junk` |
| socks5 | string | 否 | SOCKS5 代理地址 |
| http | string | 否 | HTTP 代理地址 |

**示例：**

```bash
curl -X POST "http://localhost:3000/api/mail_new" \
  -H "X-API-Key: sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"email": "example@outlook.com", "mailbox": "junk"}'
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "email": "example@outlook.com",
    "mailbox": "junk",
    "count": 1,
    "messages": [
      {
        "id": "AAMk...",
        "subject": "Email verification code",
        "from": "nekoapi@qq.com",
        "text": "Your verification code is 537084",
        "html": "<html>...</html>",
        "date": "2026-07-05T10:30:00Z"
      }
    ],
    "method": "graph_api"
  },
  "email": "example@outlook.com"
}
```

---

### 4. 获取所有邮件

```
GET/POST /api/mail_all
```

**参数：** 同 `/api/mail_new`

**示例：**

```bash
curl "http://localhost:3000/api/mail_all?email=example@outlook.com" \
  -H "X-API-Key: sk_xxx"
```

**成功响应：** 结构同 `/api/mail_new`，`count` 为实际数量。

---

### 5. 清空邮箱

删除指定邮箱文件夹中的所有邮件（仅支持 Graph API）。

```
GET/POST /api/process-mailbox
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| mailbox | string | 否 | 文件夹：`inbox`（默认）/ `junk` |
| socks5 | string | 否 | SOCKS5 代理地址 |
| http | string | 否 | HTTP 代理地址 |

**示例：**

```bash
curl -X POST "http://localhost:3000/api/process-mailbox" \
  -H "X-API-Key: sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"email": "example@outlook.com"}'
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "email": "example@outlook.com",
    "mailbox": "inbox",
    "status": "success",
    "deletedCount": 5,
    "message": "Successfully deleted 5 messages"
  }
}
```

---

### 6. 获取可用邮箱列表

```
GET/POST /api/list-emails
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| group | string | 否 | 分组名称，仅返回该分组内的邮箱 |

**示例：**

```bash
curl "http://localhost:3000/api/list-emails" \
  -H "X-API-Key: sk_xxx"
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "emails": [
      { "email": "user1@outlook.com", "status": "ACTIVE", "group": "hotmail" },
      { "email": "user2@outlook.com", "status": "ACTIVE", "group": null }
    ]
  }
}
```

---

### 7. 邮箱池统计

查看当前 API Key 的分配使用情况。

```
GET/POST /api/pool-stats
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| group | string | 否 | 分组名称，仅统计该分组 |

**示例：**

```bash
curl "http://localhost:3000/api/pool-stats" \
  -H "X-API-Key: sk_xxx"
```

**成功响应：**
```json
{
  "success": true,
  "data": { "total": 100, "used": 3, "remaining": 97 }
}
```

---

### 8. 重置分配记录

释放当前 API Key 占用的所有邮箱标记，可重新分配。

```
GET/POST /api/reset-pool
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| group | string | 否 | 分组名称，仅重置该分组 |

**示例：**

```bash
curl -X POST "http://localhost:3000/api/reset-pool" \
  -H "X-API-Key: sk_xxx"
```

**成功响应：**
```json
{
  "success": true,
  "data": { "message": "Pool reset successfully" }
}
```

---

## 应用（App）概念

### 配置应用

在管理后台「应用管理」页面添加应用配置，支持以下字段：

| 字段 | 说明 | 示例 |
|------|------|------|
| 名称 | 应用唯一标识 | `Neko API` |
| 发件人匹配 | 用于定位验证邮件，匹配发件人地址（多个，不区分大小写） | `nekoapi@qq.com` |
| 主题关键词 | 用于定位验证邮件，匹配主题（不区分大小写） | `verification code` |
| 验证码正则 | 从邮件正文提取验证码的正则 | `\d{6}` |

### 工作原理

1. 调用 `/api/get-email` 时传 `app` 参数 → 系统自动跳过该应用已用过的邮箱
2. 调用 `/api/mail_text` 时传 `app` 参数 → 系统按应用配置的 fromPatterns + subjectPattern（AND 逻辑）过滤邮件，用 codeRegex 提取验证码

### 推荐流程

```bash
# 1. 分配邮箱
curl -X POST "/api/get-email" \
  -H "X-API-Key: sk_xxx" \
  -d '{"app": "Neko API"}'
# → {"success": true, "data": {"email": "xxx@outlook.com"}}

# 2. 用邮箱注册目标应用（你的业务逻辑）

# 3. 提取验证码（无需手动传正则）
curl "/api/mail_text?email=xxx@outlook.com&app=Neko+API&mailbox=junk" \
  -H "X-API-Key: sk_xxx"
# → 537084
```

---

## 操作日志 Action 值

| Action | 含义 |
|--------|------|
| `get_email` | 分配邮箱 |
| `mail_new` | 获取最新邮件 |
| `mail_text` | 获取邮件文本 |
| `mail_all` | 获取所有邮件 |
| `process_mailbox` | 清空邮箱 |
| `list_emails` | 获取邮箱列表 |
| `pool_stats` | 邮箱池统计 |
| `pool_reset` | 重置邮箱池 |

## 健康检查

```bash
curl http://localhost:3000/health
# {"success":true,"data":{"status":"ok"}}
```
