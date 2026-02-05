import { describe, it, expect } from 'vitest';
import { PromptCompiler } from '../promptCompiler';

describe('PromptCompiler', () => {
  const compiler = new PromptCompiler();

  it('compiles empty input to empty output', () => {
    const result = compiler.compile({
      annotations: [],
      textEdits: [],
      mutationDiffs: [],
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.markdown).toBe('');
    expect(result.sections).toHaveLength(0);
  });

  it('compiles annotations with source locations', () => {
    const result = compiler.compile({
      annotations: [
        {
          id: '1',
          componentName: 'HeroSection',
          sourceFile: 'src/components/Hero.tsx',
          sourceLine: 23,
          text: 'Padding feels too tight on mobile',
          selector: '.hero',
          timestamp: Date.now(),
        },
      ],
      textEdits: [],
      mutationDiffs: [],
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.markdown).toContain('## Annotations');
    expect(result.markdown).toContain('`<HeroSection>`');
    expect(result.markdown).toContain('src/components/Hero.tsx:23');
    expect(result.markdown).toContain('Padding feels too tight on mobile');
  });

  it('compiles text edits with before/after', () => {
    const result = compiler.compile({
      annotations: [],
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
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.markdown).toContain('## Text Changes');
    expect(result.markdown).toContain('Before: "Welcome to our platform"');
    expect(result.markdown).toContain('After: "Ship faster with Flow"');
  });

  it('compiles mutation diffs with property changes', () => {
    const result = compiler.compile({
      annotations: [],
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
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.markdown).toContain('## Style Mutations');
    expect(result.markdown).toContain('padding: `16px` -> `24px`');
  });

  it('compiles prompt builder steps with source refs', () => {
    const result = compiler.compile({
      annotations: [],
      textEdits: [],
      mutationDiffs: [],
      designerChanges: [],
      animationDiffs: [],
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
    });
    expect(result.markdown).toContain('## Instructions');
    expect(result.markdown).toContain('Change `<HeroSection>` (src/components/Hero.tsx:23) to flex-row');
  });

  it('joins multiple sections with dividers', () => {
    const result = compiler.compile({
      annotations: [{ id: '1', componentName: 'A', text: 'note', selector: '.a', timestamp: 0 }],
      textEdits: [{ id: '1', selector: '.b', before: 'x', after: 'y', timestamp: 0 }],
      mutationDiffs: [],
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.sections).toHaveLength(2);
    expect(result.markdown).toContain('---');
  });

  it('counts unique source files in metadata', () => {
    const result = compiler.compile({
      annotations: [
        { id: '1', componentName: 'A', sourceFile: 'a.tsx', sourceLine: 1, text: 'x', selector: '.a', timestamp: 0 },
        { id: '2', componentName: 'B', sourceFile: 'b.tsx', sourceLine: 1, text: 'y', selector: '.b', timestamp: 0 },
      ],
      textEdits: [{ id: '1', sourceFile: 'a.tsx', sourceLine: 5, selector: '.a', before: 'x', after: 'y', timestamp: 0 }],
      mutationDiffs: [],
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.metadata.sourceFileCount).toBe(2); // a.tsx counted once
  });
});
