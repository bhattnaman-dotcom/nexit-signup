'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  agreementId: string;
  status: 'pending' | 'signed' | 'paid' | 'voided';
  businessName: string;
}

export default function AgreementActions({ agreementId, status, businessName }: Props) {
  const router = useRouter();
  const [working, setWorking] = useState<'void' | 'delete' | null>(null);

  async function handleVoid() {
    if (!confirm(`Mark "${businessName}" as voided? The client will no longer be able to sign it.`)) return;
    setWorking('void');
    try {
      const res = await fetch(`/api/agreements/${agreementId}/void`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? 'Failed to void agreement');
        return;
      }
      router.refresh();
    } finally {
      setWorking(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete the agreement for "${businessName}"? This cannot be undone.`)) return;
    setWorking('delete');
    try {
      const res = await fetch(`/api/agreements/${agreementId}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? 'Failed to delete agreement');
        return;
      }
      router.push('/admin/dashboard');
    } finally {
      setWorking(null);
    }
  }

  if (status === 'paid') return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {status !== 'voided' && (
        <button
          onClick={handleVoid}
          disabled={working !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          {working === 'void' ? 'Voiding…' : 'Mark Void'}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={working !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
        {working === 'delete' ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  );
}
