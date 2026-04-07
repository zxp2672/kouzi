#!/bin/bash

# 项目打包脚本 - 用于上传到阿里云服务器
# 使用方法：在本地运行此脚本
# chmod +x package-for-aliyun.sh
# ./package-for-aliyun.sh

set -e

echo "======================================"
echo "  库房管理系统 - 打包上传脚本"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 获取项目名称
PROJECT_NAME="warehouse-system"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="${PROJECT_NAME}_${TIMESTAMP}.tar.gz"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误：请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${GREEN}正在打包项目...${NC}"

# 创建临时打包目录
TEMP_DIR=$(mktemp -d)
DEST_DIR="$TEMP_DIR/$PROJECT_NAME"
mkdir -p $DEST_DIR

# 复制必要文件（排除不需要的目录）
echo "复制项目文件..."
rsync -av \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='.vscode' \
    --exclude='.qoder' \
    --exclude='*.md' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='.env.*.local' \
    ./ $DEST_DIR/

# 重新包含必要的 md 文件
cp DEPLOYMENT.md $DEST_DIR/ 2>/dev/null || true
cp README.md $DEST_DIR/ 2>/dev/null || true

# 创建压缩包
echo "创建压缩包..."
cd $TEMP_DIR
tar -czf $PACKAGE_NAME $PROJECT_NAME

# 移动压缩包到当前目录
mv $PACKAGE_NAME /tmp/

# 清理临时目录
rm -rf $TEMP_DIR

echo ""
echo -e "${GREEN}打包完成！${NC}"
echo "文件位置: /tmp/$PACKAGE_NAME"
echo "文件大小: $(du -h /tmp/$PACKAGE_NAME | cut -f1)"
echo ""

# 询问是否上传
read -p "是否现在上传到服务器？(y/n): " UPLOAD
if [ "$UPLOAD" = "y" ] || [ "$UPLOAD" = "Y" ]; then
    echo ""
    read -p "服务器 IP 地址: " SERVER_IP
    read -p "服务器用户名 [默认: root]: " SERVER_USER
    if [ -z "$SERVER_USER" ]; then
        SERVER_USER="root"
    fi
    read -p "服务器部署目录 [默认: /opt]: " SERVER_DIR
    if [ -z "$SERVER_DIR" ]; then
        SERVER_DIR="/opt"
    fi
    
    echo ""
    echo -e "${GREEN}正在上传到服务器...${NC}"
    
    # 上传文件
    scp /tmp/$PACKAGE_NAME ${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}/
    
    echo ""
    echo -e "${GREEN}上传完成！${NC}"
    echo ""
    echo "下一步操作："
    echo "1. SSH 登录服务器: ssh ${SERVER_USER}@${SERVER_IP}"
    echo "2. 解压文件: cd ${SERVER_DIR} && tar -xzf ${PACKAGE_NAME}"
    echo "3. 运行部署脚本: cd ${SERVER_DIR}/${PROJECT_NAME} && sudo ./aliyun-deploy.sh"
    echo "4. 启动服务: sudo docker compose up -d --build"
    echo ""
else
    echo -e "${YELLOW}跳过上传步骤${NC}"
    echo ""
    echo "手动上传命令："
    echo "scp /tmp/$PACKAGE_NAME root@your-server-ip:/opt/"
    echo ""
    echo "在服务器上："
    echo "1. cd /opt"
    echo "2. tar -xzf $PACKAGE_NAME"
    echo "3. cd $PROJECT_NAME"
    echo "4. sudo ./aliyun-deploy.sh"
    echo "5. sudo docker compose up -d --build"
fi

# 清理
rm -f /tmp/$PACKAGE_NAME
