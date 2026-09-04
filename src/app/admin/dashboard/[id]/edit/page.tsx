import { notFound, redirect } from 'next/navigation';
import pool from '@/lib/db';
import type { Agreement } from '@/types';
import EditAgreementForm from './EditAgreementForm';
import NexitLogo from '@/components/NexitLogo';
import Link from 'next/link';

async function getAgreement(id: string): Promise<Agreement | null> {
  const [rows] = await pool.query<any[]>('SELECT * FROM agreements WHERE id = ?', [id]);
  if (!rows.length) return null;
  const row = rows[0];
  return {
    ...row,
    products: typeof row.products === 'string' ? JSON.parse(row.products) : row.products,
    price: Number(row.price),
  };
}

export default async function EditAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agreement = await getAgreement(id);

  if (!agreement) notFound();
  if (agreement.status !== 'pending') redirect(`/admin/dashboard/${id}`);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-nexit-dark border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <NexitLogo variant="light" />
          <span className="text-gray-500 text-sm">Admin Dashboard</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href={`/admin/dashboard/${id}`} className="hover:text-nexit-navy transition-colors">
            ← Back to Agreement
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold font-sora text-nexit-dark mb-1">Edit Agreement</h1>
          <p className="text-gray-500 text-sm">
            {agreement.business_name} · Changes apply immediately (agreement not yet signed)
          </p>
        </div>

        <EditAgreementForm agreement={agreement} />
      </main>
    </div>
  );
}
