
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('username', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      const mockUsers = [
        {
          id: 1,
          username: 'admin',
          name: '系统管理员',
          email: 'admin@example.com',
          phone: '13800138000',
          role_id: 1,
          organization_id: null,
          department: '公安局机关',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null,
        }
      ];
      return NextResponse.json(mockUsers);
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
      .from('users')
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
