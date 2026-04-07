#!/bin/bash

# 阿里云部署脚本 - 库房管理系统
# 使用方法：在服务器上运行此脚本
# chmod +x aliyun-deploy.sh
# ./aliyun-deploy.sh

set -e

echo "======================================"
echo "  库房管理系统 - 阿里云部署脚本"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="warehouse-system"
APP_DIR="/opt/warehouse-system"
DOCKER_COMPOSE_FILE="$APP_DIR/docker-compose.yml"
ENV_FILE="$APP_DIR/.env"
NGINX_CONF="/etc/nginx/sites-available/warehouse-system"

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}错误：请使用 root 权限运行此脚本${NC}"
    echo "使用 sudo ./aliyun-deploy.sh"
    exit 1
fi

# 步骤 1: 系统更新
echo -e "${GREEN}[步骤 1/7]${NC} 更新系统..."
apt update && apt upgrade -y
echo ""

# 步骤 2: 安装 Docker
echo -e "${GREEN}[步骤 2/7]${NC} 安装 Docker..."
if command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker 已安装，跳过${NC}"
else
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    rm get-docker.sh
fi
echo ""

# 步骤 3: 安装 Docker Compose
echo -e "${GREEN}[步骤 3/7]${NC} 安装 Docker Compose..."
if command -v docker compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose 已安装，跳过${NC}"
else
    apt install docker-compose-plugin -y
fi
echo ""

# 步骤 4: 安装 Nginx
echo -e "${GREEN}[步骤 4/7]${NC} 安装 Nginx..."
if command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx 已安装，跳过${NC}"
else
    apt install nginx -y
    systemctl enable nginx
fi
echo ""

# 步骤 5: 创建应用目录
echo -e "${GREEN}[步骤 5/7]${NC} 创建应用目录..."
mkdir -p $APP_DIR
echo ""

# 步骤 6: 配置环境变量
echo -e "${GREEN}[步骤 6/7]${NC} 配置环境变量..."
echo ""
echo -e "${YELLOW}请输入以下配置信息（按回车使用默认值）：${NC}"
echo ""

# 获取 Supabase URL
read -p "Supabase URL (例如: https://xxx.supabase.co): " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    SUPABASE_URL="https://mock.supabase.co"
    echo -e "${YELLOW}使用 Mock 模式（无数据库）${NC}"
fi

# 获取 Supabase Anon Key
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
if [ -z "$SUPABASE_ANON_KEY" ]; then
    SUPABASE_ANON_KEY="mock-key"
fi

# 获取端口
read -p "应用端口 [默认: 3000]: " APP_PORT
if [ -z "$APP_PORT" ]; then
    APP_PORT=3000
fi

# 获取域名（可选）
read -p "域名（可选，直接回车使用 IP 访问）: " DOMAIN_NAME

# 创建 .env 文件
cat > $ENV_FILE << EOF
# 库房管理系统 - 环境变量配置
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
PORT=$APP_PORT
NODE_ENV=production
TZ=Asia/Shanghai
EOF

echo -e "${GREEN}环境变量配置完成${NC}"
echo ""

# 步骤 7: 创建 Docker Compose 文件
echo -e "${GREEN}[步骤 7/7]${NC} 创建 Docker Compose 配置..."

cat > $DOCKER_COMPOSE_FILE << EOF
version: '3.8'

services:
  warehouse-system:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: $APP_NAME
    restart: always
    ports:
      - "${APP_PORT}:3000"
    environment:
      - NODE_ENV=production
      - TZ=Asia/Shanghai
      - NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF

echo -e "${GREEN}Docker Compose 配置完成${NC}"
echo ""

# 创建 Nginx 配置
if [ -n "$DOMAIN_NAME" ]; then
    echo -e "${GREEN}配置 Nginx 反向代理（域名模式）...${NC}"
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

    # 启用站点
    ln -sf $NGINX_CONF /etc/nginx/sites-enabled/warehouse-system
    rm -f /etc/nginx/sites-enabled/default
    
    echo -e "${GREEN}Nginx 配置完成（域名: $DOMAIN_NAME）${NC}"
else
    echo -e "${YELLOW}跳过 Nginx 配置（使用 IP 直接访问）${NC}"
    echo -e "${YELLOW}如需配置 Nginx，请运行: nginx-config.sh${NC}"
fi

echo ""
echo "======================================"
echo -e "${GREEN}部署准备完成！${NC}"
echo "======================================"
echo ""
echo "下一步操作："
echo "1. 将项目文件上传到 $APP_DIR 目录"
echo "2. 在 $APP_DIR 目录下运行: docker compose up -d --build"
echo "3. 查看日志: docker compose logs -f"
echo ""

if [ -n "$DOMAIN_NAME" ]; then
    echo "访问地址: http://$DOMAIN_NAME"
else
    echo "访问地址: http://your-server-ip:$APP_PORT"
fi

echo ""
echo -e "${YELLOW}注意：${NC}"
echo "- 如果使用域名，请确保域名已解析到服务器 IP"
echo "- 如需 HTTPS，请运行: certbot --nginx -d $DOMAIN_NAME"
echo "- 阿里云安全组需开放端口 80、443、$APP_PORT"
echo ""
