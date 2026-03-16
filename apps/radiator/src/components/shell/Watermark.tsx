'use client';

export function Watermark() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none text-center">
      <div className="flex flex-col gap-2 opacity-40">
        <h1 className="font-joystix text-2xl uppercase text-main">
          The Radiator
        </h1>
        <p className="font-mondwest text-lg text-sub">
          Full RadOS coming soon
        </p>
        <p className="font-mondwest text-sm text-mute">
          Prototype for Solana Grizzlython Submission
        </p>
      </div>
    </div>
  );
}
