#!/bin/bash
set -e

echo "=========================================="
echo "库房管理系统 - 部署打包脚本"
echo "=========================================="

# 配置
PROJECT_NAME="warehouse-management-system"
VERSION=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="deploy-packages"
PACKAGE_NAME="${PROJECT_NAME}-${VERSION}.tar.gz"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Node.js
print_info "检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装，请先安装 Node.js 24"
    exit 1
fi
NODE_VERSION=$(node -v)
print_info "Node.js 版本: $NODE_VERSION"

# 检查 pnpm
print_info "检查 pnpm..."
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm 未安装，正在安装..."
    npm install -g pnpm
fi
PNPM_VERSION=$(pnpm -v)
print_info "pnpm 版本: $PNPM_VERSION"

# 清理旧的构建
print_info "清理旧的构建文件..."
rm -rf .next
rm -rf dist
rm -rf "$OUTPUT_DIR"

# 安装依赖
print_info "安装项目依赖..."
pnpm install

# 构建项目
print_info "构建项目..."
pnpm run build

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 复制必要文件到临时目录
print_info "准备部署文件..."
TEMP_DIR=$(mktemp -d)
mkdir -p "$TEMP_DIR/$PROJECT_NAME"

# 复制构建产物和必要文件
cp -r .next/standalone/* "$TEMP_DIR/$PROJECT_NAME/" 2>/dev/null || true
cp -r .next/static "$TEMP_DIR/$PROJECT_NAME/.next/" 2>/dev/null || true
cp -r public "$TEMP_DIR/$PROJECT_NAME/" 2>/dev/null || true
cp package.json "$TEMP_DIR/$PROJECT_NAME/"
cp pnpm-lock.yaml "$TEMP_DIR/$PROJECT_NAME/" 2>/dev/null || true
cp Dockerfile "$TEMP_DIR/$PROJECT_NAME/" 2>/dev/null || true
cp docker-compose.yml "$TEMP_DIR/$PROJECT_NAME/" 2>/dev/null || true
cp .dockerignore "$TEMP_DIR/$PROJECT_NAME/" 2>/dev/null || true
cp DEPLOYMENT.md "$TEMP_DIR/$PROJECT_NAME/" 2>/dev/null || true

# 创建版本信息文件
cat > "$TEMP_DIR/$PROJECT_NAME/VERSION.txt" << EOF
项目名称: 库房管理系统
版本: $VERSION
构建时间: $(date '+%Y-%m-%d %H:%M:%S')
Node.js 版本: $NODE_VERSION
EOF

# 打包
print_info "创建部署包..."
cd "$TEMP_DIR"
tar -czf "$PACKAGE_NAME" "$PROJECT_NAME"
cd - > /dev/null

# 移动到输出目录
mv "$TEMP_DIR/$PACKAGE_NAME" "$OUTPUT_DIR/"

# 清理临时目录
rm -rf "$TEMP_DIR"

# 获取文件大小
PACKAGE_SIZE=$(du -h "$OUTPUT_DIR/$PACKAGE_NAME" | cut -f1)

print_info "=========================================="
print_info "打包完成！"
print_info "=========================================="
print_info "版本: $VERSION"
print_info "文件: $OUTPUT_DIR/$PACKAGE_NAME"
print_info "大小: $PACKAGE_SIZE"
print_info ""
print_info "部署说明:"
print_info "1. 将 $PACKAGE_NAME 上传到服务器"
print_info "2. 解压: tar -xzf $PACKAGE_NAME"
print_info "3. 查看 DEPLOYMENT.md 了解详细部署步骤"
print_info "=========================================="

# 显示输出目录内容
ls -lh "$OUTPUT_DIR/"
