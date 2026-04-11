import type { PixelModifyItem } from '@/lib/dotting';

export interface RadnomTemplate {
  id: string;
  name: string;
  pixels: Array<Array<string>>;
}

export interface RadnomManifest {
  version: number;
  width: number;
  height: number;
  palette: Record<string, string>;
  templates: Array<RadnomTemplate>;
}

const MANIFEST_URL = '/templates/radiants.json';
const BACKGROUND_COLOR = '#fef8e2';

let manifestPromise: Promise<RadnomManifest> | null = null;

function loadManifest(): Promise<RadnomManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`radiants manifest ${res.status}`);
        return res.json() as Promise<RadnomManifest>;
      })
      .catch((err) => {
        manifestPromise = null;
        throw err;
      });
  }
  return manifestPromise;
}

export async function pickRandomRadiant(): Promise<PixelModifyItem[][]> {
  const manifest = await loadManifest();
  const { templates, width, height } = manifest;
  if (templates.length === 0) throw new Error('radiants manifest is empty');

  const template = templates[Math.floor(Math.random() * templates.length)];
  const originRow = -Math.floor(height / 2);
  const originCol = -Math.floor(width / 2);

  const data: PixelModifyItem[][] = [];
  for (let r = 0; r < height; r++) {
    const row: PixelModifyItem[] = [];
    for (let c = 0; c < width; c++) {
      const hex = template.pixels[r]?.[c] ?? '';
      row.push({
        rowIndex: originRow + r,
        columnIndex: originCol + c,
        color: hex || BACKGROUND_COLOR,
      });
    }
    data.push(row);
  }
  return data;
}
