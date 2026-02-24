import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';

export function PromptBuilderDock() {
  const promptDraft = useAppStore((s) => s.promptDraft);
  const insertPromptDraftText = useAppStore((s) => s.insertPromptDraftText);
  const removePromptDraftNode = useAppStore((s) => s.removePromptDraftNode);
  const clearPromptDraft = useAppStore((s) => s.clearPromptDraft);
  const copyToClipboard = useAppStore((s) => s.copyToClipboard);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        insertPromptDraftText(inputValue.trim());
        setInputValue('');
      }
      if (e.key === 'Backspace' && !inputValue && promptDraft.length > 0) {
        const lastNode = promptDraft[promptDraft.length - 1];
        removePromptDraftNode(lastNode.id);
      }
    },
    [inputValue, promptDraft, insertPromptDraftText, removePromptDraftNode],
  );

  return (
    <div className="flex flex-col gap-1 p-2 text-xs">
      <div className="flex flex-wrap gap-1 min-h-[24px]">
        {promptDraft.map((node) => {
          if (node.type === 'chip') {
            return (
              <span
                key={node.id}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300 text-[10px]"
              >
                <span className="opacity-60">{node.chip.kind}:</span>
                {node.chip.label}
                <button
                  onClick={() => removePromptDraftNode(node.id)}
                  className="ml-0.5 opacity-40 hover:opacity-100"
                >
                  x
                </button>
              </span>
            );
          }
          if (node.type === 'text') {
            return (
              <span key={node.id} className="text-neutral-300 text-[11px]">
                {node.text}
              </span>
            );
          }
          return null;
        })}
      </div>

      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type text or use V-mode to add chips..."
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-blue-600"
        />
        <button
          onClick={() => copyToClipboard()}
          disabled={promptDraft.length === 0}
          className="px-2 py-1 rounded text-[10px] bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Copy
        </button>
        {promptDraft.length > 0 && (
          <button
            onClick={() => clearPromptDraft()}
            className="px-1.5 py-1 rounded text-[10px] text-neutral-500 hover:text-neutral-300"
          >
            Clear
          </button>
        )}
      </div>

      <p className="text-[9px] text-neutral-600">
        V-mode: Cmd+click elements to add chips. Enter to add text.
      </p>
    </div>
  );
}
