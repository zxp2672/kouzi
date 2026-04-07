#!/bin/bash

# Docker 管理脚本 - 用于管理库房管理系统容器
# 使用方法：./docker-manage.sh

set -e

echo "======================================"
echo "  库房管理系统 - Docker 管理"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/www/wwwroot/warehouse-system"
CONTAINER_NAME="warehouse-system"

# 切换到应用目录
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
else
    echo -e "${RED}错误：应用目录不存在: $APP_DIR${NC}"
    exit 1
fi

# 显示菜单
show_menu() {
    echo -e "${BLUE}请选择操作：${NC}"
    echo "  1) 查看服务状态"
    echo "  2) 查看实时日志"
    echo "  3) 重启服务"
    echo "  4) 停止服务"
    echo "  5) 启动服务"
    echo "  6) 更新服务（重新构建）"
    echo "  7) 查看容器资源使用"
    echo "  8) 清理无用镜像"
    echo "  9) 备份数据"
    echo "  10) 进入容器终端"
    echo "  0) 退出"
    echo ""
}

# 查看状态
show_status() {
    echo -e "${GREEN}服务状态：${NC}"
    docker compose ps
    echo ""
    
    echo -e "${GREEN}容器信息：${NC}"
    docker inspect $CONTAINER_NAME --format='容器ID: {{.Id}}' 2>/dev/null || echo "容器未运行"
    docker inspect $CONTAINER_NAME --format='运行状态: {{.State.Status}}' 2>/dev/null || true
    docker inspect $CONTAINER_NAME --format='启动时间: {{.State.StartedAt}}' 2>/dev/null || true
    echo ""
}

# 查看日志
show_logs() {
    echo -e "${GREEN}显示实时日志（按 Ctrl+C 退出）${NC}"
    docker compose logs -f --tail=100
}

# 重启服务
restart_service() {
    echo -e "${YELLOW}正在重启服务...${NC}"
    docker compose restart
    echo -e "${GREEN}服务已重启${NC}"
}

# 停止服务
stop_service() {
    echo -e "${YELLOW}正在停止服务...${NC}"
    docker compose down
    echo -e "${GREEN}服务已停止${NC}"
}

# 启动服务
start_service() {
    echo -e "${YELLOW}正在启动服务...${NC}"
    docker compose up -d
    echo -e "${GREEN}服务已启动${NC}"
}

# 更新服务
update_service() {
    echo -e "${YELLOW}正在更新服务（重新构建）...${NC}"
    echo -e "${BLUE}这可能需要几分钟时间，请耐心等待${NC}"
    docker compose down
    docker compose up -d --build
    echo -e "${GREEN}服务已更新${NC}"
}

# 查看资源使用
show_resources() {
    echo -e "${GREEN}容器资源使用情况：${NC}"
    docker stats $CONTAINER_NAME --no-stream
    echo ""
    
    echo -e "${GREEN}磁盘使用情况：${NC}"
    docker system df -v | grep warehouse || echo "无数据"
    echo ""
}

# 清理无用镜像
cleanup_images() {
    echo -e "${YELLOW}清理无用的 Docker 镜像和容器...${NC}"
    docker system prune -f
    echo -e "${GREEN}清理完成${NC}"
}

# 备份数据
backup_data() {
    BACKUP_DIR="/www/backup/warehouse-system"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    echo -e "${YELLOW}正在备份数据...${NC}"
    mkdir -p $BACKUP_DIR
    
    # 备份数据目录
    if [ -d "$APP_DIR/data" ]; then
        tar -czf $BACKUP_FILE -C $APP_DIR data
        echo -e "${GREEN}数据备份完成: $BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}数据目录不存在，跳过备份${NC}"
    fi
    
    # 备份环境变量
    if [ -f "$APP_DIR/.env" ]; then
        cp $APP_DIR/.env $BACKUP_DIR/env_backup_$(date +%Y%m%d_%H%M%S)
        echo -e "${GREEN}环境变量已备份${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}备份文件列表：${NC}"
    ls -lh $BACKUP_DIR/ | tail -10
    echo ""
}

# 进入容器
enter_container() {
    echo -e "${YELLOW}正在进入容器...${NC}"
    docker exec -it $CONTAINER_NAME /bin/sh
}

# 主循环
while true; do
    show_menu
    read -p "请输入选项 [0-10]: " choice
    
    case $choice in
        1)
            show_status
            ;;
        2)
            show_logs
            ;;
        3)
            restart_service
            ;;
        4)
            stop_service
            ;;
        5)
            start_service
            ;;
        6)
            update_service
            ;;
        7)
            show_resources
            ;;
        8)
            cleanup_images
            ;;
        9)
            backup_data
            ;;
        10)
            enter_container
            ;;
        0)
            echo -e "${GREEN}退出${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}无效选项，请重新输入${NC}"
            ;;
    esac
    
    echo ""
    read -p "按回车键继续..."
    clear
done
