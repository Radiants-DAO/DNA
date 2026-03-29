/* eslint-disable */
'use client';

export function HoverOverlayMock() {
  return (
    <div className="relative h-32 w-full overflow-hidden rounded border border-dashed border-gray-300 bg-gray-50">
      {/* Target element with blue overlay */}
      <div
        className="absolute left-6 top-3 h-10 w-28"
        style={{
          border: '1.5px dashed #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
        }}
      />

      {/* Horizontal measurement guide */}
      <div
        className="absolute top-8 left-0 w-6"
        style={{
          borderBottom: '1px dashed #3b82f6',
        }}
      />
      <div
        className="absolute top-8 left-[136px] right-0"
        style={{
          borderBottom: '1px dashed #3b82f6',
        }}
      />

      {/* Vertical measurement guide */}
      <div
        className="absolute left-10 top-0 h-3"
        style={{
          borderRight: '1px dashed #3b82f6',
        }}
      />
      <div
        className="absolute left-10 top-[52px] h-[calc(100%-52px)]"
        style={{
          borderRight: '1px dashed #3b82f6',
        }}
      />

      {/* Info card */}
      <div
        className="absolute bottom-2 left-3 flex items-center gap-3 rounded border px-2 py-1.5"
        style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <span className="font-mono text-[10px]" style={{ color: '#7c3aed' }}>
          div.card-wrapper
        </span>
        <span className="font-mono text-[10px] text-gray-400">420 × 280</span>
        <span className="font-mono text-[10px] text-gray-400">3 children</span>
      </div>
    </div>
  );
}
