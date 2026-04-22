import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      staff_name,
      staff_email,
      prepared_date,
      business_name,
      customer_name,
      customer_email,
      customer_phone,
      products,
      price,
      billing_type,
    } = body;

    if (
      !staff_name || !staff_email || !prepared_date ||
      !business_name || !customer_name || !customer_email || !customer_phone ||
      !products || !Array.isArray(products) || products.length === 0 ||
      !price || !billing_type
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['once-off', 'recurring'].includes(billing_type)) {
      return NextResponse.json({ error: 'Invalid billing_type' }, { status: 400 });
    }

    const id = uuidv4();

    await pool.execute(
      `INSERT INTO agreements
        (id, staff_name, staff_email, prepared_date, business_name, customer_name, customer_email, customer_phone, products, price, billing_type, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')`,
      [
        id,
        staff_name,
        staff_email,
        prepared_date,
        business_name,
        customer_name,
        customer_email,
        customer_phone,
        JSON.stringify(products),
        price,
        billing_type,
      ]
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/agreements error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
