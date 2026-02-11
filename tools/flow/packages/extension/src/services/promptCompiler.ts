import type { MutationDiff } from '@flow/shared';
import type { Annotation } from '@flow/shared';
import type { TextEdit } from '@flow/shared';
import type { DesignerChange } from '@flow/shared';
import type { AnimationDiff } from '@flow/shared';
import type { PromptStep } from '@flow/shared';
import type { Feedback } from '../panel/stores/types';

export interface CompilerInput {
  annotations: Annotation[];
  textEdits: TextEdit[];
  mutationDiffs: MutationDiff[];
  designerChanges: DesignerChange[];
  animationDiffs: AnimationDiff[];
  promptSteps: PromptStep[];
  comments: Feedback[];
}

export interface CompiledPrompt {
  markdown: string;
  sections: PromptSection[];
  metadata: {
    tabId: number;
    timestamp: number;
    elementCount: number;
    sourceFileCount: number;
  };
}

export interface PromptSection {
  type: 'annotations' | 'text-changes' | 'style-mutations' | 'designer-changes' | 'animation-changes' | 'instructions' | 'comments';
  markdown: string;
  itemCount: number;
}

export class PromptCompiler {
  compile(input: CompilerInput): CompiledPrompt {
    const sections: PromptSection[] = [];

    if (input.annotations.length > 0) {
      sections.push(this.compileAnnotations(input.annotations));
    }
    if (input.textEdits.length > 0) {
      sections.push(this.compileTextEdits(input.textEdits));
    }
    if (input.mutationDiffs.length > 0) {
      sections.push(this.compileMutationDiffs(input.mutationDiffs));
    }
    if (input.designerChanges.length > 0) {
      sections.push(this.compileDesignerChanges(input.designerChanges));
    }
    if (input.animationDiffs.length > 0) {
      sections.push(this.compileAnimationDiffs(input.animationDiffs));
    }
    if (input.promptSteps.length > 0) {
      sections.push(this.compilePromptSteps(input.promptSteps));
    }
    if (input.comments.length > 0) {
      sections.push(this.compileComments(input.comments));
    }

    const markdown = sections.map((s) => s.markdown).join('\n\n---\n\n');
    const allFiles = new Set<string>();
    // Count unique source files from all inputs
    input.annotations.forEach((item) => item.sourceFile && allFiles.add(item.sourceFile));
    input.textEdits.forEach((item) => item.sourceFile && allFiles.add(item.sourceFile));
    input.designerChanges.forEach((item) => item.sourceFile && allFiles.add(item.sourceFile));
    input.animationDiffs.forEach((item) => item.sourceFile && allFiles.add(item.sourceFile));
    input.mutationDiffs.forEach((item) => {
      if (item.element.sourceFile) allFiles.add(item.element.sourceFile);
    });

    return {
      markdown,
      sections,
      metadata: {
        tabId: 0, // Set by caller
        timestamp: Date.now(),
        elementCount: sections.reduce((sum, s) => sum + s.itemCount, 0),
        sourceFileCount: allFiles.size,
      },
    };
  }

  private compileAnnotations(annotations: Annotation[]): PromptSection {
    const lines = annotations.map((a, i) => {
      const location = a.sourceFile ? ` at ${a.sourceFile}:${a.sourceLine}` : '';
      return `${i + 1}. \`<${a.componentName}>\`${location}\n   -> "${a.text}"`;
    });
    return {
      type: 'annotations',
      markdown: `## Annotations\n\n${lines.join('\n\n')}`,
      itemCount: annotations.length,
    };
  }

  private compileTextEdits(edits: TextEdit[]): PromptSection {
    const lines = edits.map((e, i) => {
      const location = e.sourceFile ? `${e.sourceFile}:${e.sourceLine}` : e.selector;
      return `${i + 1}. ${location}\n   - Before: "${e.before}"\n   - After: "${e.after}"`;
    });
    return {
      type: 'text-changes',
      markdown: `## Text Changes\n\n${lines.join('\n\n')}`,
      itemCount: edits.length,
    };
  }

