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
}: {
  state: WalletState;
  onConnect: () => void;
}) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (state !== 'connecting' && state !== 'verifying') return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(id);
  }, [state]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="font-mono text-green-400 space-y-4">
        <pre className="text-xs leading-tight">
{`  ____  ___  ____  ___ __  __ _   _ ___
 |  _ \\/ _ \\|  _ \\|_ _|  \\/  | | | / __|
 | |_) | |_| | | | || || |\\/| | | | \\__ \\
 |  _ <|  _  | |_| || || |  | | |_| |__) |
 |_| \\_\\_| |_|____/___|_|  |_|\\___/|___/`}
        </pre>

        {state === 'disconnected' && (
          <>
            <p className="text-sm text-cream/60 font-mono">NFT required for access</p>
            <button
              onClick={onConnect}
              className="mt-4 px-6 py-2 border border-green-400 text-green-400 font-mono text-sm hover:bg-green-400/10 transition-colors"
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
      </div>
    </div>
  );
}

export function ChatTab() {
  const [walletState, setWalletState] = useState<WalletState>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleConnect = useCallback(() => {
    setWalletState('connecting');
    setTimeout(() => {
      setWalletState('verifying');
      setTimeout(() => {
        setWalletState('connected');
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

  if (walletState !== 'connected') {
    return <WalletConnect state={walletState} onConnect={handleConnect} />;
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
                  ? 'bg-green-400/20 text-green-400'
                  : 'bg-white/5 text-cream/80'
              }`}
            >
              {msg.role === 'assistant' && (
                <span className="text-sun-yellow/60 mr-1">&gt; RADIMUS:</span>
              )}
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the sun..."
          className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 font-mono text-xs text-cream placeholder:text-cream/30 focus:outline-none focus:border-green-400/50"
        />
        <button
          onClick={handleSend}
          className="w-8 h-8 flex items-center justify-center text-green-400 hover:text-green-300 transition-colors"
          aria-label="Send message"
        >
          <Icon name="go-forward" size={16} />
        </button>
      </div>
    </div>
  );
}
