# 库房管理系统 - 快速部署指南

## 🚀 快速开始

### 方式一：使用打包脚本（推荐）

```bash
# 1. 在本地运行打包脚本
./package-for-deploy.sh

# 2. 将生成的压缩包上传到阿里云服务器
scp deploy-packages/warehouse-management-system-*.tar.gz root@your-server-ip:/root/

# 3. 登录服务器并解压
ssh root@your-server-ip
tar -xzf warehouse-management-system-*.tar.gz
cd warehouse-management-system

# 4. 查看详细部署文档
cat DEPLOYMENT.md
```

### 方式二：Docker 一键部署

```bash
# 1. 上传项目文件到服务器
# 2. 在服务器上运行
cd /path/to/project
docker-compose up -d --build

# 3. 访问
# 浏览器打开: http://your-server-ip:3000
```

## 📋 前置检查清单

- [ ] 阿里云服务器（Ubuntu 20.04/22.04）
- [ ] 服务器开放端口：22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (应用)
- [ ] 域名（可选，用于 HTTPS）
- [ ] 本地已安装 Node.js 24 和 pnpm

## 🔧 服务器环境配置

### 基础环境安装（Ubuntu）

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git vim

# 安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
sudo npm install -g pnpm

# 验证安装
node -v
pnpm -v
```

### Docker 环境安装

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo apt install -y docker-compose-plugin

# 验证
docker --version
docker compose version
```

## 📦 部署步骤详解

### 1. 准备项目文件

```bash
# 方式 A: 使用打包脚本（推荐）
# 在本地运行：
./package-for-deploy.sh

# 方式 B: 直接上传源码
# 使用 git 或 scp 上传完整项目
```

### 2. 上传到服务器

```bash
# 使用 SCP 上传
scp -r /local/path/to/project root@your-server-ip:/opt/warehouse-system

# 或使用 Git（推荐）
ssh root@your-server-ip
cd /opt
git clone <your-repo-url> warehouse-system
```

### 3. Docker 部署（最简单）

```bash
cd /opt/warehouse-system

# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps
```

### 4. 直接部署（Node.js + PM2）

```bash
cd /opt/warehouse-system

# 安装依赖
pnpm install

# 构建
pnpm run build

# 安装 PM2
sudo npm install -g pm2

# 启动应用
pm2 start npm --name "warehouse" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs warehouse
```

### 5. 配置 Nginx（推荐用于生产）

```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/warehouse
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
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/warehouse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. 配置 HTTPS（可选但推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 证书会自动续期
```

## 🌐 访问应用

部署完成后，通过以下方式访问：

- **IP 访问**: `http://your-server-ip:3000`
- **域名访问**: `http://your-domain.com` （如配置了 Nginx）
- **HTTPS 访问**: `https://your-domain.com` （如配置了 SSL）

## 🔍 常见问题排查

### 端口被占用

```bash
# 查看端口使用
sudo netstat -tlnp | grep :3000

# 或使用 ss
ss -tlnp | grep :3000
```

### 查看应用日志

```bash
# Docker 方式
docker-compose logs -f

# PM2 方式
pm2 logs warehouse

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 防火墙设置

```bash
# 检查防火墙状态
sudo ufw status

# 允许端口
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp

# 启用防火墙
sudo ufw enable
```

## 📚 更多信息

- **详细部署文档**: 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)
- **项目文档**: 查看项目根目录的其他文档
- **技术支持**: 如遇问题，请联系技术支持

## 🎯 阿里云安全组配置

重要：在阿里云控制台配置安全组规则，开放以下端口：

| 端口 | 协议 | 说明 | 授权对象 |
|------|------|------|----------|
| 22 | TCP | SSH | 您的IP（推荐）或 0.0.0.0/0 |
| 80 | TCP | HTTP | 0.0.0.0/0 |
| 443 | TCP | HTTPS | 0.0.0.0/0 |
| 3000 | TCP | 应用 | 0.0.0.0/0 |

## 💡 提示

1. **首次部署**：建议先使用 Docker 方式，最简单快捷
2. **生产环境**：建议配置 Nginx + HTTPS + 域名
3. **数据备份**：定期备份重要数据
4. **监控告警**：配置服务监控和告警机制

祝部署顺利！🎉
