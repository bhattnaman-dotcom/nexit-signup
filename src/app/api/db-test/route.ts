import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    return NextResponse.json({ status: 'connected', result: rows });
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { code?: string; sqlMessage?: string };
    return NextResponse.json(
      {
        status: 'failed',
        message: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage,
        host: process.env.DB_HOST ?? '(not set)',
        port: process.env.DB_PORT ?? '(not set)',
        database: process.env.DB_NAME ?? '(not set)',
        user: process.env.DB_USER ?? '(not set)',
        password_set: !!process.env.DB_PASSWORD,
      },
      { status: 500 }
    );
  }
}
