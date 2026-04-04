#!/bin/bash
set +e  # 不立即退出，让我们自己处理错误

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志文件
LOG_FILE="deploy-$(date +%Y%m%d_%H%M%S).log"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║           库房管理系统 - 全自动一键部署                   ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

ScriptDir="$(cd "$(dirname "$0")" && pwd)"
cd "$ScriptDir"

"库房管理系统 - Linux部署日志" | tee -a "$LOG_FILE"
"开始时间: $(date)" | tee -a "$LOG_FILE"
"" | tee -a "$LOG_FILE"

echo -e "${GREEN}[信息]${NC} 开始全自动部署..."
echo -e "${GREEN}[信息]${NC} 日志文件: $LOG_FILE"
echo ""

# ========================================
# 步骤1: 检查Node.js
# ========================================
echo -e "${BLUE}[1/8]${NC} 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[警告]${NC} 未检测到 Node.js"
    echo ""
    echo -e "${GREEN}[信息]${NC} 请先安装 Node.js (LTS版本)"
    echo "       下载地址: https://nodejs.org/"
    echo ""
    echo "       Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "       CentOS/RHEL: curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && sudo yum install -y nodejs"
    echo ""
    read -p "按回车退出"
    exit 1
fi

NODE_VER=$(node --version)
echo -e "${GREEN}[成功]${NC} Node.js 版本: $NODE_VER"
echo "[1/8] Node.js: $NODE_VER" | tee -a "$LOG_FILE"
echo ""

# ========================================
# 步骤2: 检查pnpm
# ========================================
echo -e "${BLUE}[2/8]${NC} 检查 pnpm 包管理器..."
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}[提示]${NC} 未检测到 pnpm，正在安装..."
    npm install -g pnpm
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}[提示]${NC} 尝试使用淘宝镜像..."
        npm install -g pnpm --registry=https://registry.npmmirror.com
    fi
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}[错误]${NC} pnpm 安装失败，请检查网络连接"
        read -p "按回车退出"
        exit 1
    fi
fi

PNPM_VER=$(pnpm --version)
echo -e "${GREEN}[成功]${NC} pnpm 版本: $PNPM_VER"
echo "[2/8] pnpm: $PNPM_VER" | tee -a "$LOG_FILE"
echo ""

# ========================================
# 步骤3: 配置镜像源
# ========================================
echo -e "${BLUE}[3/8]${NC} 优化下载速度..."
echo -e "${GREEN}[信息]${NC} 正在配置国内镜像源..."
pnpm config set registry https://registry.npmmirror.com
echo -e "${GREEN}[成功]${NC} 镜像源配置完成"
echo "[3/8] 镜像源配置完成" | tee -a "$LOG_FILE"
echo ""

# ========================================
# 步骤4: 检查项目文件
# ========================================
echo -e "${BLUE}[4/8]${NC} 检查项目文件..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}[错误]${NC} 未找到 package.json"
    echo -e "${RED}[错误]${NC} 请确保在项目根目录运行此脚本"
    read -p "按回车退出"
    exit 1
fi
echo -e "${GREEN}[成功]${NC} 项目文件完整"
echo "[4/8] 项目文件检查完成" | tee -a "$LOG_FILE"
echo ""

# ========================================
# 步骤5: 安装依赖
# ========================================
echo -e "${BLUE}[5/8]${NC} 安装项目依赖..."
echo ""
echo -e "${GREEN}[信息]${NC} 这可能需要 3-10 分钟，请耐心等待..."
echo -e "${GREEN}[信息]${NC} 正在安装依赖，请勿关闭窗口..."
echo ""

pnpm install 2>&1 | tee -a "$LOG_FILE"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo -e "${YELLOW}[警告]${NC} 首次安装失败，尝试重试..."
    pnpm install 2>&1 | tee -a "$LOG_FILE"
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo -e "${RED}[错误]${NC} 依赖安装失败"
        echo -e "${YELLOW}[提示]${NC} 请查看日志文件: $LOG_FILE"
        echo ""
        echo -e "${YELLOW}[提示]${NC} 或者尝试手动运行: pnpm install"
        read -p "按回车退出"
        exit 1
    fi
fi

echo -e "${GREEN}[成功]${NC} 依赖安装完成"
echo "[5/8] 依赖安装完成" | tee -a "$LOG_FILE"
echo ""

# ========================================
# 步骤6: 检查是否已有构建产物
# ========================================
echo -e "${BLUE}[6/8]${NC} 检查构建状态..."
if [ -d ".next" ]; then
    echo -e "${GREEN}[成功]${NC} 检测到已有构建产物，跳过重新构建"
    echo "[6/8] 使用已有构建产物" | tee -a "$LOG_FILE"
else
    echo -e "${YELLOW}[提示]${NC} 未检测到构建产物，需要构建"
    echo ""
    
    # ========================================
    # 步骤7: 构建项目（如果需要）
    # ========================================
    echo -e "${BLUE}[7/8]${NC} 构建项目..."
    echo ""
    echo -e "${GREEN}[信息]${NC} 正在构建生产版本..."
    echo -e "${GREEN}[信息]${NC} 这可能需要 1-5 分钟..."
    echo ""

    pnpm build 2>&1 | tee -a "$LOG_FILE"
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo -e "${YELLOW}[警告]${NC} 构建过程有警告，但继续执行..."
        echo -e "${YELLOW}[提示]${NC} 如果服务无法启动，请尝试手动运行: pnpm build"
    fi

    echo -e "${GREEN}[成功]${NC} 项目构建完成"
    echo "[7/8] 项目构建完成" | tee -a "$LOG_FILE"
