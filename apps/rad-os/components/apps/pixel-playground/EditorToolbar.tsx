'use client';

import { type MutableRefObject } from 'react';
import { type DottingRef, useDotting } from '@/lib/dotting';
import { Button, Tooltip, Switch } from '@rdna/radiants/components/core';

interface EditorToolbarProps {
  dottingRef: MutableRefObject<DottingRef | null>;
  isGridVisible: boolean;
  onGridToggle: (visible: boolean) => void;
}

export function EditorToolbar({
  dottingRef,
  isGridVisible,
  onGridToggle,
}: EditorToolbarProps) {
  const { undo, redo, clear } = useDotting(dottingRef);

  return (
    <div className="h-full flex items-center gap-1 px-2">
      <Tooltip content="Undo" position="top">
        <Button
          mode="text"
          size="sm"
          iconOnly
          icon="seek-back"
          aria-label="Undo"
          onClick={() => undo()}
        />
      </Tooltip>
      <Tooltip content="Redo" position="top">
        <Button
          mode="text"
          size="sm"
          iconOnly
          icon="go-forward"
          aria-label="Redo"
          onClick={() => redo()}
        />
      </Tooltip>

      <span aria-hidden className="self-stretch w-px bg-rule mx-1" />

      <div className="flex items-center gap-1.5">
        <span className="font-joystix text-xs text-sub uppercase select-none">Grid</span>
        <Switch
          checked={isGridVisible}
          onChange={() => onGridToggle(!isGridVisible)}
          size="sm"
        />
      </div>

      <span aria-hidden className="self-stretch w-px bg-rule mx-1" />

      <Tooltip content="Clear canvas" position="top">
        <Button
          mode="text"
          size="sm"
          iconOnly
          icon="trash"
          aria-label="Clear canvas"
          onClick={() => clear()}
        />
      </Tooltip>
    </div>
  );
}
