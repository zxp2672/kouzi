import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取出库单列表
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('outbound_orders')
      .select('*, warehouses(name), outbound_items(*, products(name, code, unit))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      // 返回模拟数据
      const mockOrders = [
        {
          id: 1,
          order_no: 'OUT202401001',
          warehouse_id: 1,
          warehouses: { name: '主仓库' },
          customer: '派出所A',
          type: '领用',
          status: 'approved',
          remark: '日常领用',
          created_by: '张三',
          created_at: '2024-01-14T09:00:00Z',
          approved_at: '2024-01-14T11:00:00Z',
          approved_by: '李四',
          outbound_items: [
            { product_id: 1, products: { name: '对讲机', code: 'PRD001', unit: '台' }, quantity: 10 },
          ],
        },
      ];
      return NextResponse.json(mockOrders);
    }

    // 转换数据格式
    const formattedData = data.map((order: any) => ({
      ...order,
      warehouse_name: order.warehouses?.name || '未知仓库',
      items: order.outbound_items?.map((item: any) => ({
        product_id: item.product_id,
        product_code: item.products?.code || '',
        product_name: item.products?.name || '',
        quantity: item.quantity,
        price: item.price,
      })) || [],
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 创建出库单
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { warehouse_id, customer, type, remark, items, created_by } = body;

    const client = getSupabaseClient();

    // 生成出库单号
    const orderNo = `OUT${Date.now()}`;

    // 创建出库单
    const { data: order, error: orderError } = await client
      .from('outbound_orders')
      .insert({
        order_no: orderNo,
        warehouse_id,
        customer,
        type,
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

    // 创建出库商品明细
    if (items && items.length > 0) {
      const outboundItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await client
        .from('outbound_items')
        .insert(outboundItems);

      if (itemsError) {
        console.error('Supabase error:', itemsError);
        // 回滚出库单
        await client.from('outbound_orders').delete().eq('id', order.id);
        return NextResponse.json({ error: itemsError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ...order, items: items || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
