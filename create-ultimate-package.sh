#!/bin/bash
set -e

echo "=========================================="
echo "库房管理系统 - 终极一键部署包"
echo "=========================================="

VERSION=$(date +"%Y%m%d_%H%M%S")
TMP_DIR=$(mktemp -d)
PACKAGE_NAME="warehouse-management-system-ultimate-${VERSION}"
OUTPUT_DIR="$(pwd)/deploy-packages"

echo "[INFO] 版本: ${VERSION}"
echo "[INFO] 临时目录: ${TMP_DIR}"
echo "[INFO] 包名: ${PACKAGE_NAME}"

mkdir -p "${OUTPUT_DIR}"

# 复制项目文件
echo "[INFO] 复制项目文件..."
cp -r \
  package.json \
  pnpm-lock.yaml \
  next.config.ts \
  tsconfig.json \
  public \
  src \
  scripts \
  .npmrc \
  README.md \
  DEPLOYMENT.md \
  WINDOWS-DEPLOY.md \
  LOCAL-DEPLOY.md \
  NGINX-DEPLOY.md \
  TROUBLESHOOTING-403.md \
  "${TMP_DIR}/" 2>/dev/null || true

# 复制所有一键部署脚本
echo "[INFO] 复制部署脚本..."
cp \
  一键部署.bat \
  一键部署.ps1 \
  一键部署.sh \
  一键部署-修复版.sh \
  解除阻止.bat \
  install-windows.bat \
  快速启动.bat \
  start-local.bat \
  start-local.sh \
  nginx \
  Dockerfile \
  docker-compose.yml \
  Windows安全问题解决方案.md \
  "${TMP_DIR}/" 2>/dev/null || true

# 如果有构建产物，也复制
if [ -d ".next" ]; then
  echo "[INFO] 包含构建产物..."
  cp -r .next "${TMP_DIR}/"
fi

# 创建终极快速开始指南
cat > "${TMP_DIR}/! 必读 - 终极快速开始.txt" << 'EOF'
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           库房管理系统 - 终极一键部署包                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

📋 目录：
  1. Windows 系统部署（最重要）
  2. Linux 系统部署
  3. Docker 部署
  4. 常见问题

══════════════════════════════════════════════════════════════
第1部分：Windows 系统部署（最重要）
══════════════════════════════════════════════════════════════

⚠️  重要：如果提示"此文件已被阻止"
-----------------------------------
请先运行：解除阻止.bat
或者查看：Windows安全问题解决方案.md

方式一：超级一键部署（推荐新手）
----------------------------------
1. 如果被阻止，先运行：解除阻止.bat
2. 双击运行：一键部署.bat（或一键部署.ps1）
3. 等待 5-15 分钟，完全自动化
4. 完成后会自动打开管理工具
5. 访问：http://localhost:3000

方式二：快速安装（推荐有经验）
--------------------------------
1. 双击运行：install-windows.bat
2. 安装完成后双击：快速启动.bat
3. 访问：http://localhost:3000

方式三：手动启动
----------------
1. 安装 Node.js: https://nodejs.org/
2. 打开命令行，进入项目目录
3. 运行: pnpm install
4. 运行: pnpm build
5. 运行: pnpm start
6. 访问：http://localhost:3000

══════════════════════════════════════════════════════════════
第2部分：Linux 系统部署
══════════════════════════════════════════════════════════════

方式一：超级一键部署（推荐）
------------------------------
1. 上传此包到服务器
2. 解压: tar -xzf warehouse-management-system-ultimate-*.tar.gz
3. 运行: chmod +x 一键部署.sh
4. 运行: ./一键部署.sh
5. 访问：http://localhost:3000

方式二：使用 PM2 部署（推荐生产环境）
----------------------------------------
1. 安装 Node.js 和 pnpm
2. 运行: pnpm install
3. 运行: pnpm build
4. 安装 PM2: npm install -g pm2
5. 启动: pm2 start npm --name "warehouse" -- start
6. 保存: pm2 save
7. 自启: pm2 startup
8. 访问：http://localhost:3000

