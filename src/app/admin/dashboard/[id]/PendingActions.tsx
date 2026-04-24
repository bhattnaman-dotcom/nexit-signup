'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PendingActions({ agreementId }: { agreementId: string }) {
  const [resending, setResending] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleResend() {
    setResending(true);
    setResendState('idle');
    try {
      const res = await fetch(`/api/agreements/${agreementId}/resend`, { method: 'POST' });
      setResendState(res.ok ? 'success' : 'error');
    } catch {
      setResendState('error');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Link
        href={`/admin/dashboard/${agreementId}/edit`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-nexit-navy text-white rounded-lg text-sm font-semibold hover:bg-nexit-navy-light transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
        </svg>
        Edit Agreement
      </Link>

      <div className="flex flex-col gap-1">
        <button
          onClick={handleResend}
          disabled={resending}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          {resending ? 'Sending…' : 'Resend Link Email'}
        </button>
        {resendState === 'success' && (
          <p className="text-xs text-emerald-600 font-medium px-1">✓ Email sent to client</p>
        )}
        {resendState === 'error' && (
          <p className="text-xs text-red-600 px-1">Failed to send — check logs</p>
        )}
      </div>
    </div>
  );
}
