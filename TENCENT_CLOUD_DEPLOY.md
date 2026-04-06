# 腾讯云部署 - 数据库配置指南

## 问题说明

如果部署后发现"保存不了数据，其他地方打开还是原始状态"，这是因为：

❌ **没有配置真实数据库**，系统使用了 Mock 数据和 localStorage
❌ **localStorage 是浏览器本地存储**，不同用户/设备无法共享数据
✅ **需要配置 Supabase 数据库**，实现真正的数据持久化

## 解决方案

### 第一步：创建 Supabase 数据库

1. **注册/登录 Supabase**
   - 访问：https://supabase.com
   - 点击 "Start your project"
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 填写项目信息：
     - Name: `warehouse-system`（或您喜欢的名称）
     - Database Password: 设置一个强密码（请保存好！）
     - Region: 选择离您最近的区域（如 `Singapore`）
   - 点击 "Create new project"
   - 等待 2-3 分钟，数据库正在初始化

3. **获取数据库连接信息**
   - 项目创建完成后，点击左侧菜单的 `Settings` -> `API`
   - 复制以下信息：
     - `Project URL`: 类似 `https://xxxxxx.supabase.co`
     - `Project API keys` -> `anon public`: 以 `eyJhbG...` 开头的长字符串
     - `Project API keys` -> `service_role`: （可选，仅后端需要）

### 第二步：配置数据库表结构

#### 方法 1：使用 SQL 编辑器（推荐）

1. 在 Supabase 项目中，点击左侧菜单的 `SQL Editor`
2. 点击 `New query`
3. 复制以下 SQL 并执行：

```sql
-- 创建商品表
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(20) NOT NULL,
    specification VARCHAR(200),
    barcode VARCHAR(50),
    purchase_price NUMERIC(10, 2),
    selling_price NUMERIC(10, 2),
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 创建仓库表
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    manager VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 创建入库单表
CREATE TABLE IF NOT EXISTS inbound_orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    supplier VARCHAR(200),
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    remark TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(100)
);

-- 创建入库商品明细表
CREATE TABLE IF NOT EXISTS inbound_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES inbound_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2),
    batch_no VARCHAR(50),
    production_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    remark TEXT
);

-- 创建出库单表
CREATE TABLE IF NOT EXISTS outbound_orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    customer VARCHAR(200),
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    remark TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(100)
);

-- 创建出库商品明细表
CREATE TABLE IF NOT EXISTS outbound_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES outbound_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2),
    remark TEXT
);

-- 创建库存表
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0 NOT NULL,
    locked_quantity INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, product_id)
);

-- 创建盘点单表
CREATE TABLE IF NOT EXISTS stock_counts (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    status VARCHAR(20) DEFAULT 'draft',
    count_date TIMESTAMPTZ NOT NULL,
    remark TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(100)
);

-- 创建盘点商品明细表
CREATE TABLE IF NOT EXISTS stock_count_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    system_quantity INTEGER NOT NULL,
    actual_quantity INTEGER NOT NULL,
    difference INTEGER,
    remark TEXT
);

-- 创建调拨单表
CREATE TABLE IF NOT EXISTS transfer_orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
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

-- 创建调拨商品明细表
CREATE TABLE IF NOT EXISTS transfer_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    remark TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS products_code_idx ON products(code);
CREATE INDEX IF NOT EXISTS warehouses_code_idx ON warehouses(code);
CREATE INDEX IF NOT EXISTS inbound_orders_order_no_idx ON inbound_orders(order_no);
CREATE INDEX IF NOT EXISTS inbound_orders_status_idx ON inbound_orders(status);
CREATE INDEX IF NOT EXISTS outbound_orders_order_no_idx ON outbound_orders(order_no);
CREATE INDEX IF NOT EXISTS outbound_orders_status_idx ON outbound_orders(status);
CREATE INDEX IF NOT EXISTS inventory_warehouse_id_idx ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS inventory_product_id_idx ON inventory(product_id);

-- 启用 RLS（行级安全）
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_items ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（允许所有操作，生产环境请根据需要调整）
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations on warehouses" ON warehouses FOR ALL USING (true);
CREATE POLICY "Allow all operations on inbound_orders" ON inbound_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on inbound_items" ON inbound_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on outbound_orders" ON outbound_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on outbound_items" ON outbound_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on inventory" ON inventory FOR ALL USING (true);
CREATE POLICY "Allow all operations on stock_counts" ON stock_counts FOR ALL USING (true);
CREATE POLICY "Allow all operations on stock_count_items" ON stock_count_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on transfer_orders" ON transfer_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on transfer_items" ON transfer_items FOR ALL USING (true);

-- 插入示例数据（可选）
INSERT INTO products (code, name, category, unit, specification, min_stock, max_stock) VALUES
('PRD001', '防暴盾牌', '防护装备', '个', '100*50cm', 10, 100),
('PRD002', '防刺服', '防护装备', '件', 'L号', 5, 50),
('PRD003', '对讲机', '通讯设备', '台', '数字对讲机', 8, 50)
ON CONFLICT (code) DO NOTHING;

INSERT INTO warehouses (code, name, address, manager, phone) VALUES
('WH001', '主仓库', '北京市朝阳区xxx街道xxx号', '张三', '13800138001'),
('WH002', '分仓库', '上海市浦东新区xxx路xxx号', '李四', '13800138002')
ON CONFLICT (code) DO NOTHING;
```

