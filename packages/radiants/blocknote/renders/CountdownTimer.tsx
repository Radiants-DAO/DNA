import { CountdownTimer } from '../../components/core';
import type { BlockNoteRenderProps } from '../types';

export function renderCountdownTimerBlock(_props: BlockNoteRenderProps) {
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return <CountdownTimer endTime={futureDate} />;
}
