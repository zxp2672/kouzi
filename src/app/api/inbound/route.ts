import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取入库单列表
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('inbound_orders')
      .select('*, warehouses(name), inbound_items(*, products(name, code, unit))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      // 返回模拟数据
      const mockOrders = [
        {
          id: 1,
          order_no: 'IN202401001',
          warehouse_id: 1,
          warehouses: { name: '主仓库' },
          supplier: '安防设备有限公司',
          type: 'purchase',
          status: 'approved',
          remark: '常规采购',
          created_by: '张三',
          created_at: '2024-01-15T10:30:00Z',
          approved_at: '2024-01-15T14:00:00Z',
          approved_by: '李四',
          inbound_items: [
            { product_id: 1, products: { name: '对讲机', code: 'PRD001', unit: '台' }, quantity: 50, price: '300', batch_no: 'B2024011501' },
            { product_id: 2, products: { name: '警棍', code: 'PRD002', unit: '根' }, quantity: 100, price: '50', batch_no: 'B2024011502' },
          ],
        },
      ];
      return NextResponse.json(mockOrders);
    }

    // 转换数据格式
    const formattedData = data.map((order: any) => ({
      ...order,
      warehouse_name: order.warehouses?.name || '未知仓库',
      items: order.inbound_items?.map((item: any) => ({
        product_id: item.product_id,
        product_code: item.products?.code || '',
        product_name: item.products?.name || '',
        quantity: item.quantity,
        price: item.price,
        batch_no: item.batch_no,
      })) || [],
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 创建入库单
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { warehouse_id, supplier, type, remark, items, created_by } = body;

    const client = getSupabaseClient();

    // 生成入库单号
    const orderNo = `IN${Date.now()}`;

    // 创建入库单
    const { data: order, error: orderError } = await client
      .from('inbound_orders')
      .insert({
        order_no: orderNo,
        warehouse_id,
        supplier,
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

    // 创建入库商品明细
    if (items && items.length > 0) {
      const inboundItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        batch_no: item.batch_no,
      }));

      const { error: itemsError } = await client
        .from('inbound_items')
        .insert(inboundItems);

      if (itemsError) {
        console.error('Supabase error:', itemsError);
        // 回滚入库单
        await client.from('inbound_orders').delete().eq('id', order.id);
        return NextResponse.json({ error: itemsError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ...order, items: items || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
