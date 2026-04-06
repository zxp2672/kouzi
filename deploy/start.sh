#!/bin/bash
# 库房管理系统 - 生产环境部署脚本

echo "=========================================="
echo "库房管理系统 - 生产环境启动"
echo "=========================================="

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "错误: 需要 Node.js 18 或更高版本"
    echo "当前版本: $(node -v)"
    exit 1
fi

echo "✓ Node.js 版本: $(node -v)"

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "正在安装 pnpm..."
    npm install -g pnpm
fi

echo "✓ pnpm 版本: $(pnpm -v)"

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    pnpm install --prod
fi

# 设置环境变量
export NODE_ENV=production
export PORT=${PORT:-5000}

echo ""
echo "=========================================="
echo "启动配置:"
echo "  - 环境: 生产模式"
echo "  - 端口: $PORT"
echo "  - 访问地址: http://localhost:$PORT"
echo "=========================================="
echo ""

# 启动服务
echo "正在启动服务..."
pnpm start
