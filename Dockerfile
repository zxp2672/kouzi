FROM node:24-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录权限
RUN chown -R node:node /app
USER node

# 复制依赖文件
COPY --chown=node:node package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY --chown=node:node . .

# 构建应用
RUN pnpm run build

# 生产镜像
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "server.js"]
