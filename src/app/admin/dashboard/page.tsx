import pool from '@/lib/db';
import type { AdminAgreementRow } from '@/types';
import NexitLogo from '@/components/NexitLogo';
import StatusBadge from '@/components/StatusBadge';
import LogoutButton from './LogoutButton';
import Link from 'next/link';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(price);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function getAgreements(params: {
  search?: string;
  status?: string;
  page: number;
}): Promise<{ rows: AdminAgreementRow[]; total: number }> {
  const PAGE_SIZE = 20;
  const offset = (params.page - 1) * PAGE_SIZE;
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.search) {
    conditions.push('(business_name LIKE ? OR customer_name LIKE ?)');
    const like = `%${params.search}%`;
    values.push(like, like);
  }

  if (params.status && params.status !== 'all') {
    conditions.push('status = ?');
    values.push(params.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query<any[]>(
    `SELECT COUNT(*) as total FROM agreements ${where}`,
    values
  );
  const total = Number(countRows[0].total);

  const [rows] = await pool.query<any[]>(
    `SELECT id, created_at, business_name, customer_name, products, price, billing_type, status, payment_status
     FROM agreements ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, PAGE_SIZE, offset]
  );

  return {
    rows: rows.map((r) => ({
      ...r,
      products: typeof r.products === 'string' ? JSON.parse(r.products) : r.products,
      price: Number(r.price),
    })),
    total,
  };
}

interface SearchParams {
  search?: string;
  status?: string;
  page?: string;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.search ?? '';
  const status = sp.status ?? 'all';

  const { rows, total } = await getAgreements({ search, status, page });
  const totalPages = Math.ceil(total / 20);

  function buildUrl(overrides: Partial<SearchParams>): string {
    const p = new URLSearchParams();
    if (overrides.search ?? search) p.set('search', overrides.search ?? search);
    if ((overrides.status ?? status) !== 'all') p.set('status', overrides.status ?? status);
    if (Number(overrides.page ?? page) > 1) p.set('page', String(overrides.page ?? page));
    const qs = p.toString();
    return `/admin/dashboard${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-nexit-dark border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NexitLogo textClassName="text-white text-xl" />
            <span className="text-gray-500 text-sm hidden sm:block">Admin Dashboard</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total', value: total, color: 'text-nexit-dark' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-400 mb-1">{s.label} Agreements</p>
              <p className={`text-3xl font-bold font-sora ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search & filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <form className="flex-1" action="/admin/dashboard" method="get">
            <div className="flex gap-2">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by business or client name…"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexit-navy/30"
              />
              {status !== 'all' && (
                <input type="hidden" name="status" value={status} />
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-nexit-navy text-white rounded-lg text-sm font-medium hover:bg-nexit-navy-light transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Status filter */}
          <div className="flex gap-1.5">
            {['all', 'pending', 'signed', 'paid'].map((s) => (
              <Link
                key={s}
                href={buildUrl({ status: s, page: '1' })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  status === s
                    ? 'bg-nexit-navy text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {rows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>No agreements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <Th>Date</Th>
                    <Th>Business</Th>
                    <Th>Client</Th>
                    <Th>Services</Th>
                    <Th>Price</Th>
                    <Th>Billing</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <Td>{formatDate(row.created_at)}</Td>
                      <Td>
                        <span className="font-medium text-nexit-dark">{row.business_name}</span>
                      </Td>
                      <Td>{row.customer_name}</Td>
                      <Td>
                        <span className="text-gray-500 text-xs leading-relaxed">
                          {row.products.join(', ')}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-medium">{formatPrice(row.price)}</span>
                      </Td>
                      <Td>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            row.billing_type === 'recurring'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {row.billing_type === 'recurring' ? 'Recurring' : 'Once-off'}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={row.status} />
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/dashboard/${row.id}`}
                            className="text-nexit-navy hover:text-nexit-navy-light text-xs font-medium underline-offset-2 hover:underline"
                          >
                            View
                          </Link>
                          {row.status !== 'pending' && (
                            <a
                              href={`/api/admin/agreements/${row.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-nexit-orange hover:text-orange-600 text-xs font-medium underline-offset-2 hover:underline"
                            >
                              PDF
                            </a>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <p className="text-gray-400">
              Page {page} of {totalPages} · {total} agreements
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  ← Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-gray-700 align-top">{children}</td>;
}
