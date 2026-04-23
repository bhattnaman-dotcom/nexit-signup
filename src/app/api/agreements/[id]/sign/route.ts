import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createPayAdvantageCustomer } from '@/lib/payadvantage';
import type { Agreement } from '@/types';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { signature_data } = await req.json();

    if (!signature_data || typeof signature_data !== 'string') {
      return NextResponse.json({ error: 'Missing signature_data' }, { status: 400 });
    }

    // Fetch agreement
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM agreements WHERE id = ?',
      [id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    const row = rows[0];
    if (row.status !== 'pending') {
      return NextResponse.json({ error: 'Agreement already signed' }, { status: 409 });
    }

    const agreement: Agreement = {
      ...row,
      products: typeof row.products === 'string' ? JSON.parse(row.products) : row.products,
      price: Number(row.price),
    };

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Check Pay Advantage credentials are configured
    if (!process.env.PAY_ADVANTAGE_USERNAME || !process.env.PAY_ADVANTAGE_PASSWORD) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please set PAY_ADVANTAGE_USERNAME and PAY_ADVANTAGE_PASSWORD in Vercel environment variables.' },
        { status: 503 }
      );
    }

    // Create Pay Advantage customer
    let customerId: string;
    let iframeUrl: string;
    try {
      ({ customerId, iframeUrl } = await createPayAdvantageCustomer(agreement));
    } catch (paErr) {
      const msg = paErr instanceof Error ? paErr.message : String(paErr);
      console.error('Pay Advantage error:', msg);
      return NextResponse.json(
        { error: `Payment gateway error: ${msg}` },
        { status: 502 }
      );
    }

    // Save signature and update status
    await pool.execute(
      `UPDATE agreements
       SET signature_data = ?, signed_at = ?, status = 'signed',
           payadvantage_customer_id = ?, payment_status = 'processing'
       WHERE id = ?`,
      [signature_data, now, customerId, id]
    );

    return NextResponse.json({ iframeUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('POST /api/agreements/[id]/sign error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
