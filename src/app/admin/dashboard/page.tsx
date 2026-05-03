import pool from '@/lib/db';
import type { AdminAgreementRow } from '@/types';
import NexitLogo from '@/components/NexitLogo';
import StatusBadge from '@/components/StatusBadge';
import LogoutButton from './LogoutButton';
import Link from 'next/link';
import DashboardRowActions from './DashboardRowActions';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(price);
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface Stats {
  sent_month: number;
  sent_year: number;
  revenue_collected: number;
  revenue_pipeline: number;
  revenue_potential: number;
  count_pending: number;
  count_signed: number;
  count_paid: number;
  count_voided: number;
}

interface StaffStat {
  staff_name: string;
  staff_email: string;
  this_month: number;
  this_year: number;
  revenue_generated: number;
}

async function getStats(): Promise<Stats> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) AND status != 'voided' THEN 1 ELSE 0 END) as sent_month,
      SUM(CASE WHEN YEAR(created_at) = YEAR(NOW()) AND status != 'voided' THEN 1 ELSE 0 END) as sent_year,
      SUM(CASE WHEN payment_status = 'paid' THEN price ELSE 0 END) as revenue_collected,
      SUM(CASE WHEN status = 'signed' AND payment_status != 'paid' THEN price ELSE 0 END) as revenue_pipeline,
      SUM(CASE WHEN status = 'pending' THEN price ELSE 0 END) as revenue_potential,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as count_pending,
      SUM(CASE WHEN status = 'signed' THEN 1 ELSE 0 END) as count_signed,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as count_paid,
      SUM(CASE WHEN status = 'voided' THEN 1 ELSE 0 END) as count_voided
    FROM agreements
  `);
  const r = rows[0];
  return {
    sent_month: Number(r.sent_month ?? 0),
    sent_year: Number(r.sent_year ?? 0),
    revenue_collected: Number(r.revenue_collected ?? 0),
    revenue_pipeline: Number(r.revenue_pipeline ?? 0),
    revenue_potential: Number(r.revenue_potential ?? 0),
    count_pending: Number(r.count_pending ?? 0),
    count_signed: Number(r.count_signed ?? 0),
    count_paid: Number(r.count_paid ?? 0),
    count_voided: Number(r.count_voided ?? 0),
  };
}

async function getStaffStats(): Promise<StaffStat[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      staff_name,
      staff_email,
      SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END) as this_month,
      SUM(CASE WHEN YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END) as this_year,
      SUM(CASE WHEN payment_status = 'paid' THEN price ELSE 0 END) as revenue_generated
    FROM agreements
    WHERE status != 'voided'
    GROUP BY staff_name, staff_email
    ORDER BY this_year DESC
  `);
  return rows.map((r) => ({
    staff_name: r.staff_name,
    staff_email: r.staff_email,
    this_month: Number(r.this_month),
    this_year: Number(r.this_year),
    revenue_generated: Number(r.revenue_generated),
  }));
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
    conditions.push('(business_name LIKE ? OR customer_name LIKE ? OR staff_name LIKE ?)');
    const like = `%${params.search}%`;
    values.push(like, like, like);
  }

  if (params.status && params.status !== 'all') {
    conditions.push('status = ?');
    values.push(params.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query<any[]>(
    `SELECT COUNT(*) as total FROM agreements ${where}`, values
  );
  const total = Number(countRows[0].total);

  const [rows] = await pool.query<any[]>(
    `SELECT id, created_at, staff_name, business_name, customer_name, customer_email,
            products, price, billing_type, billing_frequency, status, payment_status
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

interface SearchParams { search?: string; status?: string; page?: string; }

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.search ?? '';
  const status = sp.status ?? 'all';

  const [stats, staffStats, { rows, total }] = await Promise.all([
    getStats(),
    getStaffStats(),
    getAgreements({ search, status, page }),
  ]);

  const totalPages = Math.ceil(total / 20);
  const currentMonth = new Date().toLocaleString('en-AU', { month: 'long', year: 'numeric' });

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
          <div className="flex items-center gap-3">
            <Link
              href="/admin/staff"
              className="px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
              Staff
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-nexit-orange hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Agreement
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── KPI Cards ── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard
              label={`Sent in ${currentMonth.split(' ')[0]}`}
              value={stats.sent_month}
              unit="agreements"
              color="blue"
            />
            <KpiCard
              label={`Sent in ${currentMonth.split(' ')[1]}`}
              value={stats.sent_year}
              unit="agreements"
              color="indigo"
            />
            <KpiCard
              label="Revenue Collected"
              value={formatPrice(stats.revenue_collected)}
              unit="AUD incl. GST"
              color="green"
            />
            <KpiCard
              label="In Pipeline"
              value={formatPrice(stats.revenue_pipeline)}
              unit="signed, awaiting payment"
              color="orange"
              note={stats.count_signed > 0 ? `${stats.count_signed} agreement${stats.count_signed > 1 ? 's' : ''}` : undefined}
            />
            <KpiCard
              label="Potential Revenue"
              value={formatPrice(stats.revenue_potential)}
              unit="not yet signed"
              color="gray"
              note={stats.count_pending > 0 ? `${stats.count_pending} pending` : undefined}
            />
          </div>
        </section>

        {/* ── Status Breakdown ── */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Agreement Status Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Pending', count: stats.count_pending, color: 'bg-amber-50 border-amber-200 text-amber-800' },
              { label: 'Signed', count: stats.count_signed, color: 'bg-blue-50 border-blue-200 text-blue-800' },
              { label: 'Paid', count: stats.count_paid, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
              { label: 'Voided', count: stats.count_voided, color: 'bg-gray-100 border-gray-200 text-gray-500' },
            ].map((s) => (
              <Link
                key={s.label}
                href={buildUrl({ status: s.label.toLowerCase(), page: '1' })}
                className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 ${s.color} hover:opacity-80 transition-opacity cursor-pointer`}
              >
                <span className="text-3xl font-bold font-sora">{s.count}</span>
                <span className="text-xs font-semibold uppercase tracking-wider mt-1">{s.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Staff Performance ── */}
        {staffStats.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Staff Performance
              </h2>
              <span className="text-xs text-gray-400">{currentMonth}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <Th>Staff Member</Th>
                    <Th>Sent This Month</Th>
                    <Th>Sent This Year</Th>
                    <Th>Revenue Generated</Th>
                  </tr>
                </thead>
                <tbody>
                  {staffStats.map((s) => (
                    <tr key={s.staff_email} className="border-b border-gray-50 last:border-0">
                      <Td>
                        <div>
                          <p className="font-medium text-nexit-dark">{s.staff_name}</p>
                          <p className="text-xs text-gray-400">{s.staff_email}</p>
                        </div>
                      </Td>
                      <Td>
                        <span className={`text-lg font-bold font-sora ${s.this_month > 0 ? 'text-nexit-navy' : 'text-gray-300'}`}>
                          {s.this_month}
                        </span>
                      </Td>
                      <Td>
                        <span className={`text-lg font-bold font-sora ${s.this_year > 0 ? 'text-nexit-navy' : 'text-gray-300'}`}>
                          {s.this_year}
                        </span>
                      </Td>
                      <Td>
                        <span className={`font-semibold ${s.revenue_generated > 0 ? 'text-emerald-700' : 'text-gray-300'}`}>
                          {s.revenue_generated > 0 ? formatPrice(s.revenue_generated) : '—'}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Agreement List ── */}
        <section>
          {/* Search & filters */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3">
            <form className="flex-1" action="/admin/dashboard" method="get">
              <div className="flex gap-2">
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Search by business, client or staff name…"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexit-navy/30"
                />
                {status !== 'all' && <input type="hidden" name="status" value={status} />}
                <button
                  type="submit"
                  className="px-4 py-2 bg-nexit-navy text-white rounded-lg text-sm font-medium hover:bg-nexit-navy-light transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'pending', 'signed', 'paid', 'voided'].map((s) => (
                <Link
                  key={s}
                  href={buildUrl({ status: s, page: '1' })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    status === s ? 'bg-nexit-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

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
                      <Th>Staff</Th>
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
                        className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${row.status === 'voided' ? 'opacity-60' : ''}`}
                      >
                        <Td>{formatDate(row.created_at)}</Td>
                        <Td>
                          <div>
                            <p className="font-medium text-nexit-dark">{row.business_name}</p>
                            <p className="text-xs text-gray-400">{(row as any).customer_name}</p>
                          </div>
                        </Td>
                        <Td>
                          <span className="text-xs text-gray-600">{(row as any).staff_name}</span>
                        </Td>
                        <Td>
                          <span className="text-gray-500 text-xs leading-relaxed">
                            {row.products.join(', ')}
                          </span>
                        </Td>
                        <Td>
                          <span className="font-medium">{formatPrice(row.price)}</span>
                        </Td>
                        <Td>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            row.billing_type === 'recurring'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {row.billing_type === 'recurring'
                              ? `↻ ${(row.billing_frequency ?? 'recurring').charAt(0).toUpperCase() + (row.billing_frequency ?? 'recurring').slice(1)}`
                              : '⚡ Once-off'}
                          </span>
                        </Td>
                        <Td>
                          <StatusBadge status={row.status} />
                        </Td>
                        <Td>
                          <DashboardRowActions
                            agreementId={row.id}
                            status={row.status}
                            businessName={row.business_name}
                          />
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
                  <Link href={buildUrl({ page: String(page - 1) })}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
                    ← Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={buildUrl({ page: String(page + 1) })}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function KpiCard({
  label, value, unit, color, note,
}: {
  label: string;
  value: string | number;
  unit: string;
  color: 'blue' | 'indigo' | 'green' | 'orange' | 'gray';
  note?: string;
}) {
  const border = {
    blue: 'border-blue-200 bg-blue-50',
    indigo: 'border-indigo-200 bg-indigo-50',
    green: 'border-emerald-200 bg-emerald-50',
    orange: 'border-orange-200 bg-orange-50',
    gray: 'border-gray-200 bg-gray-50',
  }[color];
  const text = {
    blue: 'text-blue-800',
    indigo: 'text-indigo-800',
    green: 'text-emerald-800',
    orange: 'text-orange-800',
    gray: 'text-gray-600',
  }[color];

  return (
    <div className={`rounded-xl border-2 ${border} p-4`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 leading-tight">{label}</p>
      <p className={`text-2xl font-bold font-sora ${text} leading-none mb-1`}>{value}</p>
      <p className="text-xs text-gray-400">{unit}</p>
      {note && <p className="text-xs text-gray-500 mt-1 font-medium">{note}</p>}
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
