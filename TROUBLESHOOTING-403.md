# Nginx 403 Forbidden 错误排查指南

## 常见原因和解决方案

### 问题1：文件权限不正确

**症状**：访问任何页面都返回 403

**解决**：

```bash
# 1. 检查应用目录权限
ls -la /opt/warehouse-system

# 2. 确保目录和文件权限正确
sudo chown -R $USER:$USER /opt/warehouse-system
sudo chmod -R 755 /opt/warehouse-system

# 3. 检查 public 目录权限
ls -la /opt/warehouse-system/public
sudo chmod -R 755 /opt/warehouse-system/public
```

### 问题2：Nginx 用户权限

**症状**：Nginx 没有权限访问文件

**解决**：

```bash
# 1. 查看 Nginx 运行用户
ps aux | grep nginx

# 通常是 www-data 用户，确保文件对其可读
sudo chown -R $USER:www-data /opt/warehouse-system
sudo chmod -R 755 /opt/warehouse-system
```

### 问题3：SELinux/AppArmor 限制

**症状**：权限看起来正确但仍 403

**解决**（Ubuntu）：

```bash
# 1. 检查 AppArmor 状态
sudo aa-status

# 2. 临时禁用 AppArmor 测试（仅用于测试）
sudo aa-complain /usr/sbin/nginx

# 3. 如果问题解决，需要正确配置 AppArmor
```

### 问题4：Nginx 配置错误

**症状**：配置文件有错误

**检查**：

```bash
# 1. 测试 Nginx 配置
sudo nginx -t

# 2. 查看 Nginx 错误日志
sudo tail -n 50 /var/log/nginx/error.log
sudo tail -n 50 /var/log/nginx/warehouse-error.log
```

### 问题5：Next.js 应用没有运行

**症状**：Nginx 正常但应用没启动

**检查**：

```bash
# 1. 检查 PM2 状态
pm2 status

# 2. 如果没运行，启动它
pm2 start warehouse-system

# 3. 查看应用日志
pm2 logs warehouse-system

# 4. 检查 3000 端口是否监听
ss -tlnp | grep :3000
# 或
netstat -tlnp | grep :3000
```

### 问题6：Nginx 配置中的 root 或 alias 错误

**检查配置文件**：

```bash
# 编辑配置
sudo nano /etc/nginx/sites-available/warehouse-system
```

确保配置是代理方式，不是静态文件方式：

```nginx
# ❌ 错误：配置了错误的 root
server {
    listen 80;
    root /opt/warehouse-system;  # 这会导致 403
    ...
}

# ✅ 正确：使用 proxy_pass
server {
    listen 80;
    location / {
        proxy_pass http://localhost:3000;  # 代理到应用
        ...
    }
}
```

## 完整排查步骤

### 步骤1：确认应用正在运行

```bash
# 1. 检查 PM2
pm2 status

# 2. 如果没有运行，启动
cd /opt/warehouse-system
pm2 start npm --name "warehouse-system" -- start

# 3. 等待几秒，查看日志
pm2 logs warehouse-system --lines 50

# 4. 测试应用是否响应
curl -I http://localhost:3000
```

### 步骤2：检查 Nginx 配置

```bash
# 1. 测试配置
sudo nginx -t

# 2. 如果有错误，修复后重启
sudo systemctl restart nginx

# 3. 查看 Nginx 状态
sudo systemctl status nginx
```

### 步骤3：检查文件权限

```bash
# 1. 设置正确的所有者
sudo chown -R $USER:www-data /opt/warehouse-system

# 2. 设置正确的权限
sudo chmod -R 755 /opt/warehouse-system

# 3. 确保 public 目录可读
sudo chmod -R 755 /opt/warehouse-system/public
```

### 步骤4：检查防火墙

```bash
# 1. 检查防火墙状态
sudo ufw status

# 2. 如果启用，确保允许 80 和 443
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 步骤5：查看详细日志

```bash
# 1. Nginx 错误日志
sudo tail -n 100 /var/log/nginx/error.log

# 2. Nginx 访问日志
sudo tail -n 100 /var/log/nginx/access.log

# 3. 应用日志
pm2 logs warehouse-system --lines 100
```

## 快速修复脚本

如果您不确定问题，可以运行这个快速修复：

```bash
#!/bin/bash
echo "开始修复 403 问题..."

# 1. 确保应用运行
cd /opt/warehouse-system
if ! pm2 list | grep -q "warehouse-system"; then
    echo "启动应用..."
    pm2 start npm --name "warehouse-system" -- start
    pm2 save
fi

# 2. 修复权限
echo "修复权限..."
sudo chown -R $USER:www-data /opt/warehouse-system
sudo chmod -R 755 /opt/warehouse-system

# 3. 重启 Nginx
echo "重启 Nginx..."
sudo nginx -t && sudo systemctl restart nginx

# 4. 检查状态
echo "检查状态..."
pm2 status
sudo systemctl status nginx

echo "完成！请测试访问。"
```

## 验证修复

执行上述步骤后，验证：

```bash
# 1. 本地测试应用
curl -I http://localhost:3000

# 2. 测试 Nginx
curl -I http://localhost

# 3. 如果有域名
curl -I http://your-domain.com
```

## 仍有问题？

如果以上方法都无法解决，请收集以下信息：

1. Nginx 错误日志：
```bash
sudo tail -n 100 /var/log/nginx/error.log
```

2. 应用日志：
```bash
pm2 logs warehouse-system --lines 100
```

3. Nginx 配置：
```bash
sudo cat /etc/nginx/sites-available/warehouse-system
```

4. 权限信息：
```bash
ls -la /opt/warehouse-system
ps aux | grep nginx
```
