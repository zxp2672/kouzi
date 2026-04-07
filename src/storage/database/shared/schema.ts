import { pgTable, index, foreignKey, unique, pgPolicy, serial, varchar, integer, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const inboundOrders = pgTable("inbound_orders", {
	id: serial().primaryKey().notNull(),
	orderNo: varchar("order_no", { length: 50 }).notNull(),
	warehouseId: integer("warehouse_id").notNull(),
	supplier: varchar({ length: 200 }),
	type: varchar({ length: 20 }).notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	remark: text(),
	createdBy: varchar("created_by", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	approvedBy: varchar("approved_by", { length: 100 }),
}, (table) => [
	index("inbound_orders_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("inbound_orders_order_no_idx").using("btree", table.orderNo.asc().nullsLast().op("text_ops")),
	index("inbound_orders_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("inbound_orders_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("inbound_orders_warehouse_id_idx").using("btree", table.warehouseId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.warehouseId],
			foreignColumns: [warehouses.id],
			name: "inbound_orders_warehouse_id_warehouses_id_fk"
		}),
	unique("inbound_orders_order_no_unique").on(table.orderNo),
	pgPolicy("inbound_orders_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("inbound_orders_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("inbound_orders_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("inbound_orders_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const inventory = pgTable("inventory", {
	id: serial().primaryKey().notNull(),
	warehouseId: integer("warehouse_id").notNull(),
	productId: integer("product_id").notNull(),
	quantity: integer().default(0).notNull(),
	lockedQuantity: integer("locked_quantity").default(0),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("inventory_product_id_idx").using("btree", table.productId.asc().nullsLast().op("int4_ops")),
	index("inventory_warehouse_id_idx").using("btree", table.warehouseId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.warehouseId],
			foreignColumns: [warehouses.id],
			name: "inventory_warehouse_id_warehouses_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "inventory_product_id_products_id_fk"
		}).onDelete("cascade"),
	pgPolicy("inventory_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("inventory_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("inventory_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("inventory_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const inboundItems = pgTable("inbound_items", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	productId: integer("product_id").notNull(),
	quantity: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }),
	batchNo: varchar("batch_no", { length: 50 }),
	productionDate: timestamp("production_date", { withTimezone: true, mode: 'string' }),
	expiryDate: timestamp("expiry_date", { withTimezone: true, mode: 'string' }),
	remark: text(),
}, (table) => [
	index("inbound_items_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
	index("inbound_items_product_id_idx").using("btree", table.productId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [inboundOrders.id],
			name: "inbound_items_order_id_inbound_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "inbound_items_product_id_products_id_fk"
		}),
	pgPolicy("inbound_items_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("inbound_items_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("inbound_items_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("inbound_items_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const outboundItems = pgTable("outbound_items", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	productId: integer("product_id").notNull(),
	quantity: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }),
	remark: text(),
}, (table) => [
	index("outbound_items_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
	index("outbound_items_product_id_idx").using("btree", table.productId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [outboundOrders.id],
			name: "outbound_items_order_id_outbound_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "outbound_items_product_id_products_id_fk"
		}),
	pgPolicy("outbound_items_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("outbound_items_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("outbound_items_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("outbound_items_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const outboundOrders = pgTable("outbound_orders", {
	id: serial().primaryKey().notNull(),
	orderNo: varchar("order_no", { length: 50 }).notNull(),
	warehouseId: integer("warehouse_id").notNull(),
	customer: varchar({ length: 200 }),
	type: varchar({ length: 20 }).notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	remark: text(),
	createdBy: varchar("created_by", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	approvedBy: varchar("approved_by", { length: 100 }),
}, (table) => [
	index("outbound_orders_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("outbound_orders_order_no_idx").using("btree", table.orderNo.asc().nullsLast().op("text_ops")),
	index("outbound_orders_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("outbound_orders_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("outbound_orders_warehouse_id_idx").using("btree", table.warehouseId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.warehouseId],
			foreignColumns: [warehouses.id],
			name: "outbound_orders_warehouse_id_warehouses_id_fk"
		}),
	unique("outbound_orders_order_no_unique").on(table.orderNo),
	pgPolicy("outbound_orders_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("outbound_orders_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("outbound_orders_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("outbound_orders_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const productCategories = pgTable("product_categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("product_categories_name_unique").on(table.name),
	pgPolicy("product_categories_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("product_categories_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("product_categories_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("product_categories_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const productUnits = pgTable("product_units", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("product_units_name_unique").on(table.name),
	pgPolicy("product_units_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("product_units_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("product_units_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("product_units_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	category: varchar({ length: 100 }),
	unit: varchar({ length: 20 }).notNull(),
	specification: varchar({ length: 200 }),
	barcode: varchar({ length: 50 }),
	purchasePrice: numeric("purchase_price", { precision: 10, scale:  2 }),
	sellingPrice: numeric("selling_price", { precision: 10, scale:  2 }),
	minStock: integer("min_stock").default(0),
	maxStock: integer("max_stock"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("products_barcode_idx").using("btree", table.barcode.asc().nullsLast().op("text_ops")),
	index("products_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("products_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("products_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	unique("products_code_unique").on(table.code),
	pgPolicy("products_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("products_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("products_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("products_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const stockCountItems = pgTable("stock_count_items", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	productId: integer("product_id").notNull(),
	systemQuantity: integer("system_quantity").notNull(),
	actualQuantity: integer("actual_quantity").notNull(),
	difference: integer(),
	remark: text(),
}, (table) => [
	index("stock_count_items_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
	index("stock_count_items_product_id_idx").using("btree", table.productId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [stockCounts.id],
			name: "stock_count_items_order_id_stock_counts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "stock_count_items_product_id_products_id_fk"
		}),
	pgPolicy("stock_count_items_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("stock_count_items_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("stock_count_items_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("stock_count_items_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const stockCounts = pgTable("stock_counts", {
	id: serial().primaryKey().notNull(),
	orderNo: varchar("order_no", { length: 50 }).notNull(),
	warehouseId: integer("warehouse_id").notNull(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	countDate: timestamp("count_date", { withTimezone: true, mode: 'string' }).notNull(),
	remark: text(),
	createdBy: varchar("created_by", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	approvedBy: varchar("approved_by", { length: 100 }),
}, (table) => [
	index("stock_counts_count_date_idx").using("btree", table.countDate.asc().nullsLast().op("timestamptz_ops")),
	index("stock_counts_order_no_idx").using("btree", table.orderNo.asc().nullsLast().op("text_ops")),
	index("stock_counts_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("stock_counts_warehouse_id_idx").using("btree", table.warehouseId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.warehouseId],
			foreignColumns: [warehouses.id],
			name: "stock_counts_warehouse_id_warehouses_id_fk"
		}),
	unique("stock_counts_order_no_unique").on(table.orderNo),
	pgPolicy("stock_counts_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("stock_counts_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("stock_counts_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("stock_counts_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const transferOrders = pgTable("transfer_orders", {
	id: serial().primaryKey().notNull(),
	orderNo: varchar("order_no", { length: 50 }).notNull(),
	fromWarehouseId: integer("from_warehouse_id").notNull(),
	toWarehouseId: integer("to_warehouse_id").notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	remark: text(),
	createdBy: varchar("created_by", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	approvedBy: varchar("approved_by", { length: 100 }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	completedBy: varchar("completed_by", { length: 100 }),
}, (table) => [
	index("transfer_orders_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("transfer_orders_from_warehouse_id_idx").using("btree", table.fromWarehouseId.asc().nullsLast().op("int4_ops")),
	index("transfer_orders_order_no_idx").using("btree", table.orderNo.asc().nullsLast().op("text_ops")),
	index("transfer_orders_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("transfer_orders_to_warehouse_id_idx").using("btree", table.toWarehouseId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.fromWarehouseId],
			foreignColumns: [warehouses.id],
			name: "transfer_orders_from_warehouse_id_warehouses_id_fk"
		}),
	foreignKey({
			columns: [table.toWarehouseId],
			foreignColumns: [warehouses.id],
			name: "transfer_orders_to_warehouse_id_warehouses_id_fk"
		}),
	unique("transfer_orders_order_no_unique").on(table.orderNo),
	pgPolicy("transfer_orders_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("transfer_orders_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("transfer_orders_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("transfer_orders_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const transferItems = pgTable("transfer_items", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	productId: integer("product_id").notNull(),
	quantity: integer().notNull(),
	remark: text(),
}, (table) => [
	index("transfer_items_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
	index("transfer_items_product_id_idx").using("btree", table.productId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [transferOrders.id],
			name: "transfer_items_order_id_transfer_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "transfer_items_product_id_products_id_fk"
		}),
	pgPolicy("transfer_items_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("transfer_items_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("transfer_items_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("transfer_items_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const warehouses = pgTable("warehouses", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	address: text(),
	manager: varchar({ length: 100 }),
	phone: varchar({ length: 20 }),
	organizationId: integer("organization_id"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("warehouses_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("warehouses_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	unique("warehouses_code_unique").on(table.code),
	pgPolicy("warehouses_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("warehouses_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("warehouses_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("warehouses_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);
