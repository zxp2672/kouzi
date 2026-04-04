
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('organizations')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      const mockOrganizations = [
        {
          id: 1,
          code: 'GAJ001',
          name: 'XX市公安局',
          type: 'bureau',
          level: 1,
          parent_id: null,
          path: null,
          sort_order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null,
        },
        {
          id: 2,
          code: 'GAC001',
          name: 'XX区公安处',
          type: 'department',
          level: 2,
          parent_id: 1,
          path: '1',
          sort_order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null,
        }
      ];
      return NextResponse.json(mockOrganizations);
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
      .from('organizations')
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
