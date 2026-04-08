#!/bin/bash
echo "开始部署到阿里云服务器..."
apt update && apt install -y curl wget git
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pnpm
apt install -y nginx
cd /opt
rm -rf warehouse-system
git clone https://github.com/zxp2672/kouzi.git warehouse-system
cd warehouse-system
pnpm install --frozen-lockfile
cat > .env << EOF
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SUPABASE_URL=https://rcyeqrjalfzczdyspbog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeWVxcmphbGZ6Y3pkeXNwYm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjMxMjEsImV4cCI6MjA5MTEzOTEyMX0.Q-WS3GuGI3VWi61whHt1nAbEHyf-T6o2fBttqYhanD4
DB_HOST=cd-postgres-gu24c63s.sql.tencentcdb.com
DB_PORT=21021
DB_NAME=warehouse_db
DB_USER=zxp2672
DB_PASSWORD=Swj121648.
EOF
pnpm build
cat > /etc/systemd/system/warehouse-system.service << EOF
[Unit]
Description=Warehouse Management System
After=network.target
[Service]
Type=simple
User=root
WorkingDirectory=/opt/warehouse-system
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable warehouse-system
systemctl start warehouse-system
cat > /etc/nginx/sites-available/warehouse-system << EOF
server {
    listen 80;
    server_name _;
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/warehouse-system /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx && systemctl enable nginx
ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
echo "部署完成！"
echo "网站地址: http://47.109.159.143"
echo "登录: admin / 123456"
