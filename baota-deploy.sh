#!/bin/bash
# 库房管理系统 - 宝塔面板一键部署脚本

set -e

echo "====================================="
echo "  库房管理系统 - 宝塔面板部署"
echo "====================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用root用户运行此脚本"
    echo "   运行: sudo bash baota-deploy.sh"
    exit 1
fi

# 配置变量
APP_NAME="kouzi"
APP_DIR="/www/wwwroot/kouzi"
APP_PORT=3000
NODE_VERSION="20"

echo "📦 1. 安装Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js已安装: $(node -v)"
else
    # 使用宝塔面板安装Node.js
    echo "正在安装Node.js $NODE_VERSION..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
    echo "✅ Node.js安装完成: $(node -v)"
fi

echo ""
echo "📦 2. 安装pnpm..."
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm已安装: $(pnpm -v)"
else
    npm install -g pnpm
    echo "✅ pnpm安装完成: $(pnpm -v)"
fi

echo ""
echo "📦 3. 创建应用目录..."
mkdir -p $APP_DIR
cd $APP_DIR

echo ""
echo "📥 4. 从GitHub拉取代码..."
if [ -d ".git" ]; then
    echo "检测到已有代码，正在更新..."
    git pull origin main
else
    git clone https://github.com/zxp2672/kouzi.git .
fi

echo ""
echo "📦 5. 安装依赖..."
pnpm install

echo ""
echo "🔨 6. 构建项目..."
pnpm build

echo ""
echo "🔨 7. 安装PM2..."
if command -v pm2 &> /dev/null; then
    echo "✅ PM2已安装"
else
    npm install -g pm2
    echo "✅ PM2安装完成"
fi

echo ""
echo "🚀 8. 启动应用..."
# 停止旧进程
pm2 delete $APP_NAME 2>/dev/null || true

# 启动新进程
pm2 start npm --name "$APP_NAME" -- start

# 保存PM2配置
pm2 save
pm2 startup

echo ""
echo "🌐 9. 配置Nginx反向代理..."

NGINX_CONF="/www/server/panel/vhost/nginx/kouzi.conf"
cat > $NGINX_CONF << 'EOF'
server {
    listen 80;
    server_name _;  # 改为您的域名
    
    # 日志配置
    access_log /www/wwwlogs/kouzi-access.log;
    error_log /www/wwwlogs/kouzi-error.log;
    
    # 反向代理配置
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
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 重载Nginx
nginx -t && nginx -s reload

echo ""
echo "====================================="
echo "  ✅ 部署完成！"
echo "====================================="
echo ""
echo "📊 应用信息:"
echo "  应用目录: $APP_DIR"
echo "  运行端口: $APP_PORT"
echo "  进程管理: PM2"
echo ""
echo "🌐 访问地址:"
echo "  http://您的服务器IP"
echo ""
echo "📝 常用命令:"
echo "  查看日志: pm2 logs $APP_NAME"
echo "  重启应用: pm2 restart $APP_NAME"
echo "  停止应用: pm2 stop $APP_NAME"
echo "  查看状态: pm2 status"
echo ""
echo "⚠️  下一步:"
echo "  1. 在宝塔面板配置域名解析"
echo "  2. 配置SSL证书（可选）"
echo "  3. 配置Supabase环境变量"
echo ""
