#!/bin/bash
set -e

echo "=========================================="
echo "库房管理系统 - 本地部署专用打包"
echo "=========================================="

# 配置
PROJECT_NAME="warehouse-management-system"
VERSION=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="deploy-packages"
PACKAGE_NAME="${PROJECT_NAME}-local-${VERSION}.tar.gz"

# 颜色输出
GREEN='\033[0;32m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# 清理旧的打包
print_info "清理旧文件..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# 创建临时目录
TEMP_DIR=$(mktemp -d)
print_info "临时目录: $TEMP_DIR"

# 创建项目目录
mkdir -p "$TEMP_DIR/$PROJECT_NAME"

print_info "复制项目文件..."

# 使用 tar 来复制所有文件，排除不需要的
cd /workspace/projects
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='deploy-packages' \
    --exclude='*.log' \
    --exclude='.cozeproj' \
    --exclude='.coze' \
    --exclude='.DS_Store' \
    -cf - . | (cd "$TEMP_DIR/$PROJECT_NAME" && tar -xf -)

# 回到临时目录
cd "$TEMP_DIR"

print_info "创建部署包..."
tar -czf "$PACKAGE_NAME" "$PROJECT_NAME"

# 移动到输出目录
mv "$TEMP_DIR/$PACKAGE_NAME" "/workspace/projects/$OUTPUT_DIR/"

# 清理临时目录
rm -rf "$TEMP_DIR"

# 回到项目目录
cd /workspace/projects

# 获取文件大小
PACKAGE_SIZE=$(du -h "$OUTPUT_DIR/$PACKAGE_NAME" | cut -f1)

print_info "=========================================="
print_info "本地部署包创建完成！"
print_info "=========================================="
print_info "版本: $VERSION"
print_info "文件: $OUTPUT_DIR/$PACKAGE_NAME"
print_info "大小: $PACKAGE_SIZE"
print_info ""
print_info "📦 包含的本地部署文件："
print_info "✓ LOCAL-DEPLOY.md - 本地部署完整指南"
print_info "✓ start-local.sh - Mac/Linux 快速启动脚本"
print_info "✓ start-local.bat - Windows 快速启动脚本"
print_info "✓ 完整项目源代码"
print_info ""
print_info "🚀 本地运行步骤："
print_info "1. 解压: tar -xzf $PACKAGE_NAME"
print_info "2. 进入目录: cd $PROJECT_NAME"
print_info "3. 运行: ./start-local.sh (Mac/Linux)"
print_info "   或: start-local.bat (Windows)"
print_info "4. 访问: http://localhost:3000"
print_info ""
print_info "详细说明请查看 LOCAL-DEPLOY.md"
print_info "=========================================="

# 显示输出目录内容
ls -lh "$OUTPUT_DIR/"

# 检查包内容
print_info ""
print_info "包内容预览（前45个文件）："
tar -tzf "$OUTPUT_DIR/$PACKAGE_NAME" | head -45
