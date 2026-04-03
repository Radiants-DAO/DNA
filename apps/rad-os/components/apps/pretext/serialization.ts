import { isPrimitiveKind } from './primitive-registry';
import type { PretextDocumentSettings } from './types';

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

export function deserializePretextBundle(
  markdown: string,
  settingsJson: string,
): PretextBundle {
  const parsed = JSON.parse(settingsJson);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid settings JSON');
  }
  if (!isPrimitiveKind(parsed.primitive)) {
    throw new Error(
      `Invalid primitive kind: "${parsed.primitive}". Expected one of: editorial, broadsheet, book`,
    );
  }

  const settings = parsed as PretextDocumentSettings;
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

export function deserializePretextBundleFromPaste(
  text: string,
): PretextBundle | null {
  // Try parsing as pure JSON settings
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && isPrimitiveKind(parsed.primitive)) {
      return { markdown: '', settings: parsed as PretextDocumentSettings };
    }
  } catch {
    // Not pure JSON — continue
  }

  // Try markdown with fenced JSON settings block at the end
  const fencePattern = /\n```(?:json)?\s*\n(\{[\s\S]*\})\s*\n```\s*$/;
  const match = text.match(fencePattern);
  if (match) {
    try {
      const settings = JSON.parse(match[1]);
      if (isPrimitiveKind(settings.primitive)) {
        const markdown = text.slice(0, match.index!).trimEnd();
        return { markdown, settings: settings as PretextDocumentSettings };
      }
    } catch {
      // Malformed JSON in fence — treat as plain markdown
    }
  }

  // Plain markdown — return as-is with no settings (caller should use current settings)
  if (text.trim()) {
    return null; // Signal: markdown-only paste, caller preserves current settings
  }

  return null;
}
