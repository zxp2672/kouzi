#!/bin/bash
# 本地PostgreSQL数据库初始化脚本

echo "🚀 开始初始化本地PostgreSQL数据库..."

# 1. 安装PostgreSQL
echo "📦 安装PostgreSQL..."
sudo yum install -y postgresql15-server postgresql15

# 2. 初始化数据库
echo "🔧 初始化数据库..."
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb

# 3. 启动服务
echo "▶️ 启动PostgreSQL服务..."
sudo systemctl start postgresql-15
sudo systemctl enable postgresql-15

# 4. 配置密码认证
echo "🔐 配置密码认证..."
sudo sed -i 's/ident/md5/g' /var/lib/pgsql/15/data/pg_hba.conf
sudo sed -i 's/peer/md5/g' /var/lib/pgsql/15/data/pg_hba.conf
sudo systemctl restart postgresql-15

# 5. 创建数据库和表
echo "🗄️ 创建数据库和表..."
sudo -u postgres psql << 'EOSQL'
-- 设置密码
ALTER USER postgres PASSWORD 'Swj121648.';

-- 创建数据库
CREATE DATABASE warehouse;
\c warehouse

-- 库房表
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  manager VARCHAR(255),
  phone VARCHAR(50),
  organization_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category TEXT,
  specification TEXT,
  unit VARCHAR(50),
  barcode VARCHAR(100),
  purchase_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  min_stock INTEGER,
  max_stock INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 入库单表
CREATE TABLE IF NOT EXISTS inbound_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(100) NOT NULL UNIQUE,
  warehouse_id INTEGER REFERENCES warehouses(id),
  supplier VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  created_by TEXT,
  approved_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 出库单表
CREATE TABLE IF NOT EXISTS outbound_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(100) NOT NULL UNIQUE,
  warehouse_id INTEGER REFERENCES warehouses(id),
  customer VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  created_by TEXT,
  approved_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  warehouse_id INTEGER REFERENCES warehouses(id),
  quantity INTEGER DEFAULT 0,
  min_stock INTEGER,
  max_stock INTEGER,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

-- 调拨单表
CREATE TABLE IF NOT EXISTS transfer_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(100) NOT NULL UNIQUE,
  from_warehouse_id INTEGER REFERENCES warehouses(id),
  to_warehouse_id INTEGER REFERENCES warehouses(id),
  status VARCHAR(50) DEFAULT 'pending',
  created_by TEXT,
  approved_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 盘点单表
CREATE TABLE IF NOT EXISTS stock_count_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(100) NOT NULL UNIQUE,
  warehouse_id INTEGER REFERENCES warehouses(id),
  status VARCHAR(50) DEFAULT 'pending',
  created_by TEXT,
  approved_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 组织单位表
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE,
  parent_id TEXT REFERENCES organizations(id),
  type VARCHAR(50),
  manager VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  organization_id TEXT REFERENCES organizations(id),
  role_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 审批流表
CREATE TABLE IF NOT EXISTS approval_flows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  steps JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 审批记录表
CREATE TABLE IF NOT EXISTS approvals (
  id SERIAL PRIMARY KEY,
  approval_flow_id INTEGER REFERENCES approval_flows(id),
  ref_type VARCHAR(100),
  ref_id INTEGER,
  applicant_id TEXT,
  current_step INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 商品类别表
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE,
  parent_id INTEGER REFERENCES categories(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

\q
EOSQL

echo "✅ 数据库初始化完成！"
echo ""
echo "📊 数据库信息："
echo "  主机: localhost"
echo "  端口: 5432"
echo "  数据库: warehouse"
echo "  用户: postgres"
echo "  密码: Swj121648."
echo ""
echo "🎉 所有步骤完成！"
