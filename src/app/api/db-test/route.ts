import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await pool.query('SELECT 1 AS ok');

    // Check if agreements table exists
    const [tables] = await pool.query<any[]>(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agreements'`
    );
    const tableExists = (tables as any[]).length > 0;

    // If table exists, count rows
    let rowCount: number | null = null;
    if (tableExists) {
      const [countRows] = await pool.query<any[]>('SELECT COUNT(*) as n FROM agreements');
      rowCount = Number((countRows as any[])[0].n);
    }

    return NextResponse.json({
      status: 'connected',
      database: process.env.DB_NAME,
      agreements_table_exists: tableExists,
      row_count: rowCount,
    });
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { code?: string; sqlMessage?: string };
    return NextResponse.json(
      {
        status: 'failed',
        message: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage,
        host: process.env.DB_HOST ?? '(not set)',
        database: process.env.DB_NAME ?? '(not set)',
        user: process.env.DB_USER ?? '(not set)',
        password_set: !!process.env.DB_PASSWORD,
      },
      { status: 500 }
    );
  }
}
