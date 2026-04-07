/**
 * 库存管理服务
 * 处理库存查询、更新、扣减等操作
 */

import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { url } = getSupabaseCredentials();
    return url !== 'https://mock.supabase.co';
  } catch {
    return false;
  }
}

export interface InventoryItem {
  id: number;
  warehouse_id: number;
  product_id: number;
  quantity: number;
  updated_at: string;
  product?: {
    id: number;
    code: string;
    name: string;
    unit: string;
  };
  warehouse?: {
    id: number;
    code: string;
    name: string;
  };
}

/**
 * 获取仓库库存
 */
export async function getWarehouseInventory(warehouseId: number): Promise<InventoryItem[]> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    console.warn('Supabase 不可用，使用 localStorage');
    const key = `inventory_warehouse_${warehouseId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('inventory')
      .select(`
        *,
        product:products (
          id,
          code,
          name,
          unit
        ),
        warehouse:warehouses (
          id,
          code,
          name
        )
      `)
      .eq('warehouse_id', warehouseId)
      .order('product_id');

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('获取库存失败:', error);
    const key = `inventory_warehouse_${warehouseId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  }
}

/**
 * 获取产品在所有仓库的库存
 */
export async function getProductInventory(productId: number): Promise<InventoryItem[]> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const key = `inventory_product_${productId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('inventory')
      .select(`
        *,
        product:products (
          id,
          code,
          name,
          unit
        ),
        warehouse:warehouses (
          id,
          code,
          name
        )
      `)
      .eq('product_id', productId);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('获取产品库存失败:', error);
    return [];
  }
}

/**
 * 增加库存（入库时调用）
 */
export async function increaseInventory(
  warehouseId: number,
  productId: number,
  quantity: number
): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const key = `inventory_warehouse_${warehouseId}`;
    const saved = localStorage.getItem(key);
    const inventory = saved ? JSON.parse(saved) : [];
    
    const existingIndex = inventory.findIndex(
      (item: InventoryItem) => item.product_id === productId
    );

    if (existingIndex >= 0) {
      inventory[existingIndex].quantity += quantity;
      inventory[existingIndex].updated_at = new Date().toISOString();
    } else {
      inventory.push({
        id: Date.now(),
        warehouse_id: warehouseId,
        product_id: productId,
        quantity,
        updated_at: new Date().toISOString()
      });
    }

    localStorage.setItem(key, JSON.stringify(inventory));
    return;
  }

  try {
    const client = getSupabaseClient();

    // 查询是否已有库存记录
    const { data: existing, error: queryError } = await client
      .from('inventory')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .eq('product_id', productId)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      throw queryError;
    }

    if (existing) {
      // 更新现有库存
      const { error: updateError } = await client
        .from('inventory')
        .update({
          quantity: existing.quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // 创建新库存记录
      const { error: insertError } = await client
        .from('inventory')
        .insert({
          warehouse_id: warehouseId,
          product_id: productId,
          quantity,
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('增加库存失败:', error);
    throw error;
  }
}

/**
 * 减少库存（出库时调用）
 */
export async function decreaseInventory(
  warehouseId: number,
  productId: number,
  quantity: number
): Promise<boolean> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const key = `inventory_warehouse_${warehouseId}`;
    const saved = localStorage.getItem(key);
    const inventory = saved ? JSON.parse(saved) : [];
    
    const existingIndex = inventory.findIndex(
      (item: InventoryItem) => item.product_id === productId
    );

    if (existingIndex >= 0 && inventory[existingIndex].quantity >= quantity) {
      inventory[existingIndex].quantity -= quantity;
      inventory[existingIndex].updated_at = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(inventory));
      return true;
    }
    return false;
  }

  try {
    const client = getSupabaseClient();

    // 查询库存
    const { data: existing, error: queryError } = await client
      .from('inventory')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .eq('product_id', productId)
      .single();

    if (queryError) {
      console.error('查询库存失败:', queryError);
      return false;
    }

    if (!existing || existing.quantity < quantity) {
      console.warn('库存不足');
      return false;
    }

    // 扣减库存
    const { error: updateError } = await client
      .from('inventory')
      .update({
        quantity: existing.quantity - quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('减少库存失败:', error);
    return false;
  }
}

/**
 * 检查库存是否充足
 */
export async function checkStockAvailability(
  warehouseId: number,
  productId: number,
  requiredQuantity: number
): Promise<{ available: boolean; currentStock: number }> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const key = `inventory_warehouse_${warehouseId}`;
    const saved = localStorage.getItem(key);
    const inventory = saved ? JSON.parse(saved) : [];
    
    const item = inventory.find(
      (inv: InventoryItem) => inv.product_id === productId
    );

    const currentStock = item?.quantity || 0;
    return {
      available: currentStock >= requiredQuantity,
      currentStock
    };
  }

  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('inventory')
      .select('quantity')
      .eq('warehouse_id', warehouseId)
      .eq('product_id', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录，库存为 0
        return { available: false, currentStock: 0 };
      }
      throw error;
    }

    const currentStock = data?.quantity || 0;
    return {
      available: currentStock >= requiredQuantity,
      currentStock
    };
  } catch (error) {
    console.error('检查库存失败:', error);
    return { available: false, currentStock: 0 };
  }
}

/**
 * 获取低库存预警列表
 */
export async function getLowStockAlerts(minStockThreshold: number = 10): Promise<InventoryItem[]> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    // localStorage 模式：遍历所有仓库
    const allInventory: InventoryItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('inventory_warehouse_')) {
        const saved = localStorage.getItem(key);
        if (saved) {
          const items = JSON.parse(saved);
          allInventory.push(...items);
        }
      }
    }
    return allInventory.filter(item => item.quantity < minStockThreshold);
  }

  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('inventory')
      .select(`
        *,
        product:products (
          id,
          code,
          name,
          unit,
          min_stock
        ),
        warehouse:warehouses (
          id,
          code,
          name
        )
      `)
      .lt('quantity', minStockThreshold)
      .order('quantity', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('获取低库存预警失败:', error);
    return [];
  }
}

/**
 * 获取库存统计信息
 */
export async function getInventoryStats(): Promise<{
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  warehouseCount: number;
}> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    // 简化统计
    return {
      totalProducts: 0,
      totalQuantity: 0,
      lowStockCount: 0,
      warehouseCount: 0
    };
  }

  try {
    const client = getSupabaseClient();

    // 总产品数
    const { count: totalProducts } = await client
      .from('inventory')
      .select('*', { count: 'exact', head: true });

    // 总库存数量
    const { data: sumData } = await client
      .from('inventory')
      .select('quantity');
    
    const totalQuantity = sumData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    // 低库存数量
    const { count: lowStockCount } = await client
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .lt('quantity', 10);

    // 仓库数量
    const { count: warehouseCount } = await client
      .from('warehouses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return {
      totalProducts: totalProducts || 0,
      totalQuantity,
      lowStockCount: lowStockCount || 0,
      warehouseCount: warehouseCount || 0
    };
  } catch (error) {
    console.error('获取库存统计失败:', error);
    return {
      totalProducts: 0,
      totalQuantity: 0,
      lowStockCount: 0,
      warehouseCount: 0
    };
  }
}
