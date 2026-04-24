'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agreement } from '@/types';

const PRODUCTS = [
  'Website Design',
  'Local SEO',
  'Advanced SEO',
  'Social Media Marketing (SMM)',
  'Paid Ads',
] as const;

const PRESET_PRODUCTS = new Set(PRODUCTS as unknown as string[]);

export default function EditAgreementForm({ agreement }: { agreement: Agreement }) {
  const router = useRouter();

  const presetSelected = agreement.products.filter((p) => PRESET_PRODUCTS.has(p));
  const otherProducts = agreement.products.filter((p) => !PRESET_PRODUCTS.has(p));

  const [form, setForm] = useState({
    staff_name: agreement.staff_name,
    staff_email: agreement.staff_email,
    prepared_date: agreement.prepared_date.split('T')[0],
    business_name: agreement.business_name,
    customer_name: agreement.customer_name,
    customer_email: agreement.customer_email,
    customer_phone: agreement.customer_phone,
    customer_abn: agreement.customer_abn ?? '',
    products: presetSelected,
    other_product: otherProducts.join(', '),
    breakdown_notes: agreement.breakdown_notes ?? '',
    price: String(agreement.price),
    billing_type: agreement.billing_type,
    billing_frequency: agreement.billing_frequency ?? 'monthly',
  });

  const [otherChecked, setOtherChecked] = useState(otherProducts.length > 0);
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
      const res = await fetch(`/api/agreements/${agreement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_name: form.staff_name,
          staff_email: form.staff_email,
          prepared_date: form.prepared_date,
          business_name: form.business_name,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          customer_abn: form.customer_abn.trim() || null,
          products,
          breakdown_notes: form.breakdown_notes.trim() || null,
          price: parseFloat(form.price),
          billing_type: form.billing_type,
          billing_frequency: form.billing_type === 'recurring' ? form.billing_frequency : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update agreement');
      }

      router.push(`/admin/dashboard/${agreement.id}`);
      router.refresh();
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Prepared By */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
          Prepared By
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Staff Name *</label>
            <input type="text" required value={form.staff_name}
              onChange={(e) => setForm((f) => ({ ...f, staff_name: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Staff Email *</label>
            <input type="email" required value={form.staff_email}
              onChange={(e) => setForm((f) => ({ ...f, staff_email: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date *</label>
            <input type="date" required value={form.prepared_date}
              onChange={(e) => setForm((f) => ({ ...f, prepared_date: e.target.value }))}
              className={inputClass} />
          </div>
        </div>
      </section>

      {/* Client Details */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
          Client Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Business Name *</label>
            <input type="text" required value={form.business_name}
              onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Customer Name *</label>
            <input type="text" required value={form.customer_name}
              onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Customer Phone *</label>
            <input type="tel" required value={form.customer_phone}
              onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Customer Email *</label>
            <input type="email" required value={form.customer_email}
              onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              Client ABN <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input type="text" value={form.customer_abn}
              onChange={(e) => setForm((f) => ({ ...f, customer_abn: e.target.value }))}
              className={inputClass} maxLength={14} />
          </div>
        </div>
      </section>

      {/* Services & Pricing */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
          Services &amp; Pricing
        </h2>

        <div className="mb-6">
          <label className={labelClass}>Products / Services *</label>
          <div className="space-y-2 mt-2">
            {PRODUCTS.map((p) => (
              <label key={p}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-nexit-navy/40 hover:bg-blue-50/30 cursor-pointer transition-colors">
                <input type="checkbox" checked={form.products.includes(p)}
                  onChange={() => toggleProduct(p)} className="accent-nexit-orange w-4 h-4" />
                <span className="text-sm text-gray-700">{p}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-nexit-navy/40 hover:bg-blue-50/30 cursor-pointer transition-colors">
              <input type="checkbox" checked={otherChecked}
                onChange={(e) => {
                  setOtherChecked(e.target.checked);
                  if (!e.target.checked) setForm((f) => ({ ...f, other_product: '' }));
                }}
                className="accent-nexit-orange w-4 h-4" />
              <span className="text-sm text-gray-700">Other</span>
            </label>
            {otherChecked && (
              <div className="ml-7 mt-1">
                <input type="text" value={form.other_product}
                  onChange={(e) => setForm((f) => ({ ...f, other_product: e.target.value }))}
                  placeholder="Describe the service…" className={inputClass} />
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className={labelClass}>
            Pricing Breakdown <span className="text-gray-400 font-normal">(optional — shown on PDF)</span>
          </label>
          <textarea value={form.breakdown_notes}
            onChange={(e) => setForm((f) => ({ ...f, breakdown_notes: e.target.value }))}
            className={`${inputClass} resize-none`} rows={5} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Price (AUD, incl. GST) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
              <input type="number" required min="1" step="0.01" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className={`${inputClass} pl-8`} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Billing Type *</label>
            <div className="flex gap-3 mt-2">
              {(['once-off', 'recurring'] as const).map((bt) => (
                <label key={bt}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium ${
                    form.billing_type === bt
                      ? 'border-nexit-orange bg-orange-50 text-nexit-orange'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  <input type="radio" name="billing_type" value={bt}
                    checked={form.billing_type === bt}
                    onChange={() => setForm((f) => ({ ...f, billing_type: bt }))}
                    className="hidden" />
                  {bt === 'once-off' ? 'Once-off' : 'Recurring'}
                </label>
              ))}
            </div>
          </div>
          {form.billing_type === 'recurring' && (
            <div>
              <label className={labelClass}>Billing Frequency *</label>
              <select value={form.billing_frequency}
                onChange={(e) => setForm((f) => ({ ...f, billing_frequency: e.target.value as typeof f.billing_frequency }))}
                className={inputClass} required>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting}
          className="flex-1 py-3 bg-nexit-orange hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          {submitting ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
