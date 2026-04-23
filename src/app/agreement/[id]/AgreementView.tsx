'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Agreement } from '@/types';
import SignaturePad from '@/components/SignaturePad';
import { TC_SECTIONS } from '@/lib/tc';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(price);
}

type Stage = 'sign' | 'payment' | 'complete';

export default function AgreementView({ agreement }: { agreement: Agreement }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(() => {
    if (agreement.status === 'paid') return 'complete';
    if (agreement.status === 'signed') return 'payment';
    return 'sign';
  });
  const [tcConsent, setTcConsent] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Poll for payment completion (webhook-driven)
  useEffect(() => {
    if (stage !== 'payment') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/agreements/${agreement.id}`);
        if (!res.ok) return;
        const data: Agreement = await res.json();
        if (data.payment_status === 'paid') {
          clearInterval(interval);
          router.push(`/agreement/${agreement.id}/signed`);
        }
      } catch {
        // ignore transient errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [stage, agreement.id, router]);

  // Already paid — redirect
  useEffect(() => {
    if (agreement.status === 'paid') {
      router.push(`/agreement/${agreement.id}/signed`);
    }
  }, [agreement.id, agreement.status, router]);

  const handleSign = useCallback(async () => {
    if (!tcConsent || !signatureData) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/agreements/${agreement.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_data: signatureData }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to submit signature');
      }

      setStage('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }, [agreement.id, tcConsent, signatureData]);

  const preparedDate = new Date(agreement.prepared_date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (agreement.status === 'signed' && stage === 'sign') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
          <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-sora text-nexit-dark mb-2">
          This agreement has already been signed.
        </h2>
        <p className="text-gray-500 text-sm">
          Please check your email for a copy of your signed agreement.
        </p>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Hero banner */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-nexit-navy to-nexit-navy-light text-white px-8 py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-2">
          Melbourne, VIC · Australia
        </p>
        <h1 className="text-3xl font-bold font-sora mb-2">Your Service Agreement</h1>
        <p className="text-blue-200 text-sm">
          Prepared {preparedDate} by {agreement.staff_name}
        </p>
      </div>

      {/* Agreement Details card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
          Agreement Details
        </h2>

        <div className="space-y-3 mb-6">
          <DetailRow label="Business" value={agreement.business_name} />
          <DetailRow label="Contact" value={agreement.customer_name} />
          <DetailRow label="Prepared By" value={`${agreement.staff_name} (${agreement.staff_email})`} />
        </div>

        {/* Services pills */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Services</p>
          <div className="flex flex-wrap gap-2">
            {agreement.products.map((p) => (
              <span
                key={p}
                className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Price & billing */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Investment
            </p>
            <p className="text-2xl font-bold font-sora text-nexit-dark">
              {formatPrice(agreement.price)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">AUD incl. GST</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-bold ${
              agreement.billing_type === 'recurring'
                ? 'bg-nexit-navy text-white'
                : 'bg-nexit-orange text-white'
            }`}
          >
            {agreement.billing_type === 'recurring' ? '↻ Recurring' : '⚡ Once-off'}
          </span>
        </div>
      </div>

      {stage === 'sign' && (
        <>
          {/* Terms & Conditions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Terms &amp; Conditions
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Please read carefully before signing. Governing law: Victoria, Australia. ABN [ABN].
            </p>

            {/* Scrollable T&C */}
            <div
              className="h-[260px] overflow-y-auto border border-gray-200 rounded-xl p-4 space-y-5 text-sm text-gray-600 leading-relaxed"
              style={{ scrollbarWidth: 'thin' }}
            >
              {TC_SECTIONS.map((section) => (
                <div key={section.number}>
                  <h3 className="font-semibold text-nexit-navy mb-1">
                    {section.number}. {section.title}
                  </h3>
                  <p>{section.content}</p>
                </div>
              ))}
            </div>

            {/* Consent checkbox */}
            <label className="flex items-start gap-3 mt-5 p-4 bg-gray-50 rounded-xl cursor-pointer group">
              <input
                type="checkbox"
                checked={tcConsent}
                onChange={(e) => setTcConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-nexit-orange rounded shrink-0"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                I, <strong>{agreement.customer_name}</strong> on behalf of{' '}
                <strong>{agreement.business_name}</strong>, have read and agree to the NexIT
                Solutions Terms &amp; Conditions above and confirm all details are accurate.
              </span>
            </label>
          </div>

          {/* Signature box — only after checkbox ticked */}
          {tcConsent && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Your Signature
              </h2>
              <SignaturePad
                onChange={setSignatureData}
                customerName={agreement.customer_name}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Sign button */}
          <button
            type="button"
            disabled={!tcConsent || !signatureData || submitting}
            onClick={handleSign}
            className="w-full py-4 bg-nexit-orange hover:bg-orange-600 text-white font-bold rounded-2xl text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting ? 'Submitting…' : 'Sign & Submit Agreement →'}
          </button>

          {(!tcConsent || !signatureData) && (
            <p className="text-center text-xs text-gray-400">
              {!tcConsent
                ? 'Please read and accept the Terms & Conditions to continue'
                : 'Please provide your signature to continue'}
            </p>
          )}
        </>
      )}

      {stage === 'payment' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex gap-3 items-start">
            <svg className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <p className="text-sm text-emerald-800">
              <strong>Agreement signed successfully.</strong>
            </p>
          </div>

          <div className="text-center py-8 px-4">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-nexit-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-nexit-navy mb-2">Check your email</h2>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Pay Advantage has sent a payment authorisation link to <strong>{agreement.customer_email}</strong>.
              Please check your inbox and follow the link to set up your {agreement.billing_frequency ?? 'recurring'} payment of{' '}
              <strong>{new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(agreement.price)}</strong>.
            </p>
            <p className="text-xs text-gray-400 mt-4">
              Payments are securely processed by Pay Advantage.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="w-28 text-xs font-semibold text-gray-400 uppercase tracking-wider pt-0.5 shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}
