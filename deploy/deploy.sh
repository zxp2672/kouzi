#!/bin/bash
# 库房管理系统 - 一键部署脚本

set -e

echo "=========================================="
echo "库房管理系统 - 一键部署"
echo "=========================================="
echo ""

# 检查系统
check_system() {
    echo "检查系统环境..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装"
        echo "请先安装 Node.js 18 或更高版本"
        echo "下载地址: https://nodejs.org/"
        exit 1
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
    
    echo ""
}

# 安装依赖
install_dependencies() {
    echo "安装依赖..."
    
    if [ -d "node_modules" ]; then
        echo "发现已安装的依赖，跳过安装"
    else
        pnpm install --prod
        echo "✓ 依赖安装完成"
    fi
    
    echo ""
}

# 配置环境
setup_environment() {
    echo "配置环境..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            echo "创建环境配置文件..."
            cp .env.example .env
            echo "✓ 已创建 .env 文件"
            echo "⚠️  请根据需要修改 .env 文件中的配置"
        fi
    else
        echo "✓ 环境配置文件已存在"
    fi
    
    echo ""
}

# 启动服务
start_service() {
    echo "启动服务..."
    
    export NODE_ENV=production
    export PORT=${PORT:-5000}
    
    echo ""
    echo "=========================================="
    echo "部署完成！"
    echo "=========================================="
    echo ""
    echo "服务信息:"
    echo "  - 访问地址: http://localhost:$PORT"
    echo "  - 默认用户: admin"
    echo "  - 默认密码: admin123"
    echo ""
    echo "管理命令:"
    echo "  - 启动服务: pnpm start"
    echo "  - 停止服务: Ctrl+C"
    echo "  - 查看日志: tail -f logs/app.log"
    echo ""
    echo "=========================================="
    echo ""
    
    # 启动
    pnpm start
}

# 主函数
main() {
    check_system
    install_dependencies
    setup_environment
    start_service
}

# 执行主函数
main
