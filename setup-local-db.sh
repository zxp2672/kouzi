#!/bin/bash
# 阿里云服务器本地PostgreSQL数据库部署脚本
# 使用方法: sudo bash setup-local-db.sh

set -e

echo "========================================="
echo "  本地PostgreSQL数据库部署脚本"
echo "========================================="

# 第1步：安装PostgreSQL
echo ""
echo "【步骤 1/6】安装PostgreSQL..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
echo "✅ PostgreSQL安装完成"

# 第2步：创建数据库和用户
echo ""
echo "【步骤 2/6】创建数据库和用户..."
sudo -u postgres psql -c "CREATE DATABASE warehouse_db;" || echo "数据库已存在"
sudo -u postgres psql -c "CREATE USER warehouse_user WITH PASSWORD 'Warehouse2024!';" || echo "用户已存在"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE warehouse_db TO warehouse_user;"
echo "✅ 数据库和用户创建完成"

# 第3步：授权schema
echo ""
echo "【步骤 3/6】授权schema..."
sudo -u postgres psql -d warehouse_db << 'SQL'
GRANT ALL ON SCHEMA public TO warehouse_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO warehouse_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO warehouse_user;
SQL
echo "✅ Schema授权完成"

# 第4步：创建表结构
echo ""
echo "【步骤 4/6】创建数据库表..."
sudo -u postgres psql -d warehouse_db << 'SQL'
-- 创建users表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role_id INTEGER,
  organization_id INTEGER,
  department VARCHAR(255),
  avatar_url TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建默认管理员用户（密码: 123456）
INSERT INTO users (username, password_hash, name, role_id, is_active) 
VALUES ('admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '系统管理员', 1, true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, name, role_id, is_active) 
VALUES ('manager', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '库房管理员', 2, true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, name, role_id, is_active) 
VALUES ('user1', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '普通用户', 3, true)
ON CONFLICT (username) DO NOTHING;

-- 创建其他必要的表
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  organization_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  warehouse_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_configs (
  config_key VARCHAR(255) PRIMARY KEY,
  config_value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 授权
GRANT ALL ON ALL TABLES IN SCHEMA public TO warehouse_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO warehouse_user;
SQL
echo "✅ 数据库表创建完成"

# 第5步：配置环境变量
echo ""
echo "【步骤 5/6】配置环境变量..."
cd /www/wwwroot/kouzi || { echo "项目目录不存在"; exit 1; }

cat > .env << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://rcyeqrjalfzczdyspbog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeWVxcmphbGZ6Y3pkeXNwYm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjMxMjEsImV4cCI6MjA5MTEzOTEyMX0.Q-WS3GuGI3VWi61whHt1nAbEHyf-T6o2fBttqYhanD4
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warehouse_db
DB_USER=warehouse_user
DB_PASSWORD=Warehouse2024!
EOF

chmod 644 .env
echo "✅ 环境变量配置完成"

# 第6步：重新构建并启动
echo ""
echo "【步骤 6/6】重新构建并启动应用..."
pnpm install
pnpm build
pm2 restart kouzi || pm2 start npx --name "kouzi" -- next start -p 3001
pm2 save

echo ""
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "访问地址："
echo "  - http://001tf.com"
echo "  - http://www.001tf.com"
echo "  - http://47.109.159.143:3001"
echo ""
echo "默认账号："
echo "  - 用户名: admin"
echo "  - 密码: 123456"
echo ""
echo "数据库信息："
echo "  - 地址: localhost:5432"
echo "  - 数据库: warehouse_db"
echo "  - 用户: warehouse_user"
echo "  - 密码: Warehouse2024!"
echo ""
echo "管理命令："
echo "  - 查看日志: pm2 logs kouzi"
echo "  - 重启应用: pm2 restart kouzi"
echo "  - 查看状态: pm2 status"
echo "  - 重启PostgreSQL: sudo systemctl restart postgresql"
echo ""
