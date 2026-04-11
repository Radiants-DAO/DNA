'use client';

import { type MutableRefObject } from 'react';
import { type DottingRef, useDotting } from '@/lib/dotting';
import { Button, Toolbar, Tooltip, Switch } from '@rdna/radiants/components/core';
import { pickRandomRadiant } from './radnom';

interface EditorToolbarProps {
  dottingRef: MutableRefObject<DottingRef | null>;
  isGridVisible: boolean;
  onGridToggle: (visible: boolean) => void;
}

export function EditorToolbar({ dottingRef, isGridVisible, onGridToggle }: EditorToolbarProps) {
  const { undo, redo, clear, downloadImage, setData } = useDotting(dottingRef);

  const handleRadnom = async () => {
    try {
      const data = await pickRandomRadiant();
      setData(data);
    } catch (err) {
      console.error('radnom failed', err);
    }
  };

  return (
    <div className="shrink-0 border-b border-rule">
      <Toolbar.Root>
        <Tooltip content="Undo" position="bottom">
          <Button
            mode="text"
            size="md"
            iconOnly
            icon="seek-back"
            aria-label="Undo"
            onClick={() => undo()}
          />
        </Tooltip>
        <Tooltip content="Redo" position="bottom">
          <Button
            mode="text"
            size="md"
            iconOnly
            icon="go-forward"
            aria-label="Redo"
            onClick={() => redo()}
          />
        </Tooltip>

        <Toolbar.Separator />

        <div className="flex items-center gap-1.5 px-1">
          <span className="font-joystix text-xs text-sub uppercase select-none">Grid</span>
          <Switch
            checked={isGridVisible}
            onChange={() => onGridToggle(!isGridVisible)}
            size="sm"
          />
        </div>

        <Toolbar.Separator />

        <Tooltip content="Clear canvas" position="bottom">
          <Button
            mode="text"
            size="md"
            iconOnly
            icon="trash"
            aria-label="Clear canvas"
            onClick={() => clear()}
          />
        </Tooltip>

        <div className="flex-1" />

        <Tooltip content="Radnom — random radiant" position="bottom">
          <Button
            mode="text"
            size="md"
            iconOnly
            icon="sparkles"
            aria-label="Radnom"
            onClick={handleRadnom}
          />
        </Tooltip>

        <Toolbar.Separator />

        <Tooltip content="Export PNG" position="bottom">
          <Button
            mode="text"
            size="md"
            iconOnly
            icon="download"
            aria-label="Export PNG"
            onClick={() => downloadImage({ type: 'png', isGridVisible: false })}
          />
        </Tooltip>
      </Toolbar.Root>
    </div>
  );
}
