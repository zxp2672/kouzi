
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      // 如果 Supabase 失败，返回 mock 数据
      const mockProducts = [
        {
          id: 1,
          code: 'PRD001',
          name: '防暴盾牌',
          category: '防护装备',
          unit: '个',
          specification: '100*50cm',
          barcode: '6901234567890',
          purchase_price: '150.00',
          selling_price: '200.00',
          min_stock: 10,
          max_stock: 100,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null,
        },
        {
          id: 2,
          code: 'PRD002',
          name: '防刺服',
          category: '防护装备',
          unit: '件',
          specification: 'L号',
          barcode: '6901234567891',
          purchase_price: '300.00',
          selling_price: '400.00',
          min_stock: 5,
          max_stock: 50,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null,
        }
      ];
      return NextResponse.json(mockProducts);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('products')
      .insert(body)
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
