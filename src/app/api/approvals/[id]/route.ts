import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取单个审核单据详情
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    let result: any = null;
    
    // 根据类型查询不同的表
    switch (type) {
      case 'inbound':
        result = await query(
          `SELECT io.*, w.name as warehouse_name 
           FROM inbound_orders io 
           LEFT JOIN warehouses w ON io.warehouse_id = w.id 
           WHERE io.id = $1`,
          [id]
        );
        break;
      case 'outbound':
        result = await query(
          `SELECT oo.*, w.name as warehouse_name 
           FROM outbound_orders oo 
           LEFT JOIN warehouses w ON oo.warehouse_id = w.id 
           WHERE oo.id = $1`,
          [id]
        );
        break;
      case 'stock_count':
        result = await query(
          `SELECT sc.*, w.name as warehouse_name 
           FROM stock_count_orders sc 
           LEFT JOIN warehouses w ON sc.warehouse_id = w.id 
           WHERE sc.id = $1`,
          [id]
        );
        break;
      case 'transfer':
        result = await query(
          `SELECT to.*, 
                  fw.name as from_warehouse_name, 
                  tw.name as to_warehouse_name
           FROM transfer_orders to 
           LEFT JOIN warehouses fw ON to.from_warehouse_id = fw.id 
           LEFT JOIN warehouses tw ON to.to_warehouse_id = tw.id 
           WHERE to.id = $1`,
          [id]
        );
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 更新审核状态
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, status, approved_by } = body;
    
    let tableName = '';
    switch (type) {
      case 'inbound':
        tableName = 'inbound_orders';
        break;
      case 'outbound':
        tableName = 'outbound_orders';
        break;
      case 'stock_count':
        tableName = 'stock_count_orders';
        break;
      case 'transfer':
        tableName = 'transfer_orders';
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const result = await query(
      `UPDATE ${tableName} 
       SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [status, approved_by || '系统管理员', id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
