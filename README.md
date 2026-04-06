# 库房管理系统

专业的库房管理系统，支持商品入库、出库、盘点、调拨、审核等功能。

## 🚀 快速开始（推荐 Docker）

### Docker 部署（最简单，3步搞定）

```bash
# 1. 克隆代码
git clone https://github.com/zxp2672/kouzi.git
cd kouzi

# 2. 启动服务
docker-compose up -d

# 3. 访问应用
# 打开浏览器访问：http://localhost:3000
```

详细文档请查看：[DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md)

### npm/yarn 部署（如果不使用 Docker）

```bash
# 1. 克隆代码
git clone https://github.com/zxp2672/kouzi.git
cd kouzi

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 启动
npm start
```

访问：http://localhost:3000

详细文档请查看：[NPM_DEPLOY.md](./NPM_DEPLOY.md)

## ✨ 功能特性

- ✨ **数据大屏** - 深蓝色科技感设计，适合投屏参观
- 📦 **商品管理** - 商品信息管理
- 🏪 **仓库管理** - 仓库信息管理
- 📥 **入库管理** - 采购入库、生产入库
- 📤 **出库管理** - 领用出库、销售出库
- 📋 **库存盘点** - 盘点单管理
- 🔄 **调拨管理** - 仓库调拨
- ✅ **审核管理** - 完整的数据库审核流程
- ⚙️ **系统设置** - 组织机构、用户权限

## 🛠️ 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **动画**: framer-motion
- **部署**: Docker（推荐）或 npm/yarn

## 📚 文档

- [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - Docker 快速启动（推荐）
- [NPM_DEPLOY.md](./NPM_DEPLOY.md) - npm/yarn 部署指南
- [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md) - Docker 完整部署指南
- [TENCENT_CLOUD_DEPLOY.md](./TENCENT_CLOUD_DEPLOY.md) - 腾讯云部署数据库配置

## 🔐 默认登录

- 用户名: `admin`
- 密码: `admin123`

## 📝 数据持久化

如需数据持久化，请配置 Supabase 数据库，详细步骤请查看：
[TENCENT_CLOUD_DEPLOY.md](./TENCENT_CLOUD_DEPLOY.md)

## 🎯 端口说明

默认端口: `8080`

如端口被占用，可修改 `docker-compose.yml` 或 `package.json` 中的端口配置。
