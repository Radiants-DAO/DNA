export interface Annotation {
  id: string;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  selector: string;
  text: string;
  timestamp: number;
}
