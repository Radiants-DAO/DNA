import type { AgentFeedback } from '@flow/shared';

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

export interface SessionData {
  compiledMarkdown: string;
  annotations: unknown[];
  textEdits: unknown[];
  mutationDiffs: unknown[];
  animationDiffs: unknown[];
  comments: unknown[];
  promptSteps: unknown[];
  lastUpdated: number;
}

export class ContextStore {
  private elements = new Map<string, ElementContext>();
  private componentTree: Record<string, unknown>[] = [];
  private mutations: MutationDiff[] = [];
  private animationStates = new Map<string, AnimationState>();
  private extractedStyles = new Map<string, Record<string, unknown>>();
  private sessions = new Map<number, SessionData>();
  private lastActiveTabId: number | null = null;
  private agentFeedbackByTab = new Map<number, Map<string, AgentFeedback>>();

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

  setSession(tabId: number, data: SessionData): void {
    this.sessions.set(tabId, data);
    this.lastActiveTabId = tabId;
  }

  getSession(tabId?: number): SessionData | undefined {
    const id = tabId ?? this.lastActiveTabId;
    if (id == null) return undefined;
    return this.sessions.get(id);
  }

  getLastActiveTabId(): number | null {
    return this.lastActiveTabId;
  }

  // --- Agent Feedback ---

  private ensureTabBucket(tabId: number): Map<string, AgentFeedback> {
    const existing = this.agentFeedbackByTab.get(tabId);
    if (existing) return existing;
    const created = new Map<string, AgentFeedback>();
    this.agentFeedbackByTab.set(tabId, created);
    return created;
  }

  addAgentFeedback(tabId: number, feedback: AgentFeedback): void {
    this.ensureTabBucket(tabId).set(feedback.id, feedback);
  }

  getAgentFeedback(tabId: number, id: string): AgentFeedback | undefined {
    return this.agentFeedbackByTab.get(tabId)?.get(id);
  }

  getAllAgentFeedback(tabId: number): AgentFeedback[] {
    return Array.from(this.agentFeedbackByTab.get(tabId)?.values() ?? []);
  }

  getPendingAgentFeedback(tabId: number): AgentFeedback[] {
    return this.getAllAgentFeedback(tabId).filter(
      (f) => f.status === 'pending' || f.status === 'acknowledged',
    );
  }

  updateAgentFeedback(tabId: number, id: string, updates: Partial<AgentFeedback>): AgentFeedback | undefined {
    const existing = this.getAgentFeedback(tabId, id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.ensureTabBucket(tabId).set(id, updated);
    return updated;
  }

  resolveAgentFeedback(tabId: number, id: string, summary: string): AgentFeedback | undefined {
    return this.updateAgentFeedback(tabId, id, {
      status: 'resolved',
      resolvedAt: Date.now(),
      resolvedBy: 'agent',
      thread: [
        ...(this.getAgentFeedback(tabId, id)?.thread ?? []),
        { id: crypto.randomUUID(), role: 'agent', content: summary, timestamp: Date.now() },
      ],
    });
  }

  addThreadReply(tabId: number, feedbackId: string, message: { role: 'human' | 'agent'; content: string }): AgentFeedback | undefined {
    const existing = this.getAgentFeedback(tabId, feedbackId);
    if (!existing) return undefined;
    const reply = {
      id: crypto.randomUUID(),
      role: message.role as 'human' | 'agent',
      content: message.content,
      timestamp: Date.now(),
    };
    return this.updateAgentFeedback(tabId, feedbackId, {
      thread: [...existing.thread, reply],
    });
  }
}
