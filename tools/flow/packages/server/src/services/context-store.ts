/**
 * In-memory store for data pushed from the extension via WebSocket.
 * MCP tools read from this store to answer queries.
 */
export interface ElementContext {
  selector: string;
  componentName?: string;
  filePath?: string;
  line?: number;
  column?: number;
  props?: Record<string, unknown>;
  parentChain?: string[];
  appliedTokens?: Record<string, string>;
  computedStyles?: Record<string, string>;
}

export interface MutationDiff {
  selector: string;
  componentName?: string;
  filePath?: string;
  property: string;
  before: string;
  after: string;
  timestamp: number;
}

export interface AnimationState {
  selector: string;
  animations: Array<{
    name: string;
    type: "css" | "waapi" | "gsap";
    duration: number;
    delay: number;
    easing: string;
    keyframes: Record<string, unknown>[];
    playState: string;
  }>;
}

export class ContextStore {
  private elements = new Map<string, ElementContext>();
  private componentTree: Record<string, unknown>[] = [];
  private mutations: MutationDiff[] = [];
  private animationStates = new Map<string, AnimationState>();
  private extractedStyles = new Map<string, Record<string, unknown>>();

  setElementContext(selector: string, context: ElementContext): void {
    this.elements.set(selector, context);
  }

  getElementContext(selector: string): ElementContext | undefined {
    return this.elements.get(selector);
  }

  setComponentTree(tree: Record<string, unknown>[]): void {
    this.componentTree = tree;
  }

  getComponentTree(): Record<string, unknown>[] {
    return this.componentTree;
  }

  addMutation(diff: MutationDiff): void {
    this.mutations.push(diff);
  }

  getMutations(): MutationDiff[] {
    return this.mutations;
  }

  clearMutations(): void {
    this.mutations = [];
  }

  setAnimationState(selector: string, state: AnimationState): void {
    this.animationStates.set(selector, state);
  }

  getAnimationState(selector?: string): AnimationState[] {
    if (selector) {
      const state = this.animationStates.get(selector);
      return state ? [state] : [];
    }
    return Array.from(this.animationStates.values());
  }

  setExtractedStyles(selector: string, styles: Record<string, unknown>): void {
    this.extractedStyles.set(selector, styles);
  }

  getExtractedStyles(selector?: string): Record<string, unknown>[] {
    if (selector) {
      const styles = this.extractedStyles.get(selector);
      return styles ? [styles] : [];
    }
    return Array.from(this.extractedStyles.values());
  }
}
