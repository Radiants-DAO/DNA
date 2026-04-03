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

/** Returns true when the value looks like a settings object (has version or primitive key). */
function looksLikeSettings(value: unknown): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === 'object' &&
    ('version' in value || 'primitive' in value)
  );
}

function requireNumber(obj: Record<string, unknown>, key: string, label: string): void {
  if (typeof obj[key] !== 'number') {
    throw new Error(`Invalid settings: ${label} must be a number, got ${typeof obj[key]}`);
  }
}

function requireString(obj: Record<string, unknown>, key: string, label: string): void {
  if (typeof obj[key] !== 'string') {
    throw new Error(`Invalid settings: ${label} must be a string, got ${typeof obj[key]}`);
  }
}

function validateEditorialSettings(ps: Record<string, unknown>): void {
  if (typeof ps.dropCap !== 'boolean') {
    throw new Error('Invalid editorial settings: dropCap must be a boolean');
  }
  if (typeof ps.pullquote !== 'boolean') {
    throw new Error('Invalid editorial settings: pullquote must be a boolean');
  }
  if (ps.columnCount !== 1 && ps.columnCount !== 2) {
    throw new Error('Invalid editorial settings: columnCount must be 1 or 2');
  }
}

function validateBroadsheetSettings(ps: Record<string, unknown>): void {
  if (ps.columns !== 2 && ps.columns !== 3) {
    throw new Error('Invalid broadsheet settings: columns must be 2 or 3');
  }
  requireString(ps, 'masthead', 'broadsheet masthead');
  const validWraps = ['leftSide', 'rightSide', 'both'];
  if (!validWraps.includes(ps.heroWrap as string)) {
    throw new Error(`Invalid broadsheet settings: heroWrap must be one of: ${validWraps.join(', ')}`);
  }
}

function validateBookSettings(ps: Record<string, unknown>): void {
  requireNumber(ps, 'pageWidth', 'book pageWidth');
  requireNumber(ps, 'pageHeight', 'book pageHeight');
  if (ps.columns !== 1 && ps.columns !== 2) {
    throw new Error('Invalid book settings: columns must be 1 or 2');
  }
}

const primitiveValidators: Record<string, (ps: Record<string, unknown>) => void> = {
  editorial: validateEditorialSettings,
  broadsheet: validateBroadsheetSettings,
  book: validateBookSettings,
};

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
  const psObj = ps as Record<string, unknown>;
  if (psObj.primitive !== obj.primitive) {
    throw new Error(
      `primitiveSettings.primitive ("${psObj.primitive}") must match primitive ("${obj.primitive}")`,
    );
  }

  // Validate per-primitive required fields
  primitiveValidators[obj.primitive as string](psObj);

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

  // Try parsing as pure JSON — if it looks like settings, validate strictly (throws on bad data)
  try {
    const parsed = JSON.parse(text);
    if (looksLikeSettings(parsed)) {
      const settings = validateSettings(parsed);
      return { kind: 'settings-only', settings };
    }
    // Valid JSON but not settings-shaped — fall through to markdown
  } catch {
    // Not valid JSON at all — continue to fenced / plain markdown
  }

  // Try markdown with fenced JSON settings block at the end
  const fencePattern = /\n```(?:json)?\s*\n(\{[\s\S]*\})\s*\n```\s*$/;
  const match = text.match(fencePattern);
  if (match) {
    let fencedJson: unknown;
    try {
      fencedJson = JSON.parse(match[1]);
    } catch {
      // Not valid JSON in fence — treat entire text as markdown
      return { kind: 'markdown-only', markdown: text };
    }
    // If the fenced block looks like settings, validate strictly (throws on bad data)
    if (looksLikeSettings(fencedJson)) {
      const settings = validateSettings(fencedJson);
      const markdown = text.slice(0, match.index!).trimEnd();
      return { kind: 'full', markdown, settings };
    }
    // Fenced JSON that isn't settings-shaped — treat as markdown
  }

  // Plain markdown
  return { kind: 'markdown-only', markdown: text };
}
