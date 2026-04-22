import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await pool.query<any[]>(
      `SELECT id, staff_name, staff_email, prepared_date, business_name, customer_name,
              customer_email, customer_phone, products, price, billing_type, status,
              signed_at, payadvantage_customer_id, payment_status, paid_at, created_at
       FROM agreements WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const row = rows[0];
    const agreement = {
      ...row,
      products: typeof row.products === 'string' ? JSON.parse(row.products) : row.products,
      price: Number(row.price),
      signature_data: null,
    };

    return NextResponse.json(agreement);
  } catch (err) {
    console.error('GET /api/agreements/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