fi
echo ""

# ========================================
# 步骤8: 创建启动脚本和配置
# ========================================
echo -e "${BLUE}[8/8]${NC} 完成部署配置..."

# 创建启动脚本
cat > "start.sh" << 'EOF'
#!/bin/bash
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║           库房管理系统 - 服务运行中                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "[信息] 服务正在启动..."
echo ""
echo "[提示] 请在浏览器访问以下地址："
echo ""
echo "   http://localhost:3000"
echo ""
echo "[提示] 按 Ctrl+C 可停止服务"
echo ""

cd "$(dirname "$0")"

# 智能检测启动方式
if [ -f ".next/standalone/server.js" ]; then
    echo "[信息] 检测到 standalone 模式"
    node .next/standalone/server.js
else
    echo "[信息] 使用标准模式"
    pnpm start
fi
EOF
chmod +x "start.sh"

# 创建停止脚本
cat > "stop.sh" << 'EOF'
#!/bin/bash
echo "[信息] 正在查找并停止服务..."
PID=$(lsof -ti :3000 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 || true)
if [ -n "$PID" ]; then
    echo "[信息] 找到进程 ID: $PID"
    kill -9 $PID 2>/dev/null
    echo "[成功] 进程已停止"
else
    echo "[提示] 未找到运行中的服务"
fi
echo "[完成]"
EOF
chmod +x "stop.sh"

# 创建服务管理脚本
cat > "manage.sh" << 'EOF'
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

show_menu() {
    clear
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║           库房管理系统 - 服务管理                          ║"
    echo "║                                                            ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║                                                            ║"
    echo "║   [1] 启动服务                                            ║"
    echo "║   [2] 停止服务                                            ║"
    echo "║   [3] 重启服务                                            ║"
    echo "║   [4] 查看状态                                            ║"
    echo "║   [5] 查看日志                                            ║"
    echo "║   [6] 安装 PM2 管理                                      ║"
    echo "║   [0] 退出                                                ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    read -p "请选择操作 [0-6]: " choice
    echo ""
}

start_service() {
    echo "[信息] 正在启动服务..."
    if command -v pm2 &> /dev/null; then
        pm2 start npm --name "warehouse-system" -- start
        pm2 save
        echo "[成功] 服务已通过 PM2 启动"
    else
        bash start.sh
    fi
}

stop_service() {
    echo "[信息] 正在停止服务..."
    if command -v pm2 &> /dev/null; then
        pm2 stop warehouse-system 2>/dev/null
        pm2 delete warehouse-system 2>/dev/null
    else
        bash stop.sh
    fi
}

check_status() {
    echo "[信息] 检查服务状态..."
    if command -v pm2 &> /dev/null; then
        pm2 status warehouse-system
    else
        if lsof -ti :3000 >/dev/null 2>&1; then
            echo "[成功] 服务正在运行"
            echo "[信息] 访问地址: http://localhost:3000"
        else
            echo "[提示] 服务未运行"
        fi
    fi
}

install_pm2() {
    echo "[信息] 正在安装 PM2..."
    npm install -g pm2
    echo "[成功] PM2 安装完成"
    echo "[提示] 使用 PM2 可以实现开机自启和进程守护"
}

while true; do
    show_menu
    case $choice in
        1) start_service; read -p "按回车继续...";;
        2) stop_service; read -p "按回车继续...";;
        3) stop_service; sleep 2; start_service; read -p "按回车继续...";;
        4) check_status; read -p "按回车继续...";;
        5) if [ -f "pm2.log" ]; then tail -f pm2.log; else echo "[提示] 暂无日志文件"; fi; read -p "按回车继续...";;
        6) install_pm2; read -p "按回车继续...";;
        0) echo "[完成] 再见！"; exit 0;;
        *) echo "[错误] 无效选择"; read -p "按回车继续...";;
    esac
done
EOF
chmod +x "manage.sh"

echo -e "${GREEN}[成功]${NC} 部署配置完成"
echo "[8/8] 部署配置完成" | tee -a "$LOG_FILE"
echo ""

# ========================================
# 部署完成
# ========================================
"部署完成: $(date)" | tee -a "$LOG_FILE"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║           ✅  全自动部署完成！                            ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}[信息]${NC} 日志文件: $LOG_FILE"
echo ""
echo -e "${BLUE}📦 已创建的文件：${NC}"
echo "   ${GREEN}✓${NC} start.sh       - 启动服务"
echo "   ${GREEN}✓${NC} stop.sh        - 停止服务"
echo "   ${GREEN}✓${NC} manage.sh      - 综合管理工具"
echo ""
echo -e "${BLUE}🌐 访问地址：${NC}"
echo "   http://localhost:3000"
echo ""
echo -e "${BLUE}🎯 下一步：${NC}"
echo "   运行: ./manage.sh"
echo ""

read -p "是否现在打开管理工具？(Y/N) " choice
if [ "$choice" = "Y" ] || [ "$choice" = "y" ]; then
    echo ""
    ./manage.sh
else
    echo ""
    echo -e "${YELLOW}[提示]${NC} 稍后可以运行 ./manage.sh 打开管理工具"
    echo ""
    read -p "按回车退出"
fi
