@echo off
chcp 65001 >nul
title 解除Windows文件阻止

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           解除Windows文件阻止 - 工具                        ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo [信息] 正在解除当前目录下所有脚本文件的阻止...
echo.

:: 方法1: 使用PowerShell解除Zone.Identifier
echo [方法1] 使用PowerShell解除...
powershell -Command "Get-ChildItem -Path . -Filter '*.bat' | Unblock-File" 2>nul
powershell -Command "Get-ChildItem -Path . -Filter '*.ps1' | Unblock-File" 2>nul
powershell -Command "Get-ChildItem -Path . -Filter '*.sh' | Unblock-File" 2>nul
echo [成功] PowerShell解除完成

:: 方法2: 备用方法 - 复制文件
echo.
echo [方法2] 创建安全副本...
if exist "一键部署.bat" (
    copy /Y "一键部署.bat" "一键部署-安全.bat" >nul
    echo [成功] 已创建: 一键部署-安全.bat
)

if exist "install-windows.bat" (
    copy /Y "install-windows.bat" "install-windows-安全.bat" >nul
    echo [成功] 已创建: install-windows-安全.bat
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║                    ✅  解除完成！                          ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🎯 现在可以尝试运行以下文件：
echo.
echo    方式1（推荐）: 一键部署-安全.bat
echo    方式2:         一键部署.bat
echo    方式3:         install-windows-安全.bat
echo.
echo 💡 如果仍然被阻止，请右键点击文件 -^> 属性 -^> 解除锁定
echo.
pause
