'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

const DrawPad = dynamic(() => import('./DrawPad'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[220px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
      Loading…
    </div>
  ),
});

const FONTS = [
  { id: 'elegant', name: 'Elegant', family: 'Dancing Script' },
  { id: 'classic', name: 'Classic', family: 'Great Vibes' },
  { id: 'modern', name: 'Modern', family: 'Pacifico' },
] as const;

type FontId = (typeof FONTS)[number]['id'];
type Tab = 'draw' | 'type';

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  customerName: string;
}

export default function SignaturePad({ onChange, customerName }: SignaturePadProps) {
  const [tab, setTab] = useState<Tab>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState<FontId>('elegant');
  const typeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  const renderTypeSignature = useCallback(
    (name: string, fontId: FontId) => {
      if (!name.trim() || !typeCanvasRef.current || !fontsLoaded) return;
      const canvas = typeCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const font = FONTS.find((f) => f.id === fontId)!;
      canvas.width = 480;
      canvas.height = 120;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1A1D36';
      ctx.font = `52px "${font.family}"`;
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 16, canvas.height / 2);

      onChange(canvas.toDataURL('image/png'));
    },
    [fontsLoaded, onChange]
  );

  useEffect(() => {
    if (tab === 'type' && typedName) {
      renderTypeSignature(typedName, selectedFont);
    }
  }, [tab, typedName, selectedFont, renderTypeSignature]);

  useEffect(() => {
    if (tab === 'draw') {
      onChange(null);
    }
  }, [tab, onChange]);

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        {(['draw', 'type'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-nexit-navy text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'draw' ? '✏️ Draw' : '⌨️ Type'}
          </button>
        ))}
      </div>

      {tab === 'draw' && <DrawPad onChange={onChange} />}

      {tab === 'type' && (
        <div className="space-y-4">
          <input
            type="text"
            value={typedName}
            onChange={(e) => {
              setTypedName(e.target.value);
              if (!e.target.value.trim()) onChange(null);
            }}
            placeholder={customerName || 'Type your full name…'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexit-navy/30 focus:border-nexit-navy"
          />

          {/* Font style cards */}
          <div className="grid grid-cols-3 gap-3">
            {FONTS.map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => {
                  setSelectedFont(font.id);
                  renderTypeSignature(typedName, font.id);
                }}
                className={`p-3 rounded-lg border-2 text-center cursor-pointer transition-all ${
                  selectedFont === font.id
                    ? 'border-nexit-orange bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="text-xs text-gray-500 mb-2">{font.name}</p>
                <p
                  style={{ fontFamily: `"${font.family}"`, fontSize: '22px', lineHeight: 1.3 }}
                  className="text-nexit-dark truncate"
                >
                  {typedName || customerName || 'Signature'}
                </p>
              </button>
            ))}
          </div>

          {/* Hidden canvas for type signature rendering */}
          <canvas ref={typeCanvasRef} className="hidden" />

          {typedName && (
            <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Preview</p>
              <p
                style={{
                  fontFamily: `"${FONTS.find((f) => f.id === selectedFont)!.family}"`,
                  fontSize: '40px',
                  color: '#1A1D36',
                  lineHeight: 1.3,
                }}
              >
                {typedName}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
