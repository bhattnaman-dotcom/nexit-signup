'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NexitLogo from '@/components/NexitLogo';

const PRODUCTS = [
  'Website Design',
  'Local SEO',
  'Advanced SEO',
  'Social Media Marketing (SMM)',
  'Paid Ads',
] as const;

export default function StaffFormPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    staff_name: '',
    staff_email: '',
    prepared_date: today,
    business_name: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    products: [] as string[],
    other_product: '',
    price: '',
    billing_type: 'recurring' as 'once-off' | 'recurring',
  });

  const [otherChecked, setOtherChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function toggleProduct(p: string) {
    setForm((f) => ({
      ...f,
      products: f.products.includes(p) ? f.products.filter((x) => x !== p) : [...f.products, p],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const products = [
      ...form.products,
      ...(otherChecked && form.other_product.trim() ? [form.other_product.trim()] : []),
    ];

    if (products.length === 0) {
      setError('Please select at least one service.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_name: form.staff_name,
          staff_email: form.staff_email,
          prepared_date: form.prepared_date,
          business_name: form.business_name,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          products,
          price: parseFloat(form.price),
          billing_type: form.billing_type,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create agreement');
      }

      const { id } = await res.json();
      router.push(`/agreement/${id}/created`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexit-navy/30 focus:border-nexit-navy transition-colors';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-nexit-dark border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <NexitLogo textClassName="text-white text-xl" />
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Staff Portal
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-nexit-dark font-sora mb-2">
            New Client Agreement
          </h1>
          <p className="text-gray-500 text-sm">
            Complete the form below to generate a shareable client agreement link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section A: Prepared By */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-nexit-navy text-white text-sm font-bold flex items-center justify-center font-sora">
                A
              </div>
              <h2 className="text-lg font-semibold font-sora text-nexit-dark">Prepared By</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Staff Name *</label>
                <input
                  type="text"
                  required
                  value={form.staff_name}
                  onChange={(e) => setForm((f) => ({ ...f, staff_name: e.target.value }))}
                  className={inputClass}
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className={labelClass}>Staff Email *</label>
                <input
                  type="email"
                  required
                  value={form.staff_email}
                  onChange={(e) => setForm((f) => ({ ...f, staff_email: e.target.value }))}
                  className={inputClass}
                  placeholder="jane@nexit.com.au"
                />
              </div>
              <div>
                <label className={labelClass}>Date *</label>
                <input
                  type="date"
                  required
                  value={form.prepared_date}
                  onChange={(e) => setForm((f) => ({ ...f, prepared_date: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Section B: Client Details */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-nexit-navy text-white text-sm font-bold flex items-center justify-center font-sora">
                B
              </div>
              <h2 className="text-lg font-semibold font-sora text-nexit-dark">Client Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className={labelClass}>Business Name *</label>
                <input
                  type="text"
                  required
                  value={form.business_name}
                  onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                  className={inputClass}
                  placeholder="Acme Pty Ltd"
                />
              </div>
              <div>
                <label className={labelClass}>Customer Name *</label>
                <input
                  type="text"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  className={inputClass}
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className={labelClass}>Customer Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.customer_phone}
                  onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                  className={inputClass}
                  placeholder="0400 000 000"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Customer Email *</label>
                <input
                  type="email"
                  required
                  value={form.customer_email}
                  onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
                  className={inputClass}
                  placeholder="jane@acme.com.au"
                />
              </div>
            </div>
          </section>

          {/* Section C: Services & Pricing */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-nexit-navy text-white text-sm font-bold flex items-center justify-center font-sora">
                C
              </div>
              <h2 className="text-lg font-semibold font-sora text-nexit-dark">
                Services &amp; Pricing
              </h2>
            </div>

            {/* Products */}
            <div className="mb-6">
              <label className={labelClass}>Products / Services *</label>
              <div className="space-y-2 mt-2">
                {PRODUCTS.map((p) => (
                  <label
                    key={p}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-nexit-navy/40 hover:bg-blue-50/30 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={form.products.includes(p)}
                      onChange={() => toggleProduct(p)}
                      className="accent-nexit-orange w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{p}</span>
                  </label>
                ))}

                {/* Other */}
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-nexit-navy/40 hover:bg-blue-50/30 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={otherChecked}
                    onChange={(e) => {
                      setOtherChecked(e.target.checked);
                      if (!e.target.checked) setForm((f) => ({ ...f, other_product: '' }));
                    }}
                    className="accent-nexit-orange w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Other</span>
                </label>

                {otherChecked && (
                  <div className="ml-7 mt-1">
                    <input
                      type="text"
                      value={form.other_product}
                      onChange={(e) => setForm((f) => ({ ...f, other_product: e.target.value }))}
                      placeholder="Describe the service…"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Price & Billing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Price (AUD, incl. GST) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className={`${inputClass} pl-8`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Billing Type *</label>
                <div className="flex gap-3 mt-2">
                  {(['once-off', 'recurring'] as const).map((bt) => (
                    <label
                      key={bt}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium ${
                        form.billing_type === bt
                          ? 'border-nexit-orange bg-orange-50 text-nexit-orange'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="billing_type"
                        value={bt}
                        checked={form.billing_type === bt}
                        onChange={() => setForm((f) => ({ ...f, billing_type: bt }))}
                        className="hidden"
                      />
                      {bt === 'once-off' ? 'Once-off' : 'Recurring'}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-nexit-orange hover:bg-orange-600 text-white font-semibold rounded-xl text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting ? 'Generating Agreement…' : 'Generate Agreement →'}
          </button>
        </form>
      </main>
    </div>
  );
}
