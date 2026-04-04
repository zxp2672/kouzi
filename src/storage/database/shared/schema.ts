import { pgTable, serial, timestamp, varchar, integer, numeric, text, boolean, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 仓库表
export const warehouses = pgTable(
  "warehouses",
  {
    id: serial().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    address: text("address"),
    manager: varchar("manager", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("warehouses_code_idx").on(table.code),
    index("warehouses_is_active_idx").on(table.is_active),
  ]
);

// 商品表
export const products = pgTable(
  "products",
  {
    id: serial().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    category: varchar("category", { length: 100 }),
    unit: varchar("unit", { length: 20 }).notNull(), // 单位：个、箱、件等
    specification: varchar("specification", { length: 200 }), // 规格
    barcode: varchar("barcode", { length: 50 }), // 条形码
    purchase_price: numeric("purchase_price", { precision: 10, scale: 2 }), // 采购价
    selling_price: numeric("selling_price", { precision: 10, scale: 2 }), // 销售价
    min_stock: integer("min_stock").default(0), // 最小库存预警
    max_stock: integer("max_stock"), // 最大库存
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("products_code_idx").on(table.code),
    index("products_category_idx").on(table.category),
    index("products_barcode_idx").on(table.barcode),
    index("products_is_active_idx").on(table.is_active),
  ]
);

// 库存表
export const inventory = pgTable(
  "inventory",
  {
    id: serial().primaryKey(),
    warehouse_id: integer("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
    product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    locked_quantity: integer("locked_quantity").default(0), // 锁定数量（订单占用）
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("inventory_warehouse_id_idx").on(table.warehouse_id),
    index("inventory_product_id_idx").on(table.product_id),
  ]
);

// 入库单表
export const inboundOrders = pgTable(
  "inbound_orders",
  {
    id: serial().primaryKey(),
    order_no: varchar("order_no", { length: 50 }).notNull().unique(),
    warehouse_id: integer("warehouse_id").notNull().references(() => warehouses.id),
    supplier: varchar("supplier", { length: 200 }), // 供应商
    type: varchar("type", { length: 20 }).notNull(), // 入库类型：采购入库、退货入库、调拨入库等
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 状态：pending-待审核, approved-已审核, rejected-已拒绝
    remark: text("remark"), // 备注
    created_by: varchar("created_by", { length: 100 }), // 创建人
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
    approved_at: timestamp("approved_at", { withTimezone: true }), // 审核时间
    approved_by: varchar("approved_by", { length: 100 }), // 审核人
  },
  (table) => [
    index("inbound_orders_order_no_idx").on(table.order_no),
    index("inbound_orders_warehouse_id_idx").on(table.warehouse_id),
    index("inbound_orders_status_idx").on(table.status),
    index("inbound_orders_type_idx").on(table.type),
    index("inbound_orders_created_at_idx").on(table.created_at),
  ]
);

// 入库单明细表
export const inboundItems = pgTable(
  "inbound_items",
  {
    id: serial().primaryKey(),
    order_id: integer("order_id").notNull().references(() => inboundOrders.id, { onDelete: "cascade" }),
    product_id: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(), // 入库数量
    price: numeric("price", { precision: 10, scale: 2 }), // 单价
    batch_no: varchar("batch_no", { length: 50 }), // 批次号
    production_date: timestamp("production_date", { withTimezone: true }), // 生产日期
    expiry_date: timestamp("expiry_date", { withTimezone: true }), // 有效期
    remark: text("remark"),
  },
  (table) => [
    index("inbound_items_order_id_idx").on(table.order_id),
    index("inbound_items_product_id_idx").on(table.product_id),
  ]
);

// 出库单表
export const outboundOrders = pgTable(
  "outbound_orders",
  {
    id: serial().primaryKey(),
    order_no: varchar("order_no", { length: 50 }).notNull().unique(),
    warehouse_id: integer("warehouse_id").notNull().references(() => warehouses.id),
    customer: varchar("customer", { length: 200 }), // 客户
    type: varchar("type", { length: 20 }).notNull(), // 出库类型：销售出库、退货出库、调拨出库等
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 状态：pending-待审核, approved-已审核, rejected-已拒绝
    remark: text("remark"), // 备注
    created_by: varchar("created_by", { length: 100 }), // 创建人
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
    approved_at: timestamp("approved_at", { withTimezone: true }), // 审核时间
    approved_by: varchar("approved_by", { length: 100 }), // 审核人
  },
  (table) => [
    index("outbound_orders_order_no_idx").on(table.order_no),
    index("outbound_orders_warehouse_id_idx").on(table.warehouse_id),
    index("outbound_orders_status_idx").on(table.status),
    index("outbound_orders_type_idx").on(table.type),
    index("outbound_orders_created_at_idx").on(table.created_at),
  ]
);

// 出库单明细表
export const outboundItems = pgTable(
  "outbound_items",
  {
    id: serial().primaryKey(),
    order_id: integer("order_id").notNull().references(() => outboundOrders.id, { onDelete: "cascade" }),
    product_id: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(), // 出库数量
    price: numeric("price", { precision: 10, scale: 2 }), // 单价
    remark: text("remark"),
  },
  (table) => [
    index("outbound_items_order_id_idx").on(table.order_id),
    index("outbound_items_product_id_idx").on(table.product_id),
  ]
);

// 盘点单表
export const stockCounts = pgTable(
  "stock_counts",
  {
    id: serial().primaryKey(),
    order_no: varchar("order_no", { length: 50 }).notNull().unique(),
    warehouse_id: integer("warehouse_id").notNull().references(() => warehouses.id),
    status: varchar("status", { length: 20 }).notNull().default("draft"), // 状态：draft-草稿, pending-待审核, approved-已审核, rejected-已拒绝
    count_date: timestamp("count_date", { withTimezone: true }).notNull(), // 盘点日期
    remark: text("remark"), // 备注
    created_by: varchar("created_by", { length: 100 }), // 创建人
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
    approved_at: timestamp("approved_at", { withTimezone: true }), // 审核时间
    approved_by: varchar("approved_by", { length: 100 }), // 审核人
  },
  (table) => [
    index("stock_counts_order_no_idx").on(table.order_no),
    index("stock_counts_warehouse_id_idx").on(table.warehouse_id),
    index("stock_counts_status_idx").on(table.status),
    index("stock_counts_count_date_idx").on(table.count_date),
  ]
);

// 盘点单明细表
export const stockCountItems = pgTable(
  "stock_count_items",
  {
    id: serial().primaryKey(),
    order_id: integer("order_id").notNull().references(() => stockCounts.id, { onDelete: "cascade" }),
    product_id: integer("product_id").notNull().references(() => products.id),
    system_quantity: integer("system_quantity").notNull(), // 系统库存
    actual_quantity: integer("actual_quantity").notNull(), // 实盘数量
    difference: integer("difference"), // 差异数量
    remark: text("remark"),
  },
  (table) => [
    index("stock_count_items_order_id_idx").on(table.order_id),
    index("stock_count_items_product_id_idx").on(table.product_id),
  ]
);

// 调拨单表
export const transferOrders = pgTable(
  "transfer_orders",
  {
    id: serial().primaryKey(),
    order_no: varchar("order_no", { length: 50 }).notNull().unique(),
    from_warehouse_id: integer("from_warehouse_id").notNull().references(() => warehouses.id),
    to_warehouse_id: integer("to_warehouse_id").notNull().references(() => warehouses.id),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 状态：pending-待审核, approved-已审核, rejected-已拒绝, completed-已完成
    remark: text("remark"), // 备注
    created_by: varchar("created_by", { length: 100 }), // 创建人
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
    approved_at: timestamp("approved_at", { withTimezone: true }), // 审核时间
    approved_by: varchar("approved_by", { length: 100 }), // 审核人
    completed_at: timestamp("completed_at", { withTimezone: true }), // 完成时间
    completed_by: varchar("completed_by", { length: 100 }), // 完成人
  },
  (table) => [
    index("transfer_orders_order_no_idx").on(table.order_no),
    index("transfer_orders_from_warehouse_id_idx").on(table.from_warehouse_id),
    index("transfer_orders_to_warehouse_id_idx").on(table.to_warehouse_id),
    index("transfer_orders_status_idx").on(table.status),
    index("transfer_orders_created_at_idx").on(table.created_at),
  ]
);

// 调拨单明细表
export const transferItems = pgTable(
  "transfer_items",
  {
    id: serial().primaryKey(),
    order_id: integer("order_id").notNull().references(() => transferOrders.id, { onDelete: "cascade" }),
    product_id: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(), // 调拨数量
    remark: text("remark"),
  },
  (table) => [
    index("transfer_items_order_id_idx").on(table.order_id),
    index("transfer_items_product_id_idx").on(table.product_id),
  ]
);

// 角色表
export const roles = pgTable(
  "roles",
  {
    id: serial().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    level: integer("level").default(1),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("roles_code_idx").on(table.code),
    index("roles_level_idx").on(table.level),
    index("roles_is_active_idx").on(table.is_active),
  ]
);

// 权限表
export const permissions = pgTable(
  "permissions",
  {
    id: serial().primaryKey(),
    code: varchar("code", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    module: varchar("module", { length: 50 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("permissions_code_idx").on(table.code),
    index("permissions_module_idx").on(table.module),
  ]
);

// 角色权限关联表
export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: serial().primaryKey(),
    role_id: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    permission_id: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("role_permissions_role_id_idx").on(table.role_id),
    index("role_permissions_permission_id_idx").on(table.permission_id),
  ]
);

// 用户表
export const users = pgTable(
  "users",
  {
    id: serial().primaryKey(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    password: varchar("password", { length: 255 }),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    role_id: integer("role_id").references(() => roles.id),
    department: varchar("department", { length: 100 }),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("users_username_idx").on(table.username),
    index("users_role_id_idx").on(table.role_id),
    index("users_is_active_idx").on(table.is_active),
  ]
);

// 用户仓库关联表
export const userWarehouses = pgTable(
  "user_warehouses",
  {
    id: serial().primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    warehouse_id: integer("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
    is_default: boolean("is_default").default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("user_warehouses_user_id_idx").on(table.user_id),
    index("user_warehouses_warehouse_id_idx").on(table.warehouse_id),
  ]
);

// 审核流程配置表
export const approvalFlows = pgTable(
  "approval_flows",
  {
    id: serial().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    module: varchar("module", { length: 50 }).notNull(),
    description: text("description"),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("approval_flows_code_idx").on(table.code),
    index("approval_flows_module_idx").on(table.module),
    index("approval_flows_is_active_idx").on(table.is_active),
  ]
);

// 审核流程节点表
export const approvalFlowNodes = pgTable(
  "approval_flow_nodes",
  {
    id: serial().primaryKey(),
    flow_id: integer("flow_id").notNull().references(() => approvalFlows.id, { onDelete: "cascade" }),
    step_order: integer("step_order").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    role_id: integer("role_id").references(() => roles.id),
    min_level: integer("min_level").default(1),
    approver_user_id: integer("approver_user_id").references(() => users.id),
    is_final: boolean("is_final").default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("approval_flow_nodes_flow_id_idx").on(table.flow_id),
    index("approval_flow_nodes_step_order_idx").on(table.step_order),
  ]
);

// 审核记录表
export const approvalRecords = pgTable(
  "approval_records",
  {
    id: serial().primaryKey(),
    module: varchar("module", { length: 50 }).notNull(),
    order_id: integer("order_id").notNull(),
    flow_node_id: integer("flow_node_id").references(() => approvalFlowNodes.id),
    step_order: integer("step_order").notNull(),
    approver_id: integer("approver_id").references(() => users.id),
    approver_name: varchar("approver_name", { length: 100 }),
    status: varchar("status", { length: 20 }).notNull(),
    comment: text("comment"),
    approved_at: timestamp("approved_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("approval_records_module_order_id_idx").on(table.module, table.order_id),
    index("approval_records_approver_id_idx").on(table.approver_id),
  ]
);

// 组织架构表（支持多级结构）
export const organizations = pgTable(
  "organizations",
  {
    id: serial().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 组织类型：公安局机关、公安处机关、所队
    level: integer("level").notNull(), // 组织层级：1-公安局机关, 2-公安处机关, 3-所队
    parent_id: integer("parent_id"), // 父组织ID，顶级组织为null
    path: varchar("path", { length: 500 }), // 路径，如"1.2.3"格式，便于查询下级
    sort_order: integer("sort_order").default(0),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("organizations_code_idx").on(table.code),
    index("organizations_type_idx").on(table.type),
    index("organizations_level_idx").on(table.level),
    index("organizations_parent_id_idx").on(table.parent_id),
    index("organizations_path_idx").on(table.path),
    index("organizations_is_active_idx").on(table.is_active),
  ]
);

// 用户组织关联表
export const userOrganizations = pgTable(
  "user_organizations",
  {
    id: serial().primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    organization_id: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    is_default: boolean("is_default").default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("user_organizations_user_id_idx").on(table.user_id),
    index("user_organizations_organization_id_idx").on(table.organization_id),
  ]
);

// 仓库组织关联表
export const warehouseOrganizations = pgTable(
  "warehouse_organizations",
  {
    id: serial().primaryKey(),
    warehouse_id: integer("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
    organization_id: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("warehouse_organizations_warehouse_id_idx").on(table.warehouse_id),
    index("warehouse_organizations_organization_id_idx").on(table.organization_id),
  ]
);
