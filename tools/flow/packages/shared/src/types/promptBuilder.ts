export type PromptVerb = 'Change' | 'Add' | 'Remove' | 'Move' | 'Apply' | 'Set' | 'Replace';

export interface PromptStep {
  id: string;
  verb: PromptVerb;
  targetComponentName?: string;
  targetSourceFile?: string;
  targetSourceLine?: number;
  targetSelector: string;
  value?: string;
  preposition?: string;
  referenceComponentName?: string;
  referenceSourceFile?: string;
  referenceSourceLine?: number;
  referenceSelector?: string;
  timestamp: number;
}

export type LanguageAdapter = 'css' | 'tailwind' | 'figma';

export type PromptChipKind = 'element' | 'component' | 'token' | 'asset';

export interface PromptChip {
  id: string;
  kind: PromptChipKind;
  label: string;
  selector?: string;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  tokenName?: string;
  tokenValue?: string;
  assetId?: string;
  assetType?: string;
  metadata?: Record<string, unknown>;
}

export interface PromptDraftTextNode {
  id: string;
  type: 'text';
  text: string;
}

export interface PromptDraftChipNode {
  id: string;
  type: 'chip';
  chip: PromptChip;
}

export type PromptDraftNode = PromptDraftTextNode | PromptDraftChipNode;
