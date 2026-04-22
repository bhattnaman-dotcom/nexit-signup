import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? '';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (search) {
      conditions.push('(business_name LIKE ? OR customer_name LIKE ?)');
      const like = `%${search}%`;
      values.push(like, like);
    }

    if (status && status !== 'all') {
      conditions.push('status = ?');
      values.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM agreements ${where}`,
      values
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query<any[]>(
      `SELECT id, created_at, business_name, customer_name, products, price, billing_type, status, payment_status
       FROM agreements ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const agreements = rows.map((r) => ({
      ...r,
      products: typeof r.products === 'string' ? JSON.parse(r.products) : r.products,
      price: Number(r.price),
    }));

    return NextResponse.json({ agreements, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('GET /api/admin/agreements error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
