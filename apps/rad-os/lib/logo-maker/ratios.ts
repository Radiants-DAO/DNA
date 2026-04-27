export interface RatioPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const RATIO_PRESETS = [
  { id: 'square-512',  label: 'Square 512',   width: 512,  height: 512  },
  { id: 'wide-1080p',  label: '16:9 1080p',   width: 1920, height: 1080 },
  { id: 'og-1200x630', label: 'OG 1200×630',  width: 1200, height: 630  },
  { id: 'favicon-128', label: 'Favicon 128',  width: 128,  height: 128  },
  { id: 'story-9-16',  label: 'Story 9:16',   width: 1080, height: 1920 },
] as const satisfies readonly RatioPreset[];

export type RatioPresetId = (typeof RATIO_PRESETS)[number]['id'];

export function getRatioPreset(id: RatioPresetId): RatioPreset | undefined {
  return RATIO_PRESETS.find((p) => p.id === id);
}
