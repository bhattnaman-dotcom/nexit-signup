import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { AgreementPDF } from '@/lib/pdf';
import React from 'react';
import type { Agreement } from '@/types';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await pool.query<any[]>(
      'SELECT * FROM agreements WHERE id = ?',
      [id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const row = rows[0];
    const agreement: Agreement = {
      ...row,
      products: typeof row.products === 'string' ? JSON.parse(row.products) : row.products,
      price: Number(row.price),
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(AgreementPDF, { agreement }) as React.ReactElement<DocumentProps>
    );

    const filename = `NexIT-Agreement-${agreement.business_name.replace(/[^a-z0-9]/gi, '-')}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('GET /api/admin/agreements/[id]/pdf error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
