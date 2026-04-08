
import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET() {
  try {
    const result = await query('SELECT * FROM organizations ORDER BY sort_order ASC');
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
      'INSERT INTO organizations (code, name, type, level, parent_id, path, sort_order, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [body.code, body.name, body.type, body.level, body.parent_id, body.path, body.sort_order, body.is_active ?? true]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
