# Docker 快速启动指南

## 前置要求

- 已安装 Docker 和 Docker Compose

## 快速启动（3步搞定）

### 1. 克隆代码

```bash
git clone https://github.com/zxp2672/kouzi.git
cd kouzi
```

### 2. 启动服务

```bash
docker-compose up -d
```

### 3. 访问应用

打开浏览器访问：http://localhost:3000

## 常用命令

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建并启动
docker-compose up -d --build
```

## 配置数据库（可选）

如果需要数据持久化，编辑 `docker-compose.yml`：

```yaml
environment:
  - NODE_ENV=production
  - NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

然后重启：

```bash
docker-compose up -d
```

## 故障排查

### 端口被占用？

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "3000:8080"  # 改成其他端口
```

### 查看日志

```bash
docker-compose logs -f warehouse
```

### 进入容器

```bash
docker-compose exec warehouse sh
```
