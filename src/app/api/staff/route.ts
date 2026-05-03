import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

// Public endpoint — returns staff list for the agreement creation form
export async function GET() {
  const [rows] = await pool.query<any[]>(
    'SELECT id, name, email FROM staff ORDER BY name ASC'
  );
  return NextResponse.json(rows);
}
