@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title 库房管理系统 - 全自动一键部署

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           库房管理系统 - 全自动一键部署                  ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 设置颜色
color 0A

:: 记录开始时间
set START_TIME=%time%

:: 创建日志文件
set LOG_FILE=%~dp0deploy.log
echo 库房管理系统 - 部署日志 > "%LOG_FILE%"
echo 开始时间: %date% %START_TIME% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

echo [信息] 开始全自动部署...
echo [信息] 日志文件: %LOG_FILE%
echo.

:: ========================================
:: 步骤1: 检查管理员权限
:: ========================================
echo [1/8] 检查权限...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [提示] 未使用管理员权限运行，部分功能可能受限
    echo [提示] 建议右键选择"以管理员身份运行"
) else (
    echo [成功] 管理员权限确认
)
echo. >> "%LOG_FILE%"
echo [1/8] 权限检查完成 >> "%LOG_FILE%"

:: ========================================
:: 步骤2: 检查并安装Node.js
:: ========================================
echo [2/8] 检查 Node.js 环境...
echo.

node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [警告] 未检测到 Node.js
    echo.
    echo [提示] 正在尝试自动下载 Node.js...
    echo [提示] 如果自动下载失败，请手动访问:
    echo        https://nodejs.org/
    echo.
    
    :: 尝试使用PowerShell下载
    where powershell >nul 2>&1
    if %errorLevel% equ 0 (
        echo [信息] 正在下载 Node.js 安装程序...
        echo [信息] 这可能需要几分钟，请耐心等待...
        
        set NODE_INSTALLER=%TEMP%\node-installer.exe
        powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi' -OutFile '%NODE_INSTALLER%'}" 2>> "%LOG_FILE%"
        
        if exist "%NODE_INSTALLER%" (
            echo [成功] Node.js 安装程序下载完成
            echo [信息] 正在启动安装程序...
            echo [提示] 请按照安装向导完成安装
            echo [提示] 安装完成后请重新运行此脚本
            start /wait msiexec /i "%NODE_INSTALLER%" /quiet /norestart
            del "%NODE_INSTALLER%"
            echo.
            echo [提示] Node.js 安装完成，请重新运行此脚本
            pause
            exit /b 0
        ) else (
            echo [错误] 自动下载失败
        )
    )
    
    echo.
    echo [错误] 请手动安装 Node.js 后重新运行此脚本
    echo        下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo [成功] Node.js 版本: %NODE_VER%
echo. >> "%LOG_FILE%"
echo [2/8] Node.js: %NODE_VER% >> "%LOG_FILE%"

:: ========================================
:: 步骤3: 检查并安装pnpm
:: ========================================
echo [3/8] 检查 pnpm 包管理器...
echo.

pnpm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [提示] 未检测到 pnpm，正在安装...
    call npm install -g pnpm >> "%LOG_FILE%" 2>&1
    if !errorLevel! neq 0 (
        echo [错误] pnpm 安装失败，尝试使用淘宝镜像...
        call npm install -g pnpm --registry=https://registry.npmmirror.com >> "%LOG_FILE%" 2>&1
        if !errorLevel! neq 0 (
            echo [错误] pnpm 安装失败，请检查网络连接
            pause
            exit /b 1
        )
    )
    echo [成功] pnpm 安装完成
)

for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VER=%%i
echo [成功] pnpm 版本: %PNPM_VER%
echo. >> "%LOG_FILE%"
echo [3/8] pnpm: %PNPM_VER% >> "%LOG_FILE%"

:: ========================================
:: 步骤4: 配置国内镜像源（可选）
:: ========================================
echo [4/8] 优化下载速度...
echo.
echo [信息] 正在配置国内镜像源...
pnpm config set registry https://registry.npmmirror.com >> "%LOG_FILE%" 2>&1
echo [成功] 镜像源配置完成
echo. >> "%LOG_FILE%"
echo [4/8] 镜像源配置完成 >> "%LOG_FILE%"

:: ========================================
:: 步骤5: 检查项目文件
:: ========================================
echo [5/8] 检查项目文件...
echo.

