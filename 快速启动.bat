@echo off
chcp 65001 >nul
title 库房管理系统 - 快速启动

echo ========================================
echo    库房管理系统 - 快速启动
echo ========================================
echo.

:: 检查Node.js
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 未检测到 Node.js
    echo.
    echo 请先运行 "install-windows.bat" 完成安装
    echo.
    pause
    exit /b 1
)

:: 检查依赖
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    call pnpm install
    if %errorLevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

:: 检查构建
if not exist ".next" (
    echo [提示] 首次运行，正在构建项目...
    call pnpm build
)

echo [提示] 服务即将启动...
echo.
echo 请在浏览器访问以下地址：
echo.
echo    http://localhost:3000
echo.
echo 提示：按 Ctrl+C 可停止服务
echo.
echo ========================================
echo.

call pnpm start

pause
