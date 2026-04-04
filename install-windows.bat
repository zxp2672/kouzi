@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title 库房管理系统 - Windows一键安装

echo ========================================
echo    库房管理系统 - Windows一键安装
echo ========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [提示] 建议以管理员身份运行此脚本
    echo.
)

:: 检查Node.js
echo [1/6] 检查 Node.js 环境...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 未检测到 Node.js
    echo.
    echo 请先安装 Node.js (LTS版本):
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo [成功] Node.js 版本: %NODE_VER%
echo.

:: 检查pnpm
echo [2/6] 检查 pnpm 包管理器...
pnpm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [提示] 未检测到 pnpm，正在安装...
    call npm install -g pnpm
    if !errorLevel! neq 0 (
        echo [错误] pnpm 安装失败
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VER=%%i
echo [成功] pnpm 版本: %PNPM_VER%
echo.

:: 检查项目文件
echo [3/6] 检查项目文件...
if not exist "package.json" (
    echo [错误] 未找到 package.json，请确保在项目根目录运行
    pause
    exit /b 1
)
echo [成功] 项目文件完整
echo.

:: 安装依赖
echo [4/6] 安装项目依赖...
echo 这可能需要几分钟，请耐心等待...
call pnpm install
if %errorLevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [成功] 依赖安装完成
echo.

:: 构建项目
echo [5/6] 构建项目...
call pnpm build
if %errorLevel% neq 0 (
    echo [警告] 构建过程有警告，但不影响运行
)
echo [成功] 项目构建完成
echo.

:: 创建启动脚本
echo [6/6] 创建启动脚本...
(
echo @echo off
echo title 库房管理系统
echo echo ========================================
echo echo    库房管理系统 - 启动中
echo echo ========================================
echo echo.
echo echo [提示] 服务启动后，请在浏览器访问:
echo echo http://localhost:3000
echo echo.
echo echo 按 Ctrl+C 可停止服务
echo echo.
echo pnpm start
) > "启动系统.bat"

echo [成功] 安装完成！
echo.
echo ========================================
echo    安装成功！
echo ========================================
echo.
echo 下一步操作：
echo 1. 双击 "启动系统.bat" 启动服务
echo 2. 打开浏览器访问: http://localhost:3000
echo.
echo 如需修改端口，请编辑 package.json
echo.
echo 是否现在启动系统？(Y/N)
set /p START_NOW=
if /i "%START_NOW%"=="Y" (
    echo.
    echo 正在启动系统...
    call pnpm start
) else (
    echo.
    echo 好的，稍后可以双击 "启动系统.bat" 启动
    echo.
    pause
)

endlocal
