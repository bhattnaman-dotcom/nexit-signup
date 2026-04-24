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
              customer_email, customer_phone, customer_abn, products, breakdown_notes,
              price, billing_type, billing_frequency, status,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      staff_name, staff_email, prepared_date,
      business_name, customer_name, customer_email, customer_phone, customer_abn,
      products, breakdown_notes, price, billing_type, billing_frequency,
    } = body;

    if (
      !staff_name || !staff_email || !prepared_date ||
      !business_name || !customer_name || !customer_email || !customer_phone ||
      !products || !Array.isArray(products) || products.length === 0 ||
      !price || !billing_type
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Only pending agreements can be edited
    const [rows] = await pool.query<any[]>(
      'SELECT status FROM agreements WHERE id = ?', [id]
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }
    if (rows[0].status !== 'pending') {
      return NextResponse.json({ error: 'Only pending agreements can be edited' }, { status: 409 });
    }

    const validFrequencies = ['weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly'];
    const freq = billing_type === 'recurring' ? (billing_frequency ?? 'monthly') : null;
    if (freq && !validFrequencies.includes(freq)) {
      return NextResponse.json({ error: 'Invalid billing_frequency' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE agreements
       SET staff_name = ?, staff_email = ?, prepared_date = ?,
           business_name = ?, customer_name = ?, customer_email = ?, customer_phone = ?, customer_abn = ?,
           products = ?, breakdown_notes = ?, price = ?, billing_type = ?, billing_frequency = ?
       WHERE id = ?`,
      [
        staff_name, staff_email, prepared_date,
        business_name, customer_name, customer_email, customer_phone, customer_abn ?? null,
        JSON.stringify(products), breakdown_notes ?? null, price, billing_type, freq,
        id,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/agreements/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await pool.query<any[]>('SELECT status FROM agreements WHERE id = ?', [id]);
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await pool.execute('DELETE FROM agreements WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/agreements/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
