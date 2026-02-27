'use client';

export function Watermark() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none text-center">
      <div className="flex flex-col gap-2 opacity-40">
        <h1 className="font-joystix text-2xl uppercase text-content-primary">
          The Radiator
        </h1>
        <p className="font-mondwest text-lg text-content-secondary">
          Full RadOS coming soon
        </p>
        <p className="font-mondwest text-sm text-content-muted">
          Prototype for Solana Grizzlython Submission
        </p>
      </div>
    </div>
  );
}
