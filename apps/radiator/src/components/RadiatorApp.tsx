'use client';

import { useAppStore } from '@/store';
import { Explainer } from './scenes/Explainer';
import { Landing } from './scenes/Landing';
import { ChooseFate } from './scenes/ChooseFate';
import { SealClaim } from './scenes/SealClaim';
import { FeedRadiator } from './scenes/FeedRadiator';

export function RadiatorApp() {
  const currentView = useAppStore((s) => s.currentView);

  switch (currentView) {
    case 'explainer':
      return <Explainer />;
    case 'landing':
      return <Landing />;
    case 'choose-fate':
      return <ChooseFate />;
    case 'seal-claim':
      return <SealClaim />;
    case 'feed-radiator':
      return <FeedRadiator />;
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
