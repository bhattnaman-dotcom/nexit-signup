import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await pool.query('SELECT 1 AS ok');

    const [tables] = await pool.query<any[]>(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agreements'`
    );
    const tableExists = (tables as any[]).length > 0;

    let rowCount: number | null = null;
    if (tableExists) {
      const [countRows] = await pool.query<any[]>('SELECT COUNT(*) as n FROM agreements');
      rowCount = Number((countRows as any[])[0].n);
    }

    const paConfigured =
      !!process.env.PAY_ADVANTAGE_USERNAME &&
      !!process.env.PAY_ADVANTAGE_PASSWORD &&
      !!process.env.PAY_ADVANTAGE_BASE_URL;

    return NextResponse.json({
      db_connected: true,
      database: process.env.DB_NAME,
      agreements_table_exists: tableExists,
      row_count: rowCount,
      pay_advantage_configured: paConfigured,
      pay_advantage_base_url: process.env.PAY_ADVANTAGE_BASE_URL ?? '(not set)',
      pay_advantage_username_set: !!process.env.PAY_ADVANTAGE_USERNAME,
      pay_advantage_password_set: !!process.env.PAY_ADVANTAGE_PASSWORD,
      gmail_configured: !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD,
      admin_hash_set: !!process.env.ADMIN_PASSWORD_HASH,
      jwt_secret_set: !!process.env.JWT_SECRET,
    });
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { code?: string; sqlMessage?: string };
    return NextResponse.json(
      {
        db_connected: false,
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
