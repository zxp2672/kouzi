#!/bin/bash

# 宝塔面板专用部署脚本 - 库房管理系统
# 使用方法：在服务器上运行
# chmod +x baota-deploy.sh
# sudo ./baota-deploy.sh

set -e

echo "======================================"
echo "  库房管理系统 - 宝塔面板部署脚本"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
APP_NAME="warehouse-system"
APP_DIR="/www/wwwroot/warehouse-system"
DOCKER_COMPOSE_FILE="$APP_DIR/docker-compose.yml"
ENV_FILE="$APP_DIR/.env"

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}错误：请使用 root 权限运行此脚本${NC}"
    echo "使用: sudo ./baota-deploy.sh"
    exit 1
fi

# 检查宝塔面板是否安装
if [ ! -d "/www/server/panel" ] && [ ! -f "/etc/init.d/bt" ]; then
    echo -e "${RED}警告：未检测到宝塔面板${NC}"
    read -p "是否继续安装？(y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
fi

# 步骤 1: 创建应用目录
echo -e "${GREEN}[步骤 1/6]${NC} 创建应用目录..."
mkdir -p $APP_DIR
echo -e "${GREEN}应用目录: $APP_DIR${NC}"
echo ""

# 步骤 2: 检查 Docker 环境
echo -e "${GREEN}[步骤 2/6]${NC} 检查 Docker 环境..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker 已安装: $(docker --version)${NC}"
else
    echo -e "${YELLOW}Docker 未安装，正在安装...${NC}"
    # 使用宝塔 Docker 管理器安装
    if [ -f "/www/server/panel/install/install_soft.sh" ]; then
        # 通过宝塔面板安装 Docker
        bash /www/server/panel/install/install_soft.sh 0 install docker 2>&1 | tail -20
    else
        # 手动安装 Docker
        curl -fsSL https://get.docker.com | bash -s docker
        systemctl start docker
        systemctl enable docker
    fi
fi

# 检查 Docker Compose
if command -v docker compose &> /dev/null || command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose 已安装${NC}"
else
    echo -e "${YELLOW}安装 Docker Compose...${NC}"
    apt install docker-compose-plugin -y 2>/dev/null || yum install docker-compose-plugin -y 2>/dev/null || true
fi
echo ""

# 步骤 3: 配置环境变量
echo -e "${GREEN}[步骤 3/6]${NC} 配置环境变量..."
echo ""
echo -e "${BLUE}请配置以下信息（直接回车使用默认值）：${NC}"
echo ""

# 获取 Supabase 配置
echo -e "${YELLOW}数据库配置（Supabase）：${NC}"
read -p "  Supabase URL (例如: https://xxx.supabase.co，留空使用 Mock 模式): " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    SUPABASE_URL="https://mock.supabase.co"
    SUPABASE_ANON_KEY="mock-key"
    echo -e "${YELLOW}  → 使用 Mock 模式（无真实数据库）${NC}"
else
    read -p "  Supabase Anon Key: " SUPABASE_ANON_KEY
    if [ -z "$SUPABASE_ANON_KEY" ]; then
        SUPABASE_ANON_KEY="mock-key"
    fi
fi

echo ""

# 获取端口配置
echo -e "${YELLOW}端口配置：${NC}"
read -p "  应用端口 [默认: 3000]: " APP_PORT
if [ -z "$APP_PORT" ]; then
    APP_PORT=3000
fi

echo ""

# 创建 .env 文件
cat > $ENV_FILE << EOF
# 库房管理系统 - 环境变量配置
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')

NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
PORT=$APP_PORT
NODE_ENV=production
TZ=Asia/Shanghai
EOF

echo -e "${GREEN}✓ 环境变量已保存到: $ENV_FILE${NC}"
echo ""

# 步骤 4: 创建 Docker Compose 配置
echo -e "${GREEN}[步骤 4/6]${NC} 创建 Docker Compose 配置..."

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
    volumes:
      - ./data:/app/data
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
        max-file: "5"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
EOF

echo -e "${GREEN}✓ Docker Compose 配置已创建${NC}"
echo ""

