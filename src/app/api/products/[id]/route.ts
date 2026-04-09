import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await query('SELECT * FROM products WHERE id = $1', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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
      'UPDATE products SET code = $1, name = $2, category = $3, specification = $4, unit = $5, barcode = $6, purchase_price = $7, selling_price = $8, min_stock = $9, max_stock = $10, is_active = $11 WHERE id = $12 RETURNING *',
      [body.code, body.name, body.category || null, body.specification || null, body.unit, body.barcode || null, body.purchase_price, body.selling_price, body.min_stock || null, body.max_stock || null, body.is_active ?? true, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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
    
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
