
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('warehouses')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      const mockWarehouses = [
        {
          id: 1,
          code: 'WH001',
          name: '主仓库',
          address: 'XX市公安局大院1号楼',
          manager: '张三',
          phone: '13800138000',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null,
        },
        {
          id: 2,
          code: 'WH002',
          name: '分仓库',
          address: 'XX区公安处大院2号楼',
          manager: '李四',
          phone: '13800138001',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null,
        }
      ];
      return NextResponse.json(mockWarehouses);
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
      .from('warehouses')
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
