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
          <NexitLogo variant="light" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-14 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 mb-6">
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

        {/* Heading */}
        <h1 className="text-3xl font-bold font-sora text-nexit-dark mb-3">
          Thank You — You&apos;re All Set!
        </h1>
        <p className="text-gray-500 text-base mb-2">
          Hi <strong>{agreement.customer_name}</strong>, your agreement is confirmed.
        </p>
        <p className="text-gray-400 text-sm mb-10">
          If anything is required, our team will be in touch with you shortly.
        </p>

        {/* Summary card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Agreement Summary
          </p>
          <div className="space-y-3">
            <SummaryRow label="Business" value={agreement.business_name} />
            <SummaryRow label="Contact" value={agreement.customer_name} />
            <SummaryRow
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
            <SummaryRow
              label="Investment"
              value={new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(agreement.price) + ' AUD (incl. GST)'}
            />
          </div>
        </div>

        {/* Email note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-left mb-8">
          <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <p className="text-sm text-blue-700">
            A copy of your signed agreement has been sent to{' '}
            <strong>{agreement.customer_email}</strong>
          </p>
        </div>

        {/* Contact */}
        <div className="bg-nexit-dark rounded-2xl p-6">
          <NexitLogo variant="light" height={30} className="mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-4">Questions? Our team is here to help.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm">
            <a
              href="mailto:hello@nexit.com.au"
              className="flex items-center justify-center gap-2 text-nexit-orange hover:text-orange-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              hello@nexit.com.au
            </a>
            <span className="hidden sm:inline text-gray-600">·</span>
            <a
              href="tel:0391932978"
              className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              03 9193 2978
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="w-24 text-xs font-semibold text-gray-400 uppercase tracking-wider pt-0.5 shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}
