
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('roles')
      .select('*')
      .order('level', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      const mockRoles = [
        {
          id: 1,
          code: 'admin',
          name: '系统管理员',
          description: '拥有系统全部权限',
          level: 1,
          permissions: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null,
        },
        {
          id: 2,
          code: 'manager',
          name: '库房管理员',
          description: '管理库房日常操作',
          level: 2,
          permissions: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null,
        }
      ];
      return NextResponse.json(mockRoles);
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
      .from('roles')
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
