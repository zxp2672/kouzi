#!/bin/bash
cd /var/www/html
echo "📥 拉取代码..."
git pull origin main
echo "📦 安装依赖..."
pnpm install
echo "🔨 构建项目..."
pnpm build
echo "🔄 重启应用..."
pm2 restart kouzi
sleep 3
echo "📊 检查状态..."
pm2 status
echo "✅ 部署完成！"
