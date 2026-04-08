@echo off
chcp 65001 >nul
echo ========================================
echo   库房管理系统 - 阿里云部署工具
echo ========================================
echo.

echo 请选择操作：
echo.
echo 1. 打包项目（生成tar.gz）
echo 2. 上传到服务器
echo 3. 查看部署文档
echo 4. 退出
echo.
set /p choice=请输入选项 (1-4): 

if "%choice%"=="1" goto package
if "%choice%"=="2" goto upload
if "%choice%"=="3" goto docs
if "%choice%"=="4" goto end
echo 无效选项！
pause
goto end

:package
echo.
echo ========================================
echo   正在打包项目...
echo ========================================
echo.

REM 使用Git Bash打包
if exist "C:\Program Files\Git\bin\bash.exe" (
    "C:\Program Files\Git\bin\bash.exe" package-for-aliyun.sh
) else if exist "C:\Program Files\Git\usr\bin\bash.exe" (
    "C:\Program Files\Git\usr\bin\bash.exe" package-for-aliyun.sh
) else (
    echo 错误：未找到Git Bash，请先安装Git for Windows
    echo 下载地址：https://git-scm.com/download/win
    pause
    goto end
)

echo.
echo 打包完成！请记下生成的文件名
pause
goto menu

:upload
echo.
echo ========================================
echo   上传到阿里云服务器
echo ========================================
echo.

set /p server_ip=请输入服务器IP: 
set /p package_file=请输入打包文件名: 

if "%server_ip%"=="" (
    echo 错误：服务器IP不能为空！
    pause
    goto menu
)

if "%package_file%"=="" (
    echo 错误：打包文件名不能为空！
    pause
    goto menu
)

echo.
echo 正在上传到 %server_ip%...
echo.

REM 使用scp上传
"C:\Program Files\Git\usr\bin\scp.exe" "%package_file%" "root@%server_ip%:/root/"

if %errorlevel% equ 0 (
    echo.
    echo ✅ 上传成功！
    echo.
    echo 下一步：
    echo 1. SSH登录服务器：ssh root@%server_ip%
    echo 2. 运行部署脚本：bash aliyun-deploy.sh
) else (
    echo.
    echo ❌ 上传失败，请检查：
    echo - 服务器IP是否正确
    echo - SSH端口22是否开放
    echo - 是否安装了OpenSSH
)

pause
goto menu

:docs
echo.
echo ========================================
echo   打开部署文档
echo ========================================
echo.

if exist "DEPLOYMENT-ALIYUN.md" (
    start DEPLOYMENT-ALIYUN.md
    echo 已打开部署文档
) else (
    echo 错误：未找到部署文档
)

pause
goto menu

:menu
cls
goto start

:start
echo 请选择操作：
echo.
echo 1. 打包项目（生成tar.gz）
echo 2. 上传到服务器
echo 3. 查看部署文档
echo 4. 退出
echo.
set /p choice=请输入选项 (1-4): 

if "%choice%"=="1" goto package
if "%choice%"=="2" goto upload
if "%choice%"=="3" goto docs
if "%choice%"=="4" goto end
echo 无效选项！
pause
goto end

:end
echo.
echo 感谢使用！
pause
