'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
} from '@blocknote/core';
import type { DefaultReactSuggestionItem } from '@blocknote/react';

import '@blocknote/mantine/style.css';
import './scratchpad-theme.css';

import { alertBlock } from './rdna-blocks';
import { applyRdnaIcons, RdnaSlashMenu } from './RdnaSlashMenu';
import { Icon } from '@rdna/radiants/icons/runtime';

// ============================================================================
// Schema — default blocks + RDNA Alert
// ============================================================================

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    alert: alertBlock,
  },
});

// ============================================================================
// Persistence
// ============================================================================

const STORAGE_KEY = 'rados-scratchpad';

function loadContent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Corrupted — start fresh
  }
  return undefined;
}

// ============================================================================
// Custom slash menu items (defaults + RDNA Alert)
// ============================================================================

function getSlashMenuItems(
  editor: typeof schema.BlockNoteEditor.prototype,
): DefaultReactSuggestionItem[] {
  const defaults = getDefaultReactSlashMenuItems(editor);

  const alertItem: DefaultReactSuggestionItem = {
    title: 'Alert',
    subtext: 'RDNA alert callout',
    aliases: ['alert', 'callout', 'info', 'warning'],
    group: 'RDNA',
    icon: <Icon name="comments-blank" />,
    onItemClick: () => {
      insertOrUpdateBlockForSlashMenu(editor, {
        type: 'alert',
        props: { variant: 'info' },
      });
    },
  };

  return applyRdnaIcons([...defaults, alertItem]);
}

// ============================================================================
// Editor Component
// ============================================================================

export default function ScratchpadEditor() {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const editor = useCreateBlockNote({
    schema,
    initialContent: loadContent(),
  });

  // Debounced save
  const handleChange = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(editor.document));
    }, 300);
  }, [editor]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Memoized getItems for the slash menu
  const getItems = useMemo(
    () => async (query: string) =>
      filterSuggestionItems(getSlashMenuItems(editor), query),
    [editor],
  );

  return (
    <div className="scratchpad-editor h-full overflow-y-auto">
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme="light"
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={getItems}
          suggestionMenuComponent={RdnaSlashMenu}
        />
      </BlockNoteView>
    </div>
  );
}
