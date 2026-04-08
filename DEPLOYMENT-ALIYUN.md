# 库房管理系统 - 阿里云部署指南

## 📋 部署架构

```
用户 → 阿里云ECS → Nginx(80/443) → Next.js(3000) → 腾讯云PostgreSQL
```

## 🎯 部署前准备

### 1. 阿里云ECS服务器要求
- **操作系统**: Ubuntu 20.04/22.04 LTS
- **配置**: 至少 2核2G
- **带宽**: 建议 3Mbps 以上
- **存储**: 至少 40GB

### 2. 阿里云安全组配置
在阿里云控制台开放以下端口：
- ✅ **80** - HTTP
- ✅ **443** - HTTPS
- ✅ **22** - SSH

### 3. 数据库
- 已配置腾讯云PostgreSQL数据库
- 数据库连接信息已在部署脚本中预设

---

## 🚀 部署步骤

### 方式一：一键部署（推荐）

#### 步骤1：本地打包

在本地Windows系统（Git Bash或WSL）中运行：

```bash
cd e:\ai\kc6\kouzi
bash package-for-aliyun.sh
```

会生成类似 `warehouse-system_20260406_143025.tar.gz` 的压缩包

#### 步骤2：上传到服务器

```bash
# 替换为你的服务器IP
scp warehouse-system_*.tar.gz root@你的服务器IP:/root/
```

#### 步骤3：SSH登录服务器

```bash
ssh root@你的服务器IP
```

#### 步骤4：运行部署脚本

```bash
# 进入部署目录
cd /root

# 创建部署目录
mkdir -p /opt/warehouse-system
cd /opt/warehouse-system

# 解压项目
tar -xzf /root/warehouse-system_*.tar.gz

# 赋予执行权限
chmod +x aliyun-deploy.sh

# 运行部署脚本
bash aliyun-deploy.sh
```

脚本会引导你完成：
1. ✅ 安装系统依赖（Node.js, pnpm, Nginx）
2. ✅ 安装项目依赖
3. ✅ 配置环境变量
4. ✅ 构建项目
5. ✅ 创建系统服务
6. ✅ 配置Nginx反向代理
7. ✅ 配置SSL证书（可选）
8. ✅ 配置防火墙

---

### 方式二：手动部署

#### 1. 连接服务器

```bash
ssh root@你的服务器IP
```

#### 2. 安装系统依赖

```bash
# 更新系统
apt update -y

# 安装必要工具
apt install -y curl wget git nginx

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 pnpm
npm install -g pnpm
```

#### 3. 上传项目代码

```bash
# 在本地打包（排除不必要的文件）
cd e:\ai\kc6\kouzi
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='.qoder' \
    -czf /tmp/warehouse.tar.gz .

# 上传到服务器
scp /tmp/warehouse.tar.gz root@你的服务器IP:/opt/

# 在服务器上解压
ssh root@你的服务器IP
cd /opt
mkdir -p warehouse-system
cd warehouse-system
tar -xzf /opt/warehouse.tar.gz
```

#### 4. 安装项目依赖并构建

```bash
cd /opt/warehouse-system

# 安装依赖
pnpm install --frozen-lockfile

# 创建环境变量文件
cat > .env << EOF
DB_HOST=cd-postgres-gu24c63s.sql.tencentcdb.com
DB_PORT=21021
DB_NAME=warehouse_db
DB_USER=zxp2672
DB_PASSWORD=Swj121648.
NODE_ENV=production
PORT=3000
EOF

# 构建项目
pnpm build
```

#### 5. 创建系统服务

```bash
cat > /etc/systemd/system/warehouse-system.service << EOF
[Unit]
Description=Warehouse Management System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/warehouse-system
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
systemctl daemon-reload
systemctl enable warehouse-system
systemctl start warehouse-system

# 查看状态
systemctl status warehouse-system
```

#### 6. 配置Nginx

```bash
cat > /etc/nginx/sites-available/warehouse-system << 'EOF'
server {
    listen 80;
    server_name 你的域名或IP;

    access_log /var/log/nginx/warehouse-access.log;
    error_log /var/log/nginx/warehouse-error.log;

    client_max_body_size 50M;

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
    }

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/warehouse-system /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并重载
nginx -t
systemctl reload nginx
```

#### 7. 配置SSL证书（可选）

