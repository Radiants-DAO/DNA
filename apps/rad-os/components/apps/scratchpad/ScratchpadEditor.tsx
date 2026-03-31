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

import {
  rdnaBlockSpecs,
  rdnaSlashMenuDescriptors,
} from '@rdna/radiants/blocknote';
import { applyRdnaIcons, RdnaSlashMenu } from './RdnaSlashMenu';
import { Icon } from '@rdna/radiants/icons/runtime';

// ============================================================================
// Schema — default blocks + all RDNA blocks from generated registry
// ============================================================================

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    ...rdnaBlockSpecs,
  },
});

// ============================================================================
// Slash menu items — defaults + RDNA components from generated descriptors
// ============================================================================

type AnyBNEditor = Parameters<typeof getDefaultReactSlashMenuItems>[0];

function getSlashMenuItems(
  editor: AnyBNEditor,
): DefaultReactSuggestionItem[] {
  const defaults = getDefaultReactSlashMenuItems(editor);

  const rdnaItems: DefaultReactSuggestionItem[] = rdnaSlashMenuDescriptors.map(
    (desc) => ({
      title: desc.title,
      subtext: desc.subtext,
      aliases: desc.aliases,
      group: desc.group,
      icon: <Icon name={desc.icon} /> as React.JSX.Element,
      onItemClick: () => {
        (insertOrUpdateBlockForSlashMenu as Function)(editor, {
          type: desc.type,
          props: desc.defaultProps,
        });
      },
    }),
  );

  return applyRdnaIcons([...defaults, ...rdnaItems]);
}

// ============================================================================
// Props
// ============================================================================

interface ScratchpadEditorProps {
  initialContent: unknown[];
  onSave: (content: unknown[]) => void;
}

// ============================================================================
// Editor Component
// ============================================================================

export default function ScratchpadEditor({
  initialContent,
  onSave,
}: ScratchpadEditorProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const editor = useCreateBlockNote({
    schema,
    initialContent: initialContent.length > 0 ? (initialContent as any) : undefined,
  });

  // Debounced save
  const handleChange = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onSave(editor.document as unknown as unknown[]);
    }, 300);
  }, [editor, onSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const getItems = useMemo(
    () => async (query: string) =>
      filterSuggestionItems(
        getSlashMenuItems(editor as unknown as AnyBNEditor),
        query,
      ),
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
