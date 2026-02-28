'use client';

import { useAppStore } from '@/store';
import { SceneTransition } from './ui/SceneTransition';
import { Explainer } from './scenes/Explainer';
import { Landing } from './scenes/Landing';
import { ChooseFate } from './scenes/ChooseFate';
import { SealClaim } from './scenes/SealClaim';
import { FeedRadiator } from './scenes/FeedRadiator';
import { Ignite } from './scenes/Ignite';
import { Radiated } from './scenes/Radiated';
import { AdminWizard } from './scenes/AdminWizard';
import type { View } from '@/store/viewSlice';

/** Scenes that get extra dramatic scale-in animation */
const scaleScenes: View[] = ['feed-radiator', 'radiated'];

export function RadiatorApp() {
  const currentView = useAppStore((s) => s.currentView);
  const variant = scaleScenes.includes(currentView) ? 'scale' : 'fade';

  return (
    <SceneTransition key={currentView} variant={variant}>
      <SceneContent view={currentView} />
    </SceneTransition>
  );
}

function SceneContent({ view }: { view: View }) {
  switch (view) {
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
      return <Ignite />;
    case 'radiated':
      return <Radiated />;
    case 'admin-wizard':
      return <AdminWizard />;
  }
}
