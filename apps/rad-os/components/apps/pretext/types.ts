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

/** Maps a primitive kind to its typed settings interface. */
export type PrimitiveSettingsFor<K extends PretextPrimitiveKind> =
  K extends 'editorial' ? EditorialSettings :
  K extends 'broadsheet' ? BroadsheetSettings :
  K extends 'book' ? BookSettings :
  never;

export interface PretextDocumentSettingsBase {
  version: 1;
  id: string;
  title: string;
  slug: string;
  preview: PretextPreviewSettings;
  assets: Record<string, string>;
}

export interface PretextDocumentSettingsOf<K extends PretextPrimitiveKind>
  extends PretextDocumentSettingsBase {
  primitive: K;
  primitiveSettings: PrimitiveSettingsFor<K>;
}

/** Union of all concrete document settings. Use PretextDocumentSettingsOf<K> when the kind is known. */
export type PretextDocumentSettings =
  | PretextDocumentSettingsOf<'editorial'>
  | PretextDocumentSettingsOf<'broadsheet'>
  | PretextDocumentSettingsOf<'book'>;
