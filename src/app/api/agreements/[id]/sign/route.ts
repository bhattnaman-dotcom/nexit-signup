import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { setupPayAdvantageDirectDebit } from '@/lib/payadvantage';
import { sendSignedClientEmail, sendSignedStaffEmail } from '@/lib/email';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { AgreementPDF } from '@/lib/pdf';
import React from 'react';
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

    if (!process.env.PAY_ADVANTAGE_USERNAME || !process.env.PAY_ADVANTAGE_PASSWORD) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Set PAY_ADVANTAGE_USERNAME and PAY_ADVANTAGE_PASSWORD in Vercel.' },
        { status: 503 }
      );
    }

    let customerId: string;
    try {
      ({ customerId } = await setupPayAdvantageDirectDebit(agreement));
    } catch (paErr) {
      const msg = paErr instanceof Error ? paErr.message : String(paErr);
      console.error('Pay Advantage error:', msg);
      return NextResponse.json({ error: `Payment gateway error: ${msg}` }, { status: 502 });
    }

    await pool.execute(
      `UPDATE agreements
       SET signature_data = ?, signed_at = ?, status = 'signed',
           payadvantage_customer_id = ?, payment_status = 'processing'
       WHERE id = ?`,
      [signature_data, now, customerId, id]
    );

    // Send signed emails (PDF attached) — fire and forget, don't block response
    const signedAgreement: Agreement = { ...agreement, signed_at: now, status: 'signed' };
    (async () => {
      try {
        const pdfBuffer = await renderToBuffer(
          React.createElement(AgreementPDF, { agreement: signedAgreement }) as React.ReactElement<DocumentProps>
        );
        await Promise.all([
          sendSignedClientEmail(signedAgreement, Buffer.from(pdfBuffer)),
          sendSignedStaffEmail(signedAgreement),
        ]);
      } catch (emailErr) {
        console.error('Failed to send signed emails:', emailErr);
      }
    })();

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('POST /api/agreements/[id]/sign error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
