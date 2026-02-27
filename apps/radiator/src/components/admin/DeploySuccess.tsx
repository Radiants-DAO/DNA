'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@rdna/radiants/components/core';
import { Zap, Copy, ExternalLink } from '@rdna/radiants/icons';

const MOCK_CONFIG_ADDRESS = 'RadCfg...4x2K';
const MOCK_TX_HASH = '5ZjH2...k9YP';

export function DeploySuccess() {
  const setView = useAppStore((s) => s.setView);
  const setAdminStep = useAppStore((s) => s.setAdminStep);
  const resetAdmin = useAppStore((s) => s.resetAdmin);

  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleViewRadiator = () => {
    resetAdmin();
    setAdminStep('select-collection');
    setView('landing');
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 h-full text-center">
      {/* Celebratory icon */}
      <Zap size={48} className="text-action-primary" />

      {/* Title */}
      <h1 className="font-joystix text-2xl uppercase text-content-heading">
        Radiator Deployed
      </h1>

      {/* Config address */}
      <div className="flex flex-col gap-3 w-full max-w-[24rem]">
        <CopyRow
          label="Config address"
          value={MOCK_CONFIG_ADDRESS}
          onCopy={() => handleCopy(MOCK_CONFIG_ADDRESS, 'config')}
          copied={copied === 'config'}
        />
        <CopyRow
          label="Transaction"
          value={MOCK_TX_HASH}
          onCopy={() => handleCopy(MOCK_TX_HASH, 'tx')}
          copied={copied === 'tx'}
          href={`https://explorer.solana.com/tx/${MOCK_TX_HASH}?cluster=devnet`}
        />
        <CopyRow
          label="Shareable link"
          value={`radiator.app/${MOCK_CONFIG_ADDRESS}`}
          onCopy={() => handleCopy(`https://radiator.app/${MOCK_CONFIG_ADDRESS}`, 'link')}
          copied={copied === 'link'}
        />
      </div>

      {/* CTA */}
      <Button variant="primary" size="lg" onClick={handleViewRadiator}>
        View Your Radiator
      </Button>
    </div>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
  copied,
  href,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 border border-edge-muted rounded-sm">
      <div className="flex flex-col items-start min-w-0">
        <span className="font-joystix text-[8px] uppercase text-content-muted">{label}</span>
        <span className="font-mondwest text-sm text-content-heading truncate max-w-full">
          {value}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-content-muted hover:text-content-heading"
          >
            <ExternalLink size={14} />
          </a>
        )}
        <button
          onClick={onCopy}
          className="p-1 text-content-muted hover:text-content-heading"
        >
          <Copy size={14} />
        </button>
        {copied && (
          <span className="font-mondwest text-xs text-status-success">Copied</span>
        )}
      </div>
    </div>
  );
}
