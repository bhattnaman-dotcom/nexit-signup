import { notFound } from 'next/navigation';
import Link from 'next/link';
import pool from '@/lib/db';
import type { Agreement } from '@/types';
import NexitLogo from '@/components/NexitLogo';
import StatusBadge from '@/components/StatusBadge';

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

function formatDatetime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminAgreementDetailPage({
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
      <header className="bg-nexit-dark border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <NexitLogo textClassName="text-white text-xl" />
          <span className="text-gray-500 text-sm">Admin Dashboard</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/admin/dashboard" className="hover:text-nexit-navy transition-colors">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Title row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-sora text-nexit-dark">
              {agreement.business_name}
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-mono">{agreement.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={agreement.status} className="text-sm px-3 py-1" />
            {agreement.status !== 'pending' && (
              <a
                href={`/api/admin/agreements/${agreement.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-nexit-orange text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download PDF
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prepared By */}
          <Card title="Prepared By">
            <Field label="Staff Name" value={agreement.staff_name} />
            <Field label="Staff Email" value={agreement.staff_email} />
            <Field
              label="Prepared Date"
              value={new Date(agreement.prepared_date).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
            <Field label="Created" value={formatDatetime(agreement.created_at)} />
          </Card>

          {/* Client Details */}
          <Card title="Client Details">
            <Field label="Business" value={agreement.business_name} />
            <Field label="Contact" value={agreement.customer_name} />
            <Field label="Email" value={agreement.customer_email} />
            <Field label="Phone" value={agreement.customer_phone} />
          </Card>

          {/* Services & Pricing */}
          <Card title="Services & Pricing">
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Services
              </p>
              <div className="flex flex-wrap gap-1.5">
                {agreement.products.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <Field label="Price" value={`${formatPrice(agreement.price)} AUD (incl. GST)`} />
            <Field
              label="Billing"
              value={agreement.billing_type === 'recurring' ? 'Recurring Monthly' : 'Once-off'}
            />
          </Card>

          {/* Status & Timestamps */}
          <Card title="Status & Timestamps">
            <Field label="Agreement Status" value={agreement.status} capitalize />
            <Field label="Payment Status" value={agreement.payment_status} capitalize />
            <Field label="Signed At" value={formatDatetime(agreement.signed_at)} />
            <Field label="Paid At" value={formatDatetime(agreement.paid_at)} />
            {agreement.payadvantage_customer_id && (
              <Field
                label="PA Customer ID"
                value={agreement.payadvantage_customer_id}
                mono
              />
            )}
          </Card>
        </div>

        {/* Signature */}
        {agreement.signature_data && (
          <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Client Signature
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 inline-block border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={agreement.signature_data}
                alt="Client signature"
                className="max-h-32 max-w-sm object-contain"
              />
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Signed by:</span> {agreement.customer_name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">On behalf of:</span> {agreement.business_name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">At:</span> {formatDatetime(agreement.signed_at)}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  capitalize,
  mono,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="w-32 text-xs font-semibold text-gray-400 uppercase tracking-wider pt-0.5 shrink-0">
        {label}
      </span>
      <span
        className={`text-sm text-gray-800 ${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
