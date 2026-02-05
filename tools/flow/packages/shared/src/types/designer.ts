import type { PropertyMutation } from './mutation';

export interface DesignerChange {
  id: string;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  selector: string;
  section: 'layout' | 'spacing' | 'size' | 'typography' | 'colors' | 'borders' | 'shadows' | 'effects' | 'animations';
  changes: PropertyMutation[];
  timestamp: number;
}
