/**
 * 调拨单数据库服务
 * 使用 Supabase 进行数据持久化
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

export interface TransferOrder {
  id: number;
  order_no: string;
  from_warehouse_id: number;
  to_warehouse_id: number;
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'rejected';
  remark?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  approved_by?: string;
  completed_at?: string;
  completed_by?: string;
}

export interface TransferItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  remark?: string;
  product?: {
    id: number;
    code: string;
    name: string;
    unit: string;
  };
}

/**
 * 获取所有调拨单
 */
export async function fetchTransferOrders(): Promise<TransferOrder[]> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    console.warn('Supabase 不可用，使用 localStorage');
    try {
      const saved = localStorage.getItem('transfer_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('transfer_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取调拨单失败:', error);
      const saved = localStorage.getItem('transfer_orders');
      return saved ? JSON.parse(saved) : [];
    }

    return data || [];
  } catch (error) {
    console.error('获取调拨单异常:', error);
    const saved = localStorage.getItem('transfer_orders');
    return saved ? JSON.parse(saved) : [];
  }
}

/**
 * 获取调拨单详情
 */
export async function fetchTransferOrderWithItems(orderId: number): Promise<{
  order: TransferOrder | null;
  items: TransferItem[];
}> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const orders = localStorage.getItem('transfer_orders');
    const items = localStorage.getItem(`transfer_items_${orderId}`);
    return {
      order: orders ? JSON.parse(orders).find((o: TransferOrder) => o.id === orderId) : null,
      items: items ? JSON.parse(items) : []
    };
  }

  try {
    const client = getSupabaseClient();

    const { data: order, error: orderError } = await client
      .from('transfer_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await client
      .from('transfer_items')
      .select(`
        *,
        product:products (
          id,
          code,
          name,
          unit
        )
      `)
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    return { order, items: items || [] };
  } catch (error) {
    console.error('获取调拨单详情失败:', error);
    return { order: null, items: [] };
  }
}

/**
 * 创建调拨单
 */
export async function createTransferOrder(
  order: Omit<TransferOrder, 'id' | 'created_at'>,
  items: Omit<TransferItem, 'id' | 'order_id'>[]
): Promise<TransferOrder> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const orders = localStorage.getItem('transfer_orders');
    const orderList = orders ? JSON.parse(orders) : [];
    const newOrder: TransferOrder = {
      ...order,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    orderList.push(newOrder);
    localStorage.setItem('transfer_orders', JSON.stringify(orderList));
    localStorage.setItem(`transfer_items_${newOrder.id}`, JSON.stringify(items));
    return newOrder;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    const { data: newOrder, error: orderError } = await client
      .from('transfer_orders')
      .insert({
        ...order,
        created_at: now
      })
      .select()
      .single();

    if (orderError) throw orderError;

    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        order_id: newOrder.id
      }));

      const { error: itemsError } = await client
        .from('transfer_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return newOrder;
  } catch (error) {
    console.error('创建调拨单失败:', error);
    throw error;
  }
}

/**
 * 更新调拨单
 */
export async function updateTransferOrder(
  id: number,
  updates: Partial<TransferOrder>
): Promise<TransferOrder> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const orders = localStorage.getItem('transfer_orders');
    const orderList = orders ? JSON.parse(orders) : [];
    const updatedList = orderList.map((o: TransferOrder) =>
      o.id === id ? { ...o, ...updates, updated_at: new Date().toISOString() } : o
    );
    localStorage.setItem('transfer_orders', JSON.stringify(updatedList));
    return updatedList.find((o: TransferOrder) => o.id === id);
  }

  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('transfer_orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('更新调拨单失败:', error);
    throw error;
  }
}

/**
 * 审核调拨单
 */
export async function approveTransferOrder(
  id: number,
  approvedBy: string,
  status: 'approved' | 'rejected' = 'approved'
): Promise<TransferOrder> {
  return updateTransferOrder(id, {
    status,
    approved_by: approvedBy,
    approved_at: new Date().toISOString()
  });
}

/**
 * 完成调拨
 */
export async function completeTransferOrder(
  id: number,
  completedBy: string
): Promise<TransferOrder> {
  return updateTransferOrder(id, {
    status: 'completed',
    completed_by: completedBy,
    completed_at: new Date().toISOString()
  });
}

/**
 * 删除调拨单
 */
export async function deleteTransferOrder(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const orders = localStorage.getItem('transfer_orders');
    const orderList = orders ? JSON.parse(orders) : [];
    const filteredList = orderList.filter((o: TransferOrder) => o.id !== id);
    localStorage.setItem('transfer_orders', JSON.stringify(filteredList));
    localStorage.removeItem(`transfer_items_${id}`);
    return;
  }

  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from('transfer_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('删除调拨单失败:', error);
    throw error;
  }
}

/**
 * 生成调拨单号
 */
export function generateOrderNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `DB${year}${month}${day}${random}`;
}
