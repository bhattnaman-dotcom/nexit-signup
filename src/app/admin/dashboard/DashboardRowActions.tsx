'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  agreementId: string;
  status: 'pending' | 'signed' | 'paid' | 'voided';
  businessName: string;
}

export default function DashboardRowActions({ agreementId, status, businessName }: Props) {
  const [working, setWorking] = useState<'void' | 'delete' | null>(null);

  async function handleVoid() {
    if (!confirm(`Mark "${businessName}" as voided?`)) return;
    setWorking('void');
    try {
      const res = await fetch(`/api/agreements/${agreementId}/void`, { method: 'POST' });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? 'Failed'); return; }
      window.location.reload();
    } finally { setWorking(null); }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete the agreement for "${businessName}"? This cannot be undone.`)) return;
    setWorking('delete');
    try {
      const res = await fetch(`/api/agreements/${agreementId}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? 'Failed'); return; }
      window.location.reload();
    } finally { setWorking(null); }
  }

  return (
    <div className="flex flex-col gap-1 min-w-[100px]">
      <div className="flex gap-2">
        <Link
          href={`/admin/dashboard/${agreementId}`}
          className="text-nexit-navy hover:text-nexit-navy-light text-xs font-medium underline-offset-2 hover:underline"
        >
          View
        </Link>
        {status === 'pending' && (
          <Link
            href={`/admin/dashboard/${agreementId}/edit`}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium underline-offset-2 hover:underline"
          >
            Edit
          </Link>
        )}
        {(status === 'signed' || status === 'paid') && (
          <a
            href={`/api/admin/agreements/${agreementId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nexit-orange hover:text-orange-600 text-xs font-medium underline-offset-2 hover:underline"
          >
            PDF
          </a>
        )}
      </div>
      <div className="flex gap-2">
        {status !== 'voided' && status !== 'paid' && (
          <button
            onClick={handleVoid}
            disabled={working !== null}
            className="text-amber-600 hover:text-amber-800 text-xs font-medium disabled:opacity-50"
          >
            {working === 'void' ? '…' : 'Void'}
          </button>
        )}
        {status !== 'paid' && (
          <button
            onClick={handleDelete}
            disabled={working !== null}
            className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
          >
            {working === 'delete' ? '…' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}
