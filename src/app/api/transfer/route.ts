import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/postgres';

// 获取调拨单列表
export async function GET() {
  try {
    const orders = await query('SELECT * FROM transfer_orders ORDER BY created_at DESC');
    
    const orderIds = orders.rows.map((o: any) => o.id);
    let items: any[] = [];
    if (orderIds.length > 0) {
      const itemsResult = await query(
        'SELECT ti.*, p.name as product_name, p.code as product_code, p.unit FROM transfer_items ti LEFT JOIN products p ON ti.product_id = p.id WHERE ti.order_id = ANY($1)',
        [orderIds]
      );
      items = itemsResult.rows;
    }
    
    const warehouseIds = [...new Set([...orders.rows.map((o: any) => o.from_warehouse_id), ...orders.rows.map((o: any) => o.to_warehouse_id)])];
    let warehouses: any[] = [];
    if (warehouseIds.length > 0) {
      const warehousesResult = await query('SELECT * FROM warehouses WHERE id = ANY($1)', [warehouseIds]);
      warehouses = warehousesResult.rows;
    }
    
    const formattedData = orders.rows.map((order: any) => ({
      ...order,
      from_warehouse_name: warehouses.find((w: any) => w.id === order.from_warehouse_id)?.name || '未知仓库',
      to_warehouse_name: warehouses.find((w: any) => w.id === order.to_warehouse_id)?.name || '未知仓库',
      items: items.filter((item: any) => item.order_id === order.id),
    }));
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 创建调拨单
export async function POST(request: Request) {
  const client = await getClient();
  try {
    const body = await request.json();
    const { from_warehouse_id, to_warehouse_id, remark, items, created_by } = body;

    await client.query('BEGIN');

    const orderNo = `TR${Date.now()}`;

    const orderResult = await client.query(
      'INSERT INTO transfer_orders (order_no, from_warehouse_id, to_warehouse_id, status, remark, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orderNo, from_warehouse_id, to_warehouse_id, 'pending', remark, created_by || '系统用户']
    );
    const order = orderResult.rows[0];

    if (items && items.length > 0) {
      const itemValues = items.map((item: any, index: number) => 
        `($1, $${index * 3 + 2}, $${index * 3 + 3})`
      ).join(', ');
      
      const itemParams = [order.id];
      items.forEach((item: any) => {
        itemParams.push(item.product_id, item.quantity);
      });

      await client.query(
        `INSERT INTO transfer_items (order_id, product_id, quantity) VALUES ${itemValues}`,
        itemParams
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ ...order, items: items || [] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
