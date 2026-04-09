import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await query('SELECT * FROM warehouses WHERE id = $1', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const result = await query(
      'UPDATE warehouses SET code = $1, name = $2, address = $3, manager = $4, phone = $5, organization_id = $6, is_active = $7 WHERE id = $8 RETURNING *',
      [body.code, body.name, body.address || null, body.manager || null, body.phone || null, body.organization_id || null, body.is_active ?? true, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const result = await query('DELETE FROM warehouses WHERE id = $1 RETURNING *', [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
