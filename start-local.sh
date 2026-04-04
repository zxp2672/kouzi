#!/bin/bash

echo "=========================================="
echo "库房管理系统 - 本地快速启动"
echo "=========================================="

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 检查 Node.js
print_info "检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装！请先安装 Node.js 24 或更高版本"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
print_info "Node.js 版本: $(node -v)"

if [ "$NODE_VERSION" -lt 24 ]; then
    print_warning "Node.js 版本较低，建议使用 24 或更高版本"
fi

# 检查 pnpm
print_info "检查 pnpm..."
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm 未安装，正在安装..."
    npm install -g pnpm
fi
print_info "pnpm 版本: $(pnpm -v)"

# 安装依赖
print_info "检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    print_info "安装项目依赖..."
    pnpm install
else
    print_info "依赖已存在，跳过安装"
fi

# 选择运行模式
echo ""
echo "请选择运行模式："
echo "1) 开发模式 (推荐，支持热更新)"
echo "2) 生产模式 (先构建再运行)"
read -p "请输入选项 (1/2，默认1): " choice

choice=${choice:-1}

case $choice in
    1)
        echo ""
        print_info "启动开发模式..."
        print_info "开发服务器将在 http://localhost:3000 启动"
        print_info "按 Ctrl+C 停止服务器"
        echo ""
        pnpm dev
        ;;
    2)
        echo ""
        print_info "构建生产版本..."
        pnpm run build
        
        echo ""
        print_info "启动生产服务器..."
        print_info "服务器将在 http://localhost:3000 启动"
        print_info "按 Ctrl+C 停止服务器"
        echo ""
        pnpm start
        ;;
    *)
        echo "无效选项，启动开发模式..."
        pnpm dev
        ;;
esac
