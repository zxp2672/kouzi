#!/bin/bash
set -e

echo "=========================================="
echo "库房管理系统 - 最终服务器部署打包"
echo "=========================================="

VERSION=$(date +"%Y%m%d_%H%M%S")
TMP_DIR=$(mktemp -d)
PACKAGE_NAME="warehouse-management-system-deploy-${VERSION}"
OUTPUT_DIR="$(pwd)/deploy-packages"

echo "[INFO] 使用已有的构建产物..."
echo "[INFO] 临时目录: ${TMP_DIR}"
echo "[INFO] 包名: ${PACKAGE_NAME}"

mkdir -p "${OUTPUT_DIR}"

# 复制项目文件
echo "[INFO] 复制项目文件..."
cp -r \
  package.json \
  pnpm-lock.yaml \
  .next \
  public \
  next.config.ts \
  tsconfig.json \
  DEPLOYMENT.md \
  NGINX-DEPLOY.md \
  README-DEPLOY.md \
  TROUBLESHOOTING-403.md \
  Dockerfile \
  docker-compose.yml \
  nginx \
  start-local.sh \
  start-local.bat \
  "${TMP_DIR}/" 2>/dev/null || true

# 创建目录结构
mkdir -p "${TMP_DIR}/src/app"

# 复制基本页面（可选，主要用于调试）
cp -r src/app/page.tsx "${TMP_DIR}/src/app/" 2>/dev/null || true

# 创建部署说明
cat > "${TMP_DIR}/README-DEPLOY.txt" << 'EOF'
库房管理系统 - 服务器部署包
============================

部署方式1: 使用 pm2 (推荐)
----------------------------
1. 上传此包到服务器
2. 解压: tar -xzf warehouse-management-system-deploy-*.tar.gz
3. 安装依赖: pnpm install --prod
4. 启动服务: pm2 start npm --name "warehouse-system" -- start
5. 查看日志: pm2 logs warehouse-system

部署方式2: 使用 Docker
-----------------------
1. 上传此包到服务器
2. 解压: tar -xzf warehouse-management-system-deploy-*.tar.gz
3. 构建镜像: docker build -t warehouse-system .
4. 启动容器: docker-compose up -d

部署方式3: 使用 Nginx (反向代理)
---------------------------------
参考 NGINX-DEPLOY.md 详细文档

系统配置
--------
- 默认端口: 3000
- 数据存储: localStorage (浏览器本地)
- 环境: 生产环境

EOF

# 创建部署包
echo "[INFO] 创建部署包..."
cd "${TMP_DIR}"
tar -czf "${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz" .

echo "[INFO] =========================================="
echo "[INFO] 最终服务器部署包创建完成！"
echo "[INFO] =========================================="
echo "[INFO] 版本: ${VERSION}"
echo "[INFO] 文件: ${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz"
echo "[INFO] 大小: $(du -h "${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz" | cut -f1)"
echo "[INFO]"
echo "[INFO] 📦 包含内容："
echo "[INFO] ✓ .next/ - Next.js 构建产物"
echo "[INFO] ✓ public/ - 静态资源"
echo "[INFO] ✓ package.json - 项目依赖"
echo "[INFO] ✓ Docker 配置文件"
echo "[INFO] ✓ Nginx 配置文件"
echo "[INFO] ✓ 完整部署文档"
echo "[INFO]"
echo "[INFO] 🚀 快速部署步骤 (服务器)："
echo "[INFO] 1. 上传: ${PACKAGE_NAME}.tar.gz 到服务器"
echo "[INFO] 2. 解压: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "[INFO] 3. 安装: pnpm install --prod"
echo "[INFO] 4. 启动: pnpm start"
echo "[INFO] 5. 访问: http://your-server-ip:3000"
echo "[INFO]"
echo "[INFO] 详细说明请查看 README-DEPLOY.txt"
echo "[INFO] =========================================="

# 清理
cd - > /dev/null
rm -rf "${TMP_DIR}"

echo "[INFO]"
echo "[INFO] 当前 deploy-packages 目录内容："
ls -lh "${OUTPUT_DIR}/"
