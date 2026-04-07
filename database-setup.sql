-- ==========================================
-- 库房管理系统数据库表结构
-- Supabase PostgreSQL
-- ==========================================

-- 1. 产品表
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

-- 2. 仓库表
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

-- 3. 入库单表
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

-- 4. 入库单明细表
CREATE TABLE IF NOT EXISTS inbound_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES inbound_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2),
  batch_no VARCHAR(50),
  production_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  remark TEXT
);

-- 5. 出库单表
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

-- 6. 出库单明细表
CREATE TABLE IF NOT EXISTS outbound_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES outbound_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2),
  remark TEXT
);

-- 7. 盘点单表
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

-- 8. 盘点明细表
CREATE TABLE IF NOT EXISTS stock_count_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  book_quantity INTEGER NOT NULL,
  actual_quantity INTEGER,
  difference INTEGER,
  remark TEXT
);

-- 9. 调拨单表
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

-- 10. 调拨明细表
CREATE TABLE IF NOT EXISTS transfer_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  remark TEXT
);

-- 11. 库存表
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(warehouse_id, product_id)
);

-- 12. 组织表
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  parent_id INTEGER REFERENCES organizations(id),
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 13. 角色表
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 14. 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(200),
  email VARCHAR(200),
  phone VARCHAR(20),
  organization_id INTEGER REFERENCES organizations(id),
  role_id INTEGER REFERENCES roles(id),
  department VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 15. 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  config_type VARCHAR(50) DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. 审核流程表
