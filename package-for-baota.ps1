# 库房管理系统 - Windows 打包上传脚本（宝塔面板版）
# 使用方法：在 PowerShell 中运行
# .\package-for-baota.ps1

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  库房管理系统 - 打包上传脚本（宝塔面板）" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 配置变量
$ProjectName = "warehouse-system"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$PackageName = "${ProjectName}_${Timestamp}.tar.gz"
$TempDir = Join-Path $env:TEMP $ProjectName
$SourceDir = Get-Location

# 检查是否在正确的目录
if (-not (Test-Path "package.json")) {
    Write-Host "错误：请在项目根目录运行此脚本" -ForegroundColor Red
    Write-Host "当前目录: $SourceDir" -ForegroundColor Yellow
    exit 1
}

Write-Host "正在打包项目..." -ForegroundColor Green
Write-Host "源目录: $SourceDir" -ForegroundColor Gray
Write-Host ""

# 创建临时目录
if (Test-Path $TempDir) {
    Remove-Item -Recurse -Force $TempDir
}
New-Item -ItemType Directory -Path $TempDir | Out-Null
$DestDir = Join-Path $TempDir $ProjectName
New-Item -ItemType Directory -Path $DestDir | Out-Null

# 复制文件（排除不需要的目录）
Write-Host "正在复制项目文件..." -ForegroundColor Yellow

$ExcludeDirs = @('node_modules', '.next', '.git', '.vscode', '.qoder', 'deploy')
$ExcludeFiles = @('.env', '.env.local', '.env.*.local')
$KeepMdFiles = @('DEPLOYMENT.md', 'README.md')

