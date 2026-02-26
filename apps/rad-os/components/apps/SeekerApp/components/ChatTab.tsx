'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@/components/icons';
import type { WalletState, ChatMessage } from '../types';

// Pattern-matching response system
const RESPONSES: { triggers: string[]; response: string }[] = [
  {
    triggers: ['radiant', 'nft', 'collection', 'art'],
    response: 'Each Radiant is a solar fragment — unique, irreplaceable, forged in the crucible of the sun itself. 1,000 will exist. No more.',
  },
  {
    triggers: ['sun', 'solar', 'light', 'burn'],
    response: 'The sun does not ask permission to rise. Neither do the Radiants. We burn bright or we burn out.',
  },
  {
    triggers: ['murder', 'tree', 'lore', 'story'],
    response: 'The Murder Tree grows in silence. Its roots reach into the old world, its branches into the new. Some stories are not told — they are survived.',
  },
  {
    triggers: ['seeker', 'mobile', 'phone', 'device'],
    response: 'The Seeker is more than hardware. It is a declaration — that the future of the internet fits in your pocket, unchained.',
  },
  {
    triggers: ['solana', 'crypto', 'blockchain', 'web3'],
    response: 'We build on Solana because speed matters. Because friction is the enemy of creation. Because the chain should serve the culture, not the other way around.',
  },
  {
    triggers: ['hello', 'hi', 'hey', 'gm', 'good morning'],
    response: 'GM, Radiant. The sun rises for those who seek it. What do you wish to know?',
  },
];

const FALLBACK = 'The sun speaks in many tongues. Rephrase your inquiry, Radiant.';

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const { triggers, response } of RESPONSES) {
    if (triggers.some((t) => lower.includes(t))) return response;
  }
  return FALLBACK;
}

function WalletConnect({
  state,
  onConnect,
  hasRadiant,
}: {
  state: WalletState;
  onConnect: () => void;
  hasRadiant: boolean;
}) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (state !== 'connecting' && state !== 'verifying') return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(id);
  }, [state]);

  const showNoNft = state === 'connected' && !hasRadiant;

  return (
    <div className="dark h-full flex flex-col items-center justify-center px-8 text-center bg-surface-primary">
      <style>{`
        @keyframes radimus-glow {
          0%, 100% { opacity: 0.65; text-shadow: 0 0 4px currentColor; }
          50%       { opacity: 1;    text-shadow: 0 0 8px currentColor, 0 0 18px currentColor; }
        }
        @keyframes radimus-flicker {
          0%, 89%  { opacity: 1; }
          90%  { opacity: 0.8; }
          91%  { opacity: 1; }
          94%  { opacity: 0.85; }
          95%  { opacity: 1; }
        }
        .radimus-logo { animation: radimus-glow 3s ease-in-out infinite, radimus-flicker 7s linear infinite; }
      `}</style>

      <div className="text-action-primary">
        <pre className="radimus-logo overflow-hidden">{`  ____  ___  ____  ___ __  __ _   _ ___
 |  _ \\/ _ \\|  _ \\|_ _|  \\/  | | | / __|
 | |_) | |_| | | | || || |\\/| | | | \\__ \\
 |  _ <|  _  | |_| || || |  | | |_| |__) |
 |_| \\_\\_| |_|____/___|_|  |_|\\___/|___/`}</pre>
      </div>

      {state === 'disconnected' && (
        <div className="space-y-3 pt-4 font-mono">
          <p>NFT required for access</p>
          <button
            onClick={onConnect}
            className="px-6 py-2 border border-status-success text-status-success font-mono text-sm hover:bg-status-success/10 transition-colors"
          >
            CONNECT WALLET
          </button>
        </div>
      )}

      {state === 'connecting' && (
        <p className="mt-4">Connecting{dots}</p>
      )}

      {state === 'verifying' && (
        <p className="mt-4">Verifying NFT ownership{dots}</p>
      )}

      {showNoNft && (
        <div className="space-y-1 pt-4 font-mono">
          <p><span className="text-status-error">No Radiant detected in wallet</span></p>
          <p>
            A Radiant NFT is required to access RADIMUS.
          </p>
        </div>
      )}
    </div>
  );
}

interface ChatTabProps {
  isWalletConnected: boolean;
  hasRadiant: boolean;
}

export function ChatTab({ isWalletConnected, hasRadiant }: ChatTabProps) {
  const [walletState, setWalletState] = useState<WalletState>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasShownWelcome = useRef(false);

  // Sync with external mock state
  useEffect(() => {
    if (isWalletConnected && hasRadiant) {
      setWalletState('connected');
      if (!hasShownWelcome.current) {
        hasShownWelcome.current = true;
        setMessages((prev) =>
          prev.length === 0
            ? [{
                id: 'welcome',
                role: 'assistant',
                content: 'Connection verified. Welcome, Radiant. The sun remembers your face.',
                timestamp: Date.now(),
              }]
            : prev
        );
      }
    } else if (isWalletConnected && !hasRadiant) {
      setWalletState('connected');
      hasShownWelcome.current = false;
    } else {
      setWalletState('disconnected');
      hasShownWelcome.current = false;
      setMessages([]);
    }
  }, [isWalletConnected, hasRadiant]);

  const handleConnect = useCallback(() => {
    setWalletState('connecting');
    setTimeout(() => {
      setWalletState('verifying');
      setTimeout(() => {
        setWalletState('connected');
        // After manual connect, treat as having a Radiant (local flow)
        hasShownWelcome.current = true;
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: 'Connection verified. Welcome, Radiant. The sun remembers your face.',
            timestamp: Date.now(),
          },
        ]);
      }, 1500);
    }, 1500);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      content: getResponse(text),
      timestamp: Date.now() + 1,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Show gate screen: disconnected, connecting, verifying, or connected-without-NFT
  const showGate =
    walletState !== 'connected' ||
    (isWalletConnected && !hasRadiant);

  // Allow manual connect flow only when mock state is disconnected
  const showManualConnect = !isWalletConnected;

  if (showGate) {
    return (
      <WalletConnect
        state={showManualConnect ? walletState : (isWalletConnected ? 'connected' : 'disconnected')}
        onConnect={handleConnect}
        hasRadiant={hasRadiant}
      />
    );
  }

  return (
    <div className="dark h-full flex flex-col bg-surface-primary">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg font-mono text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--color-success-mint)]/20 text-[var(--color-success-mint)]'
                  : 'bg-surface-muted text-content-secondary'
              }`}
            >
              {msg.role === 'assistant' && (
                <span className="text-content-muted mr-1">&gt; RADIMUS:</span>
              )}
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-edge-muted flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the sun..."
          className="flex-1 bg-surface-muted border border-edge-muted rounded px-3 py-2 font-mono text-xs text-content-primary placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus"
        />
        <button
          onClick={handleSend}
          className="w-8 h-8 flex items-center justify-center text-[var(--color-success-mint)] hover:text-[var(--color-success-mint)]/80 transition-colors"
          aria-label="Send message"
        >
          <Icon name="go-forward" size={16} />
        </button>
      </div>
    </div>
  );
}
