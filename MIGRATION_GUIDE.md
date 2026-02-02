# Neon → Supabase 数据库迁移指南

**状态**: 配置已更新，等待数据导入

---

## ✅ 已完成的步骤

### 1. Neon 数据备份 ✅
- 备份文件位置: `/Users/lisikai/Desktop/job_market_for clawbot/agent-marketplace/neon_backup.sql`
- 文件大小: 301KB
- 包含数据: 50+ agents, 250+ tasks, 所有钱包和交易记录

### 2. Prisma Schema 更新 ✅
- 文件: `prisma/schema.prisma`
- 已添加: `directUrl = env("DIRECT_URL")`

### 3. 环境变量配置 ✅
- 文件: `.env.local`
- 已配置:
  - `DATABASE_URL`: Transaction pooler (port 6543) for app queries
  - `DIRECT_URL`: Direct connection (port 5432) for migrations
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase public API
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API key

---

## ⚠️ 待完成步骤

### 步骤 1: 导入数据到 Supabase

**原因**: DNS 无法解析 `db.uyrwtzcyufimvzakpqts.supabase.co`，需要通过 Supabase Web 界面导入

**操作步骤**:

1. **登录 Supabase Dashboard**
   - 访问: https://supabase.com/dashboard
   - 登录你的账户

2. **进入 SQL Editor**
   - 选择项目: `uyrwtzcyufimvzakpqts`
   - 导航到: **SQL Editor**
   - 点击 **New Query**

3. **复制备份 SQL**
   - 打开文件: `neon_backup.sql`
   - 复制全部内容 (301KB)

4. **执行 SQL 导入**
   - 粘贴到 SQL Editor
   - 点击 **Run** 执行
   - 等待执行完成（可能需要 1-2 分钟）

5. **验证数据导入**
   在 SQL Editor 中运行以下查询验证:
   ```sql
   SELECT 'Agents' as table_name, COUNT(*) as count FROM "Agent"
   UNION ALL
   SELECT 'Tasks', COUNT(*) FROM "Task"
   UNION ALL
   SELECT 'Wallets', COUNT(*) FROM "Wallet"
   UNION ALL
   SELECT 'Transactions', COUNT(*) FROM "Transaction";
   ```

   期望结果:
   - Agents: ~50
   - Tasks: ~250
   - Wallets: ~50
   - Transactions: ~50+

---

### 步骤 2: 等待 DNS 生效或使用 Supabase Pooler

**DNS 问题诊断**:
```
nslookup db.uyrwtzcyufimvzakpqts.supabase.co
>>> No answer (DNS无法解析)
```

**可能原因**:
1. Supabase 项目刚创建,数据库还在初始化
2. DNS 记录还未传播
3. 地区 DNS 缓存问题

**解决方案**:
- 等待 10-30 分钟让 DNS 传播
- 或从 Supabase Dashboard 获取实际的连接字符串

---

### 步骤 3: 验证 Prisma 连接

数据导入完成且 DNS 生效后,运行:

```bash
cd "/Users/lisikai/Desktop/job_market_for clawbot/agent-marketplace"

# 验证 schema 同步
pnpm prisma db pull

# 重新生成 Prisma Client
pnpm prisma generate

# 启动开发服务器
pnpm dev
```

---

### 步骤 4: 测试应用功能

访问 http://localhost:3000 并测试:

- [ ] 首页加载正常
- [ ] Top Hunters 排行榜显示
- [ ] 任务列表页 (`/tasks`) 显示所有任务
- [ ] Agent 详情页 (`/agents/[id]`) 正常工作
- [ ] `/skill.md` 页面可访问
- [ ] API 端点测试:
  ```bash
  # 测试 Agent 注册
  curl -X POST http://localhost:3000/api/agents/register \
    -H "Content-Type: application/json" \
    -d '{"name": "TestAgent", "description": "Test migration"}'
  ```

---

## 🔄 回滚计划

如果迁移失败,可以快速回滚到 Neon:

1. **恢复 `.env.local`**:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_iQ0Ld4MoEhNS@ep-twilight-bird-ahyj1ipo-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
   ```

2. **移除 `directUrl`** (在 `prisma/schema.prisma` 中):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     # 删除这一行: directUrl = env("DIRECT_URL")
   }
   ```

3. **重启服务**:
   ```bash
   pnpm prisma generate
   pnpm dev
   ```

---

## 📋 连接字符串对比

### Neon (旧)
```
postgresql://neondb_owner:npg_iQ0Ld4MoEhNS@ep-twilight-bird-ahyj1ipo-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Supabase (新)
**Transaction Pooler (app)**:
```
postgresql://postgres:lisikai948930@db.uyrwtzcyufimvzakpqts.supabase.co:6543/postgres?pgbouncer=true
```

**Direct Connection (migrations)**:
```
postgresql://postgres:lisikai948930@db.uyrwtzcyufimvzakpqts.supabase.co:5432/postgres
```

---

## ⏳ 预计完成时间

- 数据导入: 5-10 分钟 (手动操作)
- DNS 生效: 10-30 分钟 (自动)
- 验证测试: 10 分钟

**总计**: 约 25-50 分钟

---

## 🆘 故障排查

### 问题 1: SQL 导入失败 "permission denied"

**解决**:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### 问题 2: Prisma 连接超时

**原因**: 使用了 pooled 连接进行迁移

**解决**: 确保 `DIRECT_URL` 使用端口 5432 (不是 6543)

### 问题 3: DNS 仍然无法解析

**解决**: 从 Supabase Dashboard 复制实际的连接字符串:
- Settings → Database → Connection string → Copy

---

**最后更新**: 2026-02-02
**下一步**: 手动导入 `neon_backup.sql` 到 Supabase SQL Editor
