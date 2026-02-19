export type SeekerTab = 'info' | 'music' | 'chat' | 'camera';

export interface NewsItem {
  id: string;
  type: 'update' | 'event' | 'drop' | 'community';
  title: string;
  body: string;
  timestamp: string;
  thumbnail?: string;
}

export type WalletState = 'disconnected' | 'connecting' | 'verifying' | 'connected';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type DitherAlgorithm = 'floyd-steinberg' | 'ordered' | 'atkinson' | 'bayer';
