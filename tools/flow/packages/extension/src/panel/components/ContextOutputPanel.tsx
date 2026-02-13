import React, { useCallback, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import type { SectionType } from '../stores/slices/promptOutputSlice';

const SECTION_LABELS: Record<SectionType, string> = {
  annotations: 'Annotations',
  'text-changes': 'Text Changes',
  'style-mutations': 'Style Mutations',
  'animation-changes': 'Animation Changes',
  instructions: 'Instructions',
  comments: 'Comments',
};

export function ContextOutputPanel() {
  const {
    compiledPrompt,
    isCompiling,
    lastCopiedAt,
    enabledSections,
    copyToClipboard,
    toggleSection,
  } = useAppStore();

  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = useCallback(async () => {
    await copyToClipboard();
  }, [copyToClipboard]);

  const recentlyCopied = lastCopiedAt && Date.now() - lastCopiedAt < 2000;

  // Count items per section from compiled output
  const sections = compiledPrompt?.sections ?? [];
  const enabledCount = sections.filter((s) => enabledSections[s.type]).length;
  const totalItems = sections.reduce(
    (sum, s) => (enabledSections[s.type] ? sum + s.itemCount : sum),
    0,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-edge-primary">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Prompt Output
        </h3>
        <span className="text-xs text-content-secondary">
          {totalItems} item{totalItems !== 1 ? 's' : ''} · {enabledCount} section{enabledCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Section toggles */}
      <div className="px-3 py-2 space-y-1 border-b border-edge-primary">
        {sections.map((section) => (
          <label
            key={section.type}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={enabledSections[section.type]}
              onChange={() => toggleSection(section.type)}
              className="rounded border-edge-primary text-content-primary"
            />
            <span className="text-xs text-content-secondary group-hover:text-content-primary transition-colors flex-1">
              {SECTION_LABELS[section.type] ?? section.type}
            </span>
            <span className="text-xs text-content-secondary tabular-nums">
              {section.itemCount}
            </span>
          </label>
        ))}

        {sections.length === 0 && (
          <p className="text-xs text-content-secondary italic">
            No data yet. Use design tools, comment/question mode, or add notes to build the prompt.
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-3 py-2 border-b border-edge-primary">
        <button
          onClick={handleCopy}
          disabled={totalItems === 0 || isCompiling}
          className="flex-1 rounded bg-surface-primary border border-edge-primary px-3 py-2 text-xs font-medium text-content-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isCompiling ? 'Compiling...' : recentlyCopied ? 'Copied!' : 'Copy Prompt'}
        </button>
        <button
          onClick={() => setShowPreview(!showPreview)}
          disabled={sections.length === 0}
          className="rounded border border-edge-primary px-3 py-2 text-xs text-content-secondary hover:text-content-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {showPreview ? 'Hide' : 'Preview'}
        </button>
      </div>

      {/* Markdown preview (filtered by enabled sections) */}
      {showPreview && compiledPrompt && (
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <pre className="whitespace-pre-wrap text-xs text-content-primary font-mono leading-relaxed">
            {compiledPrompt.sections
              .filter((s) => enabledSections[s.type])
              .map((s) => s.markdown)
              .join('\n\n---\n\n')}
          </pre>
        </div>
      )}
    </div>
  );
}
