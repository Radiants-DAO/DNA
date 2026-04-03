export type PretextPrimitiveKind = 'editorial' | 'broadsheet' | 'book';

export interface PretextPreviewSettings {
  windowWidth: number;
  windowHeight: number;
  density: 'compact' | 'comfortable';
}

export interface EditorialSettings {
  primitive: 'editorial';
  dropCap: boolean;
  pullquote: boolean;
  columnCount: 1 | 2;
}

export interface BroadsheetSettings {
  primitive: 'broadsheet';
  columns: 2 | 3;
  masthead: string;
  heroImageKey?: string;
  heroWrap: 'leftSide' | 'rightSide' | 'both';
}

export interface BookSettings {
  primitive: 'book';
  pageWidth: number;
  pageHeight: number;
  columns: 1 | 2;
  coverImageKey?: string;
}

export type PrimitiveSettings =
  | EditorialSettings
  | BroadsheetSettings
  | BookSettings;

export interface PretextDocumentSettings {
  version: 1;
  id: string;
  title: string;
  slug: string;
  primitive: PretextPrimitiveKind;
  preview: PretextPreviewSettings;
  primitiveSettings: PrimitiveSettings;
  assets: Record<string, string>;
}
