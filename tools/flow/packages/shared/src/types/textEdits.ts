export interface TextEdit {
  id: string;
  sourceFile?: string;
  sourceLine?: number;
  selector: string;
  before: string;
  after: string;
  timestamp: number;
}
