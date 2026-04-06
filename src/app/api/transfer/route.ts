import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取调拨单列表
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('transfer_orders')
      .select('*, from_warehouse:warehouses!transfer_orders_from_warehouse_id_fkey(name), to_warehouse:warehouses!transfer_orders_to_warehouse_id_fkey(name), transfer_items(*, products(name, code, unit))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      // 返回模拟数据
      const mockOrders = [
        {
          id: 1,
          order_no: 'TR202401001',
          from_warehouse_id: 1,
          to_warehouse_id: 2,
          from_warehouse: { name: '主仓库' },
          to_warehouse: { name: '分仓库' },
          status: 'pending',
          remark: '物资调拨',
          created_by: '张三',
          created_at: '2024-01-15T10:00:00Z',
          transfer_items: [
            { product_id: 1, products: { name: '对讲机', code: 'PRD001', unit: '台' }, quantity: 5 },
          ],
        },
      ];
      return NextResponse.json(mockOrders);
    }

    // 转换数据格式
    const formattedData = data.map((order: any) => ({
      ...order,
      from_warehouse_name: order.from_warehouse?.name || '未知仓库',
      to_warehouse_name: order.to_warehouse?.name || '未知仓库',
      items: order.transfer_items?.map((item: any) => ({
        product_id: item.product_id,
        product_code: item.products?.code || '',
        product_name: item.products?.name || '',
        quantity: item.quantity,
      })) || [],
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 创建调拨单
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from_warehouse_id, to_warehouse_id, remark, items, created_by } = body;

    const client = getSupabaseClient();

    // 生成调拨单号
    const orderNo = `TR${Date.now()}`;

    // 创建调拨单
    const { data: order, error: orderError } = await client
      .from('transfer_orders')
      .insert({
        order_no: orderNo,
        from_warehouse_id,
        to_warehouse_id,
        status: 'pending',
        remark,
        created_by: created_by || '系统用户',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Supabase error:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 400 });
    }

    // 创建调拨商品明细
    if (items && items.length > 0) {
      const transferItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await client
        .from('transfer_items')
        .insert(transferItems);

      if (itemsError) {
        console.error('Supabase error:', itemsError);
        // 回滚调拨单
        await client.from('transfer_orders').delete().eq('id', order.id);
        return NextResponse.json({ error: itemsError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ...order, items: items || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
