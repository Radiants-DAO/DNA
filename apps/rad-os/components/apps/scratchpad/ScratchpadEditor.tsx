'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { type Block } from '@blocknote/core';
import { useCallback, useEffect, useRef } from 'react';

import '@blocknote/mantine/style.css';
import './scratchpad-theme.css';

// ============================================================================
// Persistence
// ============================================================================

const STORAGE_KEY = 'rados-scratchpad';

function loadContent(): Block[] | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Corrupted data — start fresh
  }
  return undefined;
}

function saveContent(blocks: Block[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

// ============================================================================
// Default welcome content (BlockNote block format)
// ============================================================================

const DEFAULT_CONTENT: Block[] = [
  {
    id: 'welcome-h1',
    type: 'heading',
    props: { level: 1, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [{ type: 'text', text: 'Scratchpad', styles: {} }],
    children: [],
  },
  {
    id: 'welcome-p1',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      { type: 'text', text: 'A live editor inside RadOS, powered by ', styles: {} },
      { type: 'text', text: 'BlockNote', styles: { bold: true } },
      { type: 'text', text: ' and styled with RDNA tokens.', styles: {} },
    ],
    children: [],
  },
  {
    id: 'welcome-h2',
    type: 'heading',
    props: { level: 2, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [{ type: 'text', text: 'Try it out', styles: {} }],
    children: [],
  },
  {
    id: 'welcome-li1',
    type: 'bulletListItem',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      { type: 'text', text: 'Type ', styles: {} },
      { type: 'text', text: '/', styles: { code: true } },
      { type: 'text', text: ' to open the slash menu', styles: {} },
    ],
    children: [],
  },
  {
    id: 'welcome-li2',
    type: 'bulletListItem',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      { type: 'text', text: 'Drag blocks to reorder them', styles: {} },
    ],
    children: [],
  },
  {
    id: 'welcome-li3',
    type: 'bulletListItem',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      { type: 'text', text: 'Select text for formatting options', styles: {} },
    ],
    children: [],
  },
  {
    id: 'welcome-p2',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [
      { type: 'text', text: 'Your notes persist across sessions automatically.', styles: { italic: true } },
    ],
    children: [],
  },
] as unknown as Block[];

// ============================================================================
// Editor Component
// ============================================================================

export default function ScratchpadEditor() {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const editor = useCreateBlockNote({
    initialContent: loadContent() ?? DEFAULT_CONTENT,
  });

  // Debounced save on change
  const handleChange = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(editor.document as unknown as Block[]);
    }, 300);
  }, [editor]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return (
    <div className="scratchpad-editor h-full overflow-y-auto">
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme="light"
      />
    </div>
  );
}
