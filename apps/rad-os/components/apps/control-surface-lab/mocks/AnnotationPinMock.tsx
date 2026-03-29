/* eslint-disable */
'use client';

export function AnnotationPinMock() {
  const pins = [
    { number: 1, bg: '#ef4444' },
    { number: 2, bg: '#f97316' },
    { number: 3, bg: '#3b82f6' },
  ];

  return (
    <div className="flex w-full items-center justify-center gap-3 py-2">
      {/* Numbered pins */}
      {pins.map((pin) => (
        <div
          key={pin.number}
          className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full font-mono text-[10px] font-bold text-white transition-transform hover:scale-110"
          style={{
            backgroundColor: pin.bg,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {pin.number}
        </div>
      ))}

      {/* Intent icon pin */}
      <div
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-gray-600 text-[10px] text-white transition-transform hover:scale-110"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      >
        🔧
      </div>

      {/* Stacked: number + priority dot */}
      <div className="relative cursor-pointer transition-transform hover:scale-110">
        <div
          className="flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white"
          style={{
            backgroundColor: '#3b82f6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          4
        </div>
        <div
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-gray-900"
          style={{ backgroundColor: '#ef4444' }}
        />
      </div>
    </div>
  );
}
