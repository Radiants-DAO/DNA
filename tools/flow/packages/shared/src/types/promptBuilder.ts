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
