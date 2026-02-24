import { useState } from 'react';
import { ClipboardDock } from './ClipboardDock';
import { PromptBuilderDock } from './PromptBuilderDock';
import { useAppStore } from '../../stores/appStore';

type DockTab = 'clipboard' | 'prompt';

export function BottomDock() {
  const [activeTab, setActiveTab] = useState<DockTab>('clipboard');
  const [expanded, setExpanded] = useState(false);
  const mutationCount = useAppStore((s) => s.mutationDiffs.length);
  const commentCount = useAppStore((s) => s.comments.length);
  const promptCount = useAppStore((s) => s.promptDraft.length);

  return (
    <div
      className={`shrink-0 border-t border-neutral-800 bg-neutral-900 transition-all ${
        expanded ? 'max-h-64' : 'max-h-10'
      }`}
    >
      <div className="h-10 flex items-center gap-0.5 px-2">
        <DockTabButton
          label="Clipboard"
          badge={mutationCount + commentCount}
          active={activeTab === 'clipboard'}
          onClick={() => {
            setActiveTab('clipboard');
            setExpanded(true);
          }}
        />
        <DockTabButton
          label="Prompt Builder"
          badge={promptCount}
          active={activeTab === 'prompt'}
          onClick={() => {
            setActiveTab('prompt');
            setExpanded(true);
          }}
        />
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto p-1 text-neutral-500 hover:text-neutral-300"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="overflow-hidden">
          {activeTab === 'clipboard' ? <ClipboardDock /> : <PromptBuilderDock />}
        </div>
      )}
    </div>
  );
}

function DockTabButton({
  label,
  badge,
  active,
  onClick,
}: {
  label: string;
  badge: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-[11px] transition-colors ${
        active
          ? 'bg-neutral-800 text-neutral-200'
          : 'text-neutral-500 hover:text-neutral-300'
      }`}
    >
      {label}
      {badge > 0 && (
        <span className="ml-1 px-1 py-0 rounded-full text-[9px] bg-blue-600/30 text-blue-300">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
