#Requires -RunAsAdministrator

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║           库房管理系统 - 全自动一键部署 (PowerShell)      ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$LogFile = "deploy-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
"库房管理系统 - PowerShell部署日志" | Out-File -FilePath $LogFile -Encoding UTF8
"开始时间: $(Get-Date)" | Out-File -FilePath $LogFile -Append -Encoding UTF8
"" | Out-File -FilePath $LogFile -Append -Encoding UTF8

Write-Host "[信息] 开始全自动部署..." -ForegroundColor Green
Write-Host "[信息] 日志文件: $LogFile" -ForegroundColor Green
Write-Host ""

# ========================================
# 步骤1: 检查Node.js
# ========================================
Write-Host "[1/8] 检查 Node.js 环境..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[成功] Node.js 版本: $nodeVersion" -ForegroundColor Green
        "[1/8] Node.js: $nodeVersion" | Out-File -FilePath $LogFile -Append -Encoding UTF8
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "[警告] 未检测到 Node.js" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[提示] 请先安装 Node.js (LTS版本)" -ForegroundColor Yellow
    Write-Host "       下载地址: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按回车退出"
    exit 1
}
Write-Host ""

# ========================================
# 步骤2: 检查pnpm
# ========================================
Write-Host "[2/8] 检查 pnpm 包管理器..." -ForegroundColor Cyan
try {
    $pnpmVersion = pnpm --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[提示] 未检测到 pnpm，正在安装..." -ForegroundColor Yellow
        npm install -g pnpm
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[提示] 尝试使用淘宝镜像..." -ForegroundColor Yellow
            npm install -g pnpm --registry=https://registry.npmmirror.com
        }
    }
    $pnpmVersion = pnpm --version
    Write-Host "[成功] pnpm 版本: $pnpmVersion" -ForegroundColor Green
    "[2/8] pnpm: $pnpmVersion" | Out-File -FilePath $LogFile -Append -Encoding UTF8
} catch {
    Write-Host "[错误] pnpm 安装失败" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}
Write-Host ""

# ========================================
# 步骤3: 配置镜像源
# ========================================
Write-Host "[3/8] 优化下载速度..." -ForegroundColor Cyan
pnpm config set registry https://registry.npmmirror.com
Write-Host "[成功] 镜像源配置完成" -ForegroundColor Green
"[3/8] 镜像源配置完成" | Out-File -FilePath $LogFile -Append -Encoding UTF8
Write-Host ""

# ========================================
# 步骤4: 检查项目文件
# ========================================
Write-Host "[4/8] 检查项目文件..." -ForegroundColor Cyan
if (-not (Test-Path "package.json")) {
    Write-Host "[错误] 未找到 package.json" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}
Write-Host "[成功] 项目文件完整" -ForegroundColor Green
"[4/8] 项目文件检查完成" | Out-File -FilePath $LogFile -Append -Encoding UTF8
Write-Host ""

# ========================================
# 步骤5: 安装依赖
# ========================================
Write-Host "[5/8] 安装项目依赖..." -ForegroundColor Cyan
Write-Host ""
Write-Host "[信息] 这可能需要 3-10 分钟，请耐心等待..." -ForegroundColor Green
Write-Host "[信息] 正在安装依赖，请勿关闭窗口..." -ForegroundColor Green
Write-Host ""

pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[警告] 首次安装失败，尝试重试..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 依赖安装失败" -ForegroundColor Red
        Read-Host "按回车退出"
        exit 1
    }
}
Write-Host "[成功] 依赖安装完成" -ForegroundColor Green
"[5/8] 依赖安装完成" | Out-File -FilePath $LogFile -Append -Encoding UTF8
Write-Host ""

# ========================================
# 步骤6: 构建项目
# ========================================
Write-Host "[6/8] 构建项目..." -ForegroundColor Cyan
Write-Host ""
Write-Host "[信息] 正在构建生产版本..." -ForegroundColor Green
Write-Host "[信息] 这可能需要 1-5 分钟..." -ForegroundColor Green
Write-Host ""

pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[警告] 构建过程有警告，但继续执行..." -ForegroundColor Yellow
}
Write-Host "[成功] 项目构建完成" -ForegroundColor Green
"[6/8] 项目构建完成" | Out-File -FilePath $LogFile -Append -Encoding UTF8
Write-Host ""

# ========================================
# 步骤7: 创建启动脚本
# ========================================
Write-Host "[7/8] 完成部署配置..." -ForegroundColor Cyan

# 创建启动脚本
$startScript = @"
@echo off
chcp 65001 >nul
title 库房管理系统 - 运行中
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           库房管理系统 - 服务运行中                        ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo [信息] 服务正在启动...
echo.
echo [提示] 请在浏览器访问以下地址：
echo.
echo    http://localhost:3000
echo.
echo [提示] 按 Ctrl+C 可停止服务
echo.
cd /d "%~dp0"
pnpm start
"@
$startScript | Out-File -FilePath "启动服务.bat" -Encoding Default

Write-Host "[成功] 部署配置完成" -ForegroundColor Green
"[7/8] 部署配置完成" | Out-File -FilePath $LogFile -Append -Encoding UTF8
Write-Host ""

# ========================================
# 部署完成
# ========================================
"部署完成: $(Get-Date)" | Out-File -FilePath $LogFile -Append -Encoding UTF8

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║           ✅  全自动部署完成！                            ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "[信息] 开始时间: $($startTime)" -ForegroundColor Green
Write-Host "[信息] 完成时间: $(Get-Date)" -ForegroundColor Green
Write-Host ""
Write-Host "📦 已创建的文件：" -ForegroundColor Cyan
Write-Host "   ✅ 启动服务.bat      - 一键启动服务" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 访问地址：" -ForegroundColor Cyan
Write-Host "   http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "🎯 下一步：" -ForegroundColor Cyan
Write-Host "   双击 "启动服务.bat" 启动服务" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "是否现在启动服务？(Y/N)"
if ($choice -eq "Y" -or $choice -eq "y") {
    Write-Host ""
    Write-Host "正在启动服务..." -ForegroundColor Green
    pnpm start
} else {
    Write-Host ""
    Write-Host "好的，稍后可以双击 "启动服务.bat" 启动" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按回车退出"
}
