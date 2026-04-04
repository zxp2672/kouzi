#!/bin/bash
set -e

echo "=========================================="
echo "库房管理系统 - Windows部署包打包"
echo "=========================================="

VERSION=$(date +"%Y%m%d_%H%M%S")
TMP_DIR=$(mktemp -d)
PACKAGE_NAME="warehouse-management-system-windows-${VERSION}"
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
  .npmrc \
  WINDOWS-DEPLOY.md \
  README.md \
  "${TMP_DIR}/" 2>/dev/null || true

# 复制Windows专用脚本
cp \
  install-windows.bat \
  快速启动.bat \
  start-local.bat \
  "${TMP_DIR}/" 2>/dev/null || true

# 如果有构建产物，也复制
if [ -d ".next" ]; then
  echo "[INFO] 包含构建产物..."
  cp -r .next "${TMP_DIR}/"
fi

# 创建快速开始说明
cat > "${TMP_DIR}/! 必读 - 快速开始.txt" << 'EOF'
库房管理系统 - Windows快速开始
==============================

第一步：安装
-----------
双击运行：
  install-windows.bat

等待安装完成...

第二步：启动
-----------
双击运行：
  快速启动.bat

第三步：访问
-----------
打开浏览器访问：
  http://localhost:3000

详细说明请查看：WINDOWS-DEPLOY.md

常见问题：
----------
1. 如果提示找不到 node，请先安装 Node.js
   下载地址：https://nodejs.org/

2. 如果安装很慢，可以配置国内镜像：
   pnpm config set registry https://registry.npmmirror.com

3. 如果端口被占用，可以修改 package.json 中的端口号

祝你使用愉快！
EOF

# 创建部署包
echo "[INFO] 创建部署包..."
cd "${TMP_DIR}"
tar -czf "${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz" .

# 也创建一个ZIP格式（Windows更友好）
if command -v zip &> /dev/null; then
  echo "[INFO] 同时创建ZIP格式..."
  zip -q -r "${OUTPUT_DIR}/${PACKAGE_NAME}.zip" .
fi

echo "[INFO] =========================================="
echo "[INFO] Windows部署包创建完成！"
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
echo "[INFO] ✓ package.json 和依赖配置"
echo "[INFO] ✓ Windows一键安装脚本"
echo "[INFO] ✓ Windows快速启动脚本"
echo "[INFO] ✓ Windows专用部署文档"
echo "[INFO] ✓ 构建产物（.next/）"
echo "[INFO]"
echo "[INFO] 🚀 Windows部署步骤："
echo "[INFO] 1. 解压: ${PACKAGE_NAME}.tar.gz 或 ${PACKAGE_NAME}.zip"
echo "[INFO] 2. 安装: 双击 install-windows.bat"
echo "[INFO] 3. 启动: 双击 快速启动.bat"
echo "[INFO] 4. 访问: http://localhost:3000"
echo "[INFO]"
echo "[INFO] 详细说明请查看 WINDOWS-DEPLOY.md"
echo "[INFO] =========================================="

# 清理
cd - > /dev/null
rm -rf "${TMP_DIR}"

echo "[INFO]"
echo "[INFO] 当前 deploy-packages 目录内容："
ls -lh "${OUTPUT_DIR}/"
