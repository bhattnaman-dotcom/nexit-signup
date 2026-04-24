import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';
import { sendAgreementLinkEmail } from '@/lib/email';
import type { Agreement } from '@/types';

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
      customer_abn,
      products,
      breakdown_notes,
      price,
      billing_type,
      billing_frequency,
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

    const validFrequencies = ['weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly'];
    const freq = billing_type === 'recurring' ? (billing_frequency ?? 'monthly') : null;
    if (freq && !validFrequencies.includes(freq)) {
      return NextResponse.json({ error: 'Invalid billing_frequency' }, { status: 400 });
    }

    const id = uuidv4();

    await pool.execute(
      `INSERT INTO agreements
        (id, staff_name, staff_email, prepared_date, business_name, customer_name, customer_email, customer_phone, customer_abn, products, breakdown_notes, price, billing_type, billing_frequency, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')`,
      [
        id,
        staff_name,
        staff_email,
        prepared_date,
        business_name,
        customer_name,
        customer_email,
        customer_phone,
        customer_abn ?? null,
        JSON.stringify(products),
        breakdown_notes ?? null,
        price,
        billing_type,
        freq,
      ]
    );

    // Email the agreement link to the client
    const agreementUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/agreement/${id}`;
    const agreementForEmail: Agreement = {
      id,
      staff_name,
      staff_email,
      prepared_date,
      business_name,
      customer_name,
      customer_email,
      customer_phone,
      customer_abn: customer_abn ?? null,
      products,
      breakdown_notes: breakdown_notes ?? null,
      price,
      billing_type,
      billing_frequency: freq,
      status: 'pending',
      signature_data: null,
      signed_at: null,
      payadvantage_customer_id: null,
      payment_status: 'unpaid',
      paid_at: null,
      created_at: new Date().toISOString(),
    };
    try {
      await sendAgreementLinkEmail(agreementForEmail, agreementUrl);
    } catch (emailErr) {
      console.error('Failed to send agreement link email:', emailErr);
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/agreements error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
