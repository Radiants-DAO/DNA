import { useMemo, useState } from 'react';
import { Command } from 'cmdk';
import type { PromptChip, PromptDraftNode } from '@flow/shared';
import type { OnPageState } from '../stateBridge';

interface PromptPaletteProps {
  open: boolean;
  state: OnPageState;
  onClose: () => void;
  onCopyPrompt: () => void;
  onClearDraft: () => void;
  onInsertText: (text: string) => void;
  onInsertChip: (chip: Omit<PromptChip, 'id'> & { id?: string }) => void;
  onRemoveNode: (nodeId: string) => void;
  onChipClick: (chip: PromptChip) => void;
  onStartElementPicker: () => void;
  onClearSelections?: () => void;
}

function truncate(text: string, max = 56): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function getChipTooltip(chip: PromptChip): string {
  const lines: string[] = [];
  lines.push(`Kind: ${chip.kind}`);
  lines.push(`Label: ${chip.label}`);
  if (chip.selector) lines.push(`Selector: ${chip.selector}`);
  if (chip.componentName) lines.push(`Component: ${chip.componentName}`);
  if (chip.sourceFile) lines.push(`File: ${chip.sourceFile}`);
  if (typeof chip.sourceLine === 'number') lines.push(`Line: ${chip.sourceLine}`);
  if (chip.tokenName) lines.push(`Token: ${chip.tokenName}`);
  if (chip.tokenValue) lines.push(`Token Value: ${chip.tokenValue}`);
  if (chip.assetId) lines.push(`Asset ID: ${chip.assetId}`);
  if (chip.assetType) lines.push(`Asset Type: ${chip.assetType}`);
  if (chip.metadata) {
    lines.push('');
    lines.push('Metadata');
    lines.push(JSON.stringify(chip.metadata, null, 2));
  }
  return lines.join('\n');
}

function DraftNode({
  node,
  onRemoveNode,
  onChipClick,
  onChipHover,
  onChipLeave,
}: {
  node: PromptDraftNode;
  onRemoveNode: (nodeId: string) => void;
  onChipClick: (chip: PromptChip) => void;
  onChipHover: (chip: PromptChip, anchor: { x: number; y: number }) => void;
  onChipLeave: () => void;
}) {
  if (node.type === 'text') {
    return (
      <span className="flow-cmdk-draft-node flow-cmdk-draft-text-node">
        <span>{truncate(node.text)}</span>
        <button
          type="button"
          className="flow-cmdk-draft-remove"
          onClick={(event) => {
            event.stopPropagation();
            onRemoveNode(node.id);
          }}
          title="Remove text fragment"
        >
          ×
        </button>
      </span>
    );
  }

  return (
    <span className={`flow-cmdk-draft-node flow-cmdk-draft-chip-node kind-${node.chip.kind}`}>
      <button
        type="button"
        className="flow-cmdk-chip-button"
        onClick={(event) => {
          event.stopPropagation();
          onChipClick(node.chip);
        }}
        onMouseEnter={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onChipHover(node.chip, { x: rect.left, y: rect.bottom + 8 });
        }}
        onMouseLeave={onChipLeave}
      >
        {truncate(node.chip.label)}
      </button>
      <button
        type="button"
        className="flow-cmdk-draft-remove"
        onClick={(event) => {
          event.stopPropagation();
          onRemoveNode(node.id);
        }}
        title="Remove chip"
      >
        ×
      </button>
    </span>
  );
}

