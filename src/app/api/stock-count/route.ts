import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/postgres';

// 获取盘点单列表
export async function GET() {
  try {
    const orders = await query('SELECT * FROM stock_counts ORDER BY created_at DESC');
    
    const orderIds = orders.rows.map((o: any) => o.id);
    let items: any[] = [];
    if (orderIds.length > 0) {
      const itemsResult = await query(
        'SELECT sci.*, p.name as product_name, p.code as product_code, p.unit FROM stock_count_items sci LEFT JOIN products p ON sci.product_id = p.id WHERE sci.order_id = ANY($1)',
        [orderIds]
      );
      items = itemsResult.rows;
    }
    
    const warehouseIds = [...new Set(orders.rows.map((o: any) => o.warehouse_id))];
    let warehouses: any[] = [];
    if (warehouseIds.length > 0) {
      const warehousesResult = await query('SELECT * FROM warehouses WHERE id = ANY($1)', [warehouseIds]);
      warehouses = warehousesResult.rows;
    }
    
    const formattedData = orders.rows.map((order: any) => ({
      ...order,
      warehouse_name: warehouses.find((w: any) => w.id === order.warehouse_id)?.name || '未知仓库',
      items: items.filter((item: any) => item.order_id === order.id),
    }));
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 创建盘点单
export async function POST(request: Request) {
  const client = await getClient();
  try {
    const body = await request.json();
    const { warehouse_id, count_date, remark, items, created_by } = body;

    await client.query('BEGIN');

    const orderNo = `SC${Date.now()}`;

    const orderResult = await client.query(
      'INSERT INTO stock_counts (order_no, warehouse_id, count_date, status, remark, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orderNo, warehouse_id, count_date, 'pending', remark, created_by || '系统用户']
    );
    const order = orderResult.rows[0];

    if (items && items.length > 0) {
      const itemValues = items.map((item: any, index: number) => 
        `($1, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, $${index * 4 + 5})`
      ).join(', ');
      
      const itemParams = [order.id];
      items.forEach((item: any) => {
        itemParams.push(item.product_id, item.system_quantity, item.actual_quantity, item.actual_quantity - item.system_quantity);
      });

      await client.query(
        `INSERT INTO stock_count_items (order_id, product_id, system_quantity, actual_quantity, difference) VALUES ${itemValues}`,
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
