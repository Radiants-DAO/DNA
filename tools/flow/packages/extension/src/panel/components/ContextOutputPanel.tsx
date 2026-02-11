import React, { useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

export function ContextOutputPanel() {
  const {
    compiledPrompt,
    isCompiling,
    lastCopiedAt,
    compilePrompt,
    copyToClipboard,
  } = useAppStore();

  const handleCopy = useCallback(async () => {
    await copyToClipboard();
  }, [copyToClipboard]);

  const recentlyCopied = lastCopiedAt && Date.now() - lastCopiedAt < 2000;

  // Count total items across all session data
  const annotations = useAppStore((s) => s.annotations?.length ?? 0);
  const textEdits = useAppStore((s) => s.textEdits?.length ?? 0);
  const mutationDiffs = useAppStore((s) => s.mutationDiffs?.length ?? 0);
  const designerChanges = useAppStore((s) => s.designerChanges?.length ?? 0);
  const animationDiffs = useAppStore((s) => s.animationDiffs?.length ?? 0);
  const promptSteps = useAppStore((s) => s.promptSteps?.length ?? 0);
  const comments = useAppStore((s) => s.comments?.length ?? 0);
  const totalItems = annotations + textEdits + mutationDiffs + designerChanges + animationDiffs + promptSteps + comments;

  return (
    <div className="flex flex-col gap-2 border-t border-edge-primary p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Context Output
        </h3>
        <span className="text-xs text-content-secondary">
          {totalItems} item{totalItems !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          disabled={totalItems === 0 || isCompiling}
          className="flex-1 rounded bg-surface-primary border border-edge-primary px-3 py-2 text-xs font-medium text-content-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isCompiling ? 'Compiling...' : recentlyCopied ? 'Copied!' : 'Copy Prompt'}
        </button>
        <button
          onClick={compilePrompt}
          disabled={totalItems === 0}
          className="rounded border border-edge-primary px-3 py-2 text-xs text-content-secondary hover:text-content-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Preview
        </button>
      </div>

      {compiledPrompt && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded border border-edge-primary bg-surface-primary p-3">
          <pre className="whitespace-pre-wrap text-xs text-content-primary font-mono leading-relaxed">
            {compiledPrompt.markdown}
          </pre>
        </div>
      )}
    </div>
  );
}
