/**
 * 盘点单数据库服务
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

export interface StockCount {
  id: number;
  order_no: string;
  warehouse_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  remark?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  completed_by?: string;
}

export interface StockCountItem {
  id: number;
  order_id: number;
  product_id: number;
  book_quantity: number;
  actual_quantity?: number;
  difference?: number;
  remark?: string;
  product?: {
    id: number;
    code: string;
    name: string;
    unit: string;
  };
}

/**
 * 获取所有盘点单
 */
export async function fetchStockCounts(): Promise<StockCount[]> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    console.warn('Supabase 不可用，使用 localStorage');
    try {
      const saved = localStorage.getItem('stock_counts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('stock_counts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取盘点单失败:', error);
      const saved = localStorage.getItem('stock_counts');
      return saved ? JSON.parse(saved) : [];
    }

    return data || [];
  } catch (error) {
    console.error('获取盘点单异常:', error);
    const saved = localStorage.getItem('stock_counts');
    return saved ? JSON.parse(saved) : [];
  }
}

/**
 * 获取盘点单详情
 */
export async function fetchStockCountWithItems(orderId: number): Promise<{
  count: StockCount | null;
  items: StockCountItem[];
}> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const counts = localStorage.getItem('stock_counts');
    const items = localStorage.getItem(`stock_count_items_${orderId}`);
    return {
      count: counts ? JSON.parse(counts).find((c: StockCount) => c.id === orderId) : null,
      items: items ? JSON.parse(items) : []
    };
  }

  try {
    const client = getSupabaseClient();

    const { data: count, error: countError } = await client
      .from('stock_counts')
      .select('*')
      .eq('id', orderId)
      .single();

    if (countError) throw countError;

    const { data: items, error: itemsError } = await client
      .from('stock_count_items')
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

    return { count, items: items || [] };
  } catch (error) {
    console.error('获取盘点单详情失败:', error);
    return { count: null, items: [] };
  }
}

/**
 * 创建盘点单
 */
export async function createStockCount(
  count: Omit<StockCount, 'id' | 'created_at'>,
  items: Omit<StockCountItem, 'id' | 'order_id'>[]
): Promise<StockCount> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const counts = localStorage.getItem('stock_counts');
    const countList = counts ? JSON.parse(counts) : [];
    const newCount: StockCount = {
      ...count,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    countList.push(newCount);
    localStorage.setItem('stock_counts', JSON.stringify(countList));
    localStorage.setItem(`stock_count_items_${newCount.id}`, JSON.stringify(items));
    return newCount;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    const { data: newCount, error: countError } = await client
      .from('stock_counts')
      .insert({
        ...count,
        created_at: now
      })
      .select()
      .single();

    if (countError) throw countError;

    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        order_id: newCount.id
      }));

      const { error: itemsError } = await client
        .from('stock_count_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return newCount;
  } catch (error) {
    console.error('创建盘点单失败:', error);
    throw error;
  }
}

/**
 * 更新盘点单
 */
export async function updateStockCount(
  id: number,
  updates: Partial<StockCount>
): Promise<StockCount> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const counts = localStorage.getItem('stock_counts');
    const countList = counts ? JSON.parse(counts) : [];
    const updatedList = countList.map((c: StockCount) =>
      c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
    );
    localStorage.setItem('stock_counts', JSON.stringify(updatedList));
    return updatedList.find((c: StockCount) => c.id === id);
  }

  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('stock_counts')
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
    console.error('更新盘点单失败:', error);
    throw error;
  }
}

/**
 * 完成盘点
 */
export async function completeStockCount(
  id: number,
  completedBy: string
): Promise<StockCount> {
  return updateStockCount(id, {
    status: 'completed',
    completed_by: completedBy,
    completed_at: new Date().toISOString()
  });
}

/**
 * 删除盘点单
 */
export async function deleteStockCount(id: number): Promise<void> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    const counts = localStorage.getItem('stock_counts');
    const countList = counts ? JSON.parse(counts) : [];
    const filteredList = countList.filter((c: StockCount) => c.id !== id);
    localStorage.setItem('stock_counts', JSON.stringify(filteredList));
    localStorage.removeItem(`stock_count_items_${id}`);
    return;
  }

  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from('stock_counts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('删除盘点单失败:', error);
    throw error;
  }
}

/**
 * 生成盘点单号
 */
export function generateOrderNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `PD${year}${month}${day}${random}`;
}
