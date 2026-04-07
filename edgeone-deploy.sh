#!/bin/bash

# ==========================================
# 腾讯云 EdgeOne 部署脚本
# ==========================================

set -e

echo "🚀 开始部署到腾讯云 EdgeOne..."

# 1. 清理旧的构建
echo "🧹 清理旧文件..."
rm -rf .next node_modules/.cache

# 2. 安装依赖
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

# 3. 构建项目
echo "🔨 构建项目..."
pnpm build

# 4. 检查构建结果
if [ ! -d ".next" ]; then
    echo "❌ 构建失败，.next 目录不存在"
    exit 1
fi

echo "✅ 构建成功！"
echo ""
echo "📋 部署步骤："
echo "1. 登录腾讯云 EdgeOne 控制台"
echo "   https://console.cloud.tencent.com/edgeone"
echo ""
echo "2. 创建应用"
echo "   - 选择「Serverless 应用」"
echo "   - 选择框架：Next.js"
echo "   - 运行环境：Node.js 20"
echo ""
echo "3. 关联代码仓库"
echo "   - 选择 Git 仓库（GitHub/GitLab）"
echo "   - 或直接上传构建产物"
echo ""
echo "4. 配置环境变量"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - NODE_ENV=production"
echo ""
echo "5. 部署应用"
echo "   - 点击「部署」按钮"
echo "   - 等待部署完成"
echo ""
echo "🎉 部署完成后，你将获得一个 EdgeOne 分配的域名"
echo ""
echo "📖 详细文档：https://cloud.tencent.com/document/product/1542"
