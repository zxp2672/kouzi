# 本地部署指南

## 前置要求

- Node.js 24+
- pnpm 9.0+
- Git (可选，用于从 GitHub 拉取代码)

## 快速开始

### 1. 从 GitHub 拉取代码

```bash
git clone https://github.com/zxp2672/kouzi.git
cd kouzi
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量（可选）

如果需要连接真实的 Supabase 数据库，创建 `.env` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_COZE_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_COZE_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_COZE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

如果不配置，系统会使用 Mock 数据和 localStorage 作为降级方案。

### 4. 开发模式运行

```bash
pnpm dev
```

访问：http://localhost:8080

### 5. 生产模式部署

#### 步骤 1：构建项目

```bash
pnpm build
```

#### 步骤 2：启动生产服务器

```bash
# 使用默认端口 8080
pnpm start

# 或指定其他端口
PORT=5000 pnpm start
```

访问：http://localhost:8080（或你指定的端口）

## 常见问题

### 问题：`ERR_PNPM_NO_SCRIPT_OR_SERVER Missing script start or file server.js`

**解决方案**：

1. 确保你在正确的项目目录下
2. 确保已安装依赖：`pnpm install`
3. 确保已构建项目：`pnpm build`
4. 然后再运行：`pnpm start`

### 问题：端口被占用

**解决方案**：

```bash
# Linux/Mac
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

或者使用其他端口：

```bash
PORT=5000 pnpm start
```

### 问题：构建失败

**解决方案**：

```bash
# 清理缓存重新构建
rm -rf .next node_modules
pnpm install
pnpm build
```

### 问题：数据库连接失败

**解决方案**：

系统会自动降级使用 Mock 数据和 localStorage，无需额外配置。如果需要使用真实数据库，请确保：

1. Supabase URL 和 Key 配置正确
2. 数据库表结构已创建
3. RLS 策略已正确配置

## 默认登录信息

- 用户名：`admin`
- 密码：`admin123`

## 项目结构

```
kouzi/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/         # API 路由
│   │   ├── page.tsx     # 首页（数据大屏）
│   │   └── ...          # 其他页面
│   └── components/      # React 组件
├── public/              # 静态资源
├── package.json         # 项目配置
├── .coze               # Coze 平台配置
└── ...
```

## 技术栈

- **框架**：Next.js 16 (App Router)
- **语言**：TypeScript 5
- **UI**：shadcn/ui + Tailwind CSS 4
- **数据库**：Supabase (PostgreSQL)
- **动画**：framer-motion

## 功能特性

✅ 数据大屏（深蓝色科技感设计）
✅ 商品管理
✅ 仓库管理
✅ 入库管理
✅ 出库管理
✅ 库存盘点
✅ 调拨管理
✅ 审核管理（完整的审核流程）
✅ 组织机构管理
✅ 用户权限管理

## 支持

如有问题，请查看：
- `README.md` - 项目说明
- `TROUBLESHOOTING-403.md` - 403 错误排查
- `问题诊断与修复方案.md` - 常见问题诊断
