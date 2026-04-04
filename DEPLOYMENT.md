# 库房管理系统 - 阿里云部署指南

## 项目概述

这是一个功能完整的库房管理系统，支持商品入库、出库、盘点、调拨、审核等功能。

**技术栈：**
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- shadcn/ui
- Tailwind CSS 4

## 前置准备

### 1. 阿里云服务器要求

- **操作系统**: Ubuntu 20.04/22.04 LTS (推荐)
- **CPU**: 2核及以上
- **内存**: 4GB及以上
- **磁盘**: 20GB及以上
- **网络**: 公网带宽建议 5Mbps 以上

### 2. 域名配置（可选但推荐）

- 在阿里云购买域名（如 `example.com`）
- 配置域名解析到服务器公网IP

## 部署步骤

### 方法一：使用 Docker 部署（推荐）

#### 1. 安装 Docker 和 Docker Compose

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version

# 安装 Docker Compose
sudo apt install docker-compose-plugin -y
```

#### 2. 创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
FROM node:24-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 生产镜像
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# 安装 pnpm
RUN npm install -g pnpm

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
```

#### 3. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  warehouse-system:
    build: .
    container_name: warehouse-management
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TZ=Asia/Shanghai
    volumes:
      - ./data:/app/data
```

#### 4. 上传项目文件到服务器

```bash
# 在本地打包项目（排除 node_modules）
tar -czf warehouse-system.tar.gz --exclude=node_modules --exclude=.git *

# 上传到服务器
scp warehouse-system.tar.gz root@your-server-ip:/root/

# 登录服务器
ssh root@your-server-ip

# 解压
mkdir -p /opt/warehouse-system
cd /opt/warehouse-system
tar -xzf /root/warehouse-system.tar.gz
```

#### 5. 启动服务

```bash
cd /opt/warehouse-system

# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

### 方法二：直接部署（Node.js）

#### 1. 安装 Node.js 和 pnpm

```bash
# 使用 NodeSource 安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version

# 安装 pnpm
npm install -g pnpm
```

#### 2. 上传项目文件

```bash
# 创建应用目录
sudo mkdir -p /opt/warehouse-system
sudo chown $USER:$USER /opt/warehouse-system
cd /opt/warehouse-system

# 上传并解压项目文件
# ... (同方法一)

# 安装依赖
pnpm install

# 构建项目
pnpm run build
```

#### 3. 使用 PM2 管理进程

```bash
# 安装 PM2
sudo npm install -g pm2

# 启动应用
pm2 start npm --name "warehouse-system" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs warehouse-system
```

#### 4. 配置 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install nginx -y

# 创建配置文件
sudo nano /etc/nginx/sites-available/warehouse-system
```

配置内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
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
```

启用配置：

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/warehouse-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## SSL 证书配置（HTTPS）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 阿里云安全组配置

1. 登录阿里云控制台
2. 进入 ECS 实例 -> 安全组
3. 添加入站规则：
   - **HTTP (80)**: 0.0.0.0/0
   - **HTTPS (443)**: 0.0.0.0/0
   - **SSH (22)**: 您的IP地址（出于安全考虑）

## 备份策略

### 数据备份

```bash
# 创建备份脚本
sudo nano /opt/backup-script.sh
```

内容：

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/warehouse-system"

mkdir -p $BACKUP_DIR

# 备份数据
tar -czf $BACKUP_DIR/warehouse-data-$DATE.tar.gz $APP_DIR/data

# 保留最近30天的备份
find $BACKUP_DIR -name "warehouse-data-*.tar.gz" -mtime +30 -delete
```

设置定时任务：

```bash
chmod +x /opt/backup-script.sh

# 编辑 crontab
crontab -e

# 添加每天凌晨2点备份
0 2 * * * /opt/backup-script.sh
```

## 监控和维护

### 查看日志

```bash
# Docker 方式
docker-compose logs -f

# PM2 方式
pm2 logs warehouse-system

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 更新部署

```bash
# 拉取最新代码
cd /opt/warehouse-system
git pull  # 或重新上传文件

# Docker 方式
docker-compose up -d --build

# PM2 方式
pnpm install
pnpm run build
pm2 restart warehouse-system
```

## 常见问题排查

### 端口被占用

```bash
# 查看端口使用
sudo netstat -tlnp | grep :3000

# 或使用 ss
ss -tlnp | grep :3000
```

### 权限问题

```bash
# 确保目录权限正确
sudo chown -R $USER:$USER /opt/warehouse-system
sudo chmod -R 755 /opt/warehouse-system
```

### 内存不足

```bash
# 创建 swap 文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 性能优化建议

1. **启用 Gzip 压缩**：在 Nginx 配置中添加
2. **配置 CDN**：使用阿里云 CDN 加速静态资源
3. **数据库优化**：如使用数据库，配置连接池和索引
4. **监控告警**：使用阿里云云监控服务

## 联系支持

如有问题，请查看项目文档或联系技术支持。
