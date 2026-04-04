#!/bin/bash
set -e

echo "=========================================="
echo "库房管理系统 - 完整项目打包"
echo "=========================================="

# 配置
PROJECT_NAME="warehouse-management-system"
VERSION=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="deploy-packages"
PACKAGE_NAME="${PROJECT_NAME}-full-${VERSION}.tar.gz"

# 颜色输出
GREEN='\033[0;32m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# 清理旧的构建和打包
print_info "清理旧文件..."
rm -rf .next
rm -rf dist
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# 创建临时目录
TEMP_DIR=$(mktemp -d)
print_info "临时目录: $TEMP_DIR"

# 复制项目文件（排除不必要的文件）
print_info "复制项目文件..."
rsync -av --progress \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='deploy-packages' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='.cozeproj' \
    --exclude='.coze' \
    ./ "$TEMP_DIR/$PROJECT_NAME/"

# 进入临时目录创建压缩包
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
print_info "包含内容："
print_info "✓ 完整项目源码"
print_info "✓ package.json 和依赖配置"
print_info "✓ Docker 配置文件"
print_info "✓ 部署文档"
print_info "✓ 所有组件和页面"
print_info ""
print_info "部署步骤："
print_info "1. 将 $PACKAGE_NAME 上传到服务器"
print_info "2. 解压: tar -xzf $PACKAGE_NAME"
print_info "3. 进入目录: cd $PROJECT_NAME"
print_info "4. 查看 DEPLOYMENT.md 了解详细部署"
print_info "=========================================="

# 显示输出目录内容
ls -lh "$OUTPUT_DIR/"
