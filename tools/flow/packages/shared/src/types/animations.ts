export interface AnimationPropertyChange {
  property: string;
  before: string;
  after: string;
}

export interface AnimationDiff {
  id: string;
  target: string;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  changes: AnimationPropertyChange[];
  timestamp: number;
}
