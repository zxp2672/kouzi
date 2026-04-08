#!/bin/bash
# 阿里云服务器完整部署脚本
# 使用方法: sudo bash full-deploy.sh

set -e

echo "========================================="
echo "  库房管理系统 - 阿里云完整部署脚本"
echo "========================================="
echo ""

# 配置变量
DB_PASSWORD="Warehouse2024!"
PROJECT_DIR="/www/wwwroot/kouzi"

# 第1步：安装系统依赖
echo "【步骤 1/8】安装系统依赖..."
apt update
apt install -y curl git nginx postgresql postgresql-contrib
echo "✅ 系统依赖安装完成"

# 第2步：安装Node.js 20
echo ""
echo "【步骤 2/8】安装Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
echo "✅ Node.js安装完成"

# 第3步：安装pnpm和PM2
echo ""
echo "【步骤 3/8】安装pnpm和PM2..."
npm install -g pnpm pm2
pnpm -v
pm2 -v
echo "✅ pnpm和PM2安装完成"

# 第4步：配置PostgreSQL
echo ""
echo "【步骤 4/8】配置PostgreSQL数据库..."
systemctl start postgresql
systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql << 'SQL'
CREATE DATABASE warehouse_db;
CREATE USER warehouse_user WITH PASSWORD 'Warehouse2024!';
GRANT ALL PRIVILEGES ON DATABASE warehouse_db TO warehouse_user;
SQL

# 授权schema
sudo -u postgres psql -d warehouse_db << 'SQL'
GRANT ALL ON SCHEMA public TO warehouse_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO warehouse_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO warehouse_user;
SQL

# 创建表结构
sudo -u postgres psql -d warehouse_db << 'SQL'
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

INSERT INTO users (username, password_hash, name, role_id, is_active) 
VALUES ('admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '系统管理员', 1, true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, name, role_id, is_active) 
VALUES ('manager', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '库房管理员', 2, true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, name, role_id, is_active) 
VALUES ('user1', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '普通用户', 3, true)
ON CONFLICT (username) DO NOTHING;

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

GRANT ALL ON ALL TABLES IN SCHEMA public TO warehouse_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO warehouse_user;
SQL
echo "✅ PostgreSQL数据库配置完成"

# 第5步：克隆项目代码
echo ""
echo "【步骤 5/8】克隆项目代码..."
if [ -d "$PROJECT_DIR" ]; then
  echo "项目目录已存在，更新代码..."
  cd $PROJECT_DIR
  git config --global --add safe.directory $PROJECT_DIR
  git pull
else
  mkdir -p $PROJECT_DIR
  cd $PROJECT_DIR
  git clone https://github.com/zxp2672/kouzi.git .
fi
echo "✅ 项目代码准备完成"

# 第6步：安装依赖并构建
echo ""
echo "【步骤 6/8】安装依赖并构建项目（需要3-5分钟）..."
cd $PROJECT_DIR
pnpm install
pnpm build
echo "✅ 项目构建完成"

# 第7步：配置环境变量
echo ""
echo "【步骤 7/8】配置环境变量..."
cat > $PROJECT_DIR/.env << 'EOF'
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
chmod 644 $PROJECT_DIR/.env
echo "✅ 环境变量配置完成"

# 第8步：配置Nginx并启动应用
echo ""
echo "【步骤 8/8】配置Nginx并启动应用..."

# 停止冲突的服务
systemctl stop apache2 2>/dev/null || true
killall -9 nginx 2>/dev/null || true
sleep 2

# 配置Nginx
cat > /etc/nginx/sites-available/001tf.com << 'EOF'
server {
    listen 80;
    server_name 001tf.com www.001tf.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/001tf.com.log;
    error_log /var/log/nginx/001tf.com.error.log;
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/001tf.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并启动Nginx
nginx -t
systemctl start nginx
systemctl enable nginx

# 启动应用
cd $PROJECT_DIR
pm2 delete kouzi 2>/dev/null || true
pm2 start npx --name "kouzi" -- next start -p 3001
pm2 save
pm2 startup

echo ""
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "访问地址："
echo "  - http://001tf.com"
echo "  - http://www.001tf.com"
echo "  - http://$(curl -s ifconfig.me):3001"
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
echo "  - 重启Nginx: systemctl restart nginx"
echo "  - 重启数据库: systemctl restart postgresql"
echo ""
