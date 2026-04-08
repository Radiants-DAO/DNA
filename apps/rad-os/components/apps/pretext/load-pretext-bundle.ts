import {
  deserializePretextBundle,
  type PretextBundle,
} from './serialization';

async function requireTextResponse(response: Response, label: string) {
  if (!response.ok) {
    throw new Error(`Failed to load ${label}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export async function loadPretextBundleFromPair(
  markdown: string,
  settingsJson: string,
): Promise<PretextBundle> {
  return deserializePretextBundle(markdown, settingsJson);
}

export async function loadPretextBundleFromFiles(
  markdownFile: File,
  settingsFile: File,
): Promise<PretextBundle> {
  return loadPretextBundleFromPair(
    await markdownFile.text(),
    await settingsFile.text(),
  );
}

export async function loadPretextBundle(basePath: string): Promise<PretextBundle> {
  const [markdownResponse, settingsResponse] = await Promise.all([
    fetch(`${basePath}.md`),
    fetch(`${basePath}.pretext.json`),
  ]);

  const [markdown, settingsJson] = await Promise.all([
    requireTextResponse(markdownResponse, `${basePath}.md`),
    requireTextResponse(settingsResponse, `${basePath}.pretext.json`),
  ]);

  return loadPretextBundleFromPair(markdown, settingsJson);
}
