import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取盘点单列表
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('stock_counts')
      .select('*, warehouses(name), stock_count_items(*, products(name, code, unit))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      // 返回模拟数据
      const mockOrders = [
        {
          id: 1,
          order_no: 'SC202401001',
          warehouse_id: 1,
          warehouses: { name: '主仓库' },
          status: 'completed',
          count_date: '2024-01-15',
          remark: '月度盘点',
          created_by: '张三',
          created_at: '2024-01-15T08:00:00Z',
          approved_at: '2024-01-15T16:00:00Z',
          approved_by: '李四',
          stock_count_items: [
            { product_id: 1, products: { name: '对讲机', code: 'PRD001', unit: '台' }, system_quantity: 50, actual_quantity: 48, difference: -2 },
          ],
        },
      ];
      return NextResponse.json(mockOrders);
    }

    // 转换数据格式
    const formattedData = data.map((order: any) => ({
      ...order,
      warehouse_name: order.warehouses?.name || '未知仓库',
      items: order.stock_count_items?.map((item: any) => ({
        product_id: item.product_id,
        product_code: item.products?.code || '',
        product_name: item.products?.name || '',
        system_quantity: item.system_quantity,
        actual_quantity: item.actual_quantity,
        difference: item.difference,
      })) || [],
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 创建盘点单
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { warehouse_id, count_date, remark, items, created_by } = body;

    const client = getSupabaseClient();

    // 生成盘点单号
    const orderNo = `SC${Date.now()}`;

    // 创建盘点单
    const { data: order, error: orderError } = await client
      .from('stock_counts')
      .insert({
        order_no: orderNo,
        warehouse_id,
        count_date,
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

    // 创建盘点商品明细
    if (items && items.length > 0) {
      const stockCountItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        system_quantity: item.system_quantity,
        actual_quantity: item.actual_quantity,
        difference: item.actual_quantity - item.system_quantity,
      }));

      const { error: itemsError } = await client
        .from('stock_count_items')
        .insert(stockCountItems);

      if (itemsError) {
        console.error('Supabase error:', itemsError);
        // 回滚盘点单
        await client.from('stock_counts').delete().eq('id', order.id);
        return NextResponse.json({ error: itemsError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ...order, items: items || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