CREATE TABLE IF NOT EXISTS approval_flows (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  organization VARCHAR(100),
  steps JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ==========================================
-- 创建索引
-- ==========================================

CREATE INDEX idx_inbound_orders_warehouse ON inbound_orders(warehouse_id);
CREATE INDEX idx_inbound_orders_status ON inbound_orders(status);
CREATE INDEX idx_inbound_orders_created ON inbound_orders(created_at DESC);

CREATE INDEX idx_outbound_orders_warehouse ON outbound_orders(warehouse_id);
CREATE INDEX idx_outbound_orders_status ON outbound_orders(status);
CREATE INDEX idx_outbound_orders_created ON outbound_orders(created_at DESC);

CREATE INDEX idx_stock_counts_warehouse ON stock_counts(warehouse_id);
CREATE INDEX idx_stock_counts_status ON stock_counts(status);

CREATE INDEX idx_transfer_orders_status ON transfer_orders(status);
CREATE INDEX idx_transfer_orders_created ON transfer_orders(created_at DESC);

CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse_product ON inventory(warehouse_id, product_id);

-- ==========================================
-- 设置 RLS 策略（行级安全）
-- ==========================================

-- 启用所有表的 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_flows ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（临时，用于开发测试）
-- 生产环境应该根据实际需求设置更严格的策略

CREATE POLICY "公开读取_products" ON products FOR SELECT USING (true);
CREATE POLICY "公开写入_products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_products" ON products FOR UPDATE USING (true);
CREATE POLICY "公开删除_products" ON products FOR DELETE USING (true);

CREATE POLICY "公开读取_warehouses" ON warehouses FOR SELECT USING (true);
CREATE POLICY "公开写入_warehouses" ON warehouses FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_warehouses" ON warehouses FOR UPDATE USING (true);
CREATE POLICY "公开删除_warehouses" ON warehouses FOR DELETE USING (true);

CREATE POLICY "公开读取_inbound_orders" ON inbound_orders FOR SELECT USING (true);
CREATE POLICY "公开写入_inbound_orders" ON inbound_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_inbound_orders" ON inbound_orders FOR UPDATE USING (true);
CREATE POLICY "公开删除_inbound_orders" ON inbound_orders FOR DELETE USING (true);

CREATE POLICY "公开读取_inbound_items" ON inbound_items FOR SELECT USING (true);
CREATE POLICY "公开写入_inbound_items" ON inbound_items FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_inbound_items" ON inbound_items FOR UPDATE USING (true);
CREATE POLICY "公开删除_inbound_items" ON inbound_items FOR DELETE USING (true);

CREATE POLICY "公开读取_outbound_orders" ON outbound_orders FOR SELECT USING (true);
CREATE POLICY "公开写入_outbound_orders" ON outbound_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_outbound_orders" ON outbound_orders FOR UPDATE USING (true);
CREATE POLICY "公开删除_outbound_orders" ON outbound_orders FOR DELETE USING (true);

CREATE POLICY "公开读取_outbound_items" ON outbound_items FOR SELECT USING (true);
CREATE POLICY "公开写入_outbound_items" ON outbound_items FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_outbound_items" ON outbound_items FOR UPDATE USING (true);
CREATE POLICY "公开删除_outbound_items" ON outbound_items FOR DELETE USING (true);

CREATE POLICY "公开读取_stock_counts" ON stock_counts FOR SELECT USING (true);
CREATE POLICY "公开写入_stock_counts" ON stock_counts FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_stock_counts" ON stock_counts FOR UPDATE USING (true);
CREATE POLICY "公开删除_stock_counts" ON stock_counts FOR DELETE USING (true);

CREATE POLICY "公开读取_stock_count_items" ON stock_count_items FOR SELECT USING (true);
CREATE POLICY "公开写入_stock_count_items" ON stock_count_items FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_stock_count_items" ON stock_count_items FOR UPDATE USING (true);
CREATE POLICY "公开删除_stock_count_items" ON stock_count_items FOR DELETE USING (true);

CREATE POLICY "公开读取_transfer_orders" ON transfer_orders FOR SELECT USING (true);
CREATE POLICY "公开写入_transfer_orders" ON transfer_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_transfer_orders" ON transfer_orders FOR UPDATE USING (true);
CREATE POLICY "公开删除_transfer_orders" ON transfer_orders FOR DELETE USING (true);

CREATE POLICY "公开读取_transfer_items" ON transfer_items FOR SELECT USING (true);
CREATE POLICY "公开写入_transfer_items" ON transfer_items FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_transfer_items" ON transfer_items FOR UPDATE USING (true);
CREATE POLICY "公开删除_transfer_items" ON transfer_items FOR DELETE USING (true);

CREATE POLICY "公开读取_inventory" ON inventory FOR SELECT USING (true);
CREATE POLICY "公开写入_inventory" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_inventory" ON inventory FOR UPDATE USING (true);
CREATE POLICY "公开删除_inventory" ON inventory FOR DELETE USING (true);

CREATE POLICY "公开读取_organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "公开写入_organizations" ON organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_organizations" ON organizations FOR UPDATE USING (true);
CREATE POLICY "公开删除_organizations" ON organizations FOR DELETE USING (true);

CREATE POLICY "公开读取_roles" ON roles FOR SELECT USING (true);
CREATE POLICY "公开写入_roles" ON roles FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_roles" ON roles FOR UPDATE USING (true);
CREATE POLICY "公开删除_roles" ON roles FOR DELETE USING (true);

CREATE POLICY "公开读取_users" ON users FOR SELECT USING (true);
CREATE POLICY "公开写入_users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_users" ON users FOR UPDATE USING (true);
CREATE POLICY "公开删除_users" ON users FOR DELETE USING (true);

CREATE POLICY "公开读取_system_configs" ON system_configs FOR SELECT USING (true);
CREATE POLICY "公开写入_system_configs" ON system_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_system_configs" ON system_configs FOR UPDATE USING (true);
CREATE POLICY "公开删除_system_configs" ON system_configs FOR DELETE USING (true);

CREATE POLICY "公开读取_approval_flows" ON approval_flows FOR SELECT USING (true);
CREATE POLICY "公开写入_approval_flows" ON approval_flows FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新_approval_flows" ON approval_flows FOR UPDATE USING (true);
CREATE POLICY "公开删除_approval_flows" ON approval_flows FOR DELETE USING (true);

-- ==========================================
-- 插入初始数据
-- ==========================================

-- 默认角色
INSERT INTO roles (name, code, description, permissions) VALUES
('系统管理员', 'admin', '拥有所有权限', '["*"]'::jsonb),
('仓库管理员', 'warehouse_manager', '管理仓库出入库', '["inbound:*", "outbound:*", "stock_count:*"]'::jsonb),
('普通用户', 'user', '查看和基本操作', '["inbound:read", "outbound:read", "stock_count:read"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 默认仓库
INSERT INTO warehouses (code, name, address, manager, phone) VALUES
('WH001', '主仓库', '北京市朝阳区', '张三', '13800138000'),
('WH002', '分仓库A', '上海市浦东新区', '李四', '13900139000'),
('WH003', '分仓库B', '广州市天河区', '王五', '13700137000')
ON CONFLICT DO NOTHING;

-- 默认系统配置
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('unit_name', 'XX市公安局', 'string', '单位名称，显示在登录页和系统标题中'),
('unit_logo_url', '', 'image', '单位Logo图片URL'),
('system_title', '库房管理系统', 'string', '系统标题'),
('copyright_text', '© 2024 XX市公安局 版权所有', 'string', '版权信息')
ON CONFLICT (config_key) DO NOTHING;
