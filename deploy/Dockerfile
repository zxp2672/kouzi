# 使用 Node.js 18 作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 lock 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --prod --frozen-lockfile

# 复制构建产物
COPY .next ./.next
COPY public ./public
COPY next.config.ts ./
COPY next-env.d.ts ./

# 暴露端口
EXPOSE 5000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000

# 启动应用
CMD ["pnpm", "start"]
