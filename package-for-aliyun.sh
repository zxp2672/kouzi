#!/bin/bash
# 库房管理系统 - 阿里云部署打包脚本
# 用途：在本地打包项目，上传到阿里云服务器

set -e

echo "========================================"
echo "  库房管理系统 - 阿里云部署打包"
echo "========================================"
echo ""

# 检查必要工具
if ! command -v tar &> /dev/null; then
    echo "❌ 错误：需要安装 tar"
    exit 1
fi

# 项目名称
PROJECT_NAME="warehouse-system"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="${PROJECT_NAME}_${TIMESTAMP}.tar.gz"

# 打包文件列表
echo "📦 开始打包项目..."
echo ""

# 创建临时打包目录
TEMP_DIR="tmp-deploy"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 复制必要文件
echo "复制项目文件..."
rsync -av --exclude='node_modules' \
          --exclude='.next' \
          --exclude='.git' \
          --exclude='.qoder' \
          --exclude='*.md' \
          --exclude='deploy/' \
          --exclude='scripts/' \
          --exclude='nginx/' \
          --exclude='tmp-deploy' \
          --exclude='*.tar.gz' \
          ./ "$TEMP_DIR/"

# 复制部署文档
cp DEPLOYMENT-ALIYUN.md "$TEMP_DIR/" 2>/dev/null || true

# 创建压缩包
echo "创建压缩包..."
tar -czf "$PACKAGE_NAME" -C "$TEMP_DIR" .

# 清理临时目录
rm -rf "$TEMP_DIR"

# 显示包大小
PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)

echo ""
echo "✅ 打包完成！"
echo "📦 文件名: $PACKAGE_NAME"
echo "📏 大小: $PACKAGE_SIZE"
echo ""
echo "========================================"
echo "上传到阿里云服务器："
echo "========================================"
echo ""
echo "方式1：使用 scp 上传"
echo "  scp $PACKAGE_NAME root@你的服务器IP:/root/"
echo ""
echo "方式2：使用 rsync 上传"
echo "  rsync -avz $PACKAGE_NAME root@你的服务器IP:/root/"
echo ""
echo "========================================"
