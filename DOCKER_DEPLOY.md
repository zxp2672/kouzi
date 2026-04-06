# Docker 部署（推荐，最稳定）

## 说明

使用 Docker 部署是最稳定的方案，不需要在服务器上安装 Node.js、pnpm/npm 等环境。

## 部署步骤

### 1. 准备 Dockerfile

项目中已有 `Dockerfile`，内容如下：

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080

CMD ["node", "server.js"]
```

### 2. 构建 Docker 镜像

```bash
# 构建镜像
docker build -t warehouse-system .

# 查看镜像
docker images
```

### 3. 运行容器

```bash
# 运行容器
docker run -d \
  --name warehouse-system \
  -p 8080:8080 \
  --restart unless-stopped \
  warehouse-system

# 查看运行状态
docker ps

# 查看日志
docker logs -f warehouse-system
```

### 4. 配置环境变量

创建 `docker-compose.yml`（已存在）：

```yaml
version: '3.8'
services:
  warehouse:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    restart: unless-stopped
```

使用 docker-compose 部署：

```bash
# 启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 5. 访问应用

访问：http://your-server-ip:8080

## 优势

✅ **环境一致** - 开发、测试、生产环境完全一致
✅ **依赖隔离** - 不需要在服务器安装 Node.js/npm
✅ **易于部署** - 一条命令即可部署
✅ **易于扩展** - 可以轻松扩展多个实例
✅ **快速回滚** - 可以快速回滚到之前版本

## 常见问题

### Q: Docker 怎么安装？

A:

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**CentOS:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**Windows/Mac:**
下载 Docker Desktop: https://www.docker.com/products/docker-desktop

### Q: 镜像构建失败？

A: 检查：
1. Dockerfile 是否正确
2. package.json 是否存在
3. 网络连接是否正常

### Q: 容器启动失败？

A: 查看日志：

```bash
docker logs warehouse-system
```

检查端口是否被占用：

```bash
netstat -tlnp | grep 8080
```
