'use client';

import { type BrushTool } from '@/lib/dotting';
import { ToggleGroup, Tooltip } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import { TOOL_DEFS } from './constants';

interface ToolPaletteProps {
  activeTool: BrushTool;
  onToolChange: (tool: BrushTool) => void;
}

export function ToolPalette({ activeTool, onToolChange }: ToolPaletteProps) {
  return (
    <ToggleGroup
      orientation="vertical"
      size="md"
      value={[activeTool]}
      onValueChange={(values) => {
        const next = values[values.length - 1];
        if (next != null) onToolChange(next as BrushTool);
      }}
    >
      {TOOL_DEFS.filter((def) => !def.hidden).map((def) => (
        <Tooltip key={def.tool} content={def.label} position="right">
          <ToggleGroup.Item
            value={def.tool}
            aria-label={def.label}
            iconOnly
            icon={def.large ? <Icon name={def.icon} large /> : def.icon}
          />
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
