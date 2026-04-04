@echo off
chcp 65001 >nul
echo ==========================================
echo 库房管理系统 - 本地快速启动
echo ==========================================
echo.

REM 检查 Node.js
echo [INFO] 检查 Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 未安装！请先安装 Node.js 24 或更高版本
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [INFO] Node.js 版本: %NODE_VERSION%

REM 检查 pnpm
echo [INFO] 检查 pnpm...
pnpm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] pnpm 未安装，正在安装...
    npm install -g pnpm
)

for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VERSION=%%i
echo [INFO] pnpm 版本: %PNPM_VERSION%

REM 安装依赖
echo [INFO] 检查并安装依赖...
if not exist "node_modules" (
    echo [INFO] 安装项目依赖...
    pnpm install
) else (
    echo [INFO] 依赖已存在，跳过安装
)

echo.
echo 请选择运行模式：
echo 1^) 开发模式 (推荐，支持热更新)
echo 2^) 生产模式 (先构建再运行)
set /p choice=请输入选项 (1/2，默认1): 

if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    echo.
    echo [INFO] 启动开发模式...
    echo [INFO] 开发服务器将在 http://localhost:3000 启动
    echo [INFO] 按 Ctrl+C 停止服务器
    echo.
    pnpm dev
) else if "%choice%"=="2" (
    echo.
    echo [INFO] 构建生产版本...
    pnpm run build
    
    echo.
    echo [INFO] 启动生产服务器...
    echo [INFO] 服务器将在 http://localhost:3000 启动
    echo [INFO] 按 Ctrl+C 停止服务器
    echo.
    pnpm start
) else (
    echo 无效选项，启动开发模式...
    pnpm dev
)

pause
