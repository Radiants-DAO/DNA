import type {
  BookSettings,
  BroadsheetSettings,
  EditorialSettings,
  PretextDocumentSettings,
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

const primitiveDefaults: Record<PretextPrimitiveKind, EditorialSettings | BroadsheetSettings | BookSettings> = {
  editorial: defaultEditorial,
  broadsheet: defaultBroadsheet,
  book: defaultBook,
};

const previewDefaults: Record<PretextPrimitiveKind, { windowWidth: number; windowHeight: number }> = {
  editorial: { windowWidth: 720, windowHeight: 900 },
  broadsheet: { windowWidth: 960, windowHeight: 720 },
  book: { windowWidth: 680, windowHeight: 880 },
};

export function createDefaultSettings(kind: PretextPrimitiveKind): PretextDocumentSettings {
  const preview = previewDefaults[kind];
  return {
    version: 1,
    id: crypto.randomUUID(),
    title: '',
    slug: '',
    primitive: kind,
    preview: { ...preview, density: 'comfortable' },
    primitiveSettings: { ...primitiveDefaults[kind] },
    assets: {},
  };
}
