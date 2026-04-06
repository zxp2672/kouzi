# 使用 npm 部署（替代 pnpm）

## 说明

如果服务器上安装 pnpm 遇到问题，可以使用 npm 代替。

## 部署步骤

### 1. 移除 pnpm 限制（已完成）

`package.json` 中的 `"preinstall": "npx only-allow pnpm"` 已移除，现在可以使用 npm 了。

### 2. 安装依赖

```bash
# 使用 npm 安装
npm install

# 或者使用 yarn
yarn install
```

### 3. 开发模式

```bash
npm run dev
```

访问：http://localhost:8080

### 4. 生产部署

```bash
# 构建
npm run build

# 启动
npm start
```

访问：http://localhost:8080

## 常见问题

### Q: npm install 很慢？

A: 可以使用淘宝镜像：

```bash
# 设置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 安装
npm install
```

### Q: 可以用 yarn 吗？

A: 可以！

```bash
yarn install
yarn build
yarn start
```

### Q: 端口被占用？

A: 修改 `package.json` 中的端口：

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "start": "next start -p 3000"
  }
}
```

或者使用环境变量：

```bash
PORT=3000 npm start
```
