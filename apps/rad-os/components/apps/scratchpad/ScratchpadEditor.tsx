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

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    ...rdnaBlockSpecs,
  },
});

const validBlockTypes = new Set(Object.keys(schema.blockSpecs));

function sanitizeContent(raw: unknown[]): unknown[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) {
    return undefined;
  }

  const clean = raw.filter(
    (block: any) =>
      block &&
      typeof block === 'object' &&
      typeof block.type === 'string' &&
      validBlockTypes.has(block.type),
  );

  return clean.length > 0 ? clean : undefined;
}

type AnyBNEditor = Parameters<typeof getDefaultReactSlashMenuItems>[0];

function getSlashMenuItems(editor: AnyBNEditor): DefaultReactSuggestionItem[] {
  const defaults = getDefaultReactSlashMenuItems(editor);

  const rdnaItems: DefaultReactSuggestionItem[] =
    rdnaSlashMenuDescriptors.map((descriptor) => ({
      title: descriptor.title,
      subtext: descriptor.subtext,
      aliases: descriptor.aliases,
      group: descriptor.group,
      icon: <Icon name={descriptor.icon} /> as React.JSX.Element,
      onItemClick: () => {
        (insertOrUpdateBlockForSlashMenu as Function)(editor, {
          type: descriptor.type,
          props: descriptor.defaultProps,
        });
      },
    }));

  return applyRdnaIcons([...defaults, ...rdnaItems]);
}

interface ScratchpadEditorProps {
  initialContent: unknown[];
  onSave: (content: unknown[]) => void;
}

export default function ScratchpadEditor({
  initialContent,
  onSave,
}: ScratchpadEditorProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const safeContent = sanitizeContent(initialContent);

  const editor = useCreateBlockNote({
    schema,
    initialContent: safeContent as any,
  });

  const handleChange = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onSave(editor.document as unknown as unknown[]);
    }, 300);
  }, [editor, onSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
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
