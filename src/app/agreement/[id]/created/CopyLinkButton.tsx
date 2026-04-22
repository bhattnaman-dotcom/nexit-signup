'use client';

import { useState } from 'react';

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
        copied
          ? 'bg-emerald-500 text-white'
          : 'bg-nexit-navy hover:bg-nexit-navy-light text-white'
      }`}
    >
      {copied ? '✓ Link Copied!' : 'Copy Link'}
    </button>
  );
}
