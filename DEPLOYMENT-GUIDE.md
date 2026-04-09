# 库房管理系统 - 完整部署指南

## 📋 环境要求

- **操作系统**: AlmaLinux 9.x / CentOS 8+ / RHEL 8+
- **内存**: 最低 2GB，推荐 4GB+
- **磁盘**: 最低 20GB，推荐 50GB+
- **Node.js**: >= 20.9.0
- **数据库**: PostgreSQL 15

## 🚀 一键部署脚本

### 1. 安装基础依赖

```bash
# 更新系统
sudo dnf update -y

# 安装基础工具
sudo dnf install -y git curl wget nginx

# 安装 Node.js 20
sudo dnf install -y gcc-c++ make
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# 验证 Node.js 版本（必须 >= 20.9.0）
node -v
npm -v

# 安装 pnpm 和 PM2
sudo npm install -g pnpm pm2
```

### 2. 安装并配置 PostgreSQL 15

```bash
# 添加 PostgreSQL YUM 仓库
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# 禁用内置模块
sudo dnf -qy module disable postgresql

# 安装 PostgreSQL 15
sudo dnf install -y postgresql15-server postgresql15

# 初始化数据库
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb

# 启动服务
sudo systemctl start postgresql-15
sudo systemctl enable postgresql-15

# 临时修改认证为 trust（设置密码用）
sudo sed -i 's/scram-sha-256/trust/g' /var/lib/pgsql/15/data/pg_hba.conf
sudo sed -i 's/ident/trust/g' /var/lib/pgsql/15/data/pg_hba.conf
sudo systemctl restart postgresql-15

# 创建数据库和表
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
\q
EOSQL

# 改回 md5 认证
sudo sed -i 's/trust/md5/g' /var/lib/pgsql/15/data/pg_hba.conf
sudo sed -i 's/scram-sha-256/md5/g' /var/lib/pgsql/15/data/pg_hba.conf
sudo systemctl restart postgresql-15

# 测试数据库连接
PGPASSWORD=Swj121648. psql -U postgres -d warehouse -c "\dt"
```

### 3. 部署应用

```bash
# 克隆项目
cd /home/admin
git clone https://github.com/zxp2672/kouzi.git
cd kouzi

# 安装依赖
pnpm install

# 创建 .env 配置文件
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warehouse
DB_USER=postgres
DB_PASSWORD=Swj121648.
PORT=3001
NODE_ENV=production
EOF

# 构建项目
pnpm build
```

### 4. 配置 Nginx

```bash
# 创建反向代理配置
sudo tee /etc/nginx/conf.d/kouzi.conf > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
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
}
EOF

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 测试配置
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 启动应用

```bash
# 使用 PM2 启动
pm2 start npx --name "kouzi" -- next start -p 3001
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs kouzi

# 等待启动
sleep 10
```

### 6. 测试验证

```bash
# 测试 API
curl -X POST http://localhost:3001/api/warehouses \
  -H "Content-Type: application/json" \
  -d '{"code":"WH001","name":"主库房"}'

# 预期返回：
# {"id":1,"code":"WH001","name":"主库房",...}

# 测试域名访问
curl -H "Host: www.001tf.com" http://localhost/api/warehouses
```

## 🔧 常用管理命令

### PM2 管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs kouzi

# 重启应用
pm2 restart kouzi

# 停止应用
pm2 stop kouzi

# 删除应用
pm2 delete kouzi

# 查看详细信息
pm2 show kouzi
```

### Nginx 管理

```bash
# 查看状态
sudo systemctl status nginx

# 重启
sudo systemctl restart nginx

# 重载配置
sudo systemctl reload nginx

# 测试配置
sudo nginx -t

# 查看日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL 管理

```bash
# 查看状态
sudo systemctl status postgresql-15

# 重启
sudo systemctl restart postgresql-15

# 连接数据库
PGPASSWORD=Swj121648. psql -U postgres -d warehouse

