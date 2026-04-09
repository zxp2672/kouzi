$server = "admin@47.109.159.143"
$password = "Swj121648."

# 使用ssh执行命令
$commands = @'
cd /var/www/html
echo "===== 拉取代码 ====="
git pull origin main
echo "===== 安装依赖 ====="
pnpm install
echo "===== 构建项目 ====="
pnpm build
echo "===== 重启应用 ====="
pm2 restart kouzi
sleep 3
echo "===== 检查状态 ====="
pm2 status
echo "===== 部署完成 ====="
'@

# 执行SSH命令
echo $commands | ssh $server
