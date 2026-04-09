#!/bin/bash
# 阿里云CentOS 8 一键部署脚本
# 使用方法: bash auto-deploy.sh

set -e

echo "========================================="
echo "  库房管理系统 - 自动部署脚本"
echo "========================================="

# 检查是否是root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用root用户运行此脚本"
    echo "执行: su -"
    exit 1
fi

# ===== 第1步：修复yum源 =====
echo ""
echo "📦 第1步：修复yum源..."
sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-* 2>/dev/null || true
sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-* 2>/dev/null || true
yum clean all
yum makecache

# ===== 第2步：安装系统依赖 =====
echo ""
echo "📦 第2步：安装系统依赖..."
yum update -y
yum install -y curl git nginx postgresql-server postgresql-contrib

# ===== 第3步：安装Node.js 20 =====
echo ""
echo "📦 第3步：安装Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# ===== 第4步：安装pnpm和PM2 =====
echo ""
echo "📦 第4步：安装pnpm和PM2..."
npm install -g pnpm pm2

# ===== 第5步：初始化数据库 =====
echo ""
echo "📦 第5步：初始化PostgreSQL数据库..."
postgresql-setup --initdb
systemctl start postgresql
systemctl enable postgresql

echo "创建数据库和用户..."
sudo -u postgres psql << 'EOSQL'
CREATE DATABASE warehouse_db;
CREATE USER warehouse_user WITH PASSWORD 'Warehouse2024!';
GRANT ALL PRIVILEGES ON DATABASE warehouse_db TO warehouse_user;
\c warehouse_db
GRANT ALL ON SCHEMA public TO warehouse_user;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'company',
    parent_id INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description, permissions) VALUES 
    ('admin', '超级管理员', '["*"]') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name, description, permissions) VALUES 
    ('manager', '仓库管理员', '["read:all","write:inbound","write:outbound","read:stock"]') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name, description, permissions) VALUES 
    ('user', '普通用户', '["read:basic"]') ON CONFLICT (name) DO NOTHING;
INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES 
    ('admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '系统管理员', 'admin', true) ON CONFLICT (username) DO NOTHING;
EOSQL

echo "✅ 数据库配置完成！"

# ===== 第6步：克隆项目 =====
echo ""
echo "📦 第6步：克隆项目代码..."
cd /www/wwwroot 2>/dev/null || mkdir -p /www/wwwroot && cd /www/wwwroot
rm -rf kouzi 2>/dev/null || true

echo "尝试从GitHub克隆..."
git clone https://github.com/zxp2672/kouzi.git || {
    echo "GitHub克隆失败，尝试使用认证信息..."
    git clone https://zxp2672:swj121648@github.com/zxp2672/kouzi.git --depth 1 || {
        echo "❌ GitHub克隆失败！请手动上传项目文件"
        echo "在本地执行: scp -r e:\\ai\\kc6\\kouzi root@47.109.159.143:/www/wwwroot/kouzi"
        exit 1
    }
}

cd kouzi
git config --global --add safe.directory /www/wwwroot/kouzi

# ===== 第7步：安装依赖并构建 =====
echo ""
echo "📦 第7步：安装依赖和构建项目..."
pnpm install
pnpm build

# ===== 第8步：配置环境变量 =====
echo ""
echo "📦 第8步：配置环境变量..."
cat > .env.local << 'EOF'
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warehouse_db
DB_USER=warehouse_user
DB_PASSWORD=Warehouse2024!
NEXT_PUBLIC_SUPABASE_URL=placeholder
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
NODE_ENV=production
EOF

# ===== 第9步：配置Nginx =====
echo ""
echo "📦 第9步：配置Nginx..."
cat > /etc/nginx/conf.d/warehouse.conf << 'EOF'
server {
    listen 80;
    server_name 001tf.com www.001tf.com;
    large_client_header_buffers 4 32k;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
EOF

systemctl enable nginx
systemctl restart nginx

# ===== 第10步：启动应用 =====
echo ""
echo "📦 第10步：启动应用..."
pm2 delete kouzi 2>/dev/null || true
pm2 start npx --name "kouzi" -- next start -p 3000
pm2 save
pm2 startup

# ===== 完成 =====
echo ""
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "🌐 访问地址: http://001tf.com"
echo "👤 用户名: admin"
echo "🔑 密码: 123456"
echo ""
echo "📊 查看状态: pm2 status"
echo "📝 查看日志: pm2 logs kouzi"
echo "🔄 重启应用: pm2 restart kouzi"
echo ""
echo "========================================="