  private compileMutationDiffs(diffs: MutationDiff[]): PromptSection {
    const lines = diffs.map((d, i) => {
      const label = d.element.componentName ? `<${d.element.componentName}>` : d.element.selector;
      const line = d.element.sourceLine ? `:${d.element.sourceLine}` : '';
      const location = d.element.sourceFile
        ? `\`${label}\` (${d.element.sourceFile}${line})`
        : `\`${d.element.selector}\``;
      const changes = d.changes
        .map((c) => `   - ${c.property}: \`${c.oldValue}\` -> \`${c.newValue}\``)
        .join('\n');
      return `${i + 1}. ${location}\n${changes}`;
    });
    return {
      type: 'style-mutations',
      markdown: `## Style Mutations\n\n${lines.join('\n\n')}`,
      itemCount: diffs.length,
    };
  }

  private compileDesignerChanges(changes: DesignerChange[]): PromptSection {
    const lines = changes.map((d, i) => {
      const location = d.sourceFile ? `\`<${d.componentName}>\` (${d.sourceFile}:${d.sourceLine})` : `\`${d.selector}\``;
      const props = d.changes
        .map((c) => `   - ${c.property}: \`${c.oldValue}\` -> \`${c.newValue}\``)
        .join('\n');
      return `${i + 1}. ${location}\n${props}`;
    });
    return {
      type: 'designer-changes',
      markdown: `## Designer Changes\n\n${lines.join('\n\n')}`,
      itemCount: changes.length,
    };
  }

  private compileAnimationDiffs(diffs: AnimationDiff[]): PromptSection {
    const lines = diffs.map((d, i) => {
      const location = d.sourceFile ? `\`${d.target}\` in \`<${d.componentName}>\` (${d.sourceFile}:${d.sourceLine})` : `\`${d.target}\``;
      const changes = d.changes.map((c) => `   - ${c.property}: ${c.before} -> ${c.after}`).join('\n');
      return `${i + 1}. Target: ${location}\n${changes}`;
    });
    return {
      type: 'animation-changes',
      markdown: `## Animation Changes\n\n${lines.join('\n\n')}`,
      itemCount: diffs.length,
    };
  }

  private compilePromptSteps(steps: PromptStep[]): PromptSection {
    const lines = steps.map((s, i) => {
      const target = s.targetSourceFile
        ? `\`<${s.targetComponentName}>\` (${s.targetSourceFile}:${s.targetSourceLine})`
        : `\`${s.targetSelector}\``;
      let instruction = `${i + 1}. ${s.verb} ${target}`;
      if (s.value) instruction += ` ${s.preposition || 'to'} ${s.value}`;
      if (s.referenceSourceFile) {
        instruction += `\n   Reference: \`<${s.referenceComponentName}>\` (${s.referenceSourceFile}:${s.referenceSourceLine})`;
      }
      return instruction;
    });
    return {
      type: 'instructions',
      markdown: `## Instructions\n\n${lines.join('\n\n')}`,
      itemCount: steps.length,
    };
  }

  private compileComments(comments: Feedback[]): PromptSection {
    const feedbackComments = comments.filter((c) => c.type === 'comment');
    const feedbackQuestions = comments.filter((c) => c.type === 'question');
    const lines: string[] = [];

    if (feedbackComments.length > 0) {
      lines.push('### Comments');
      lines.push('');
      feedbackComments.forEach((c, i) => {
        const location = c.source ? ` (${c.source.filePath}:${c.source.line})` : '';
        lines.push(`${i + 1}. \`${c.componentName}\`${location}`);
        lines.push(`   - ${c.content}`);
        lines.push('');
      });
    }

    if (feedbackQuestions.length > 0) {
      lines.push('### Questions');
      lines.push('');
      feedbackQuestions.forEach((c, i) => {
        const location = c.source ? ` (${c.source.filePath}:${c.source.line})` : '';
        lines.push(`${i + 1}. \`${c.componentName}\`${location}`);
        lines.push(`   ? ${c.content}`);
        lines.push('');
      });
    }

    return {
      type: 'comments',
      markdown: `## Feedback\n\n${lines.join('\n')}`,
      itemCount: comments.length,
    };
  }
}

export const promptCompiler = new PromptCompiler();
