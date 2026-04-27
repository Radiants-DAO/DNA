// =============================================================================
// Video sources for the Radio widget's circular viewport.
// =============================================================================

export interface RadioVideo {
  id: string;
  filename: string;
  src: string;
}

export const videos: RadioVideo[] = [
  { id: 'dream', filename: 'dream.mp4', src: '/media/video/dream.mp4' },
  { id: 'miner', filename: 'miner.mp4', src: '/media/video/miner.mp4' },
  { id: 'porsche', filename: 'porsche.mp4', src: '/media/video/porsche.mp4' },
];
