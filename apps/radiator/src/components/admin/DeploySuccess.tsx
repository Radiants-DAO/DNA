'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons';

export function DeploySuccess() {
  const setView = useAppStore((s) => s.setView);
  const setAdminStep = useAppStore((s) => s.setAdminStep);
  const resetAdmin = useAppStore((s) => s.resetAdmin);
  const deployTx = useAppStore((s) => s.adminDeployTx);
  const configAccount = useAppStore((s) => s.adminConfigAccount);

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

  const txExplorerHref = deployTx && !deployTx.startsWith('mock_')
    ? `https://explorer.solana.com/tx/${deployTx}?cluster=devnet`
    : undefined;
  const shareableLink = configAccount
    ? `https://radiator.app/${configAccount}`
    : '';

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 h-full text-center">
      {/* Celebratory icon */}
      <Icon name="electric" size={48} className="text-accent" />

      {/* Title */}
      <h1 className="font-joystix text-2xl uppercase text-head">
        Radiator Deployed
      </h1>

      {/* Config address */}
      <div className="flex flex-col gap-3 w-full max-w-[24rem]">
        <CopyRow
          label="Config address"
          value={configAccount || 'Not available'}
          onCopy={() => handleCopy(configAccount || 'Not available', 'config')}
          copied={copied === 'config'}
        />
        <CopyRow
          label="Transaction"
          value={deployTx || 'Not available'}
          onCopy={() => handleCopy(deployTx || 'Not available', 'tx')}
          copied={copied === 'tx'}
          href={txExplorerHref}
        />
        <CopyRow
          label="Shareable link"
          value={shareableLink || 'Not available'}
          onCopy={() => handleCopy(shareableLink || 'Not available', 'link')}
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
    <div className="flex items-center justify-between gap-2 p-2 border border-rule pixel-rounded-sm">
      <div className="flex flex-col items-start min-w-0">
        <span className="font-joystix text-xs uppercase text-mute">{label}</span>
        <span className="font-mondwest text-sm text-head truncate max-w-full">
          {value}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-mute hover:text-head"
          >
            <Icon name="share" size={14} />
          </a>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="p-1 text-mute hover:text-head"
        >
          <Icon name="copy" size={14} />
        </Button>
        {copied && (
          <span className="font-mondwest text-xs text-success">Copied</span>
        )}
      </div>
    </div>
  );
}