4. 点击 "Run" 执行 SQL

#### 方法 2：使用 Drizzle ORM（如果您有 Node.js 环境）

参考项目中的 schema 文件进行迁移。

### 第三步：在腾讯云配置环境变量

1. **登录腾讯云控制台**
2. **进入您的应用部署页面**
3. **找到环境变量配置**（通常在"设置"或"配置"中）
4. **添加以下环境变量**：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...（您的anon key）
```

**重要**：
- 不要加引号
- 不要有空格
- `NEXT_PUBLIC_` 前缀是必需的，这样前端才能访问

5. **保存并重新部署**

### 第四步：验证配置

重新部署后，测试以下功能：

1. ✅ 添加一个新商品
2. ✅ 刷新页面，看商品是否还在
3. ✅ 在另一个浏览器/设备打开，看数据是否同步
4. ✅ 创建一个入库单
5. ✅ 在审核页面查看并审核

如果都能正常工作，说明数据库配置成功！

## 常见问题

### Q: 配置后还是保存不了数据？

A: 请检查：
1. 环境变量名称是否正确（需要 `NEXT_PUBLIC_` 前缀）
2. Supabase URL 和 Key 是否复制正确
3. 数据库表是否创建成功
4. RLS 策略是否允许操作
5. 腾讯云是否重新部署了

### Q: 可以用其他数据库吗？

A: 可以！但需要修改代码。当前系统设计为使用 Supabase（PostgreSQL），如果要使用 MySQL、MongoDB 等，需要：
1. 修改数据库连接代码
2. 修改 Schema 定义
3. 修改所有 API 路由

### Q: 数据安全吗？

A: 当前配置的 RLS 策略允许所有操作。生产环境建议：
1. 限制 RLS 策略
2. 使用 Supabase Auth
3. 添加用户认证
4. 配置 API 密钥限制

### Q: 腾讯云有数据库服务吗？

A: 有！腾讯云有 PostgreSQL、MySQL 等数据库服务。如果使用腾讯云自己的数据库：
1. 创建腾讯云 PostgreSQL 实例
2. 修改代码使用腾讯云数据库连接
3. 这个方案更稳定，数据更安全

## 技术支持

如仍有问题，请检查：
1. 浏览器控制台是否有错误（F12）
2. 腾讯云部署日志
3. Supabase 项目日志
