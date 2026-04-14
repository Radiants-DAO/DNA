import type {
  BookSettings,
  BroadsheetSettings,
  PretextDocumentSettings,
  EditorialSettings,
  PretextDocumentSettingsOf,
  PretextPrimitiveKind,
} from './types';

export const primitiveKinds: PretextPrimitiveKind[] = [
  'editorial',
  'broadsheet',
  'book',
];

export function isPrimitiveKind(value: string): value is PretextPrimitiveKind {
  return primitiveKinds.includes(value as PretextPrimitiveKind);
}

const defaultEditorial: EditorialSettings = {
  primitive: 'editorial',
  dropCap: true,
  pullquote: false,
  columnCount: 1,
};

const defaultBroadsheet: BroadsheetSettings = {
  primitive: 'broadsheet',
  columns: 3,
  masthead: '',
  heroWrap: 'leftSide',
};

const defaultBook: BookSettings = {
  primitive: 'book',
  pageWidth: 612,
  pageHeight: 792,
  columns: 1,
};

const previewDefaults: Record<PretextPrimitiveKind, { windowWidth: number; windowHeight: number }> = {
  editorial: { windowWidth: 720, windowHeight: 900 },
  broadsheet: { windowWidth: 960, windowHeight: 720 },
  book: { windowWidth: 680, windowHeight: 880 },
};

export function createDefaultSettings(
  kind: 'editorial',
): PretextDocumentSettingsOf<'editorial'>;
export function createDefaultSettings(
  kind: 'broadsheet',
): PretextDocumentSettingsOf<'broadsheet'>;
export function createDefaultSettings(
  kind: 'book',
): PretextDocumentSettingsOf<'book'>;
export function createDefaultSettings(
  kind: PretextPrimitiveKind,
): PretextDocumentSettings;
export function createDefaultSettings(
  kind: PretextPrimitiveKind,
): PretextDocumentSettings {
  switch (kind) {
    case 'editorial':
      return {
        version: 1,
        id: crypto.randomUUID(),
        title: '',
        slug: '',
        primitive: 'editorial',
        preview: { ...previewDefaults.editorial, density: 'comfortable' },
        primitiveSettings: { ...defaultEditorial },
        assets: {},
      };

    case 'broadsheet':
      return {
        version: 1,
        id: crypto.randomUUID(),
        title: '',
        slug: '',
        primitive: 'broadsheet',
        preview: { ...previewDefaults.broadsheet, density: 'comfortable' },
        primitiveSettings: { ...defaultBroadsheet },
        assets: {},
      };

    case 'book':
      return {
        version: 1,
        id: crypto.randomUUID(),
        title: '',
        slug: '',
        primitive: 'book',
        preview: { ...previewDefaults.book, density: 'comfortable' },
        primitiveSettings: { ...defaultBook },
        assets: {},
      };
  }
}