# 步骤 5: 宝塔面板配置指南
echo -e "${GREEN}[步骤 5/6]${NC} 宝塔面板配置指南..."
echo ""
echo -e "${BLUE}请按照以下步骤在宝塔面板中配置：${NC}"
echo ""
echo -e "${YELLOW}1. 添加网站（用于反向代理）${NC}"
echo "   - 登录宝塔面板"
echo "   - 点击 '网站' → '添加站点'"
echo "   - 域名：填写你的域名或服务器 IP"
echo "   - 根目录：$APP_DIR"
echo "   - PHP 版本：纯静态"
echo "   - 数据库：不需要"
echo ""
echo -e "${YELLOW}2. 配置反向代理${NC}"
echo "   - 进入网站设置 → '反向代理'"
echo "   - 添加反向代理："
echo "     * 代理名称: warehouse-system"
echo "     * 目标 URL: http://127.0.0.1:$APP_PORT"
echo "     * 发送域名: \$host"
echo "   - 开启反向代理"
echo ""
echo -e "${YELLOW}3. 配置 SSL 证书（可选）${NC}"
echo "   - 进入网站设置 → 'SSL'"
echo "   - 选择 'Let's Encrypt' 免费证书"
echo "   - 点击申请"
echo "   - 开启 '强制 HTTPS'"
echo ""
echo -e "${YELLOW}4. 开放端口${NC}"
echo "   - 进入 '安全' 菜单"
echo "   - 添加端口规则：$APP_PORT（用于 Docker 容器）"
echo "   - 如果使用域名访问，确保 80 和 443 端口已开放"
echo ""

# 步骤 6: 构建和启动服务
echo -e "${GREEN}[步骤 6/6]${NC} 构建和启动服务..."
echo ""

cd $APP_DIR

# 检查项目文件是否存在
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误：项目文件不存在${NC}"
    echo ""
    echo -e "${YELLOW}请先将项目文件上传到: $APP_DIR${NC}"
    echo ""
    echo "上传方法："
    echo "1. 使用宝塔面板 '文件' 功能上传"
    echo "2. 或使用 FTP/SFTP 上传到 $APP_DIR"
    echo "3. 或使用命令: scp -r ./项目目录 root@服务器IP:$APP_DIR"
    echo ""
    exit 1
fi

echo -e "${GREEN}开始构建 Docker 镜像...${NC}"
echo -e "${YELLOW}（首次构建可能需要 5-10 分钟，请耐心等待）${NC}"
echo ""

# 构建并启动
docker compose up -d --build

echo ""
echo "======================================"
echo -e "${GREEN}部署完成！${NC}"
echo "======================================"
echo ""

# 显示服务状态
echo -e "${BLUE}服务状态：${NC}"
docker compose ps
echo ""

# 显示访问信息
echo -e "${BLUE}访问信息：${NC}"
echo "  应用端口: $APP_PORT"
echo "  本地访问: http://localhost:$APP_PORT"
echo "  外网访问: http://你的服务器IP:$APP_PORT"
echo ""

if [ "$SUPABASE_URL" = "https://mock.supabase.co" ]; then
    echo -e "${YELLOW}⚠ 当前使用 Mock 模式（无真实数据库）${NC}"
    echo "  如需使用真实数据库，请配置 Supabase 环境变量后重启："
    echo "  docker compose down && docker compose up -d"
    echo ""
fi

# 显示常用命令
echo -e "${BLUE}常用管理命令：${NC}"
echo "  查看日志:     cd $APP_DIR && docker compose logs -f"
echo "  重启服务:     cd $APP_DIR && docker compose restart"
echo "  停止服务:     cd $APP_DIR && docker compose down"
echo "  更新服务:     cd $APP_DIR && docker compose up -d --build"
echo "  查看状态:     cd $APP_DIR && docker compose ps"
echo ""

echo -e "${GREEN}✓ 部署完成！${NC}"
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "1. 在宝塔面板中配置反向代理（参考上方步骤 5）"
echo "2. 访问您的网站"
echo "3. 默认登录：admin / admin123（请及时修改密码）"
echo ""
