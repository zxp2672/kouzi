#!/bin/bash

# Nginx 配置脚本 - 用于在部署后配置反向代理
# 使用方法：sudo ./nginx-config.sh

set -e

echo "======================================"
echo "  Nginx 反向代理配置"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}错误：请使用 root 权限运行此脚本${NC}"
    exit 1
fi

# 检查 Nginx 是否安装
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}错误：Nginx 未安装${NC}"
    echo "请先运行: apt install nginx -y"
    exit 1
fi

# 获取配置信息
read -p "应用端口 [默认: 3000]: " APP_PORT
if [ -z "$APP_PORT" ]; then
    APP_PORT=3000
fi

read -p "域名（直接回车使用 IP 访问）: " DOMAIN_NAME

# 创建 Nginx 配置
NGINX_CONF="/etc/nginx/sites-available/warehouse-system"

if [ -n "$DOMAIN_NAME" ]; then
    cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    # 日志配置
    access_log /var/log/nginx/warehouse-access.log;
    error_log /var/log/nginx/warehouse-error.log;

    # 最大上传文件大小
    client_max_body_size 50M;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # 代理设置
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$APP_PORT;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
else
    cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name _;

    # 日志配置
    access_log /var/log/nginx/warehouse-access.log;
    error_log /var/log/nginx/warehouse-error.log;

    # 最大上传文件大小
    client_max_body_size 50M;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # 代理设置
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$APP_PORT;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
fi

# 启用站点
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/warehouse-system

# 测试配置
echo ""
echo "测试 Nginx 配置..."
nginx -t

# 重载 Nginx
echo "重载 Nginx..."
systemctl reload nginx

echo ""
echo -e "${GREEN}Nginx 配置完成！${NC}"
if [ -n "$DOMAIN_NAME" ]; then
    echo "访问地址: http://$DOMAIN_NAME"
else
    echo "访问地址: http://your-server-ip"
fi
echo ""