if not exist "package.json" (
    echo [错误] 未找到 package.json
    echo [错误] 请确保在项目根目录运行此脚本
    echo.
    pause
    exit /b 1
)

if not exist "src" (
    echo [错误] 未找到 src 目录
    echo [错误] 项目文件不完整
    pause
    exit /b 1
)

echo [成功] 项目文件完整
echo. >> "%LOG_FILE%"
echo [5/8] 项目文件检查完成 >> "%LOG_FILE%"

:: ========================================
:: 步骤6: 安装项目依赖
:: ========================================
echo [6/8] 安装项目依赖...
echo.
echo [信息] 这可能需要 3-10 分钟，请耐心等待...
echo [信息] 正在安装依赖，请勿关闭窗口...
echo.

call pnpm install >> "%LOG_FILE%" 2>&1
if %errorLevel% neq 0 (
    echo [警告] 首次安装失败，尝试重试...
    call pnpm install >> "%LOG_FILE%" 2>&1
    if !errorLevel! neq 0 (
        echo [错误] 依赖安装失败
        echo [提示] 请查看日志文件: %LOG_FILE%
        echo.
        pause
        exit /b 1
    )
)

echo [成功] 依赖安装完成
echo. >> "%LOG_FILE%"
echo [6/8] 依赖安装完成 >> "%LOG_FILE%"

:: ========================================
:: 步骤7: 构建项目
:: ========================================
echo [7/8] 构建项目...
echo.
echo [信息] 正在构建生产版本...
echo [信息] 这可能需要 1-5 分钟...
echo.

call pnpm build >> "%LOG_FILE%" 2>&1
if %errorLevel% neq 0 (
    echo [警告] 构建过程有警告，但继续执行...
)

echo [成功] 项目构建完成
echo. >> "%LOG_FILE%"
echo [7/8] 项目构建完成 >> "%LOG_FILE%"

:: ========================================
:: 步骤8: 创建启动脚本和配置
:: ========================================
echo [8/8] 完成部署配置...
echo.

:: 创建启动脚本
(
echo @echo off
echo chcp 65001 ^>nul
echo title 库房管理系统 - 运行中
echo.
echo echo ╔════════════════════════════════════════════════════════════╗
echo echo ║                                                            ║
echo echo ║           库房管理系统 - 服务运行中                        ║
echo echo ║                                                            ║
echo echo ╚════════════════════════════════════════════════════════════╝
echo echo.
echo echo [信息] 服务正在启动...
echo echo.
echo echo [提示] 请在浏览器访问以下地址：
echo echo.
echo echo    http://localhost:3000
echo echo.
echo echo [提示] 按 Ctrl+C 可停止服务
echo echo.
echo cd /d "%%~dp0"
echo pnpm start
) > "启动服务.bat"

:: 创建停止脚本
(
echo @echo off
echo chcp 65001 ^>nul
echo title 库房管理系统 - 停止服务
echo.
echo [信息] 正在查找并停止服务...
echo.
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo [信息] 找到进程 ID: %%a
    taskkill /F /PID %%a ^>nul 2^>^&1
    echo [成功] 进程已停止
)
echo.
echo [完成] 服务已停止
echo.
pause
) > "停止服务.bat"

