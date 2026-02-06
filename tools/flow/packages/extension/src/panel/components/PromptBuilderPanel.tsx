import React from 'react';
import { useAppStore } from '../stores/appStore';
import { translate, getDropdownOptions } from '../../services/languageAdapters';
import type { PromptVerb, LanguageAdapter } from '@flow/shared';

const VERBS: PromptVerb[] = ['Change', 'Add', 'Remove', 'Move', 'Apply', 'Set', 'Replace'];

export function PromptBuilderPanel() {
  const {
    promptSteps,
    activeLanguage,
    pendingSlot,
    addPromptStep,
    removePromptStep,
    updatePromptStep,
    setActiveLanguage,
    setPendingSlot,
  } = useAppStore();

  const dropdownOptions = getDropdownOptions(activeLanguage);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-content-primary">Prompt Builder</h2>
        <LanguageSelector active={activeLanguage} onChange={setActiveLanguage} />
      </div>

      <div className="flex flex-col gap-2">
        {promptSteps.map((step, index) => (
          <div
            key={step.id}
            className="flex items-center gap-2 rounded-md border border-edge-primary bg-surface-secondary p-2 text-sm"
          >
            <span className="text-content-secondary font-mono text-xs w-6">{index + 1}.</span>

            {/* Verb selector */}
            <select
              value={step.verb}
              onChange={(e) => updatePromptStep(step.id, { verb: e.target.value as PromptVerb })}
              className="rounded border border-edge-primary bg-surface-primary px-2 py-1 text-content-primary text-xs"
            >
              {VERBS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            {/* Target element slot */}
            <ElementSlot
              label={step.targetComponentName ? `<${step.targetComponentName}>` : 'Select element'}
              isActive={pendingSlot?.stepId === step.id && pendingSlot?.slot === 'target'}
              onClick={() => setPendingSlot({ stepId: step.id, slot: 'target' })}
              filled={!!step.targetSelector}
            />

            {/* Value dropdown */}
            {step.verb !== 'Remove' && (
              <>
                <span className="text-content-secondary text-xs">{step.preposition || 'to'}</span>
                <select
                  value={step.value || ''}
                  onChange={(e) => updatePromptStep(step.id, { value: e.target.value })}
                  className="rounded border border-edge-primary bg-surface-primary px-2 py-1 text-content-primary text-xs flex-1"
                >
                  <option value="">Select value...</option>
                  {dropdownOptions.map((opt) => (
                    <option key={opt.css} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
              </>
            )}

            {/* Reference element slot (for Move, Apply) */}
            {(step.verb === 'Move' || step.verb === 'Apply') && (
              <ElementSlot
                label={step.referenceComponentName ? `<${step.referenceComponentName}>` : 'Select ref'}
                isActive={pendingSlot?.stepId === step.id && pendingSlot?.slot === 'reference'}
                onClick={() => setPendingSlot({ stepId: step.id, slot: 'reference' })}
                filled={!!step.referenceSelector}
              />
            )}

            <button
              onClick={() => removePromptStep(step.id)}
              className="ml-auto text-content-secondary hover:text-content-primary text-xs"
              aria-label="Remove step"
            >
              x
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => addPromptStep()}
        className="flex items-center gap-1 rounded border border-dashed border-edge-primary px-3 py-2 text-xs text-content-secondary hover:text-content-primary hover:border-content-primary transition-colors"
      >
        + Add Step
      </button>
    </div>
  );
}

function ElementSlot({
  label,
  isActive,
  onClick,
  filled,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  filled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-mono border transition-colors ${
        isActive
          ? 'border-blue-500 bg-blue-500/10 text-blue-400 animate-pulse'
          : filled
            ? 'border-edge-primary bg-surface-primary text-content-primary'
            : 'border-dashed border-edge-primary text-content-secondary hover:border-content-primary'
      }`}
    >
      {isActive ? 'Click element on page...' : `@ ${label}`}
    </button>
  );
}

function LanguageSelector({
  active,
  onChange,
}: {
  active: LanguageAdapter;
  onChange: (lang: LanguageAdapter) => void;
}) {
  const languages: { value: LanguageAdapter; label: string }[] = [
    { value: 'css', label: 'CSS' },
    { value: 'tailwind', label: 'Tailwind' },
    { value: 'figma', label: 'Figma' },
  ];

  return (
    <div className="flex gap-1">
      {languages.map((lang) => (
        <button
          key={lang.value}
          onClick={() => onChange(lang.value)}
          className={`rounded px-2 py-1 text-xs transition-colors ${
            active === lang.value
              ? 'bg-surface-primary text-content-primary border border-edge-primary'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
