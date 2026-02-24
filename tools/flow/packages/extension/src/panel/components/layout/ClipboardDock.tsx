import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';

type FilterSection = 'mutations' | 'comments' | 'questions';

export function ClipboardDock() {
  const mutationDiffs = useAppStore((s) => s.mutationDiffs);
  const comments = useAppStore((s) => s.comments);
  const [activeFilters, setActiveFilters] = useState<Set<FilterSection>>(
    new Set(['mutations', 'comments', 'questions']),
  );

  const questions = comments.filter((c) => c.type === 'question');
  const nonQuestions = comments.filter((c) => c.type !== 'question');

  const toggleFilter = (section: FilterSection) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const exportAsMarkdown = () => {
    const lines: string[] = ['# Flow Session Export\n'];

    if (activeFilters.has('mutations') && mutationDiffs.length > 0) {
      lines.push('## Design Changes\n');
      for (const diff of mutationDiffs) {
        lines.push(`- **${diff.element.selector}**`);
        for (const change of diff.changes) {
          lines.push(`  - \`${change.property}\`: ${change.oldValue} → ${change.newValue}`);
        }
      }
      lines.push('');
    }

    if (activeFilters.has('comments') && nonQuestions.length > 0) {
      lines.push('## Comments\n');
      for (const c of nonQuestions) {
        lines.push(`- **${c.componentName}** (${c.elementSelector}): ${c.content}`);
      }
      lines.push('');
    }

    if (activeFilters.has('questions') && questions.length > 0) {
      lines.push('## Questions\n');
      for (const q of questions) {
        lines.push(`- **${q.componentName}** (${q.elementSelector}): ${q.content}`);
      }
      lines.push('');
    }

    navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
  };

  const totalCount = mutationDiffs.length + comments.length;

  return (
    <div className="flex flex-col gap-1 p-2 text-xs">
      <div className="flex items-center gap-1">
        <FilterChip
          label={`Changes (${mutationDiffs.length})`}
          active={activeFilters.has('mutations')}
          onClick={() => toggleFilter('mutations')}
        />
        <FilterChip
          label={`Comments (${nonQuestions.length})`}
          active={activeFilters.has('comments')}
          onClick={() => toggleFilter('comments')}
        />
        <FilterChip
          label={`Questions (${questions.length})`}
          active={activeFilters.has('questions')}
          onClick={() => toggleFilter('questions')}
        />
        <button
          onClick={exportAsMarkdown}
          disabled={totalCount === 0}
          className="ml-auto px-2 py-0.5 rounded text-[10px] bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Copy as .md
        </button>
      </div>

      <div className="max-h-32 overflow-y-auto text-neutral-400">
        {totalCount === 0 ? (
          <p className="text-neutral-600 text-center py-2">
            Make changes, add comments, or ask questions — they accumulate here.
          </p>
        ) : (
          <>
            {activeFilters.has('mutations') &&
              mutationDiffs.map((diff, i) => (
                <div key={`m-${i}`} className="py-0.5 border-b border-neutral-800">
                  <span className="text-blue-400">{diff.element.selector}</span>
                  <span className="text-neutral-600"> — {diff.changes.length} changes</span>
                </div>
              ))}
            {activeFilters.has('comments') &&
              nonQuestions.map((c) => (
                <div key={c.id} className="py-0.5 border-b border-neutral-800">
                  <span className="text-green-400">{c.componentName}</span>
                  <span className="text-neutral-500"> {c.content.slice(0, 60)}</span>
                </div>
              ))}
            {activeFilters.has('questions') &&
              questions.map((q) => (
                <div key={q.id} className="py-0.5 border-b border-neutral-800">
                  <span className="text-yellow-400">{q.componentName}</span>
                  <span className="text-neutral-500"> {q.content.slice(0, 60)}</span>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
        active
          ? 'bg-neutral-700 text-neutral-200'
          : 'bg-neutral-800 text-neutral-500'
      }`}
    >
      {label}
    </button>
  );
}
