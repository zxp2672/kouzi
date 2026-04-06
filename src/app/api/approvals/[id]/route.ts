import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取单个审核单据详情
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    const client = getSupabaseClient();
    
    let data: any = null;
    let error: any = null;
    
    // 根据类型查询不同的表
    switch (type) {
      case 'inbound':
        const inboundRes = await client
          .from('inbound_orders')
          .select('*, warehouses(name), inbound_items(*, products(name, code))')
          .eq('id', id)
          .single();
        data = inboundRes.data;
        error = inboundRes.error;
        break;
      case 'outbound':
        const outboundRes = await client
          .from('outbound_orders')
          .select('*, warehouses(name), outbound_items(*, products(name, code))')
          .eq('id', id)
          .single();
        data = outboundRes.data;
        error = outboundRes.error;
        break;
      case 'stock_count':
        const stockCountRes = await client
          .from('stock_counts')
          .select('*, warehouses(name), stock_count_items(*, products(name, code))')
          .eq('id', id)
          .single();
        data = stockCountRes.data;
        error = stockCountRes.error;
        break;
      case 'transfer':
        const transferRes = await client
          .from('transfer_orders')
          .select('*, from_warehouse:warehouses!transfer_orders_from_warehouse_id_fkey(name), to_warehouse:warehouses!transfer_orders_to_warehouse_id_fkey(name), transfer_items(*, products(name, code))')
          .eq('id', id)
          .single();
        data = transferRes.data;
        error = transferRes.error;
        break;
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
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
    
    const client = getSupabaseClient();
    
    let tableName = '';
    switch (type) {
      case 'inbound':
        tableName = 'inbound_orders';
        break;
      case 'outbound':
        tableName = 'outbound_orders';
        break;
      case 'stock_count':
        tableName = 'stock_counts';
        break;
      case 'transfer':
        tableName = 'transfer_orders';
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const updateData: any = {
      status,
      approved_by: approved_by || '系统管理员',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
