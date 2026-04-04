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
