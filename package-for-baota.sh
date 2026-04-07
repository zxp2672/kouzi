#!/bin/bash

# 库房管理系统 - Linux/Mac 打包上传脚本（宝塔面板版）
# 使用方法：
# chmod +x package-for-baota.sh
# ./package-for-baota.sh

set -e

echo "======================================"
echo "  库房管理系统 - 打包上传脚本（宝塔面板）"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_NAME="warehouse-system"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="${PROJECT_NAME}_${TIMESTAMP}.tar.gz"
TEMP_DIR=$(mktemp -d)
SOURCE_DIR=$(pwd)

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误：请在项目根目录运行此脚本${NC}"
    echo -e "当前目录: ${SOURCE_DIR}"
    exit 1
fi

echo -e "${GREEN}正在打包项目...${NC}"
echo -e "源目录: ${SOURCE_DIR}"
echo ""

# 创建临时目录
DEST_DIR="$TEMP_DIR/$PROJECT_NAME"
mkdir -p "$DEST_DIR"

# 复制文件（排除不需要的目录）
echo -e "${YELLOW}正在复制项目文件...${NC}"

# 使用 rsync 复制文件，排除不需要的目录和文件
rsync -av \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='.vscode' \
    --exclude='.qoder' \
    --exclude='deploy' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='.env.*.local' \
    --exclude='*.log' \
    ./ "$DEST_DIR/"

# 统计文件数量
FILE_COUNT=$(find "$DEST_DIR" -type f | wc -l)
echo -e "  已复制 ${FILE_COUNT} 个文件"
echo ""

# 创建压缩包
echo -e "${YELLOW}正在创建压缩包...${NC}"

cd "$TEMP_DIR"
tar -czf "$PACKAGE_NAME" "$PROJECT_NAME"

# 移动压缩包到源目录
mv "$PACKAGE_NAME" "$SOURCE_DIR/"

# 清理临时目录
cd "$SOURCE_DIR"
rm -rf "$TEMP_DIR"

# 显示结果
echo ""
echo -e "${GREEN}======================================"
echo -e "  打包完成！"
echo -e "======================================${NC}"
echo ""
echo -e "文件位置: ${SOURCE_DIR}/${PACKAGE_NAME}"
echo -e "文件大小: $(du -h "${PACKAGE_NAME}" | cut -f1)"
echo ""

# 询问是否上传
echo -e "${BLUE}======================================"
echo -e "  上传到服务器"
echo -e "======================================${NC}"
echo ""

read -p "是否现在上传到服务器？(y/n): " UPLOAD

if [ "$UPLOAD" = "y" ] || [ "$UPLOAD" = "Y" ]; then
    echo ""
    read -p "服务器 IP 地址: " SERVER_IP
    read -p "服务器用户名 [默认: root]: " SERVER_USER
    if [ -z "$SERVER_USER" ]; then
        SERVER_USER="root"
    fi
    read -p "SSH 端口 [默认: 22]: " SERVER_PORT
    if [ -z "$SERVER_PORT" ]; then
        SERVER_PORT="22"
    fi
    
    echo ""
    echo -e "${GREEN}正在上传到服务器...${NC}"
    echo -e "${YELLOW}提示：首次连接需要输入服务器密码${NC}"
    echo ""
    
    # 上传文件
    scp -P "$SERVER_PORT" "${PACKAGE_NAME}" "${SERVER_USER}@${SERVER_IP}:/www/wwwroot/"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}上传完成！${NC}"
        echo ""
        echo -e "${BLUE}======================================"
        echo -e "  下一步操作"
        echo -e "======================================${NC}"
        echo ""
        echo -e "${YELLOW}1. SSH 登录服务器:${NC}"
        echo -e "   ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP}"
        echo ""
        echo -e "${YELLOW}2. 解压文件:${NC}"
        echo -e "   cd /www/wwwroot"
        echo -e "   tar -xzf ${PACKAGE_NAME}"
        echo ""
        echo -e "${YELLOW}3. 运行部署脚本:${NC}"
        echo -e "   cd ${PROJECT_NAME}"
        echo -e "   chmod +x baota-deploy.sh"
        echo -e "   sudo ./baota-deploy.sh"
        echo ""
        echo -e "${YELLOW}4. 在宝塔面板配置反向代理（部署脚本会提供详细指引）${NC}"
        echo ""
    else
        echo ""
        echo -e "${RED}上传失败，请手动上传${NC}"
        echo ""
        echo -e "手动上传命令："
        echo -e "scp -P ${SERVER_PORT} ${PACKAGE_NAME} ${SERVER_USER}@${SERVER_IP}:/www/wwwroot/"
    fi
else
    echo -e "${YELLOW}跳过上传步骤${NC}"
    echo ""
    echo -e "${BLUE}======================================"
    echo -e "  手动上传指引"
    echo -e "======================================${NC}"
    echo ""
    echo -e "${YELLOW}方法一：使用宝塔面板文件管理器${NC}"
    echo "  1. 登录宝塔面板"
    echo "  2. 点击 '文件' 菜单"
    echo "  3. 进入 /www/wwwroot 目录"
    echo "  4. 点击 '上传' 按钮"
    echo "  5. 选择文件: ${PACKAGE_NAME}"
    echo "  6. 上传完成后右键解压"
    echo ""
    echo -e "${YELLOW}方法二：使用命令行上传${NC}"
    echo "  scp -P 22 ${PACKAGE_NAME} root@你的服务器IP:/www/wwwroot/"
    echo ""
    echo -e "${YELLOW}在服务器上执行：${NC}"
    echo "  cd /www/wwwroot"
    echo "  tar -xzf ${PACKAGE_NAME}"
    echo "  cd ${PROJECT_NAME}"
    echo "  chmod +x baota-deploy.sh"
    echo "  sudo ./baota-deploy.sh"
    echo ""
fi

echo -e "${GREEN}完成！${NC}"
echo ""
