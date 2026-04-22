import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/payadvantage';
import { sendClientEmail, sendStaffEmail } from '@/lib/email';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { AgreementPDF } from '@/lib/pdf';
import React from 'react';
import type { Agreement } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-payadvantage-signature');

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // We expect: { event: 'payment.completed', reference: '<agreement-uuid>', ... }
    const event = payload.event ?? payload.type;
    const reference = payload.reference ?? payload.data?.reference;

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    if (event !== 'payment.completed' && event !== 'subscription.created') {
      // Non-payment events — acknowledge but do nothing
      return NextResponse.json({ ok: true });
    }

    // Fetch agreement
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM agreements WHERE id = ?',
      [reference]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    const row = rows[0];
    if (row.payment_status === 'paid') {
      // Already processed — idempotent
      return NextResponse.json({ ok: true });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update DB
    await pool.execute(
      `UPDATE agreements SET payment_status = 'paid', paid_at = ?, status = 'paid' WHERE id = ?`,
      [now, reference]
    );

    // Re-fetch with updated timestamps
    const [updatedRows] = await pool.query<any[]>(
      'SELECT * FROM agreements WHERE id = ?',
      [reference]
    );
    const updated = updatedRows[0];
    const agreement: Agreement = {
      ...updated,
      products: typeof updated.products === 'string' ? JSON.parse(updated.products) : updated.products,
      price: Number(updated.price),
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(AgreementPDF, { agreement }) as React.ReactElement<DocumentProps>
    );

    // Send emails
    await Promise.all([
      sendClientEmail(agreement, Buffer.from(pdfBuffer)),
      sendStaffEmail(agreement),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/webhooks/payadvantage error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
