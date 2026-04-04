
# 库房管理系统 - Coze 平台完整实施方案

## 🎯 目标

在 Coze 平台部署库房管理系统，实现多用户通过浏览器访问，数据集中存储和同步。

---

## 📋 已完成的工作

### 1. 数据库 Schema 已创建
- ✅ 完整的数据库表结构定义（Drizzle ORM）
- ✅ 包含所有必要的表：商品、仓库、入库、出库、盘点、调拨、审核等
- ✅ RLS 策略已配置（允许公开访问）

### 2. 前端页面已创建
- ✅ 库存看板
- ✅ 商品管理
- ✅ 仓库管理
- ✅ 组织架构管理
- ✅ 用户管理
- ✅ 角色管理
- ✅ 入库管理
- ✅ 出库管理
- ✅ 库存盘点
- ✅ 调拨管理
- ✅ 审核中心
- ✅ 系统设置

### 3. 服务层已开始创建
- ✅ 商品服务 (product-service.ts)
- ✅ 仓库服务 (warehouse-service.ts)
- ✅ 组织架构服务 (organization-service.ts)
- ✅ 用户服务 (user-service.ts)
- ✅ 角色服务 (role-service.ts)

### 4. API 路由已开始创建
- ✅ 健康检查 API (`/api/health`)
- ✅ 商品管理 API (`/api/products`)

---

## 🔧 需要完成的工作

### 第一步：确认 Supabase 集成

**在 Coze 平台操作：**

1. **检查 Supabase 集成是否已配置
   - 进入 Coze 控制台
   - 查看"集成"或"设置"页面
   - 确认 Supabase 集成是否已添加

2. **如果 Supabase 未配置：
   - 添加 Supabase 集成
   - 输入您的 Supabase 项目 URL
   - 输入您的 Supabase Anon Key
   - 输入您的 Supabase Service Role Key（可选）

3. **验证环境变量：**
   部署后，系统会自动设置以下环境变量：
   ```
   COZE_SUPABASE_URL
   COZE_SUPABASE_ANON_KEY
   COZE_SUPABASE_SERVICE_ROLE_KEY
   ```

---

### 第二步：创建完整的 API 路由

需要为所有模块创建 API 路由：

| 模块 | API 路径 | 状态 |
|------|---------|------|
| 健康检查 | `/api/health` | ✅ 已完成 |
| 商品管理 | `/api/products` | ✅ 已完成 |
| 商品详情 | `/api/products/[id]` | ✅ 已完成 |
| 仓库管理 | `/api/warehouses` | ❌ 待创建 |
| 仓库详情 | `/api/warehouses/[id]` | ❌ 待创建 |
| 组织架构 | `/api/organizations` | ❌ 待创建 |
| 用户管理 | `/api/users` | ❌ 待创建 |
| 角色管理 | `/api/roles` | ❌ 待创建 |
| 入库管理 | `/api/inbound` | ❌ 待创建 |
| 出库管理 | `/api/outbound` | ❌ 待创建 |
| 库存盘点 | `/api/stock-count` | ❌ 待创建 |
| 调拨管理 | `/api/transfer` | ❌ 待创建 |
| 审核管理 | `/api/approvals` | ❌ 待创建 |

---

### 第三步：修改服务层调用 API

修改现有的服务层，让它们调用后端 API 而不是直接调用 Supabase 或 localStorage。

**示例：修改 product-service.ts**

```typescript
// 改为调用 API：
const API_BASE = '/api';

export async function fetchProducts() {
  const response = await fetch(`${API_BASE}/products`);
  return response.json();
}

export async function createProduct(data: ProductFormData) {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

---

### 第四步：迁移审核相关功能

1. **创建审核服务 (approval-service.ts)
2. **创建审核 API 路由**
3. **修改审核页面使用真实数据**
4. **修改审核待办统计读取真实数据**

---

## 🚀 快速开始方案

### 方案 A：快速部署现有版本（1-2天）

如果您想快速看到效果：

1. **使用现有的 localStorage 方案
2. **单用户可以完全正常工作
3. **虽然不能跨设备同步，但功能完整
4. **部署到 Coze 平台测试基本功能

### 方案 B：完整 API 版本（3-5天）

完整实现所有 API 路由和服务层：

1. **创建所有 API 路由
2. **修改所有服务层调用 API
3. **测试完整的数据流
4. **实现真正的多用户数据同步

### 方案 C：分阶段实施（推荐）

**第一阶段：
- [ ] 部署现有系统到 Coze 平台
- [ ] 确认 Supabase 集成配置
- [ ] 测试单用户功能正常
- [ ] 确认环境变量正确

**第二阶段：**
- [ ] 创建核心模块 API（商品、仓库）
- [ ] 测试数据可以保存到数据库
- [ ] 验证数据可以跨设备同步

**第三阶段：**
- [ ] 创建其他模块 API
- [ ] 完整的审核功能
- [ ] 完整的多用户系统

---

## 📞 已创建的文件说明

### 1. `/api/health/route.ts`
健康检查端点，验证服务是否正常运行。

### 2. `/api/products/route.ts`
商品列表的 GET 和 POST 端点。

### 3. `/api/products/[id]/route.ts`
单个商品的 GET、PUT、DELETE 端点。

---

## ⚡ 立即可以做的测试

### 1. 测试健康检查

部署后，访问：
```
https://your-domain.coze.site/api/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 测试商品 API

访问：
```
https://your-domain.coze.site/api/products
```

应该返回商品列表。

---

## 🎯 下一步行动

请告诉我：

1. **您想选择哪个方案？（A/B/C）
2. **Supabase 集成是否已在 Coze 平台配置？**
3. **您希望我优先完成哪些部分？**

根据您的选择，我可以继续完善系统！
