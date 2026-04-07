#!/bin/bash

# SSL 证书配置脚本 - 使用 Let's Encrypt 免费证书
# 使用方法：sudo ./ssl-setup.sh your-domain.com

set -e

echo "======================================"
echo "  SSL 证书配置 (Let's Encrypt)"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}错误：请使用 root 权限运行此脚本${NC}"
    exit 1
fi

# 获取域名
DOMAIN=$1
if [ -z "$DOMAIN" ]; then
    read -p "请输入域名: " DOMAIN
fi

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}错误：未提供域名${NC}"
    echo "使用方法: sudo ./ssl-setup.sh your-domain.com"
    exit 1
fi

echo -e "${GREEN}正在为域名配置 SSL 证书: $DOMAIN${NC}"
echo ""

# 安装 Certbot
echo "安装 Certbot..."
apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
echo ""
echo "获取 SSL 证书..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email

echo ""
echo -e "${GREEN}SSL 证书配置完成！${NC}"
echo "访问地址: https://$DOMAIN"
echo ""

# 配置自动续期
echo "配置自动续期..."
(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet") | crontab -

echo -e "${GREEN}已配置每天凌晨 3 点自动续期证书${NC}"
echo ""

# 测试续期
echo "测试证书续期..."
certbot renew --dry-run

echo ""
echo -e "${GREEN}所有配置完成！${NC}"
echo "您的网站现在已启用 HTTPS"
