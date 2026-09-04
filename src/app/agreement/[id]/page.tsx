import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import type { Agreement } from '@/types';
import NexitLogo from '@/components/NexitLogo';
import AgreementView from './AgreementView';

async function getAgreement(id: string): Promise<Agreement | null> {
  const [rows] = await pool.query<any[]>(
    `SELECT id, staff_name, staff_email, prepared_date, business_name, customer_name, customer_email,
            customer_phone, customer_abn, products, breakdown_notes, price, billing_type, billing_frequency,
            sd_phase, sd_scope, sd_total_cost, status, signed_at, payadvantage_customer_id,
            payment_status, paid_at, created_at
     FROM agreements WHERE id = ?`,
    [id]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    ...row,
    products: typeof row.products === 'string' ? JSON.parse(row.products) : row.products,
    price: Number(row.price),
    sd_total_cost: row.sd_total_cost != null ? Number(row.sd_total_cost) : null,
    signature_data: null,
  };
}

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agreement = await getAgreement(id);
  if (!agreement) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="bg-nexit-dark sticky top-0 z-20 shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <NexitLogo variant="light" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest bg-nexit-navy/60 px-3 py-1 rounded-full">
            Client Agreement
          </span>
        </div>
      </header>

      <AgreementView agreement={agreement} />
    </div>
  );
}
