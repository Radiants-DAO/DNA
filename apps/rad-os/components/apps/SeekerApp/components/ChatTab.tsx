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

  // Connected but no NFT
  const showNoNft = state === 'connected' && !hasRadiant;

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="font-mono text-[var(--color-success-green)] space-y-4">
        <pre className="text-xs leading-tight">
{`  ____  ___  ____  ___ __  __ _   _ ___
 |  _ \\/ _ \\|  _ \\|_ _|  \\/  | | | / __|
 | |_) | |_| | | | || || |\\/| | | | \\__ \\
 |  _ <|  _  | |_| || || |  | | |_| |__) |
 |_| \\_\\_| |_|____/___|_|  |_|\\___/|___/`}
        </pre>

        {state === 'disconnected' && (
          <>
            <p className="text-sm text-content-muted font-mono opacity-80">NFT required for access</p>
            <button
              onClick={onConnect}
              className="mt-4 px-6 py-2 border border-[var(--color-success-green)] text-[var(--color-success-green)] font-mono text-sm hover:bg-[var(--color-success-green)]/10 transition-colors"
            >
              CONNECT WALLET
            </button>
          </>
        )}

        {state === 'connecting' && (
          <p className="text-sm">Connecting{dots}</p>
        )}

        {state === 'verifying' && (
          <p className="text-sm">Verifying NFT ownership{dots}</p>
        )}

        {showNoNft && (
          <>
            <p className="text-sm text-action-destructive">No Radiant detected in wallet</p>
            <p className="text-xs text-content-muted font-mono">
              A Radiant NFT is required to access RADIMUS.
            </p>
          </>
        )}
      </div>
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
    <div className="h-full flex flex-col">
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
                  ? 'bg-[var(--color-success-green)]/20 text-[var(--color-success-green)]'
                  : 'bg-edge-primary/5 text-content-primary/80'
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
          className="flex-1 bg-edge-primary/5 border border-edge-muted rounded px-3 py-2 font-mono text-xs text-content-primary placeholder:text-content-primary/30 focus:outline-none focus:border-[var(--color-success-green)]/50"
        />
        <button
          onClick={handleSend}
          className="w-8 h-8 flex items-center justify-center text-[var(--color-success-green)] hover:text-[var(--color-success-green)]/80 transition-colors"
          aria-label="Send message"
        >
          <Icon name="go-forward" size={16} />
        </button>
      </div>
    </div>
  );
}
