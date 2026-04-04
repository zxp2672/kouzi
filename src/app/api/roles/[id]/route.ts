
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('roles')
      .select('*')
      .eq('id', parseInt(params.id))
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('roles')
      .update(body)
      .eq('id', parseInt(params.id))
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

export async function DELETE(request: Request, { params }: Params) {
  try {
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('roles')
      .delete()
      .eq('id', parseInt(params.id));

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
