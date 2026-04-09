import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

// 获取所有审核相关的单据（入库、出库、盘点、调拨）
export async function GET(request: Request) {
  try {
    // 获取URL参数，支持按状态过滤
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');
    
    // 构建状态条件
    let statusCondition = '';
    let statusParams: any[] = [];
    
    if (statusFilter === 'pending') {
      statusCondition = "WHERE status = 'pending'";
    } else if (statusFilter === 'approved') {
      statusCondition = "WHERE status IN ('approved', 'completed')";
    } else if (statusFilter === 'rejected') {
      statusCondition = "WHERE status = 'rejected'";
    }

    // 并行查询所有单据
    const [inboundRes, outboundRes, stockCountRes, transferRes] = await Promise.all([
      query(`SELECT io.*, w.name as warehouse_name FROM inbound_orders io LEFT JOIN warehouses w ON io.warehouse_id = w.id ${statusCondition}`, statusParams),
      query(`SELECT oo.*, w.name as warehouse_name FROM outbound_orders oo LEFT JOIN warehouses w ON oo.warehouse_id = w.id ${statusCondition}`, statusParams),
      query(`SELECT sc.*, w.name as warehouse_name FROM stock_count_orders sc LEFT JOIN warehouses w ON sc.warehouse_id = w.id ${statusCondition}`, statusParams),
      query(`SELECT t2.*, fw.name as from_warehouse_name, tw.name as to_warehouse_name FROM transfer_orders t2 LEFT JOIN warehouses fw ON t2.from_warehouse_id = fw.id LEFT JOIN warehouses tw ON t2.to_warehouse_id = tw.id ${statusCondition}`, statusParams),
    ]);

    // 处理入库单
    const inboundOrders = inboundRes.rows.map((item: any) => ({
      id: item.id,
      type: 'inbound' as const,
      order_no: item.order_no,
      warehouse_name: item.warehouse_name || '未知仓库',
      status: item.status,
      supplier: item.supplier,
      remark: item.remark,
      created_by: item.created_by,
      created_at: item.created_at,
    }));

    // 处理出库单
    const outboundOrders = outboundRes.rows.map((item: any) => ({
      id: item.id,
      type: 'outbound' as const,
      order_no: item.order_no,
      warehouse_name: item.warehouse_name || '未知仓库',
      status: item.status,
      customer: item.customer,
      remark: item.remark,
      created_by: item.created_by,
      created_at: item.created_at,
    }));

    // 处理盘点单
    const stockCounts = stockCountRes.rows.map((item: any) => ({
      id: item.id,
      type: 'stock_count' as const,
      order_no: item.order_no,
      warehouse_name: item.warehouse_name || '未知仓库',
      status: item.status,
      remark: item.remark,
      created_by: item.created_by,
      created_at: item.created_at,
    }));

    // 处理调拨单
    const transferOrders = transferRes.rows.map((item: any) => ({
      id: item.id,
      type: 'transfer' as const,
      order_no: item.order_no,
      from_warehouse_name: item.from_warehouse_name || '未知仓库',
      to_warehouse_name: item.to_warehouse_name || '未知仓库',
      warehouse_name: item.from_warehouse_name || '未知仓库',
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
