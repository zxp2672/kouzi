# 库房管理系统 - 生产环境部署指南

## 系统要求

- **Node.js**: 18.0 或更高版本
- **pnpm**: 9.0 或更高版本
- **操作系统**: Linux / Windows / macOS
- **内存**: 至少 512MB RAM
- **磁盘空间**: 至少 500MB

## 快速部署

### 1. 上传文件

将整个 `deploy` 目录上传到服务器：

```bash
# 使用 scp 上传（Linux/Mac）
scp -r deploy user@your-server:/path/to/deploy

# 或使用 FTP/SFTP 工具上传
```

### 2. 安装依赖

```bash
cd /path/to/deploy
pnpm install --prod
```

### 3. 启动服务

```bash
# 方式一：使用启动脚本
chmod +x start.sh
./start.sh

# 方式二：直接启动
PORT=5000 pnpm start
```

### 4. 访问系统

打开浏览器访问：`http://your-server-ip:5000`

## 环境变量配置

创建 `.env` 文件（可选）：

```env
# 服务端口
PORT=5000

# 数据库配置（如果使用 Supabase）
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# 其他配置
NODE_ENV=production
```

## 使用 PM2 管理进程（推荐）

### 安装 PM2

```bash
npm install -g pm2
```

### 启动服务

```bash
pm2 start pnpm --name "warehouse-system" -- start
```

### 管理服务

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs warehouse-system

# 重启服务
pm2 restart warehouse-system

# 停止服务
pm2 stop warehouse-system

# 开机自启
pm2 startup
pm2 save
```

## 使用 Nginx 反向代理（推荐）

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 启用配置

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo nginx -s reload
```

## 使用 Docker 部署

### 构建镜像

```bash
docker build -t warehouse-system .
```

### 运行容器

```bash
docker run -d \
  --name warehouse-system \
  -p 5000:5000 \
  --restart unless-stopped \
  warehouse-system
```

### 使用 Docker Compose

```bash
docker-compose up -d
```

## 系统功能

✅ **库房管理**
- 商品管理
- 仓库管理
- 库存查询

✅ **入库管理**
- 采购入库
- 生产入库
- 入库审核

✅ **出库管理**
- 领用出库
- 销售出库
- 出库审核

✅ **库存盘点**
- 盘点单管理
- 盘点差异处理
- 盘点报告

✅ **调拨管理**
- 仓库调拨
- 调拨审核
- 调拨记录

✅ **系统设置**
- 组织机构管理
- 用户管理
- 角色权限
- 审批流程
- 系统配置

## 默认登录信息

- **用户名**: admin
- **密码**: admin123

⚠️ **重要**: 首次登录后请立即修改密码！

## 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
lsof -i:5000

# 或使用其他端口
PORT=3000 pnpm start
```

### 2. 权限问题

```bash
# 给脚本执行权限
chmod +x start.sh

# 或使用 sudo
sudo ./start.sh
```

### 3. 依赖安装失败

```bash
# 清理缓存
pnpm store prune

# 重新安装
rm -rf node_modules
pnpm install --prod
```

### 4. 内存不足

```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=2048" pnpm start
```

## 性能优化

### 1. 启用压缩

在 Nginx 配置中添加：

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. 启用缓存

```nginx
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 负载均衡

使用 PM2 集群模式：

```bash
pm2 start pnpm --name "warehouse-system" -i max -- start
```

## 安全建议

1. **修改默认密码**: 首次登录后立即修改
2. **使用 HTTPS**: 配置 SSL 证书
3. **防火墙配置**: 只开放必要端口
4. **定期备份**: 备份数据库和配置文件
5. **更新依赖**: 定期更新安全补丁

## 技术支持

- **GitHub**: https://github.com/zxp2672/kouzi
- **问题反馈**: https://github.com/zxp2672/kouzi/issues

## 版本信息

- **当前版本**: 1.0.0
- **更新日期**: 2026-04-06
- **技术栈**: Next.js 16 + React 19 + TypeScript + Tailwind CSS

---

© 2024 库房管理系统. All rights reserved.
