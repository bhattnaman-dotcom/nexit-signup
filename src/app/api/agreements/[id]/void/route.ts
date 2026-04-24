import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await pool.query<any[]>('SELECT status FROM agreements WHERE id = ?', [id]);
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (rows[0].status === 'paid') {
      return NextResponse.json({ error: 'Paid agreements cannot be voided' }, { status: 409 });
    }
    await pool.execute("UPDATE agreements SET status = 'voided' WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/agreements/[id]/void error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
