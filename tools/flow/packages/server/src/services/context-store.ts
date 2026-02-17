import type { AgentFeedback, SessionRegistration, SessionId, ClientType } from '@flow/shared';

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
  /** Maps tabId → session registration (ownership record) */
  private sessionRegistrations = new Map<number, SessionRegistration>();

  // --- Session Registration (ownership) ---

  /**
   * Register a session for a tab. If the tab already has a different session owner,
   * returns false (ownership conflict). Same sessionId re-registering is allowed
   * (e.g. reconnect after disconnect).
   */
  registerSession(tabId: number, sessionId: SessionId, clientType: ClientType): boolean {
    const existing = this.sessionRegistrations.get(tabId);
    if (existing && existing.sessionId !== sessionId) {
      return false; // ownership conflict — different session already owns this tab
    }
    const now = Date.now();
    this.sessionRegistrations.set(tabId, {
      tabId,
      sessionId,
      clientType,
      registeredAt: existing?.registeredAt ?? now,
      lastSeenAt: now,
    });
    return true;
  }

  /**
   * Check whether the given sessionId is the owner of the given tabId.
   * Returns true if no registration exists (unguarded tab) or if the sessionId matches.
   */
  isSessionOwner(tabId: number, sessionId: SessionId): boolean {
    const reg = this.sessionRegistrations.get(tabId);
    if (!reg) return true; // no owner yet — allow
    return reg.sessionId === sessionId;
  }

  /** Update the lastSeenAt timestamp for a tab's session registration. */
  touchSession(tabId: number): void {
    const reg = this.sessionRegistrations.get(tabId);
    if (reg) {
      reg.lastSeenAt = Date.now();
    }
  }

  /** Remove a session registration (e.g. on explicit close or eviction). */
  unregisterSession(tabId: number): void {
    this.sessionRegistrations.delete(tabId);
  }

  /** Get the registration for a tab. */
  getSessionRegistration(tabId: number): SessionRegistration | undefined {
    return this.sessionRegistrations.get(tabId);
  }

  /** Get all active session registrations. */
  getAllSessionRegistrations(): SessionRegistration[] {
    return Array.from(this.sessionRegistrations.values());
  }

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
