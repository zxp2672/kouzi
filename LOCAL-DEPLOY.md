# 本地部署指南

## 快速在您的本地电脑上运行库房管理系统！

## 前置要求

- Node.js 24 或更高版本
- pnpm 包管理器
- 至少 4GB 可用内存

## 方式一：开发模式运行（推荐用于本地测试）

### 步骤1：解压项目

```bash
# 找到您的部署包
tar -xzf warehouse-management-system-nginx-*.tar.gz
cd warehouse-management-system
```

或者如果您直接在项目目录中，直接：

```bash
cd /path/to/warehouse-management-system
```

### 步骤2：安装依赖

```bash
# 安装项目依赖
pnpm install
```

### 步骤3：启动开发服务器

```bash
# 启动开发服务器（支持热更新）
pnpm dev
```

### 步骤4：访问应用

打开浏览器访问：
```
http://localhost:3000
```

## 方式二：生产模式运行（推荐用于正式使用）

### 步骤1：安装依赖和构建

```bash
# 安装依赖
pnpm install

# 构建生产版本
pnpm run build
```

### 步骤2：启动生产服务器

```bash
# 方式A：直接启动
pnpm start

# 方式B：使用 PM2 管理（推荐）
# 先安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "warehouse-system" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs warehouse-system
```

### 步骤3：访问应用

打开浏览器访问：
```
http://localhost:3000
```

## 方式三：使用 Docker 本地运行

### 步骤1：确保已安装 Docker

```bash
# 检查 Docker
docker --version
docker-compose --version
```

### 步骤2：启动容器

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps
```

### 步骤3：访问应用

打开浏览器访问：
```
http://localhost:3000
```

### 停止容器

```bash
# 停止容器
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

## 本地开发常用命令

### 依赖管理

```bash
# 安装依赖
pnpm install

# 添加新依赖
pnpm add <package-name>

# 添加开发依赖
pnpm add -D <package-name>
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 停止服务器
# Ctrl + C
```

### 生产构建

```bash
# 构建
pnpm run build

# 启动生产服务器
pnpm start
```

### 代码检查

```bash
# 运行 ESLint
pnpm lint

# 运行 TypeScript 检查
pnpm ts-check
```

## 项目结构说明

```
warehouse-management-system/
├── src/
│   ├── app/              # 页面和路由
│   │   ├── page.tsx       # 首页
│   │   ├── login/        # 登录页
│   │   ├── inbound/      # 入库管理
│   │   ├── outbound/     # 出库管理
│   │   ├── stock-count/  # 盘点管理
│   │   ├── transfer/     # 调拨管理
│   │   ├── approvals/    # 审核管理
│   │   ├── products/     # 商品管理
│   │   └── settings/     # 系统设置
│   ├── components/       # 组件
│   │   ├── ui/          # UI 组件
│   │   ├── print-pdf-export.tsx    # 打印和PDF导出
│   │   └── document-detail-dialog.tsx  # 单据详情
│   ├── hooks/          # 自定义 Hooks
│   └── lib/            # 工具函数
├── public/             # 静态资源
├── nginx/              # Nginx 配置文件
├── package.json         # 项目配置
└── next.config.ts       # Next.js 配置
```

## 功能模块说明

### 主要功能

1. **首页** (`/`)
   - 数据概览和快捷入口

2. **登录页** (`/login`)
   - 用户登录

3. **入库管理** (`/inbound`)
   - 新建入库单
   - 入库单列表
   - 审核入库单
   - 打印和PDF导出

4. **出库管理** (`/outbound`)
   - 新建出库单
   - 出库单列表
   - 审核出库单
   - 打印和PDF导出

5. **库存盘点** (`/stock-count`)
   - 盘点管理

6. **商品调拨** (`/transfer`)
   - 调拨管理

7. **审核管理** (`/approvals`)
   - 待审核单据

8. **商品管理** (`/products`)
   - 商品列表
   - 新增/编辑商品

9. **系统设置** (`/settings`)
   - 仓库管理
   - 用户管理
   - 角色权限
   - 组织架构
   - 审核流程
   - 系统配置

## 本地开发提示

### 1. 修改代码后

开发模式下，修改代码会自动热更新，无需重启服务器。

### 2. 数据存储

当前版本使用浏览器 localStorage 存储数据，数据保存在您的浏览器中。

### 3. 清除数据

如需重置数据：
- 在浏览器中打开开发者工具 (F12)
- 进入 Application/Storage/Local Storage
- 删除相关数据或全部清除

### 4. 打印和PDF导出

- 点击单据的"查看"按钮
- 在详情页点击"打印"或"导出PDF"

## 常见问题

### Q: 端口3000被占用怎么办？

A: 修改端口或停止占用进程

```bash
# 查看占用进程
lsof -ti:3000

# 或
netstat -ano | findstr :3000  # Windows
netstat -tlnp | grep :3000   # Linux/Mac

# 停止占用进程
kill -9 <PID>
```

或者修改 Next.js 端口：

```bash
# 修改 package.json 中的 scripts
# "dev": "next dev -p 3001"
# "start": "next start -p 3001"
```

### Q: 依赖安装失败？

A: 尝试清理缓存重新安装

```bash
# 清理 pnpm 缓存
pnpm store prune

# 删除 node_modules 和 lock 文件
rm -rf node_modules pnpm-lock.yaml

# 重新安装
pnpm install
```

### Q: 构建失败？

A: 检查 Node.js 版本

```bash
# 检查版本
node -v

# 需要 Node.js 24+
```

### Q: 如何更新代码？

A: 修改 `src/` 目录下的文件，开发模式会自动更新。

## 性能优化建议

### 开发阶段

- 使用 `pnpm dev` 已经很快，无需额外配置
- 修改代码后自动热更新

### 生产使用

- 使用 `pnpm run build` 构建优化版本
- 使用 PM2 管理进程
- 考虑使用 Nginx 反向代理（如需对外提供服务

## 下一步

本地运行成功后，您可以：

1. 测试所有功能模块
2. 根据需要修改代码
3. 配置生产环境部署（参考 NGINX-DEPLOY.md）
4. 配置域名和 HTTPS

祝您使用愉快！
