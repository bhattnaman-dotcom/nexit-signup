import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken } from '@/lib/auth';
import pool from '@/lib/db';
import NexitLogo from '@/components/NexitLogo';
import Link from 'next/link';
import StaffManager from './StaffManager';

export const runtime = 'nodejs';

interface StaffRow {
  id: number;
  name: string;
  email: string;
  created_at: string;
  agreement_count: number;
}

async function getStaff(): Promise<StaffRow[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT s.id, s.name, s.email, s.created_at,
           COUNT(a.id) as agreement_count
    FROM staff s
    LEFT JOIN agreements a ON a.staff_email = s.email AND a.status != 'voided'
    GROUP BY s.id, s.name, s.email, s.created_at
    ORDER BY s.name ASC
  `);
  return rows.map((r) => ({ ...r, agreement_count: Number(r.agreement_count) }));
}

export default async function StaffPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !(await verifyAdminToken(token))) redirect('/admin');

  const staff = await getStaff();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-nexit-dark border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NexitLogo variant="light" />
            <span className="text-gray-500 text-sm hidden sm:block">Staff Management</span>
          </div>
          <Link
            href="/admin/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-sora text-nexit-dark mb-1">Staff Directory</h1>
          <p className="text-gray-500 text-sm">
            Staff listed here will appear in the agreement form dropdown for quick auto-fill.
          </p>
        </div>

        <StaffManager initialStaff={staff} />
      </main>
    </div>
  );
}