# 查看表
\dt

# 查看数据
SELECT * FROM warehouses;

# 退出
\q
```

## 📁 项目结构

```
/home/admin/kouzi/
├── .env                          # 环境变量配置
├── src/
│   ├── app/                      # Next.js 页面和 API 路由
│   │   ├── api/                  # API 路由
│   │   │   ├── warehouses/       # 库房 API
│   │   │   ├── products/         # 商品 API
│   │   │   └── ...
│   │   └── ...
│   ├── lib/
│   │   └── postgres.ts           # PostgreSQL 连接配置
│   └── services/                 # 业务逻辑服务
├── .next/                        # Next.js 构建输出
└── package.json
```

## 🔐 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DB_HOST | 数据库主机 | localhost |
| DB_PORT | 数据库端口 | 5432 |
| DB_NAME | 数据库名称 | warehouse |
| DB_USER | 数据库用户 | postgres |
| DB_PASSWORD | 数据库密码 | Swj121648. |
| PORT | 应用端口 | 3001 |
| NODE_ENV | 运行环境 | production |

## 🌐 访问地址

- **本地访问**: http://localhost:3001
- **内网访问**: http://172.19.0.74:3001
- **域名访问**: http://001tf.com 或 http://www.001tf.com

## ⚠️ 常见问题

### 1. Node.js 版本过低

```bash
# 移除旧版本
sudo dnf remove -y nodejs npm
sudo dnf clean all

# 重新安装 Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

### 2. PostgreSQL 认证失败

```bash
# 临时改为 trust 认证
sudo sed -i 's/md5/trust/g' /var/lib/pgsql/15/data/pg_hba.conf
sudo systemctl restart postgresql-15

# 设置密码
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'Swj121648.';"

# 改回 md5 认证
sudo sed -i 's/trust/md5/g' /var/lib/pgsql/15/data/pg_hba.conf
sudo systemctl restart postgresql-15
```

### 3. 端口被占用

```bash
# 查看占用端口的进程
sudo lsof -ti:3001

# 杀掉进程
sudo lsof -ti:3001 | xargs sudo kill -9

# 重启应用
pm2 restart kouzi
```

### 4. Nginx 404 错误

确保 `kouzi.conf` 配置了 `default_server`：

```nginx
listen 80 default_server;
listen [::]:80 default_server;
```

### 5. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql-15

# 检查连接
PGPASSWORD=Swj121648. psql -U postgres -d warehouse -c "SELECT 1"

# 查看应用日志
pm2 logs kouzi
```

## 🔄 更新部署

```bash
# 进入项目目录
cd /home/admin/kouzi

# 拉取最新代码
git pull origin main

# 安装依赖（如果有新依赖）
pnpm install

# 重新构建
pnpm build

# 重启应用
pm2 restart kouzi

# 查看日志
pm2 logs kouzi
```

## 📊 数据库备份

```bash
# 备份数据库
pg_dump -U postgres -d warehouse > /home/admin/warehouse_backup_$(date +%Y%m%d).sql

# 恢复数据库
psql -U postgres -d warehouse < /home/admin/warehouse_backup_20260409.sql
```

## 🛡️ 安全建议

1. **修改默认密码**: 生产环境请修改数据库密码
2. **配置防火墙**: 仅开放 80、443 端口
3. **启用 HTTPS**: 使用 Let's Encrypt 配置 SSL 证书
4. **定期备份**: 设置定时任务备份数据库
5. **监控日志**: 定期检查应用和系统日志

## 📝 技术栈

- **Framework**: Next.js 16.1.1
- **UI**: React 19 + shadcn/ui
- **Database**: PostgreSQL 15
- **Web Server**: Nginx
- **Process Manager**: PM2
- **Package Manager**: pnpm
- **OS**: AlmaLinux 9.5

---

**最后更新**: 2026-04-09
**版本**: v1.0.0