══════════════════════════════════════════════════════════════
第3部分：Docker 部署
══════════════════════════════════════════════════════════════

快速开始：
1. 安装 Docker 和 Docker Compose
2. 运行: docker-compose up -d
3. 访问：http://localhost:3000

详细说明请查看 DEPLOYMENT.md

══════════════════════════════════════════════════════════════
第4部分：常见问题
══════════════════════════════════════════════════════════════

Q: 部署需要多长时间？
A: 5-15 分钟，取决于网络速度和机器配置

Q: 需要数据库吗？
A: 不需要！数据存储在浏览器 localStorage 中

Q: 如何修改端口？
A: 编辑 package.json 中的 start 脚本

Q: 数据会丢失吗？
A: 不会，存储在浏览器中，刷新页面不丢失

Q: 更多问题？
A: 查看 WINDOWS-DEPLOY.md 或 DEPLOYMENT.md

══════════════════════════════════════════════════════════════

🎯 现在开始：

Windows用户：双击 "一键部署.bat"
Linux用户：运行 "./一键部署.sh"

祝你使用愉快！
EOF

# 创建部署完成提示脚本
cat > "${TMP_DIR}/部署完成说明.bat" << 'EOF'
@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           库房管理系统 - 部署说明                          ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📦 这是库房管理系统的终极一键部署包
echo.
echo 🎯 选择你的系统：
echo.
echo   [Windows 用户]
echo     双击运行：一键部署.bat
echo.
echo   [Linux 用户]
echo     运行命令：./一键部署.sh
echo.
echo 📖 详细说明：
echo   查看 "! 必读 - 终极快速开始.txt"
echo.
echo 🌐 部署完成后访问：
echo   http://localhost:3000
echo.
pause
EOF

# 创建部署包
echo "[INFO] 创建终极部署包..."
cd "${TMP_DIR}"
tar -czf "${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz" .

# 同时创建ZIP格式
if command -v zip &> /dev/null; then
  echo "[INFO] 同时创建ZIP格式..."
  zip -q -r "${OUTPUT_DIR}/${PACKAGE_NAME}.zip" .
fi

echo "[INFO] =========================================="
echo "[INFO] 终极一键部署包创建完成！"
echo "[INFO] =========================================="
echo "[INFO] 版本: ${VERSION}"
echo "[INFO]"
echo "[INFO] 📦 生成的文件："

cd "${OUTPUT_DIR}"
for file in ${PACKAGE_NAME}.*; do
  if [ -f "$file" ]; then
    SIZE=$(du -h "$file" | cut -f1)
    echo "[INFO] ✓ $file ($SIZE)"
  fi
done

echo "[INFO]"
echo "[INFO] 📋 包含内容："
echo "[INFO] ✓ 完整项目源代码"
echo "[INFO] ✓ 预构建的生产产物 (.next/)"
echo "[INFO] ✓ Windows 超级一键部署脚本"
echo "[INFO] ✓ Linux 超级一键部署脚本"
echo "[INFO] ✓ Windows 安装脚本"
echo "[INFO] ✓ Docker 配置文件"
echo "[INFO] ✓ Nginx 配置文件"
echo "[INFO] ✓ 完整部署文档"
echo "[INFO]"
echo "[INFO] 🚀 快速使用："
echo "[INFO] Windows: 双击 一键部署.bat"
echo "[INFO] Linux:   ./一键部署.sh"
echo "[INFO] Docker:  docker-compose up -d"
echo "[INFO]"
echo "[INFO] 详细说明请查看 ! 必读 - 终极快速开始.txt"
echo "[INFO] =========================================="

# 清理
cd - > /dev/null
rm -rf "${TMP_DIR}"

echo "[INFO]"
echo "[INFO] 当前 deploy-packages 目录内容："
ls -lh "${OUTPUT_DIR}/"