export function PromptPalette({
  open,
  state,
  onClose,
  onCopyPrompt,
  onClearDraft,
  onInsertText,
  onInsertChip,
  onRemoveNode,
  onChipClick,
  onStartElementPicker,
  onClearSelections,
}: PromptPaletteProps) {
  const [query, setQuery] = useState('');
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const trimmedQuery = query.trim();
  const canAddText = trimmedQuery.length > 0;

  const componentItems = useMemo(
    () => state.promptSources.components.slice(0, 80),
    [state.promptSources.components]
  );
  const tokenItems = useMemo(
    () => state.promptSources.tokens.slice(0, 120),
    [state.promptSources.tokens]
  );
  const assetItems = useMemo(
    () => state.promptSources.assets.slice(0, 120),
    [state.promptSources.assets]
  );

  if (!open) return null;

  return (
    <div className="flow-cmdk-overlay" role="dialog" aria-modal="true">
      <button
        type="button"
        className="flow-cmdk-backdrop"
        aria-label="Close command palette"
        onClick={onClose}
      />
      <div className="flow-cmdk-panel" onClick={(event) => event.stopPropagation()}>
        <div className="flow-cmdk-header">
          <span className="flow-cmdk-title">Prompt Builder</span>
          <kbd className="flow-cmdk-kbd">Esc</kbd>
        </div>

        <div className="flow-cmdk-draft">
          {state.promptDraft.length === 0 ? (
            <span className="flow-cmdk-draft-placeholder">
              Start typing text, then insert context chips (element, component, token, asset).
            </span>
          ) : (
            state.promptDraft.map((node) => (
              <DraftNode
                key={node.id}
                node={node}
                onRemoveNode={onRemoveNode}
                onChipClick={onChipClick}
                onChipHover={(chip, anchor) =>
                  setTooltip({
                    text: getChipTooltip(chip),
                    x: anchor.x,
                    y: anchor.y,
                  })
                }
                onChipLeave={() => setTooltip(null)}
              />
            ))
          )}
        </div>

        <Command
          className="flow-cmdk-command"
          label="Flow Prompt Commands"
          shouldFilter
        >
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Type text or search for components/tokens/assets..."
            className="flow-cmdk-input"
          />
          <Command.List className="flow-cmdk-list">
            <Command.Empty className="flow-cmdk-empty">No matches.</Command.Empty>

            <Command.Group heading="Prompt">
              {canAddText && (
                <Command.Item
                  value={`add-text-${trimmedQuery}`}
                  className="flow-cmdk-item"
                  onSelect={() => {
                    onInsertText(trimmedQuery);
                    setQuery('');
                  }}
                >
                  Add text: <strong>{truncate(trimmedQuery, 72)}</strong>
                </Command.Item>
              )}
              <Command.Item
                value="pick-element"
                className="flow-cmdk-item"
                onSelect={() => {
                  setQuery('');
                  onStartElementPicker();
                }}
              >
                Pick element from page
              </Command.Item>
              <Command.Item
                value="copy-prompt"
                className="flow-cmdk-item"
                onSelect={() => {
                  onCopyPrompt();
                  setQuery('');
                }}
              >
                Copy compiled prompt
              </Command.Item>
              <Command.Item
                value="clear-draft"
                className="flow-cmdk-item"
                onSelect={() => {
                  onClearDraft();
                  setQuery('');
                }}
              >
                Clear prompt draft
              </Command.Item>
              {onClearSelections && (
                <Command.Item
                  value="clear-selections"
                  className="flow-cmdk-item"
                  onSelect={() => {
                    onClearSelections();
                    setQuery('');
                  }}
                >
                  Clear selected outlines
                </Command.Item>
              )}
            </Command.Group>

            {componentItems.length > 0 && (
              <Command.Group heading="Components">
                {componentItems.map((component) => (
                  <Command.Item
                    key={`component-${component.file}:${component.line}:${component.name}`}
                    value={`component-${component.name}-${component.file}-${component.line}`}
                    className="flow-cmdk-item"
                    onSelect={() => {
                      onInsertChip({
                        kind: 'component',
                        label: `<${component.name}>`,
                        componentName: component.name,
                        sourceFile: component.file,
                        sourceLine: component.line,
                        metadata: { component },
                      });
                      setQuery('');
                    }}
                  >
                    <span>{`<${component.name}>`}</span>
                    <span className="flow-cmdk-item-meta">{`${component.file}:${component.line}`}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {tokenItems.length > 0 && (
              <Command.Group heading="Tokens">
                {tokenItems.map((token) => (
                  <Command.Item
                    key={`token-${token.name}`}
                    value={`token-${token.name}-${token.value}`}
                    className="flow-cmdk-item"
                    onSelect={() => {
                      onInsertChip({
                        kind: 'token',
                        label: token.name,
                        tokenName: token.name,
                        tokenValue: token.value,
                        metadata: { token },
                      });
                      setQuery('');
                    }}
                  >
                    <span>{token.name}</span>
                    <span className="flow-cmdk-item-meta">{token.value}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {assetItems.length > 0 && (
              <Command.Group heading="Assets">
                {assetItems.map((asset) => (
                  <Command.Item
                    key={`asset-${asset.type}-${asset.id}`}
                    value={`asset-${asset.type}-${asset.name}-${asset.path}`}
                    className="flow-cmdk-item"
                    onSelect={() => {
                      onInsertChip({
                        kind: 'asset',
                        label: asset.name,
                        assetId: asset.id,
                        assetType: asset.type,
                        metadata: { asset },
                      });
                      setQuery('');
                    }}
                  >
                    <span>{asset.name}</span>
                    <span className="flow-cmdk-item-meta">{asset.type}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>

        {tooltip && (
          <div
            className="flow-cmdk-chip-tooltip"
            style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
          >
            <pre>{tooltip.text}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
