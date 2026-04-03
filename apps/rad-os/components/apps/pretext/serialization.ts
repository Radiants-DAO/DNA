import { isPrimitiveKind } from './primitive-registry';
import type { PretextDocumentSettings, PretextPrimitiveKind } from './types';

export interface PretextBundle {
  markdown: string;
  settings: PretextDocumentSettings;
}

export interface SerializedPretextBundle {
  markdown: string;
  settingsJson: string;
}

export function serializePretextBundle(
  bundle: PretextBundle,
): SerializedPretextBundle {
  return {
    markdown: bundle.markdown,
    settingsJson: JSON.stringify(bundle.settings, null, 2),
  };
}

export function validateSettings(parsed: unknown): PretextDocumentSettings {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid settings: expected an object');
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new Error(
      `Invalid settings version: ${JSON.stringify(obj.version)}. Expected 1`,
    );
  }

  if (!isPrimitiveKind(obj.primitive as string)) {
    throw new Error(
      `Invalid primitive kind: "${obj.primitive}". Expected one of: editorial, broadsheet, book`,
    );
  }

  const preview = obj.preview;
  if (
    !preview ||
    typeof preview !== 'object' ||
    typeof (preview as Record<string, unknown>).windowWidth !== 'number' ||
    typeof (preview as Record<string, unknown>).windowHeight !== 'number'
  ) {
    throw new Error('Invalid settings: preview must have numeric windowWidth and windowHeight');
  }

  const ps = obj.primitiveSettings;
  if (!ps || typeof ps !== 'object') {
    throw new Error('Invalid settings: missing primitiveSettings');
  }
  if ((ps as Record<string, unknown>).primitive !== obj.primitive) {
    throw new Error(
      `primitiveSettings.primitive ("${(ps as Record<string, unknown>).primitive}") must match primitive ("${obj.primitive}")`,
    );
  }

  return parsed as PretextDocumentSettings;
}

export function deserializePretextBundle(
  markdown: string,
  settingsJson: string,
): PretextBundle {
  const parsed = JSON.parse(settingsJson);
  const settings = validateSettings(parsed);
  return { markdown, settings };
}

export function downloadPretextBundle(bundle: PretextBundle): {
  mdFilename: string;
  jsonFilename: string;
} {
  const slug = bundle.settings.slug || 'untitled';
  const serialized = serializePretextBundle(bundle);

  const mdBlob = new Blob([serialized.markdown], { type: 'text/markdown' });
  const jsonBlob = new Blob([serialized.settingsJson], {
    type: 'application/json',
  });

  downloadBlob(mdBlob, `${slug}.md`);
  downloadBlob(jsonBlob, `${slug}.pretext.json`);

  return {
    mdFilename: `${slug}.md`,
    jsonFilename: `${slug}.pretext.json`,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type PasteResult =
  | { kind: 'full'; markdown: string; settings: PretextDocumentSettings }
  | { kind: 'markdown-only'; markdown: string }
  | { kind: 'settings-only'; settings: PretextDocumentSettings }
  | { kind: 'empty' };

export function deserializePretextBundleFromPaste(text: string): PasteResult {
  if (!text.trim()) return { kind: 'empty' };

  // Try parsing as pure JSON settings
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && isPrimitiveKind(parsed.primitive as string)) {
      const settings = validateSettings(parsed);
      return { kind: 'settings-only', settings };
    }
  } catch {
    // Not pure JSON — continue
  }

  // Try markdown with fenced JSON settings block at the end
  const fencePattern = /\n```(?:json)?\s*\n(\{[\s\S]*\})\s*\n```\s*$/;
  const match = text.match(fencePattern);
  if (match) {
    try {
      const settings = validateSettings(JSON.parse(match[1]));
      const markdown = text.slice(0, match.index!).trimEnd();
      return { kind: 'full', markdown, settings };
    } catch {
      // Malformed JSON in fence — treat as plain markdown
    }
  }

  // Plain markdown
  return { kind: 'markdown-only', markdown: text };
}
