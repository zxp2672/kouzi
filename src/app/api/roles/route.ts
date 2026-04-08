
import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET() {
  try {
    const result = await query('SELECT * FROM roles ORDER BY level ASC');
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
      'INSERT INTO roles (code, name, description, level, permissions, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [body.code, body.name, body.description, body.level, body.permissions, body.is_active ?? true]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
