# Nginx 部署指南

## 快速开始

### 前提条件

- 阿里云 Ubuntu 20.04/22.04 服务器
- 已安装 Node.js 24 和 pnpm
- 已安装 Nginx
- 域名（可选但推荐）

## 完整部署步骤

### 1. 上传并解压项目

```bash
# 本地上传文件到服务器
scp warehouse-management-system-full-*.tar.gz root@your-server-ip:/root/

# 登录服务器
ssh root@your-server-ip

# 创建应用目录
mkdir -p /opt/warehouse-system
cd /opt/warehouse-system

# 解压项目
tar -xzf /root/warehouse-management-system-full-*.tar.gz --strip-components=1

# 确认文件
ls -la
```

### 2. 安装项目依赖

```bash
cd /opt/warehouse-system

# 安装依赖
pnpm install

# 构建项目
pnpm run build
```

### 3. 使用 PM2 管理应用进程

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 启动应用
pm2 start npm --name "warehouse-system" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs warehouse-system

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 配置 Nginx

#### 方式一：IP 访问（无域名）

创建配置文件：

```bash
sudo nano /etc/nginx/sites-available/warehouse-system
```

内容：

```nginx
server {
    listen 80;
    server_name _;

    # 日志
    access_log /var/log/nginx/warehouse-access.log;
    error_log /var/log/nginx/warehouse-error.log;

    # 最大上传大小
    client_max_body_size 20M;

    # 代理到 Next.js 应用
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
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 7d;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 方式二：域名访问（推荐）

如果你有域名，使用这个配置：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 重定向 www 到非 www（可选）
    if ($host = www.your-domain.com) {
        return 301 https://your-domain.com$request_uri;
    }

    access_log /var/log/nginx/warehouse-access.log;
    error_log /var/log/nginx/warehouse-error.log;

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

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 7d;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5. 启用 Nginx 配置

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/warehouse-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 或者重新加载配置
sudo systemctl reload nginx
```

### 6. 配置防火墙（如果启用）

```bash
# 检查防火墙状态
sudo ufw status

# 如果防火墙启用，允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH

# 启用防火墙（如果未启用）
sudo ufw enable
```

### 7. 配置阿里云安全组

**重要**：在阿里云控制台配置安全组规则：

1. 登录阿里云 ECS 控制台
2. 找到您的实例 -> 安全组
3. 配置入站规则：

| 端口 | 协议 | 授权对象 | 说明 |
|------|------|----------|------|
| 22 | TCP | 您的IP | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |

## 配置 HTTPS（推荐）

### 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（自动配置 Nginx）
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 按提示操作：
# 1. 输入邮箱
# 2. 同意服务条款
# 3. 选择是否重定向 HTTP 到 HTTPS（推荐选 2: Redirect）
```

### 自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# Certbot 会自动设置定时任务，无需手动配置
```

### HTTPS 配置后的 Nginx 示例

Certbot 会自动修改配置，最终效果类似：

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    access_log /var/log/nginx/warehouse-access.log;
    error_log /var/log/nginx/warehouse-error.log;

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

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 7d;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 常用管理命令

### PM2 管理

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs warehouse-system
pm2 logs warehouse-system --lines 100  # 查看最后100行
pm2 logs warehouse-system --err        # 只看错误日志

# 重启应用
pm2 restart warehouse-system

# 停止应用
pm2 stop warehouse-system

# 启动应用
pm2 start warehouse-system

# 删除应用
pm2 delete warehouse-system

# 监控面板
pm2 monit
```

### Nginx 管理

```bash
# 测试配置
sudo nginx -t

# 启动 Nginx
sudo systemctl start nginx

# 停止 Nginx
sudo systemctl stop nginx

# 重启 Nginx
sudo systemctl restart nginx

# 重新加载配置（不中断服务）
sudo systemctl reload nginx

# 查看状态
sudo systemctl status nginx

# 查看访问日志
sudo tail -f /var/log/nginx/warehouse-access.log

# 查看错误日志
sudo tail -f /var/log/nginx/warehouse-error.log
```

## 故障排查

### 问题1：502 Bad Gateway

**原因**：Node.js 应用没有运行

**解决**：
```bash
# 检查 PM2 状态
pm2 status

# 如果应用没运行，启动它
pm2 start warehouse-system

# 查看日志
pm2 logs warehouse-system
```

### 问题2：404 Not Found

**原因**：Nginx 配置或路由问题

**解决**：
```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/warehouse-error.log
```

### 问题3：上传文件大小限制

**解决**：在 Nginx 配置中增加 `client_max_body_size`

```nginx
client_max_body_size 50M;  # 改为您需要的大小
```

### 问题4：端口被占用

**解决**：
```bash
# 查看端口使用
sudo netstat -tlnp | grep :3000
# 或
ss -tlnp | grep :3000

# 杀掉占用进程（如果需要）
sudo kill -9 <PID>
```

### 问题5：静态资源加载慢

**解决**：确保配置了静态资源缓存

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    proxy_pass http://localhost:3000;
    proxy_cache_valid 200 7d;
    expires 7d;
    add_header Cache-Control "public, immutable";
}
```

## 性能优化建议

### 1. 启用 Gzip 压缩

在 Nginx 配置的 `http` 块中添加（通常在 `/etc/nginx/nginx.conf`）：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
```

### 2. 配置缓存

```nginx
# 静态资源长期缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    proxy_pass http://localhost:3000;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 增加 Worker 进程

在 `/etc/nginx/nginx.conf` 中：

```nginx
worker_processes auto;
worker_connections 2048;
```

## 安全建议

1. **定期更新系统**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **使用防火墙**
```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

3. **禁止 root 直接 SSH 登录**（可选但推荐）
4. **使用 HTTPS**
5. **定期备份数据**

## 备份策略

### 备份应用

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

# 备份应用
tar -czf $BACKUP_DIR/warehouse-app-$DATE.tar.gz -C $APP_DIR .

# 保留最近30天的备份
find $BACKUP_DIR -name "warehouse-app-*.tar.gz" -mtime +30 -delete
```

设置定时任务：
```bash
chmod +x /opt/backup-script.sh
crontab -e
# 添加：每天凌晨2点备份
0 2 * * * /opt/backup-script.sh
```

## 访问您的应用

部署完成后，通过以下方式访问：

- **IP 访问**: `http://your-server-ip`
- **域名访问**: `http://your-domain.com`
- **HTTPS 访问**: `https://your-domain.com`（如果配置了）

默认登录信息请查看应用说明文档。
