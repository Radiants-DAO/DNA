import { describe, expect, it } from 'vitest';
import {
  extractDocumentTitle,
  markdownToPretextBlocks,
} from '@/components/apps/pretext/markdown';

describe('markdownToPretextBlocks', () => {
  it('converts common markdown blocks', () => {
    const blocks = markdownToPretextBlocks(
      `# Title\n\nParagraph\n\n> Quote\n\n- A\n- B\n\n---`,
    );
    expect(blocks.map((b) => b.type)).toEqual([
      'heading',
      'paragraph',
      'blockquote',
      'list',
      'rule',
    ]);
  });

  it('parses heading levels', () => {
    const blocks = markdownToPretextBlocks('# H1\n\n## H2\n\n### H3');
    expect(blocks).toEqual([
      { type: 'heading', depth: 1, text: 'H1' },
      { type: 'heading', depth: 2, text: 'H2' },
      { type: 'heading', depth: 3, text: 'H3' },
    ]);
  });

  it('parses paragraphs', () => {
    const blocks = markdownToPretextBlocks('First paragraph.\n\nSecond paragraph.');
    expect(blocks).toEqual([
      { type: 'paragraph', text: 'First paragraph.' },
      { type: 'paragraph', text: 'Second paragraph.' },
    ]);
  });

  it('parses ordered lists', () => {
    const blocks = markdownToPretextBlocks('1. One\n2. Two\n3. Three');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('list');
    if (blocks[0].type === 'list') {
      expect(blocks[0].ordered).toBe(true);
      expect(blocks[0].items).toEqual(['One', 'Two', 'Three']);
    }
  });

  it('parses unordered lists', () => {
    const blocks = markdownToPretextBlocks('- A\n- B');
    expect(blocks).toHaveLength(1);
    if (blocks[0].type === 'list') {
      expect(blocks[0].ordered).toBe(false);
      expect(blocks[0].items).toEqual(['A', 'B']);
    }
  });

  it('parses blockquotes', () => {
    const blocks = markdownToPretextBlocks('> Some wisdom');
    expect(blocks).toEqual([{ type: 'blockquote', text: 'Some wisdom' }]);
  });

  it('parses thematic breaks', () => {
    const blocks = markdownToPretextBlocks('---');
    expect(blocks).toEqual([{ type: 'rule' }]);
  });

  it('parses fenced code blocks', () => {
    const blocks = markdownToPretextBlocks('```ts\nconst x = 1;\n```');
    expect(blocks).toHaveLength(1);
    if (blocks[0].type === 'code') {
      expect(blocks[0].lang).toBe('ts');
      expect(blocks[0].value).toBe('const x = 1;');
    }
  });

  it('parses images', () => {
    const blocks = markdownToPretextBlocks('![alt text](image.png)');
    expect(blocks).toEqual([
      { type: 'image', alt: 'alt text', src: 'image.png' },
    ]);
  });

  it('handles empty input', () => {
    expect(markdownToPretextBlocks('')).toEqual([]);
  });
});

describe('extractDocumentTitle', () => {
  it('extracts the first h1', () => {
    expect(extractDocumentTitle('# My Title\n\nBody', 'fallback')).toBe(
      'My Title',
    );
  });

  it('returns fallback when no h1', () => {
    expect(extractDocumentTitle('Just text', 'Untitled')).toBe('Untitled');
  });

  it('returns fallback for empty markdown', () => {
    expect(extractDocumentTitle('', 'Untitled')).toBe('Untitled');
  });
});
