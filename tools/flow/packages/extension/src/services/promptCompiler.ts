import type { MutationDiff } from '@flow/shared';
import type { TextEdit } from '@flow/shared';
import type { AnimationDiff } from '@flow/shared';
import type { PromptStep, PromptDraftNode } from '@flow/shared';
import type { Feedback } from '@flow/shared';
import { type FeedbackV2, groupByThread } from '@flow/shared';

export interface CompilerInput {
  textEdits: TextEdit[];
  mutationDiffs: MutationDiff[];
  animationDiffs: AnimationDiff[];
  promptDraft: PromptDraftNode[];
  promptSteps: PromptStep[];
  comments: Feedback[];
  /** Unified feedback threads (when present, takes precedence over comments for the feedback section). */
  unifiedFeedback?: FeedbackV2[];
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
  type: 'text-changes' | 'style-mutations' | 'animation-changes' | 'instructions' | 'comments';
  markdown: string;
  itemCount: number;
}

export class PromptCompiler {
  compile(input: CompilerInput): CompiledPrompt {
    const sections: PromptSection[] = [];

    if (input.textEdits.length > 0) {
      sections.push(this.compileTextEdits(input.textEdits));
    }
    if (input.mutationDiffs.length > 0) {
      sections.push(this.compileMutationDiffs(input.mutationDiffs));
    }
    if (input.animationDiffs.length > 0) {
      sections.push(this.compileAnimationDiffs(input.animationDiffs));
    }
    if (input.promptDraft.length > 0) {
      sections.push(this.compilePromptDraft(input.promptDraft));
    } else if (input.promptSteps.length > 0) {
      sections.push(this.compilePromptSteps(input.promptSteps));
    }
    if (input.unifiedFeedback && input.unifiedFeedback.length > 0) {
      sections.push(this.compileUnifiedFeedback(input.unifiedFeedback));
    } else if (input.comments.length > 0) {
      sections.push(this.compileComments(input.comments));
    }

    const markdown = sections.map((s) => s.markdown).join('\n\n---\n\n');
    const allFiles = new Set<string>();
    // Count unique source files from all inputs
    input.textEdits.forEach((item) => item.sourceFile && allFiles.add(item.sourceFile));
    input.animationDiffs.forEach((item) => item.sourceFile && allFiles.add(item.sourceFile));
    input.mutationDiffs.forEach((item) => {
      if (item.element.sourceFile) allFiles.add(item.element.sourceFile);
    });
    input.promptDraft.forEach((node) => {
      if (node.type !== 'chip') return;
      if (node.chip.sourceFile) allFiles.add(node.chip.sourceFile);
      const metadataSource = node.chip.metadata as
        | { inspection?: { fiber?: { source?: { fileName?: string } } } }
        | undefined;
      const fileName = metadataSource?.inspection?.fiber?.source?.fileName;
      if (fileName) allFiles.add(fileName);
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

  private compilePromptDraft(nodes: PromptDraftNode[]): PromptSection {
    const instruction = nodes
      .map((node) => {
        if (node.type === 'text') return node.text.trim();
        if (node.chip.kind === 'element' && node.chip.selector) {
          return `\`${node.chip.selector}\``;
        }
        if (node.chip.kind === 'token' && node.chip.tokenName) {
          return `\`${node.chip.tokenName}\``;
        }
        if (node.chip.kind === 'asset' && node.chip.assetId) {
          return `\`${node.chip.label}\`(asset:${node.chip.assetId})`;
        }
        if (node.chip.componentName) {
          return `\`<${node.chip.componentName}>\``;
        }
        return `\`${node.chip.label}\``;
      })
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const chips = nodes.filter((node): node is Extract<PromptDraftNode, { type: 'chip' }> => node.type === 'chip');
    const contextLines = chips.map((node, index) => {
      const details: string[] = [];
      if (node.chip.selector) details.push(`selector=${node.chip.selector}`);
      if (node.chip.sourceFile) details.push(`file=${node.chip.sourceFile}`);
      if (typeof node.chip.sourceLine === 'number') details.push(`line=${node.chip.sourceLine}`);
      if (node.chip.tokenValue) details.push(`value=${node.chip.tokenValue}`);
      if (node.chip.assetType) details.push(`assetType=${node.chip.assetType}`);
      return `${index + 1}. [${node.chip.kind}] ${node.chip.label}${details.length > 0 ? ` (${details.join(', ')})` : ''}`;
    });

    const markdownParts = [
      '## Instructions',
      '',
      instruction.length > 0 ? `1. ${instruction}` : '1. [No prompt text entered yet]',
    ];
    if (contextLines.length > 0) {
      markdownParts.push('');
      markdownParts.push('### Context Chips');
      markdownParts.push('');
      markdownParts.push(...contextLines);
    }

    return {
      type: 'instructions',
      markdown: markdownParts.join('\n'),
      itemCount: Math.max(nodes.length, 1),
    };
  }

  private compileUnifiedFeedback(items: FeedbackV2[]): PromptSection {
    const threads = groupByThread(items);
    const lines: string[] = [];
    let threadIndex = 0;

    for (const [, thread] of threads) {
      threadIndex++;
      const root = thread[0];
      const statusBadge = root.status !== 'open' ? ` [${root.status}]` : '';
      const severityBadge = root.severity !== 'medium' ? ` (${root.severity})` : '';
      const target = root.componentName
        ? `\`${root.componentName}\``
        : root.selector
          ? `\`${root.selector}\``
          : 'general';

      lines.push(`${threadIndex}. **${root.intent}** on ${target}${severityBadge}${statusBadge}`);
      for (const entry of thread) {
        const authorTag = entry.author === 'agent' ? 'Agent' : 'Human';
        lines.push(`   - [${authorTag}] ${entry.content}`);
      }
      lines.push('');
    }

    return {
      type: 'comments',
      markdown: `## Feedback\n\n${lines.join('\n')}`,
      itemCount: items.length,
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
