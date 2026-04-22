import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import type { Agreement } from '@/types';
import NexitLogo from '@/components/NexitLogo';

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

export default async function SignedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agreement = await getAgreement(id);
  if (!agreement) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-nexit-dark">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <NexitLogo textClassName="text-white text-xl" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Celebration banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 mb-5">
            <svg
              className="w-12 h-12 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-sora text-nexit-dark mb-3">
            Agreement Signed &amp; Payment Set Up!
          </h1>
          <p className="text-gray-500">
            Thank you, <strong>{agreement.customer_name}</strong>. You're all set.
          </p>
        </div>

        {/* Confirmation card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
              </svg>
              Active Agreement
            </span>
          </div>

          <div className="space-y-3">
            <Row label="Business" value={agreement.business_name} />
            <Row label="Contact" value={agreement.customer_name} />
            <Row
              label="Services"
              value={
                <div className="flex flex-wrap gap-1.5">
                  {agreement.products.map((p) => (
                    <span key={p} className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              }
            />
            <Row
              label="Investment"
              value={`${formatPrice(agreement.price)} AUD (incl. GST)`}
            />
            <Row
              label="Billing"
              value={agreement.billing_type === 'recurring' ? 'Recurring monthly' : 'Once-off payment'}
            />
          </div>
        </div>

        {/* Email confirmation note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-6">
          <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <p className="text-sm text-blue-700">
            A copy of your signed agreement has been sent to{' '}
            <strong>{agreement.customer_email}</strong>
          </p>
        </div>

        {/* Contact card */}
        <div className="bg-nexit-dark rounded-2xl p-6 text-center">
          <NexitLogo className="justify-center mb-4" textClassName="text-white text-lg" />
          <p className="text-gray-400 text-sm mb-4">
            Questions? Our team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm">
            <a
              href="mailto:hello@nexit.com.au"
              className="flex items-center justify-center gap-2 text-nexit-orange hover:text-nexit-orange-light transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              hello@nexit.com.au
            </a>
            <span className="hidden sm:inline text-gray-600">·</span>
            <span className="text-gray-400">Melbourne, VIC, Australia</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="w-24 text-xs font-semibold text-gray-400 uppercase tracking-wider pt-0.5 shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}
