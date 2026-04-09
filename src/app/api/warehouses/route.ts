
import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET() {
  try {
    const result = await query('SELECT * FROM warehouses ORDER BY created_at ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await query(
      'INSERT INTO warehouses (code, name, address, manager, phone, organization_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [body.code, body.name, body.address || null, body.manager || null, body.phone || null, body.organization_id || null, body.is_active ?? true]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
