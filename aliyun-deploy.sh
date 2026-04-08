#!/bin/bash
# 库房管理系统 - 阿里云服务器部署脚本
# 用途：在阿里云服务器上运行，自动安装依赖并启动服务

set -e

echo "========================================"
echo "  库房管理系统 - 阿里云部署"
echo "========================================"
echo ""

# 检查root权限
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用 root 用户运行此脚本"
    echo "   sudo bash aliyun-deploy.sh"
    exit 1
fi

# 部署目录
DEPLOY_DIR="/opt/warehouse-system"
APP_NAME="warehouse-system"

echo "📋 部署信息："
echo "  部署目录: $DEPLOY_DIR"
echo "  应用名称: $APP_NAME"
echo ""

# 交互式配置
read -p "请输入服务器公网IP (例如: 47.100.123.456): " SERVER_IP
read -p "请输入域名 (可选，直接回车跳过): " DOMAIN_NAME
read -p "请输入服务端口 (默认: 3000): " PORT
PORT=${PORT:-3000}

echo ""
echo "========================================"
echo "  第一步：安装系统依赖"
echo "========================================"
echo ""

# 更新系统
echo "更新系统包..."
apt update -y

# 安装必要工具
echo "安装必要工具..."
apt install -y curl wget git nginx certbot python3-certbot-nginx

# 安装 Node.js 20
echo "安装 Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 pnpm
echo "安装 pnpm..."
npm install -g pnpm

# 验证安装
echo ""
echo "✓ Node.js 版本: $(node -v)"
echo "✓ pnpm 版本: $(pnpm -v)"
echo "✓ Nginx 版本: $(nginx -v 2>&1 | cut -d'/' -f2)"
echo ""

echo "========================================"
echo "  第二步：部署应用"
echo "========================================"
echo ""

# 创建部署目录
echo "创建部署目录..."
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# 如果已经有代码，跳过解压
if [ ! -f "package.json" ]; then
    echo "请将打包文件上传到 /root/ 目录"
    echo "然后运行: cp /root/warehouse-system_*.tar.gz $DEPLOY_DIR/"
    echo "然后运行: tar -xzf warehouse-system_*.tar.gz"
    echo ""
    read -p "按回车继续（确保已解压项目文件）..."
fi

# 安装依赖
echo "安装项目依赖..."
pnpm install --frozen-lockfile

# 创建 .env 文件
echo ""
echo "========================================"
echo "  第三步：配置环境变量"
echo "========================================"
echo ""

cat > .env << EOF
# 数据库配置（腾讯云PostgreSQL）
DB_HOST=cd-postgres-gu24c63s.sql.tencentcdb.com
DB_PORT=21021
DB_NAME=warehouse_db
DB_USER=zxp2672
DB_PASSWORD=Swj121648.

# 应用配置
NODE_ENV=production
PORT=$PORT
EOF

echo "✅ 环境变量已配置"
echo ""

# 构建项目
echo "========================================"
echo "  第四步：构建项目"
echo "========================================"
echo ""

echo "开始构建（这可能需要几分钟）..."
pnpm build

echo ""
echo "✅ 构建完成"
echo ""

# 创建 systemd 服务
echo "========================================"
echo "  第五步：创建系统服务"
echo "========================================"
echo ""

cat > /etc/systemd/system/warehouse-system.service << EOF
[Unit]
Description=Warehouse Management System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$DEPLOY_DIR
ExecStart=$(which node) .next/standalone/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$PORT

# 日志
StandardOutput=journal
StandardError=journal
SyslogIdentifier=warehouse-system

[Install]
WantedBy=multi-user.target
EOF

# 重载systemd
systemctl daemon-reload

# 启动服务
echo "启动服务..."
systemctl enable warehouse-system
systemctl restart warehouse-system

# 等待服务启动
sleep 3

# 检查服务状态
if systemctl is-active --quiet warehouse-system; then
    echo "✅ 服务启动成功！"
    echo "   服务状态: $(systemctl is-active warehouse-system)"
else
    echo "❌ 服务启动失败，请检查日志"
    echo "   查看日志: journalctl -u warehouse-system -f"
    exit 1
fi

echo ""

# 配置Nginx
echo "========================================"
echo "  第六步：配置 Nginx 反向代理"
echo "========================================"
echo ""

if [ -n "$DOMAIN_NAME" ]; then
    echo "配置域名: $DOMAIN_NAME"
    
    cat > /etc/nginx/sites-available/warehouse-system << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    # 日志
    access_log /var/log/nginx/warehouse-access.log;
    error_log /var/log/nginx/warehouse-error.log;

    # 客户端配置
    client_max_body_size 50M;

    # 代理到 Next.js
    location / {
        proxy_pass http://127.0.0.1:$PORT;
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

    # Gzip 压缩
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
    
    # 测试Nginx配置
    nginx -t
    
    # 重载Nginx
    systemctl reload nginx
    
    echo "✅ Nginx 配置完成"
    echo ""
    
    # 配置SSL
    echo "========================================"
    echo "  第七步：配置 SSL 证书"
    echo "========================================"
    echo ""
    
    read -p "是否配置 HTTPS？(y/n): " SETUP_SSL
    if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
        echo "正在申请 Let's Encrypt 证书..."
        certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --register-unsafely-without-email
        
        echo ""
        echo "✅ SSL 证书配置完成"
        echo "   证书将自动续期（每天检查）"
    fi
else
    echo "配置IP访问: $SERVER_IP"
    
    cat > /etc/nginx/sites-available/warehouse-system << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    # 日志
    access_log /var/log/nginx/warehouse-access.log;
    error_log /var/log/nginx/warehouse-error.log;

    # 客户端配置
    client_max_body_size 50M;

    # 代理到 Next.js
    location / {
        proxy_pass http://127.0.0.1:$PORT;
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

    # Gzip 压缩
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
    
    # 测试Nginx配置
    nginx -t
    
    # 重载Nginx
    systemctl reload nginx
    
    echo "✅ Nginx 配置完成"
fi

echo ""

# 配置防火墙
echo "========================================"
echo "  第八步：配置防火墙"
echo "========================================"
echo ""

if command -v ufw &> /dev/null; then
    echo "配置 UFW 防火墙..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
    echo "✅ 防火墙规则已添加"
else
    echo "⚠️  未检测到 UFW，请手动配置阿里云安全组"
    echo "   需要开放的端口: 80, 443, 22"
fi

echo ""

# 完成
echo "========================================"
echo "  🎉 部署完成！"
echo "========================================"
echo ""

if [ -n "$DOMAIN_NAME" ]; then
    echo "访问地址: http://$DOMAIN_NAME"
    if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
        echo "HTTPS地址: https://$DOMAIN_NAME"
    fi
else
    echo "访问地址: http://$SERVER_IP:$PORT"
fi

echo ""
echo "========================================"
echo "  常用命令："
echo "========================================"
echo ""
echo "查看服务状态:   systemctl status warehouse-system"
echo "重启服务:       systemctl restart warehouse-system"
echo "查看服务日志:   journalctl -u warehouse-system -f"
echo "查看Nginx日志:  tail -f /var/log/nginx/warehouse-access.log"
echo ""
echo "========================================"
