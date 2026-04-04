import { relations } from "drizzle-orm/relations";
import { warehouses, inboundOrders, inventory, products, inboundItems, outboundOrders, outboundItems, stockCounts, stockCountItems, transferOrders, transferItems } from "./schema";

export const inboundOrdersRelations = relations(inboundOrders, ({one, many}) => ({
	warehouse: one(warehouses, {
		fields: [inboundOrders.warehouseId],
		references: [warehouses.id]
	}),
	inboundItems: many(inboundItems),
}));

export const warehousesRelations = relations(warehouses, ({many}) => ({
	inboundOrders: many(inboundOrders),
	inventories: many(inventory),
	outboundOrders: many(outboundOrders),
	stockCounts: many(stockCounts),
	transferOrders_fromWarehouseId: many(transferOrders, {
		relationName: "transferOrders_fromWarehouseId_warehouses_id"
	}),
	transferOrders_toWarehouseId: many(transferOrders, {
		relationName: "transferOrders_toWarehouseId_warehouses_id"
	}),
}));

export const inventoryRelations = relations(inventory, ({one}) => ({
	warehouse: one(warehouses, {
		fields: [inventory.warehouseId],
		references: [warehouses.id]
	}),
	product: one(products, {
		fields: [inventory.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	inventories: many(inventory),
	inboundItems: many(inboundItems),
	outboundItems: many(outboundItems),
	stockCountItems: many(stockCountItems),
	transferItems: many(transferItems),
}));

export const inboundItemsRelations = relations(inboundItems, ({one}) => ({
	inboundOrder: one(inboundOrders, {
		fields: [inboundItems.orderId],
		references: [inboundOrders.id]
	}),
	product: one(products, {
		fields: [inboundItems.productId],
		references: [products.id]
	}),
}));

export const outboundItemsRelations = relations(outboundItems, ({one}) => ({
	outboundOrder: one(outboundOrders, {
		fields: [outboundItems.orderId],
		references: [outboundOrders.id]
	}),
	product: one(products, {
		fields: [outboundItems.productId],
		references: [products.id]
	}),
}));

export const outboundOrdersRelations = relations(outboundOrders, ({one, many}) => ({
	outboundItems: many(outboundItems),
	warehouse: one(warehouses, {
		fields: [outboundOrders.warehouseId],
		references: [warehouses.id]
	}),
}));

export const stockCountItemsRelations = relations(stockCountItems, ({one}) => ({
	stockCount: one(stockCounts, {
		fields: [stockCountItems.orderId],
		references: [stockCounts.id]
	}),
	product: one(products, {
		fields: [stockCountItems.productId],
		references: [products.id]
	}),
}));

export const stockCountsRelations = relations(stockCounts, ({one, many}) => ({
	stockCountItems: many(stockCountItems),
	warehouse: one(warehouses, {
		fields: [stockCounts.warehouseId],
		references: [warehouses.id]
	}),
}));

export const transferOrdersRelations = relations(transferOrders, ({one, many}) => ({
	warehouse_fromWarehouseId: one(warehouses, {
		fields: [transferOrders.fromWarehouseId],
		references: [warehouses.id],
		relationName: "transferOrders_fromWarehouseId_warehouses_id"
	}),
	warehouse_toWarehouseId: one(warehouses, {
		fields: [transferOrders.toWarehouseId],
		references: [warehouses.id],
		relationName: "transferOrders_toWarehouseId_warehouses_id"
	}),
	transferItems: many(transferItems),
}));

export const transferItemsRelations = relations(transferItems, ({one}) => ({
	transferOrder: one(transferOrders, {
		fields: [transferItems.orderId],
		references: [transferOrders.id]
	}),
	product: one(products, {
		fields: [transferItems.productId],
		references: [products.id]
	}),
}));