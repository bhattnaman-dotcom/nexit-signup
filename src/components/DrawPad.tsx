'use client';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface DrawPadProps {
  onChange: (dataUrl: string | null) => void;
}

export default function DrawPad({ onChange }: DrawPadProps) {
  const sigRef = useRef<SignatureCanvas>(null);

  function handleClear() {
    sigRef.current?.clear();
    onChange(null);
  }

  function handleEnd() {
    const canvas = sigRef.current;
    if (!canvas || canvas.isEmpty()) {
      onChange(null);
      return;
    }
    onChange(canvas.toDataURL('image/png'));
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white overflow-hidden">
        <SignatureCanvas
          ref={sigRef}
          penColor="#1A1D36"
          canvasProps={{
            width: 560,
            height: 200,
            className: 'w-full',
            style: { touchAction: 'none' },
          }}
          onEnd={handleEnd}
        />
      </div>
      <button
        type="button"
        onClick={handleClear}
        className="text-sm text-gray-500 hover:text-red-500 underline transition-colors"
      >
        Clear signature
      </button>
    </div>
  );
}
