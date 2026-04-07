/**
 * 入库单数据库服务
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

export interface InboundOrder {
  id: number;
  order_no: string;
  warehouse_id: number;
  supplier?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  remark?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  approved_by?: string;
}

export interface InboundItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price?: string;
  batch_no?: string;
  production_date?: string;
  expiry_date?: string;
  remark?: string;
  product?: {
    id: number;
    code: string;
    name: string;
    unit: string;
  };
}

/**
 * 获取所有入库单
 */
export async function fetchInboundOrders(): Promise<InboundOrder[]> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    console.warn('Supabase 不可用，使用 localStorage');
    try {
      const saved = localStorage.getItem('inbound_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('inbound_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取入库单失败:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('inbound_orders');
      return saved ? JSON.parse(saved) : [];
    }

    return data || [];
  } catch (error) {
    console.error('获取入库单异常:', error);
    const saved = localStorage.getItem('inbound_orders');
    return saved ? JSON.parse(saved) : [];
  }
}

/**
 * 获取入库单详情（包含明细）
 */
export async function fetchInboundOrderWithItems(orderId: number): Promise<{
  order: InboundOrder | null;
  items: InboundItem[];
}> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    // localStorage 模式
    const orders = localStorage.getItem('inbound_orders');
    const items = localStorage.getItem(`inbound_items_${orderId}`);
    return {
      order: orders ? JSON.parse(orders).find((o: InboundOrder) => o.id === orderId) : null,
      items: items ? JSON.parse(items) : []
    };
  }

  try {
    const client = getSupabaseClient();

    // 获取订单
    const { data: order, error: orderError } = await client
      .from('inbound_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // 获取明细（包含产品信息）
    const { data: items, error: itemsError } = await client
      .from('inbound_items')
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
    console.error('获取入库单详情失败:', error);
    return { order: null, items: [] };
  }
}

/**
 * 创建入库单
 */
export async function createInboundOrder(
  order: Omit<InboundOrder, 'id' | 'created_at'>,
  items: Omit<InboundItem, 'id' | 'order_id'>[]
): Promise<InboundOrder> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    // localStorage 模式
    const orders = localStorage.getItem('inbound_orders');
    const orderList = orders ? JSON.parse(orders) : [];
    const newOrder: InboundOrder = {
      ...order,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    orderList.push(newOrder);
    localStorage.setItem('inbound_orders', JSON.stringify(orderList));
    localStorage.setItem(`inbound_items_${newOrder.id}`, JSON.stringify(items));
    return newOrder;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    // 创建订单
    const { data: newOrder, error: orderError } = await client
      .from('inbound_orders')
      .insert({
        ...order,
        created_at: now
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 创建明细
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        order_id: newOrder.id
      }));

      const { error: itemsError } = await client
        .from('inbound_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return newOrder;
  } catch (error) {
    console.error('创建入库单失败:', error);
    throw error;
  }
}

/**
 * 更新入库单
 */
export async function updateInboundOrder(
  id: number,
  updates: Partial<InboundOrder>
): Promise<InboundOrder> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    // localStorage 模式
    const orders = localStorage.getItem('inbound_orders');
    const orderList = orders ? JSON.parse(orders) : [];
    const updatedList = orderList.map((o: InboundOrder) =>
      o.id === id ? { ...o, ...updates, updated_at: new Date().toISOString() } : o
    );
    localStorage.setItem('inbound_orders', JSON.stringify(updatedList));
    return updatedList.find((o: InboundOrder) => o.id === id);
  }

  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('inbound_orders')
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
    console.error('更新入库单失败:', error);
    throw error;
  }
}

/**
 * 审核入库单
 */
export async function approveInboundOrder(
  id: number,
  approvedBy: string,
  status: 'approved' | 'rejected' = 'approved'
): Promise<InboundOrder> {
  return updateInboundOrder(id, {
    status,
    approved_by: approvedBy,
    approved_at: new Date().toISOString()
  });
}

/**
 * 删除入库单
 */
export async function deleteInboundOrder(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    // localStorage 模式
    const orders = localStorage.getItem('inbound_orders');
    const orderList = orders ? JSON.parse(orders) : [];
    const filteredList = orderList.filter((o: InboundOrder) => o.id !== id);
    localStorage.setItem('inbound_orders', JSON.stringify(filteredList));
    localStorage.removeItem(`inbound_items_${id}`);
    return;
  }

  try {
    const client = getSupabaseClient();

    // 删除明细（会级联删除）
    const { error } = await client
      .from('inbound_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('删除入库单失败:', error);
    throw error;
  }
}

/**
 * 生成入库单号
 */
export function generateOrderNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `RK${year}${month}${day}${random}`;
}
