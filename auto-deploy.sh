#!/bin/bash
# 库房管理系统 - 阿里云自动部署脚本
# 从GitHub拉取最新代码并自动部署

set -e

echo "========================================"
echo "  库房管理系统 - 自动部署脚本"
echo "========================================"
echo ""

# 配置变量
REPO_URL="https://github.com/zxp2672/kouzi.git"
DEPLOY_DIR="/opt/warehouse-system"
PROJECT_NAME="kouzi"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
if [[ $EUID -ne 0 ]]; then
   log_error "此脚本必须以root用户运行"
   exit 1
fi

log_info "开始自动部署..."

# ========================================
# 步骤1: 安装系统依赖
# ========================================
log_info "步骤1: 检查和安装系统依赖..."

# 更新包管理器
apt update

# 安装基础工具
apt install -y curl wget git

# 安装Node.js 20.x
if ! command -v node &> /dev/null; then
    log_info "安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# 安装pnpm
if ! command -v pnpm &> /dev/null; then
    log_info "安装pnpm..."
    npm install -g pnpm
fi

# 安装Nginx
if ! command -v nginx &> /dev/null; then
    log_info "安装Nginx..."
    apt install -y nginx
fi

log_info "系统依赖安装完成"

# ========================================
# 步骤2: 拉取代码
# ========================================
log_info "步骤2: 拉取最新代码..."

# 创建部署目录
mkdir -p $DEPLOY_DIR

# 如果目录不为空，先备份
if [ -d "$DEPLOY_DIR/$PROJECT_NAME" ]; then
    log_warn "发现现有部署，创建备份..."
    mv $DEPLOY_DIR/$PROJECT_NAME $DEPLOY_DIR/${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S)
fi

# 克隆或更新代码
cd $DEPLOY_DIR
if [ ! -d "$PROJECT_NAME" ]; then
    log_info "克隆仓库..."
    git clone $REPO_URL $PROJECT_NAME
else
    log_info "更新现有代码..."
    cd $PROJECT_NAME
    git pull origin main
    cd ..
fi

log_info "代码拉取完成"

# ========================================
# 步骤3: 安装项目依赖
# ========================================
log_info "步骤3: 安装项目依赖..."

cd $DEPLOY_DIR/$PROJECT_NAME

# 安装依赖
pnpm install --frozen-lockfile

log_info "项目依赖安装完成"

# ========================================
# 步骤4: 配置环境变量
# ========================================
log_info "步骤4: 配置环境变量..."

# 检查是否存在.env文件
if [ ! -f ".env" ]; then
    log_warn ".env文件不存在，使用默认配置"
    cat > .env << EOF
# 生产环境配置
NODE_ENV=production
PORT=3000

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://rcyeqrjalfzczdyspbog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeWVxcmphbGZ6Y3pkeXNwYm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjMxMjEsImV4cCI6MjA5MTEzOTEyMX0.Q-WS3GuGI3VWi61whHt1nAbEHyf-T6o2fBttqYhanD4

# 腾讯云PostgreSQL（如果需要）
DB_HOST=cd-postgres-gu24c63s.sql.tencentcdb.com
DB_PORT=21021
DB_NAME=warehouse_db
DB_USER=zxp2672
DB_PASSWORD=Swj121648.
EOF
    log_info "已创建默认.env文件"
fi

log_info "环境变量配置完成"

# ========================================
# 步骤5: 构建项目
# ========================================
log_info "步骤5: 构建项目..."

# 清理旧的构建文件
rm -rf .next

# 构建项目
pnpm build

log_info "项目构建完成"

# ========================================
# 步骤6: 创建系统服务
# ========================================
log_info "步骤6: 创建系统服务..."

# 创建服务文件
cat > /etc/systemd/system/warehouse-system.service << EOF
[Unit]
Description=Warehouse Management System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$DEPLOY_DIR/$PROJECT_NAME
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd
systemctl daemon-reload

# 启动服务
systemctl enable warehouse-system
systemctl start warehouse-system

log_info "系统服务创建完成"

# ========================================
# 步骤7: 配置Nginx
# ========================================
log_info "步骤7: 配置Nginx反向代理..."

# 创建Nginx配置
cat > /etc/nginx/sites-available/warehouse-system << EOF
server {
    listen 80;
    server_name _;

    # 静态文件缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API路由
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Next.js应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/warehouse-system /etc/nginx/sites-enabled/

# 删除默认站点
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 重启Nginx
systemctl restart nginx
systemctl enable nginx

log_info "Nginx配置完成"

# ========================================
# 步骤8: 配置防火墙
# ========================================
log_info "步骤8: 配置防火墙..."

# 允许HTTP和HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 启用防火墙（如果未启用）
ufw --force enable

log_info "防火墙配置完成"

# ========================================
# 步骤9: 验证部署
# ========================================
log_info "步骤9: 验证部署..."

# 等待服务启动
sleep 10

# 检查服务状态
if systemctl is-active --quiet warehouse-system; then
    log_info "✅ 应用服务运行正常"
else
    log_error "❌ 应用服务启动失败"
    systemctl status warehouse-system
fi

# 检查Nginx状态
if systemctl is-active --quiet nginx; then
    log_info "✅ Nginx服务运行正常"
else
    log_error "❌ Nginx服务启动失败"
    systemctl status nginx
fi

# 检查网站访问
if curl -f http://localhost > /dev/null 2>&1; then
    log_info "✅ 网站访问正常"
else
    log_warn "⚠️ 网站访问检查失败，请稍后手动验证"
fi

echo ""
echo "========================================"
echo "🎉 部署完成！"
echo "========================================"
echo ""
echo "🌐 网站地址: http://47.109.159.143"
echo "🔧 管理后台: http://47.109.159.143/admin"
echo "📊 API地址: http://47.109.159.143/api"
echo ""
echo "🔑 默认登录信息:"
echo "   用户名: admin"
echo "   密码: 123456"
echo ""
echo "📝 查看服务状态:"
echo "   systemctl status warehouse-system"
echo "   systemctl status nginx"
echo ""
echo "🔄 重启服务:"
echo "   systemctl restart warehouse-system"
echo "   systemctl restart nginx"
echo ""
echo "📜 查看日志:"
echo "   journalctl -u warehouse-system -f"
echo ""
echo "========================================"