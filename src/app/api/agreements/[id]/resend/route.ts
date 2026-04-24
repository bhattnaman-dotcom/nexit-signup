import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendAgreementLinkEmail } from '@/lib/email';
import type { Agreement } from '@/types';

export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await pool.query<any[]>(
      'SELECT * FROM agreements WHERE id = ?', [id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    const row = rows[0];
    if (row.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending agreements can be resent' }, { status: 409 });
    }

    const agreement: Agreement = {
      ...row,
      products: typeof row.products === 'string' ? JSON.parse(row.products) : row.products,
      price: Number(row.price),
    };

    const agreementUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/agreement/${id}`;
    await sendAgreementLinkEmail(agreement, agreementUrl);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/agreements/[id]/resend error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
