
import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { createHash } from 'crypto';

// 密码哈希函数
function hashPassword(password: string): string {
  return createHash('sha256').update(password + '_warehouse_salt_2024').digest('hex');
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await query('SELECT * FROM users WHERE id = $1', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    
    // 如果有密码，先哈希
    if (body.password) {
      body.password_hash = hashPassword(body.password);
      delete body.password;
    }
    
    // 构建更新字段
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    
    updates.push(`updated_at = $${paramIndex}`);
    values.push(new Date().toISOString());
    values.push(parseInt(id));
    
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`;
    const result = await query(sql, [...values, parseInt(id)]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
