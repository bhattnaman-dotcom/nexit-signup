import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAdminToken } from '@/lib/auth';

export const runtime = 'nodejs';

async function auth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value;
  return !!token && verifyAdminToken(token);
}

export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [rows] = await pool.query<any[]>('SELECT id, name, email, created_at FROM staff ORDER BY name ASC');
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, email } = await req.json();
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    const [result] = await pool.execute<any>(
      'INSERT INTO staff (name, email) VALUES (?, ?)',
      [name.trim(), email.trim().toLowerCase()]
    );
    return NextResponse.json({ id: result.insertId, name: name.trim(), email: email.trim().toLowerCase() }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'A staff member with that email already exists' }, { status: 409 });
    }
    console.error('POST /api/admin/staff error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
