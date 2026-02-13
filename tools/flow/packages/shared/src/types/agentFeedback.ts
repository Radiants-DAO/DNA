export type FeedbackRole = 'human' | 'agent';
export type FeedbackIntent = 'comment' | 'question' | 'fix' | 'approve';
export type FeedbackSeverity = 'blocking' | 'important' | 'suggestion';
export type FeedbackStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed';

export interface ThreadMessage {
  id: string;
  role: FeedbackRole;
  content: string;
  timestamp: number;
}

export interface AgentFeedback {
  id: string;
  tabId: number;
  role: 'agent';
  intent: FeedbackIntent;
  severity: FeedbackSeverity;
  status: FeedbackStatus;
  selector: string;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  content: string;
  thread: ThreadMessage[];
  timestamp: number;
  resolvedAt?: number;
  resolvedBy?: FeedbackRole;
}

export interface AgentFeedbackMessage {
  type: 'agent-feedback';
  payload: AgentFeedback;
}

export interface AgentResolveMessage {
  type: 'agent-resolve';
  payload: {
    tabId: number;
    targetId: string;
    summary: string;
    timestamp: number;
  };
}

export interface AgentThreadReplyMessage {
  type: 'agent-thread-reply';
  payload: {
    tabId: number;
    targetId: string;
    message: ThreadMessage;
  };
}

export type AgentToExtensionMessage =
  | AgentFeedbackMessage
  | AgentResolveMessage
  | AgentThreadReplyMessage;
