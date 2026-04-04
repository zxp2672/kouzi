# 库房管理系统 - Windows 部署指南

## 📋 目录

- [快速开始](#快速开始)
- [系统要求](#系统要求)
- [安装步骤](#安装步骤)
- [启动服务](#启动服务)
- [常见问题](#常见问题)
- [卸载](#卸载)

---

## 🚀 快速开始

### 方式一：一键安装（推荐）

1. **解压部署包**
   - 使用 WinRAR、7-Zip 或 Windows 自带解压工具
   - 解压到任意目录，例如：`C:\warehouse-system\`

2. **一键安装**
   - 双击运行：`install-windows.bat`
   - 等待安装完成

3. **启动系统**
   - 双击运行：`快速启动.bat`
   - 或双击运行：`启动系统.bat`

4. **访问系统**
   - 打开浏览器访问：http://localhost:3000

---

### 方式二：手动安装

#### 1. 安装 Node.js

1. 访问 https://nodejs.org/
2. 下载 LTS 版本（推荐 18.x 或 20.x）
3. 运行安装程序，按默认设置安装
4. 验证安装：
   ```cmd
   node --version
   ```

#### 2. 安装 pnpm

打开命令提示符（CMD）或 PowerShell，运行：

```cmd
npm install -g pnpm
```

验证安装：
```cmd
pnpm --version
```

#### 3. 安装项目依赖

进入项目目录，运行：

```cmd
cd C:\warehouse-system
pnpm install
```

#### 4. 构建项目

```cmd
pnpm build
```

#### 5. 启动服务

```cmd
pnpm start
```

#### 6. 访问系统

打开浏览器访问：http://localhost:3000

---

## 💻 系统要求

### 最低配置

- **操作系统**: Windows 10 或更高版本
- **处理器**: 双核 CPU
- **内存**: 2 GB RAM
- **磁盘空间**: 1 GB 可用空间
- **Node.js**: 18.x 或更高版本

### 推荐配置

- **操作系统**: Windows 10/11 或 Windows Server 2019+
- **处理器**: 四核 CPU 或更高
- **内存**: 4 GB RAM 或更多
- **磁盘空间**: 5 GB 可用空间
- **Node.js**: 20.x LTS 版本

---

## 📦 安装步骤详解

### 第一步：准备工作

1. **下载部署包**
   - 文件名：`warehouse-management-system-windows-*.zip`
   - 或：`warehouse-management-system-windows-*.tar.gz`

2. **解压部署包**
   - 右键点击部署包
   - 选择"解压到..."
   - 选择目标文件夹，例如：`C:\warehouse-system\`

3. **进入项目目录**
   ```cmd
   cd C:\warehouse-system
   ```

### 第二步：环境检查

运行环境检查脚本（如果有），或手动检查：

```cmd
node --version
pnpm --version
```

### 第三步：一键安装

双击运行：
```
install-windows.bat
```

脚本会自动完成以下操作：
- ✅ 检查 Node.js 环境
- ✅ 检查/安装 pnpm
- ✅ 安装项目依赖
- ✅ 构建项目
- ✅ 创建启动脚本

### 第四步：启动服务

选择以下任一方式启动：

**方式A：使用快速启动脚本**
```
快速启动.bat
```

**方式B：使用生产启动脚本**
```
启动系统.bat
```

**方式C：手动启动**
```cmd
pnpm start
```

### 第五步：访问系统

1. 打开浏览器（推荐 Chrome、Edge、Firefox）
2. 访问：http://localhost:3000
3. 开始使用库房管理系统！

---

## 🎯 启动服务

### 开发模式启动

适用于开发和调试：

```cmd
pnpm dev
```

特性：
- 热更新（代码修改自动刷新）
- 详细的错误提示
- 开发工具支持

访问：http://localhost:3000

---

### 生产模式启动

适用于正式使用：

```cmd
pnpm start
```

特性：
- 最佳性能
- 优化的资源加载
- 稳定的运行环境

访问：http://localhost:3000

---

### 使用 PM2 管理进程（推荐）

#### 1. 安装 PM2

```cmd
npm install -g pm2
```

#### 2. 启动服务

```cmd
pm2 start npm --name "warehouse-system" -- start
```

#### 3. 常用命令

```cmd
# 查看状态
pm2 status

# 查看日志
pm2 logs warehouse-system

# 停止服务
pm2 stop warehouse-system

# 重启服务
pm2 restart warehouse-system

# 删除服务
pm2 delete warehouse-system
```

#### 4. 设置开机自启

```cmd
pm2 save
pm2 startup
```

---

## 🔧 配置说明

### 修改端口

编辑 `package.json`，找到 `scripts` 部分：

```json
{
  "scripts": {
    "start": "next start -p 3000",
    "dev": "next dev -p 3000"
  }
}
```

将 `3000` 改为你想要的端口，例如 `8080`。

---

### 配置防火墙

如果无法从其他电脑访问，需要配置 Windows 防火墙：

1. 打开"Windows Defender 防火墙"
2. 点击"高级设置"
3. 点击"入站规则" → "新建规则"
4. 选择"端口" → "TCP" → 特定本地端口输入 `3000`
5. 选择"允许连接"
6. 全选（域、专用、公用）
7. 命名为"库房管理系统"，完成

---

## ❓ 常见问题

### Q1: 双击脚本没反应？

**A:**
1. 右键点击脚本
2. 选择"编辑"，检查文件内容是否完整
3. 尝试以管理员身份运行

---

### Q2: 'node' 不是内部或外部命令？

**A:**
1. 确认已安装 Node.js
2. 重启命令提示符或 PowerShell
3. 检查环境变量 Path 是否包含 Node.js 安装路径

---

### Q3: 'pnpm' 不是内部或外部命令？

**A:**
```cmd
npm install -g pnpm
```

如果还是不行，尝试：
```cmd
npx pnpm install
```

---

### Q4: 端口被占用？

**A:**

**方法1：查看并结束占用进程**
```cmd
# 查看端口占用
netstat -ano | findstr :3000

# 结束进程（PID 替换为实际的进程ID）
taskkill /F /PID <PID>
```

**方法2：使用其他端口**
编辑 `package.json`，将端口改为 `3001` 或其他端口。

---

### Q5: 安装依赖很慢？

**A:**

配置国内镜像源：
```cmd
pnpm config set registry https://registry.npmmirror.com
```

然后重新安装：
```cmd
pnpm install
```

---

### Q6: 浏览器无法访问？

**A:**

1. 确认服务已启动
2. 检查防火墙设置
3. 尝试使用 `http://127.0.0.1:3000` 替代 `localhost`
4. 检查是否有杀毒软件或安全软件拦截

---

### Q7: 数据会丢失吗？

**A:**

不会。数据存储在浏览器的 localStorage 中：
- 刷新页面不会丢失数据
- 清除浏览器数据会丢失数据
- 建议定期导出数据备份

---

## 🗑️ 卸载

### 完全卸载步骤

1. **停止服务**
   ```cmd
   # 如果使用 PM2
   pm2 delete warehouse-system
   
   # 或者直接关闭命令窗口
   ```

2. **删除项目文件**
   - 删除整个项目文件夹，例如：`C:\warehouse-system\`

3. **（可选）卸载 Node.js**
   - 打开"控制面板" → "程序和功能"
   - 找到 Node.js，卸载

4. **（可选）清除 npm 缓存**
   ```cmd
   npm cache clean --force
   ```

---

## 📞 获取帮助

如果遇到问题：

1. 查看本文档的"常见问题"部分
2. 检查命令窗口的错误提示
3. 确保网络连接正常
4. 确认系统满足最低要求

---

## 🎉 开始使用

安装完成后，你可以：

- ✅ 管理商品信息
- ✅ 处理入库出库
- ✅ 进行库存盘点
- ✅ 管理仓库调拨
- ✅ 审核单据流程
- ✅ 导出Excel报表
- ✅ 打印和PDF导出

祝你使用愉快！
