'use client';

import { useAppStore } from '@/store';

export function RadiatorApp() {
  const currentView = useAppStore((s) => s.currentView);

  switch (currentView) {
    case 'explainer':
      return <Placeholder label="Explainer" />;
    case 'landing':
      return <Placeholder label="Landing" />;
    case 'choose-fate':
      return <Placeholder label="Choose Your Fate" />;
    case 'seal-claim':
      return <Placeholder label="Seal the Claim" />;
    case 'feed-radiator':
      return <Placeholder label="Feed the Radiator" />;
    case 'ignite':
      return <Placeholder label="Ignite" />;
    case 'radiated':
      return <Placeholder label="Radiated" />;
    case 'admin-wizard':
      return <Placeholder label="Admin Wizard" />;
    default:
      return <Placeholder label="Unknown View" />;
  }
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center">
        <h2 className="font-joystix text-xl uppercase text-content-heading mb-2">
          {label}
        </h2>
        <p className="font-mondwest text-content-muted">
          Scene placeholder
        </p>
      </div>
    </div>
  );
}
