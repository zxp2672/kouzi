# 腾讯云 EdgeOne 部署指南

## 📋 目录
- [前置准备](#前置准备)
- [方式一：控制台部署（推荐）](#方式一控制台部署推荐)
- [方式二：CLI 命令行部署](#方式二cli-命令行部署)
- [配置 Supabase 数据库](#配置-supabase-数据库)
- [常见问题](#常见问题)

---

## 🎯 前置准备

### 1. 腾讯云账号
- 注册并登录 [腾讯云](https://cloud.tencent.com)
- 完成实名认证

### 2. EdgeOne 服务
- 开通 EdgeOne 服务：https://console.cloud.tencent.com/edgeone

### 3. 代码准备
- 代码已推送到 GitHub（你的仓库：https://github.com/zxp2672/kouzi）

---

## 方式一：控制台部署（推荐）

### 步骤 1：进入 EdgeOne 控制台

1. 访问：https://console.cloud.tencent.com/edgeone
2. 点击左侧菜单「Serverless 应用」
3. 点击「创建应用」

### 步骤 2：配置应用

**基本信息**：
- 应用名称：`warehouse-system`（或自定义）
- 应用描述：库房管理系统
- 地域：选择离你用户最近的地域

**代码来源**：
- 选择「GitHub」
- 授权并选择仓库：`zxp2672/kouzi`
- 分支：`main`

**构建配置**：
- 框架：Next.js
- 运行环境：Node.js 20
- 构建命令：`pnpm install && pnpm build`
- 输出目录：`.next`
- 安装命令：`pnpm install`

### 步骤 3：配置环境变量

在 EdgeOne 控制台的环境变量配置中添加：

```env
# Supabase 数据库配置（必需）
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon-key

# 运行环境
NODE_ENV=production
```

### 步骤 4：部署应用

1. 点击「创建并部署」
2. 等待构建和部署完成（约 2-5 分钟）
3. 部署成功后，EdgeOne 会分配一个域名，例如：
   ```
   https://warehouse-system-xxx.edgeone.cn
   ```

### 步骤 5：绑定自定义域名（可选）

1. 在应用详情页点击「域名管理」
2. 点击「添加域名」
3. 输入你的域名（如：`warehouse.yourdomain.com`）
4. 按照提示配置 DNS 解析（CNAME 记录）
5. 等待 DNS 生效（通常几分钟到几小时）

---

## 方式二：CLI 命令行部署

### 步骤 1：安装 EdgeOne CLI

```bash
# 使用 npm 安装
npm install -g @edgeone/cli

# 或使用 pnpm
pnpm add -g @edgeone/cli
```

### 步骤 2：登录腾讯云

```bash
# 登录
edgeone login

# 会打开浏览器进行授权
```

### 步骤 3：初始化配置

```bash
# 在项目根目录执行
edgeone init
```

会生成 `edgeone.json` 配置文件（已为你创建好）。

### 步骤 4：部署

```bash
# 构建并部署
edgeone deploy

# 或先构建再部署
pnpm build
edgeone deploy --output .next
```

### 步骤 5：查看部署状态

```bash
# 查看部署日志
edgeone logs

# 查看应用信息
edgeone info
```

---

## 🔧 配置 Supabase 数据库

为了让数据真正持久化，你需要配置 Supabase：

### 1. 创建 Supabase 项目

1. 访问 https://supabase.com
2. 注册/登录
3. 点击「New Project」
4. 填写项目信息：
   - 项目名称：`warehouse-system`
   - 数据库密码：设置一个强密码（记住它）
   - 地区：选择 Singapore 或 Tokyo（离中国近）

### 2. 获取 API 凭证

1. 进入项目仪表板
2. 点击左侧「Project Settings」（齿轮图标）
3. 点击「API」
4. 复制以下信息：
   - **Project URL**：`https://xxxxx.supabase.co`
   - **anon public**：`eyJhbGci...`（一长串）

### 3. 在 EdgeOne 配置环境变量

在 EdgeOne 控制台的应用设置中，添加环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon-key
NODE_ENV=production
```

### 4. 创建数据库表

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- 产品表
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  specification TEXT,
  unit VARCHAR(50),
  barcode VARCHAR(50),
  purchase_price NUMERIC(10,2),
  selling_price NUMERIC(10,2),
  min_stock INTEGER,
  max_stock INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 仓库表
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  manager VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 入库单表
CREATE TABLE IF NOT EXISTS inbound_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  supplier VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending',
  remark TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(100)
);

-- 出库单表
CREATE TABLE IF NOT EXISTS outbound_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  customer VARCHAR(200),
  outbound_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  remark TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(100)
);

-- 盘点单表
CREATE TABLE IF NOT EXISTS stock_counts (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  status VARCHAR(20) DEFAULT 'pending',
  remark TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR(100)
);

-- 调拨单表
CREATE TABLE IF NOT EXISTS transfer_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL,
  from_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  to_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  status VARCHAR(20) DEFAULT 'pending',
  remark TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(100),
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR(100)
);

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(warehouse_id, product_id)
);

-- 创建索引
CREATE INDEX idx_inbound_orders_warehouse ON inbound_orders(warehouse_id);
CREATE INDEX idx_inbound_orders_status ON inbound_orders(status);
CREATE INDEX idx_outbound_orders_warehouse ON outbound_orders(warehouse_id);
CREATE INDEX idx_outbound_orders_status ON outbound_orders(status);
CREATE INDEX idx_stock_counts_warehouse ON stock_counts(warehouse_id);
CREATE INDEX idx_transfer_orders_status ON transfer_orders(status);
```

---

## ❓ 常见问题

### Q1: 构建失败怎么办？

**检查点**：
1. 确认 Node.js 版本 >= 20
2. 确认 pnpm 版本 >= 9.0.0
3. 查看构建日志，定位具体错误

**解决方案**：
```bash
# 本地测试构建
pnpm install
pnpm build

# 如果本地构建成功，再部署到 EdgeOne
```

### Q2: 部署后页面空白？

**可能原因**：
1. 环境变量未配置
2. Supabase 连接失败
3. 路由配置问题

**解决方案**：
1. 检查 EdgeOne 控制台的环境变量是否正确
2. 打开浏览器开发者工具查看控制台错误
3. 访问 `/api/health` 检查健康状态

### Q3: 数据仍然保存在本地？

**原因**：Supabase 环境变量未配置

**解决方案**：
1. 在 EdgeOne 控制台添加 Supabase 环境变量
2. 重新部署应用
3. 清除浏览器缓存

### Q4: 如何查看部署日志？

**EdgeOne 控制台**：
1. 进入应用详情页
2. 点击「部署日志」
3. 查看实时构建和运行日志

**CLI 命令**：
```bash
edgeone logs --follow
```

### Q5: 如何更新代码？

**自动部署**（推荐）：
1. 推送代码到 GitHub
2. EdgeOne 会自动触发部署

**手动部署**：
1. 在 EdgeOne 控制台点击「重新部署」
2. 或使用 CLI：`edgeone deploy`

---

## 📞 技术支持

- EdgeOne 文档：https://cloud.tencent.com/document/product/1542
- Supabase 文档：https://supabase.com/docs
- 腾讯云工单：https://console.cloud.tencent.com/workorder

---

## 🎉 部署成功标志

部署成功后，你应该能够：

✅ 通过 EdgeOne 分配的域名访问系统
✅ 数据持久化到 Supabase 数据库
✅ 多设备数据同步
✅ 自动 HTTPS 加密
✅ 全球 CDN 加速

祝部署顺利！🚀
