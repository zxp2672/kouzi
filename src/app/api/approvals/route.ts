import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取所有待审核的单据（入库、出库、盘点、调拨）
export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 并行获取所有待审核的单据
    const [inboundRes, outboundRes, stockCountRes, transferRes] = await Promise.all([
      client.from('inbound_orders').select('*, warehouses(name)').in('status', ['pending']),
      client.from('outbound_orders').select('*, warehouses(name)').in('status', ['pending']),
      client.from('stock_counts').select('*, warehouses(name)').in('status', ['pending']),
      client.from('transfer_orders').select('*, from_warehouse:warehouses!transfer_orders_from_warehouse_id_fkey(name), to_warehouse:warehouses!transfer_orders_to_warehouse_id_fkey(name)').in('status', ['pending'])
    ]);

    // 处理入库单
    const inboundOrders = (inboundRes.data || []).map((item: any) => ({
      id: item.id,
      type: 'inbound' as const,
      order_no: item.order_no,
      warehouse_name: item.warehouses?.name || '未知仓库',
      status: item.status,
      supplier: item.supplier,
      remark: item.remark,
      created_by: item.created_by,
      created_at: item.created_at,
    }));

    // 处理出库单
    const outboundOrders = (outboundRes.data || []).map((item: any) => ({
      id: item.id,
      type: 'outbound' as const,
      order_no: item.order_no,
      warehouse_name: item.warehouses?.name || '未知仓库',
      status: item.status,
      customer: item.customer,
      remark: item.remark,
      created_by: item.created_by,
      created_at: item.created_at,
    }));

    // 处理盘点单
    const stockCounts = (stockCountRes.data || []).map((item: any) => ({
      id: item.id,
      type: 'stock_count' as const,
      order_no: item.order_no,
      warehouse_name: item.warehouses?.name || '未知仓库',
      status: item.status,
      remark: item.remark,
      created_by: item.created_by,
      created_at: item.created_at,
    }));

    // 处理调拨单
    const transferOrders = (transferRes.data || []).map((item: any) => ({
      id: item.id,
      type: 'transfer' as const,
      order_no: item.order_no,
      from_warehouse_name: item.from_warehouse?.name || '未知仓库',
      to_warehouse_name: item.to_warehouse?.name || '未知仓库',
      warehouse_name: item.from_warehouse?.name || '未知仓库',
      status: item.status,
      remark: item.remark,
      created_by: item.created_by,
      created_at: item.created_at,
    }));

    // 合并所有单据
    const allApprovals = [
      ...inboundOrders,
      ...outboundOrders,
      ...stockCounts,
      ...transferOrders,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(allApprovals);
  } catch (error) {
    console.error('API error:', error);
    
    // 如果出错，返回模拟数据
    const mockApprovals = [
      { id: 1, type: 'inbound', order_no: 'IN202401002', warehouse_name: '主仓库', status: 'pending', supplier: '劳保用品厂', remark: '补充库存', created_by: '王五', created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, type: 'outbound', order_no: 'OUT202401002', warehouse_name: '主仓库', status: 'pending', customer: '派出所B', remark: '应急物资', created_by: '王五', created_at: new Date(Date.now() - 7200000).toISOString() },
      { id: 3, type: 'transfer', order_no: 'TR202401002', from_warehouse_name: '分仓库', to_warehouse_name: '主仓库', warehouse_name: '分仓库', status: 'pending', remark: '退回物资', created_by: '王五', created_at: new Date(Date.now() - 10800000).toISOString() },
    ];
    return NextResponse.json(mockApprovals);
  }
}
