import { describe, it, expect } from 'vitest';
import type {
  MutationDiff,
  ElementIdentity,
  MutationApplyCommand,
  MutationTextCommand,
  MutationRevertCommand,
  MutationClearCommand,
  MutationClearedEvent,
} from '../mutation';

describe('Mutation types', () => {
  it('MutationDiff is structurally valid', () => {
    const diff: MutationDiff = {
      id: 'test-id',
      element: { selector: 'div.hero > h1' },
      type: 'style',
      changes: [
        { property: 'color', oldValue: 'rgb(0, 0, 0)', newValue: 'rgb(255, 0, 0)' },
      ],
      timestamp: new Date().toISOString(),
    };
    expect(diff.changes).toHaveLength(1);
    expect(diff.type).toBe('style');
  });

  it('ElementIdentity supports optional source fields', () => {
    const el: ElementIdentity = {
      selector: '.btn',
      componentName: 'Button',
      sourceFile: 'src/components/Button.tsx',
      sourceLine: 42,
      sourceColumn: 5,
    };
    expect(el.componentName).toBe('Button');
  });

  it('MutationApplyCommand has correct shape', () => {
    const cmd: MutationApplyCommand = {
      kind: 'mutation:apply',
      elementRef: 'ref-123',
      styleChanges: { 'margin-top': '20px', color: 'red' },
    };
    expect(cmd.kind).toBe('mutation:apply');
    expect(Object.keys(cmd.styleChanges)).toHaveLength(2);
  });

  it('MutationTextCommand has correct shape', () => {
    const cmd: MutationTextCommand = {
      kind: 'mutation:text',
      elementRef: 'ref-456',
      newText: 'Hello World',
    };
    expect(cmd.kind).toBe('mutation:text');
    expect(cmd.newText).toBe('Hello World');
  });

  it('MutationRevertCommand supports single and all reverts', () => {
    const singleRevert: MutationRevertCommand = {
      kind: 'mutation:revert',
      mutationId: 'mut-123',
    };
    expect(singleRevert.mutationId).toBe('mut-123');

    const allRevert: MutationRevertCommand = {
      kind: 'mutation:revert',
      mutationId: 'all',
    };
    expect(allRevert.mutationId).toBe('all');
  });

  it('MutationClearCommand and MutationClearedEvent have correct shape', () => {
    const cmd: MutationClearCommand = {
      kind: 'mutation:clear',
    };
    const event: MutationClearedEvent = {
      kind: 'mutation:cleared',
    };
    expect(cmd.kind).toBe('mutation:clear');
    expect(event.kind).toBe('mutation:cleared');
  });
});
