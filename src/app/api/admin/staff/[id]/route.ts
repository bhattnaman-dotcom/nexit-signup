import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAdminToken } from '@/lib/auth';

export const runtime = 'nodejs';

async function auth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value;
  return !!token && verifyAdminToken(token);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const { name, email } = await req.json();
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    const [result] = await pool.execute<any>(
      'UPDATE staff SET name = ?, email = ? WHERE id = ?',
      [name.trim(), email.trim().toLowerCase(), id]
    );
    if (result.affectedRows === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'A staff member with that email already exists' }, { status: 409 });
    }
    console.error('PATCH /api/admin/staff/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    await pool.execute('DELETE FROM staff WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/staff/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