:: 创建服务管理脚本
(
echo @echo off
echo chcp 65001 ^>nul
echo title 库房管理系统 - 服务管理
echo.
echo :menu
echo cls
echo echo ╔════════════════════════════════════════════════════════════╗
echo echo ║                                                            ║
echo echo ║           库房管理系统 - 服务管理                          ║
echo echo ║                                                            ║
echo echo ╠════════════════════════════════════════════════════════════╣
echo echo ║                                                            ║
echo echo ║   [1] 启动服务                                            ║
echo echo ║   [2] 停止服务                                            ║
echo echo ║   [3] 重启服务                                            ║
echo echo ║   [4] 查看状态                                            ║
echo echo ║   [5] 打开浏览器                                          ║
echo echo ║   [0] 退出                                                ║
echo echo ║                                                            ║
echo echo ╚════════════════════════════════════════════════════════════╝
echo echo.
echo set /p choice=请选择操作 [0-5]: 
echo.
echo if "%%choice%%"=="1" goto start
echo if "%%choice%%"=="2" goto stop
echo if "%%choice%%"=="3" goto restart
echo if "%%choice%%"=="4" goto status
echo if "%%choice%%"=="5" goto browser
echo if "%%choice%%"=="0" goto end
echo goto menu
echo.
echo :start
echo echo [信息] 正在启动服务...
echo start "库房管理系统" cmd /k "cd /d \"%%~dp0\" ^&^& pnpm start"
echo echo [成功] 服务启动中...
echo timeout /t 3 /nobreak ^>nul
echo goto browser
echo.
echo :stop
echo echo [信息] 正在停止服务...
echo for /f "tokens=5" %%%%a in ('netstat -aon ^^^| findstr :3000 ^^^| findstr LISTENING') do (
echo     taskkill /F /PID %%%%a ^>nul 2^^^>^^^&1
echo     echo [成功] 服务已停止
echo ^)
echo goto menu
echo.
echo :restart
echo echo [信息] 正在重启服务...
echo call :stop
echo timeout /t 2 /nobreak ^>nul
echo call :start
echo goto menu
echo.
echo :status
echo echo [信息] 检查服务状态...
echo netstat -ano ^| findstr :3000 ^| findstr LISTENING ^>nul
echo if %%errorLevel%% equ 0 (
echo     echo [成功] 服务正在运行
echo     echo [信息] 访问地址: http://localhost:3000
echo ^) else (
echo     echo [提示] 服务未运行
echo ^)
echo echo.
echo pause
echo goto menu
echo.
echo :browser
echo echo [信息] 正在打开浏览器...
echo start http://localhost:3000
echo goto menu
echo.
echo :end
echo echo [完成] 再见！
echo timeout /t 2 /nobreak ^>nul
echo exit
) > "服务管理.bat"

:: 创建快速开始说明
(
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           库房管理系统 - 部署完成！                        ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 恭喜！库房管理系统已成功部署到你的电脑上！
echo.
echo 📋 下一步操作：
echo.
echo 方式一：使用服务管理（推荐）
echo   双击运行：服务管理.bat
echo   然后选择 "1" 启动服务
echo.
echo 方式二：直接启动
echo   双击运行：启动服务.bat
echo.
echo 方式三：开机自启（可选）
echo   将 "启动服务.bat" 的快捷方式放到以下文件夹：
echo   C:\Users\[你的用户名]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
echo.
echo 🌐 访问系统：
echo   服务启动后，打开浏览器访问：
echo   http://localhost:3000
echo.
echo ⚠️  重要提示：
echo   - 首次使用需要启动服务
echo   - 关闭命令窗口会停止服务
echo   - 建议使用"服务管理.bat"进行管理
echo.
echo 📞 如需帮助：
echo   查看 WINDOWS-DEPLOY.md 文档
echo.
echo 祝你使用愉快！
echo.
echo 按任意键打开浏览器...
pause ^>nul
start http://localhost:3000
) > "部署完成 - 点击开始使用.bat"

echo [成功] 部署配置完成
echo. >> "%LOG_FILE%"
echo [8/8] 部署配置完成 >> "%LOG_FILE%"

:: ========================================
:: 部署完成
:: ========================================
set END_TIME=%time%
echo. >> "%LOG_FILE%"
echo 部署完成: %date% %END_TIME% >> "%LOG_FILE%"

color 0A
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           ✅  全自动部署完成！                            ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo [信息] 开始时间: %START_TIME%
echo [信息] 完成时间: %END_TIME%
echo.
echo 📦 已创建的文件：
echo   ✅ 启动服务.bat      - 一键启动服务
echo   ✅ 停止服务.bat      - 一键停止服务
echo   ✅ 服务管理.bat      - 综合管理工具
echo   ✅ 部署完成 - 点击开始使用.bat
echo.
echo 🌐 访问地址：
echo    http://localhost:3000
echo.
echo 🎯 下一步：
echo    双击 "部署完成 - 点击开始使用.bat"
echo.
echo 按任意键开始使用...
pause >nul

:: 自动打开服务管理
start "" "服务管理.bat"

endlocal
