/**
 * 出库单数据库服务
 * 使用 Supabase 进行数据持久化
 */

import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';

/**
 * 检查 Supabase 是否可用
 */
async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { url } = getSupabaseCredentials();
    return url !== 'https://mock.supabase.co';
  } catch {
    return false;
  }
}

export interface OutboundOrder {
  id: number;
  order_no: string;
  warehouse_id: number;
  customer?: string;
  outbound_type?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  remark?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  approved_by?: string;
}

export interface OutboundItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price?: string;
  remark?: string;
  product?: {
    id: number;
    code: string;
    name: string;
    unit: string;
  };
}

/**
 * 获取所有出库单
 */
export async function fetchOutboundOrders(): Promise<OutboundOrder[]> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    console.warn('Supabase 不可用，使用 localStorage');
    try {
      const saved = localStorage.getItem('outbound_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('outbound_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取出库单失败:', error);
      const saved = localStorage.getItem('outbound_orders');
      return saved ? JSON.parse(saved) : [];
    }

    return data || [];
  } catch (error) {
    console.error('获取出库单异常:', error);
    const saved = localStorage.getItem('outbound_orders');
    return saved ? JSON.parse(saved) : [];
  }
}

/**
 * 获取出库单详情（包含明细）
 */
export async function fetchOutboundOrderWithItems(orderId: number): Promise<{
  order: OutboundOrder | null;
  items: OutboundItem[];
}> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const orders = localStorage.getItem('outbound_orders');
    const items = localStorage.getItem(`outbound_items_${orderId}`);
    return {
      order: orders ? JSON.parse(orders).find((o: OutboundOrder) => o.id === orderId) : null,
      items: items ? JSON.parse(items) : []
    };
  }

  try {
    const client = getSupabaseClient();

    const { data: order, error: orderError } = await client
      .from('outbound_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await client
      .from('outbound_items')
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
    console.error('获取出库单详情失败:', error);
    return { order: null, items: [] };
  }
}

/**
 * 创建出库单
 */
export async function createOutboundOrder(
  order: Omit<OutboundOrder, 'id' | 'created_at'>,
  items: Omit<OutboundItem, 'id' | 'order_id'>[]
): Promise<OutboundOrder> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const orders = localStorage.getItem('outbound_orders');
    const orderList = orders ? JSON.parse(orders) : [];
    const newOrder: OutboundOrder = {
      ...order,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    orderList.push(newOrder);
    localStorage.setItem('outbound_orders', JSON.stringify(orderList));
    localStorage.setItem(`outbound_items_${newOrder.id}`, JSON.stringify(items));
    return newOrder;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    const { data: newOrder, error: orderError } = await client
      .from('outbound_orders')
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
        .from('outbound_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return newOrder;
  } catch (error) {
    console.error('创建出库单失败:', error);
    throw error;
  }
}

/**
 * 更新出库单
 */
export async function updateOutboundOrder(
  id: number,
  updates: Partial<OutboundOrder>
): Promise<OutboundOrder> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const orders = localStorage.getItem('outbound_orders');
    const orderList = orders ? JSON.parse(orders) : [];
    const updatedList = orderList.map((o: OutboundOrder) =>
      o.id === id ? { ...o, ...updates, updated_at: new Date().toISOString() } : o
    );
    localStorage.setItem('outbound_orders', JSON.stringify(updatedList));
    return updatedList.find((o: OutboundOrder) => o.id === id);
  }

  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('outbound_orders')
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
    console.error('更新出库单失败:', error);
    throw error;
  }
}

/**
 * 审核出库单
 */
export async function approveOutboundOrder(
  id: number,
  approvedBy: string,
  status: 'approved' | 'rejected' = 'approved'
): Promise<OutboundOrder> {
  return updateOutboundOrder(id, {
    status,
    approved_by: approvedBy,
    approved_at: new Date().toISOString()
  });
}

/**
 * 删除出库单
 */
export async function deleteOutboundOrder(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const orders = localStorage.getItem('outbound_orders');
    const orderList = orders ? JSON.parse(orders) : [];
    const filteredList = orderList.filter((o: OutboundOrder) => o.id !== id);
    localStorage.setItem('outbound_orders', JSON.stringify(filteredList));
    localStorage.removeItem(`outbound_items_${id}`);
    return;
  }

  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from('outbound_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('删除出库单失败:', error);
    throw error;
  }
}

/**
 * 生成出库单号
 */
export function generateOrderNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `CK${year}${month}${day}${random}`;
}
