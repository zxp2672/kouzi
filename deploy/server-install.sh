#!/bin/bash
# 库房管理系统 - 服务器端部署脚本
# 此脚本会从 GitHub 下载源码并部署

set -e

echo "=========================================="
echo "库房管理系统 - 服务器部署"
echo "=========================================="
echo ""

# 配置
REPO_URL="https://github.com/zxp2672/kouzi"
INSTALL_DIR="/opt/warehouse-system"
SERVICE_NAME="warehouse-system"

# 检查权限
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 root 权限运行此脚本"
    echo "   sudo $0"
    exit 1
fi

# 检查系统
check_system() {
    echo "检查系统环境..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo "正在安装 Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
        echo "✓ Node.js 安装完成"
    fi
    
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "❌ Node.js 版本过低: $(node -v)"
        echo "需要 Node.js 18 或更高版本"
        exit 1
    fi
    
    echo "✓ Node.js 版本: $(node -v)"
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "正在安装 pnpm..."
        npm install -g pnpm
        echo "✓ pnpm 安装完成"
    else
        echo "✓ pnpm 版本: $(pnpm -v)"
    fi
    
    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        echo "正在安装 PM2..."
        npm install -g pm2
        echo "✓ PM2 安装完成"
    else
        echo "✓ PM2 版本: $(pm2 -v)"
    fi
    
    echo ""
}

# 下载源码
download_source() {
    echo "下载源码..."
    
    if [ -d "$INSTALL_DIR" ]; then
        echo "发现已存在的安装目录"
        read -p "是否覆盖？(y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "取消部署"
            exit 1
        fi
        rm -rf "$INSTALL_DIR"
    fi
    
    mkdir -p "$INSTALL_DIR"
    
    # 下载源码
    echo "正在从 GitHub 下载..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    
    echo "✓ 源码下载完成"
    echo ""
}

# 安装依赖和构建
build_project() {
    echo "安装依赖和构建..."
    
    cd "$INSTALL_DIR"
    
    # 安装依赖
    echo "安装依赖..."
    pnpm install
    echo "✓ 依赖安装完成"
    
    # 构建
    echo "构建项目..."
    pnpm build
    echo "✓ 构建完成"
    
    echo ""
}

# 配置服务
setup_service() {
    echo "配置服务..."
    
    cd "$INSTALL_DIR"
    
    # 创建环境变量文件
    if [ ! -f ".env" ]; then
        cp deploy/.env.example .env
        echo "✓ 已创建环境变量文件"
    fi
    
    # 使用 PM2 启动服务
    echo "启动服务..."
    pm2 delete $SERVICE_NAME 2>/dev/null || true
    pm2 start pnpm --name "$SERVICE_NAME" -- start
    pm2 save
    pm2 startup
    
    echo "✓ 服务配置完成"
    echo ""
}

# 显示完成信息
show_info() {
    echo "=========================================="
    echo "部署完成！"
    echo "=========================================="
    echo ""
    echo "服务信息:"
    echo "  - 安装目录: $INSTALL_DIR"
    echo "  - 访问地址: http://localhost:5000"
    echo "  - 默认用户: admin"
    echo "  - 默认密码: admin123"
    echo ""
    echo "管理命令:"
    echo "  - 查看状态: pm2 status"
    echo "  - 查看日志: pm2 logs $SERVICE_NAME"
    echo "  - 重启服务: pm2 restart $SERVICE_NAME"
    echo "  - 停止服务: pm2 stop $SERVICE_NAME"
    echo ""
    echo "Nginx 配置（可选）:"
    echo "  cat $INSTALL_DIR/deploy/README.md"
    echo ""
    echo "=========================================="
}

# 主函数
main() {
    check_system
    download_source
    build_project
    setup_service
    show_info
}

# 执行主函数
main