```bash
# 安装 certbot
apt install -y certbot python3-certbot-nginx

# 申请证书（替换为你的域名）
certbot --nginx -d your-domain.com

# 自动续期
crontab -e
# 添加：0 3 * * * certbot renew --quiet
```

---

## 📊 部署验证

### 1. 检查服务状态

```bash
systemctl status warehouse-system
```

应该显示 `active (running)`

### 2. 检查应用日志

```bash
journalctl -u warehouse-system -f
```

### 3. 访问应用

浏览器访问：
- HTTP: `http://你的服务器IP`
- HTTPS: `https://你的域名`（如果配置了SSL）

### 4. 测试登录

使用测试账号登录：
- 用户名: `admin`
- 密码: `123456`

### 5. 跨浏览器测试

在不同浏览器中登录，验证数据同步功能。

---

## 🔧 常用运维命令

### 服务管理

```bash
# 查看服务状态
systemctl status warehouse-system

# 重启服务
systemctl restart warehouse-system

# 停止服务
systemctl stop warehouse-system

# 查看服务日志
journalctl -u warehouse-system -f

# 查看最近100行日志
journalctl -u warehouse-system -n 100
```

### Nginx管理

```bash
# 测试配置
nginx -t

# 重载配置
systemctl reload nginx

# 重启Nginx
systemctl restart nginx

# 查看访问日志
tail -f /var/log/nginx/warehouse-access.log

# 查看错误日志
tail -f /var/log/nginx/warehouse-error.log
```

### 更新部署

```bash
# 1. 上传新代码
scp warehouse-system_*.tar.gz root@你的服务器IP:/tmp/

# 2. SSH登录服务器
ssh root@你的服务器IP

# 3. 停止服务
systemctl stop warehouse-system

# 4. 备份当前版本
cd /opt
mv warehouse-system warehouse-system-backup

# 5. 部署新版本
mkdir warehouse-system
cd warehouse-system
tar -xzf /tmp/warehouse-system_*.tar.gz
pnpm install --frozen-lockfile
pnpm build

# 6. 启动服务
systemctl start warehouse-system

# 7. 验证
systemctl status warehouse-system
```

### 数据库连接测试

```bash
# 安装PostgreSQL客户端
apt install -y postgresql-client

# 测试连接
psql -h cd-postgres-gu24c63s.sql.tencentcdb.com \
     -p 21021 \
     -U zxp2672 \
     -d warehouse_db
```

---

## 🐛 常见问题

### 1. 服务启动失败

```bash
# 查看详细日志
journalctl -u warehouse-system -n 200 --no-pager

# 检查端口是否被占用
netstat -tlnp | grep 3000

# 检查.env文件
cat /opt/warehouse-system/.env
```

### 2. Nginx 502错误

```bash
# 检查Next.js服务是否运行
systemctl status warehouse-system

# 检查端口
curl http://127.0.0.1:3000

# 检查Nginx配置
nginx -t
```

### 3. 数据库连接失败

```bash
# 测试数据库连接
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'cd-postgres-gu24c63s.sql.tencentcdb.com',
  port: 21021,
  database: 'warehouse_db',
  user: 'zxp2672',
  password: 'Swj121648.'
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  pool.end();
});
"
```

### 4. 跨浏览器登录问题

确保：
1. ✅ 登录API `/api/auth/login` 正常工作
2. ✅ 数据库连接正常
3. ✅ 每个浏览器独立登录

---

## 📈 性能优化建议

### 1. Nginx缓存优化

在Nginx配置中添加：

```nginx
# 静态资源缓存
location /_next/static/ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}

location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 30d;
    add_header Cache-Control "public";
}
```

### 2. 启用HTTP/2

```nginx
listen 443 ssl http2;
```

### 3. 配置CDN

使用阿里云CDN加速静态资源。

---

## 🔒 安全建议

1. ✅ 配置HTTPS（SSL证书）
2. ✅ 定期更新系统补丁
3. ✅ 配置防火墙规则
4. ✅ 定期备份数据库
5. ✅ 监控服务器资源
6. ✅ 限制SSH登录IP

---

## 📞 技术支持

如遇到问题，请检查：
1. 服务日志: `journalctl -u warehouse-system -f`
2. Nginx日志: `/var/log/nginx/warehouse-*.log`
3. 数据库连接状态
4. 服务器资源使用情况: `htop`, `df -h`, `free -m`
