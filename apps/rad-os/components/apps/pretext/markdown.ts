import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

// --- Block types ---

export interface HeadingBlock {
  type: 'heading';
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface BlockquoteBlock {
  type: 'blockquote';
  text: string;
}

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  items: string[];
}

export interface RuleBlock {
  type: 'rule';
}

export interface CodeBlock {
  type: 'code';
  lang: string | null;
  value: string;
}

export interface ImageBlock {
  type: 'image';
  alt: string;
  src: string;
}

export type PretextBlock =
  | HeadingBlock
  | ParagraphBlock
  | BlockquoteBlock
  | ListBlock
  | RuleBlock
  | CodeBlock
  | ImageBlock;

// --- Helpers ---

function collectText(node: MdastNode): string {
  if (node.type === 'text') return node.value ?? '';
  if (node.type === 'inlineCode') return node.value ?? '';
  if (node.children) {
    return node.children.map(collectText).join('');
  }
  return '';
}

// Minimal mdast node shape
interface MdastNode {
  type: string;
  depth?: number;
  ordered?: boolean;
  value?: string;
  lang?: string | null;
  alt?: string;
  url?: string;
  children?: MdastNode[];
}

// --- Parser ---

const parser = unified().use(remarkParse).use(remarkGfm);

function convertNode(node: MdastNode): PretextBlock | null {
  switch (node.type) {
    case 'heading':
      return {
        type: 'heading',
        depth: node.depth as HeadingBlock['depth'],
        text: collectText(node),
      };

    case 'paragraph': {
      // Check if paragraph contains only an image
      if (
        node.children?.length === 1 &&
        node.children[0].type === 'image'
      ) {
        const img = node.children[0];
        return {
          type: 'image',
          alt: img.alt ?? '',
          src: img.url ?? '',
        };
      }
      return {
        type: 'paragraph',
        text: collectText(node),
      };
    }

    case 'blockquote':
      return {
        type: 'blockquote',
        text: node.children?.map(collectText).join('\n').trim() ?? '',
      };

    case 'list':
      return {
        type: 'list',
        ordered: node.ordered ?? false,
        items:
          node.children?.map((item) =>
            item.children?.map(collectText).join('').trim() ?? '',
          ) ?? [],
      };

    case 'thematicBreak':
      return { type: 'rule' };

    case 'code':
      return {
        type: 'code',
        lang: node.lang ?? null,
        value: node.value ?? '',
      };

    case 'image':
      return {
        type: 'image',
        alt: node.alt ?? '',
        src: node.url ?? '',
      };

    default:
      return null;
  }
}

export function markdownToPretextBlocks(markdown: string): PretextBlock[] {
  if (!markdown.trim()) return [];

  const tree = parser.parse(markdown) as MdastNode;
  const blocks: PretextBlock[] = [];

  for (const child of tree.children ?? []) {
    const block = convertNode(child);
    if (block) blocks.push(block);
  }

  return blocks;
}

export function extractDocumentTitle(
  markdown: string,
  fallback: string,
): string {
  if (!markdown.trim()) return fallback;

  const tree = parser.parse(markdown) as MdastNode;
  for (const child of tree.children ?? []) {
    if (child.type === 'heading' && child.depth === 1) {
      return collectText(child);
    }
  }

  return fallback;
}
