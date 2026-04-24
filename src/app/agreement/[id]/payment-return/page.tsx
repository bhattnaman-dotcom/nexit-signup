'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

// PA redirects the iframe to this page after payment completes.
// Since the iframe is same-origin at this point, we can navigate the top frame.
export default function PaymentReturn() {
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const target = `/agreement/${id}/signed`;
    if (window.top && window.top !== window) {
      window.top.location.href = target;
    } else {
      window.location.href = target;
    }
  }, [id]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Confirming payment…</p>
      </div>
    </div>
  );
}
