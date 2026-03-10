import { describe, it, expect } from 'vitest';
import { PromptCompiler } from '../promptCompiler';
import type { FeedbackV2 } from '@flow/shared';

describe('PromptCompiler', () => {
  const compiler = new PromptCompiler();

  it('compiles empty input to empty output', () => {
    const result = compiler.compile({
      textEdits: [],
      mutationDiffs: [],
      animationDiffs: [],
      promptDraft: [],
      promptSteps: [],
      comments: [],
    });
    expect(result.markdown).toBe('');
    expect(result.sections).toHaveLength(0);
  });

  it('compiles text edits with before/after', () => {
    const result = compiler.compile({
      textEdits: [
        {
          id: '1',
          sourceFile: 'src/components/Hero.tsx',
          sourceLine: 31,
          selector: '.hero h1',
          before: 'Welcome to our platform',
          after: 'Ship faster with Flow',
          timestamp: Date.now(),
        },
      ],
      mutationDiffs: [],
      animationDiffs: [],
      promptDraft: [],
      promptSteps: [],
      comments: [],
    });
    expect(result.markdown).toContain('## Text Changes');
    expect(result.markdown).toContain('Before: "Welcome to our platform"');
    expect(result.markdown).toContain('After: "Ship faster with Flow"');
  });

  it('compiles mutation diffs with property changes', () => {
    const result = compiler.compile({
      textEdits: [],
      mutationDiffs: [
        {
          id: '1',
          element: {
            selector: '.card',
            componentName: 'Card',
            sourceFile: 'src/components/Card.tsx',
            sourceLine: 15,
          },
          type: 'style',
          changes: [
            { property: 'padding', oldValue: '16px', newValue: '24px' },
            { property: 'border-radius', oldValue: '4px', newValue: '8px' },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
      animationDiffs: [],
      promptDraft: [],
      promptSteps: [],
      comments: [],
    });
    expect(result.markdown).toContain('## Style Mutations');
    expect(result.markdown).toContain('padding: `16px` -> `24px`');
  });

  it('compiles prompt builder steps with source refs', () => {
    const result = compiler.compile({
      textEdits: [],
      mutationDiffs: [],
      animationDiffs: [],
      promptDraft: [],
      promptSteps: [
        {
          id: '1',
          verb: 'Change',
          targetComponentName: 'HeroSection',
          targetSourceFile: 'src/components/Hero.tsx',
          targetSourceLine: 23,
          targetSelector: '.hero',
          value: 'flex-row',
          preposition: 'to',
          timestamp: Date.now(),
        },
      ],
      comments: [],
    });
    expect(result.markdown).toContain('## Instructions');
    expect(result.markdown).toContain('Change `<HeroSection>` (src/components/Hero.tsx:23) to flex-row');
  });

  it('joins multiple sections with dividers', () => {
    const result = compiler.compile({
      textEdits: [{ id: '1', selector: '.b', before: 'x', after: 'y', timestamp: 0 }],
      mutationDiffs: [
        {
          id: '1',
          element: { selector: '.c', componentName: 'C' },
          type: 'style',
          changes: [{ property: 'color', oldValue: 'red', newValue: 'blue' }],
          timestamp: new Date().toISOString(),
        },
      ],
      animationDiffs: [],
      promptDraft: [],
      promptSteps: [],
      comments: [],
    });
    expect(result.sections).toHaveLength(2);
    expect(result.markdown).toContain('---');
  });

  it('counts unique source files in metadata', () => {
    const result = compiler.compile({
      textEdits: [
        { id: '1', sourceFile: 'a.tsx', sourceLine: 5, selector: '.a', before: 'x', after: 'y', timestamp: 0 },
        { id: '2', sourceFile: 'b.tsx', sourceLine: 3, selector: '.b', before: 'p', after: 'q', timestamp: 0 },
      ],
      mutationDiffs: [],
      animationDiffs: [],
      promptDraft: [],
      promptSteps: [],
      comments: [],
    });
    expect(result.metadata.sourceFileCount).toBe(2);
  });

  it('compiles comments and questions', () => {
    const result = compiler.compile({
      textEdits: [],
      mutationDiffs: [],
      animationDiffs: [],
      promptDraft: [],
      promptSteps: [],
      comments: [
        {
          id: '1', type: 'comment', elementSelector: '.btn', componentName: 'Button',
          devflowId: null, source: null, content: 'Make this bigger', coordinates: { x: 0, y: 0 }, timestamp: 1000,
        },
        {
          id: '2', type: 'question', elementSelector: '.nav', componentName: 'Nav',
          devflowId: null, source: null, content: 'Should this be sticky?', coordinates: { x: 0, y: 0 }, timestamp: 2000,
        },
      ],
    });
    expect(result.markdown).toContain('## Feedback');
    expect(result.markdown).toContain('Make this bigger');
    expect(result.markdown).toContain('Should this be sticky?');
    expect(result.sections[0].itemCount).toBe(2);
  });

  it('compiles prompt draft nodes as instructions', () => {
    const result = compiler.compile({
      textEdits: [],
      mutationDiffs: [],
      animationDiffs: [],
      promptDraft: [
        { id: 't1', type: 'text', text: 'Change' },
        {
          id: 'c1',
          type: 'chip',
          chip: {
            id: 'chip1',
            kind: 'element',
            label: '#hero > h1',
            selector: '#hero > h1',
          },
        },
        { id: 't2', type: 'text', text: 'to' },
        {
          id: 'c2',
          type: 'chip',
          chip: {
            id: 'chip2',
            kind: 'token',
            label: '--color-content-primary',
            tokenName: '--color-content-primary',
          },
        },
      ],
      promptSteps: [
        {
          id: 'legacy',
          verb: 'Change',
          targetSelector: '.legacy',
          timestamp: Date.now(),
        },
      ],
      comments: [],
    });

    expect(result.markdown).toContain('## Instructions');
    expect(result.markdown).toContain('`#hero > h1`');
    expect(result.markdown).toContain('`--color-content-primary`');
    expect(result.markdown).not.toContain('.legacy');
  });

  it('compiles unified feedback with mixed human and agent thread', () => {
    const items: FeedbackV2[] = [
      {
        id: 'h1', threadId: 't1', author: 'human', intent: 'comment',
        severity: 'medium', status: 'acknowledged', selector: '.card',
        componentName: 'Card', content: 'Padding feels too tight',
        createdAt: 1000,
      },
      {
        id: 'a1', threadId: 't1', author: 'agent', intent: 'comment',
        severity: 'medium', status: 'acknowledged', selector: '.card',
        componentName: 'Card', content: 'I increased padding to 24px',
        createdAt: 2000,
      },
    ];

    const result = compiler.compile({
      textEdits: [],
      mutationDiffs: [],
      animationDiffs: [],
      promptDraft: [],
      promptSteps: [],
      comments: [],
      unifiedFeedback: items,
    });

    expect(result.markdown).toContain('## Feedback');
    expect(result.markdown).toContain('[Human] Padding feels too tight');
    expect(result.markdown).toContain('[Agent] I increased padding to 24px');
    expect(result.markdown).toContain('[acknowledged]');
    expect(result.sections[0].type).toBe('comments');
    expect(result.sections[0].itemCount).toBe(2);
  });

  it('compiles unified feedback with status and severity badges', () => {
    const items: FeedbackV2[] = [
      {
        id: 'f1', threadId: 'f1', author: 'agent', intent: 'fix',
        severity: 'high', status: 'resolved', selector: '#hero',
        componentName: 'Hero', content: 'Fixed contrast ratio',
        createdAt: 1000,
      },
    ];

    const result = compiler.compile({
      textEdits: [],
      mutationDiffs: [],
      animationDiffs: [],
      promptDraft: [],
      promptSteps: [],
      comments: [],
      unifiedFeedback: items,
    });

    expect(result.markdown).toContain('**fix**');
    expect(result.markdown).toContain('(high)');
    expect(result.markdown).toContain('[resolved]');
    expect(result.markdown).toContain('`Hero`');
  });

  it('unified feedback takes precedence over legacy comments', () => {
    const result = compiler.compile({
      textEdits: [],
      mutationDiffs: [],
      animationDiffs: [],
      promptDraft: [],
      promptSteps: [],
      comments: [
        {
          id: 'legacy', type: 'comment', elementSelector: '.old', componentName: 'Old',
          devflowId: null, source: null, content: 'Legacy comment', coordinates: { x: 0, y: 0 }, timestamp: 1000,
        },
      ],
      unifiedFeedback: [
        {
          id: 'v2', threadId: 'v2', author: 'human', intent: 'comment',
          severity: 'medium', status: 'open', selector: '.new',
          componentName: 'New', content: 'V2 comment', createdAt: 2000,
        },
      ],
    });

    expect(result.markdown).toContain('V2 comment');
    expect(result.markdown).not.toContain('Legacy comment');
  });
});