$FileCount = 0
Get-ChildItem -Path $SourceDir -Recurse | Where-Object {
    $relativePath = $_.FullName.Replace($SourceDir, '').TrimStart('\')
    $shouldExclude = $false
    
    # 排除指定目录
    foreach ($dir in $ExcludeDirs) {
        if ($relativePath -like "$dir*" -or $relativePath -like "*\$dir*" -or $relativePath -like "$dir\*") {
            $shouldExclude = $true
            break
        }
    }
    
    # 排除指定文件
    if (-not $shouldExclude) {
        foreach ($file in $ExcludeFiles) {
            $pattern = $file -replace '\*', '.*'
            if ($_.Name -match "^$pattern$") {
                $shouldExclude = $true
                break
            }
        }
    }
    
    # 排除所有 .md 文件，但保留必要的
    if (-not $shouldExclude -and $_.Extension -eq '.md') {
        if ($_.Name -notin $KeepMdFiles) {
            $shouldExclude = $true
        }
    }
    
    -not $shouldExclude
} | ForEach-Object {
    $relativePath = $_.FullName.Replace($SourceDir, '').TrimStart('\')
    $destPath = Join-Path $DestDir $relativePath
    
    if ($_.PSIsContainer) {
        if (-not (Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        }
    } else {
        $destDirPath = Split-Path $destPath -Parent
        if (-not (Test-Path $destDirPath)) {
            New-Item -ItemType Directory -Path $destDirPath -Force | Out-Null
        }
        Copy-Item -Path $_.FullName -Destination $destPath -Force
        $FileCount++
    }
}

Write-Host "  已复制 $FileCount 个文件" -ForegroundColor Gray
Write-Host ""

# 创建压缩包
Write-Host "正在创建压缩包..." -ForegroundColor Yellow

$PackagePath = Join-Path $env:TEMP $PackageName

# 使用 tar 命令打包（Windows 10+ 内置支持）
Push-Location $TempDir
try {
    tar -czf $PackagePath $ProjectName
} catch {
    Write-Host "错误：打包失败" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# 清理临时目录
Remove-Item -Recurse -Force $TempDir

# 显示结果
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  打包完成！" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "文件位置: $PackagePath" -ForegroundColor Yellow

$FileSize = [math]::Round((Get-Item $PackagePath).Length / 1MB, 2)
Write-Host "文件大小: ${FileSize} MB" -ForegroundColor Yellow
Write-Host ""

# 询问是否上传
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  上传到服务器" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$Upload = Read-Host "是否现在上传到服务器？(y/n)"
if ($Upload -eq 'y' -or $Upload -eq 'Y') {
    Write-Host ""
    $ServerIP = Read-Host "服务器 IP 地址"
    $ServerUser = Read-Host "服务器用户名（默认: root）"
    if ([string]::IsNullOrWhiteSpace($ServerUser)) {
        $ServerUser = "root"
    }
    $ServerPort = Read-Host "SSH 端口（默认: 22）"
    if ([string]::IsNullOrWhiteSpace($ServerPort)) {
        $ServerPort = "22"
    }
    
    Write-Host ""
    Write-Host "正在上传到服务器..." -ForegroundColor Green
    Write-Host "提示：首次连接需要输入服务器密码" -ForegroundColor Yellow
    Write-Host ""
    
    # 上传文件
    $ScpCommand = "scp -P $ServerPort `"$PackagePath`" ${ServerUser}@${ServerIP}:/www/wwwroot/"
    Write-Host "执行命令: $ScpCommand" -ForegroundColor Gray
    
    try {
        Invoke-Expression $ScpCommand
        Write-Host ""
        Write-Host "上传完成！" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "上传失败，请手动上传" -ForegroundColor Red
        Write-Host "错误信息: $_" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  下一步操作" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. SSH 登录服务器:" -ForegroundColor Yellow
    Write-Host "   ssh -P $ServerPort ${ServerUser}@${ServerIP}" -ForegroundColor White
    Write-Host ""
    Write-Host "2. 解压文件:" -ForegroundColor Yellow
    Write-Host "   cd /www/wwwroot" -ForegroundColor White
    Write-Host "   tar -xzf $PackageName" -ForegroundColor White
    Write-Host ""
    Write-Host "3. 运行部署脚本:" -ForegroundColor Yellow
    Write-Host "   cd $ProjectName" -ForegroundColor White
    Write-Host "   chmod +x baota-deploy.sh" -ForegroundColor White
    Write-Host "   sudo ./baota-deploy.sh" -ForegroundColor White
    Write-Host ""
    Write-Host "4. 在宝塔面板配置反向代理（部署脚本会提供详细指引）" -ForegroundColor Yellow
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  手动上传指引" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "方法一：使用宝塔面板" -ForegroundColor Yellow
    Write-Host "  1. 登录宝塔面板" -ForegroundColor White
    Write-Host "  2. 点击 '文件' 菜单" -ForegroundColor White
    Write-Host "  3. 进入 /www/wwwroot 目录" -ForegroundColor White
    Write-Host "  4. 点击 '上传' 按钮" -ForegroundColor White
    Write-Host "  5. 选择文件: $PackagePath" -ForegroundColor White
    Write-Host "  6. 上传完成后右键解压" -ForegroundColor White
    Write-Host ""
    Write-Host "方法二：使用 SFTP 工具（如 WinSCP、FileZilla）" -ForegroundColor Yellow
    Write-Host "  1. 连接到服务器" -ForegroundColor White
    Write-Host "  2. 上传到 /www/wwwroot 目录" -ForegroundColor White
    Write-Host "  3. 解压文件" -ForegroundColor White
    Write-Host ""
    Write-Host "方法三：使用命令行" -ForegroundColor Yellow
    Write-Host "  scp -P 22 `"$PackagePath`" root@你的服务器IP:/www/wwwroot/" -ForegroundColor White
    Write-Host ""
    Write-Host "在服务器上执行：" -ForegroundColor Yellow
    Write-Host "  cd /www/wwwroot" -ForegroundColor White
    Write-Host "  tar -xzf $PackageName" -ForegroundColor White
    Write-Host "  cd $ProjectName" -ForegroundColor White
    Write-Host "  chmod +x baota-deploy.sh" -ForegroundColor White
    Write-Host "  sudo ./baota-deploy.sh" -ForegroundColor White
    Write-Host ""
}

# 清理
if (Test-Path $PackagePath) {
    Remove-Item -Force $PackagePath
}

Write-Host "完成！" -ForegroundColor Green
Write-Host ""
