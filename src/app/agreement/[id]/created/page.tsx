import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import type { Agreement } from '@/types';
import NexitLogo from '@/components/NexitLogo';
import CopyLinkButton from './CopyLinkButton';

async function getAgreement(id: string): Promise<Agreement | null> {
  const [rows] = await pool.query<any[]>(
    'SELECT * FROM agreements WHERE id = ?',
    [id]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    ...row,
    products: typeof row.products === 'string' ? JSON.parse(row.products) : row.products,
    price: Number(row.price),
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(price);
}

export default async function AgreementCreatedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agreement = await getAgreement(id);
  if (!agreement) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const shareUrl = `${baseUrl}/agreement/${id}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-nexit-dark border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <NexitLogo variant="light" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-sora text-nexit-dark mb-2">
            Agreement Created!
          </h1>
          <p className="text-gray-500 text-sm">
            Share the link below with your client so they can review, sign, and complete payment.
          </p>
        </div>

        {/* Share link card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Shareable Link
          </h2>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 mb-4">
            <span className="flex-1 text-sm text-gray-700 font-mono break-all">{shareUrl}</span>
          </div>
          <CopyLinkButton url={shareUrl} />
          <p className="text-xs text-gray-400 mt-3">
            Share this link with your client — they can review and sign directly. No login required.
          </p>
        </div>

        {/* Agreement summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Agreement Summary
          </h2>
          <div className="space-y-3">
            <SummaryRow label="Client" value={agreement.customer_name} />
            <SummaryRow label="Business" value={agreement.business_name} />
            <SummaryRow label="Email" value={agreement.customer_email} />
            <SummaryRow
              label="Services"
              value={
                <div className="flex flex-wrap gap-1.5">
                  {agreement.products.map((p) => (
                    <span
                      key={p}
                      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              }
            />
            <SummaryRow
              label="Investment"
              value={`${formatPrice(agreement.price)} AUD (incl. GST)`}
            />
            <SummaryRow
              label="Billing"
              value={
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    agreement.billing_type === 'recurring'
                      ? 'bg-nexit-navy text-white'
                      : 'bg-nexit-orange text-white'
                  }`}
                >
                  {agreement.billing_type === 'recurring' ? 'Recurring' : 'Once-off'}
                </span>
              }
            />
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-nexit-navy transition-colors"
          >
            ← Create another agreement
          </a>
        </div>
      </main>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="w-24 text-xs font-semibold text-gray-400 uppercase tracking-wider pt-0.5 shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}
