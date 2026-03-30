'use client';
import { Button, Slider } from '@rdna/radiants/components/core';
import { AlignLeft, AlignCenter, AlignRight } from '@rdna/radiants/icons';
import { type FontEntry, type TemplateId, TEMPLATES } from './typography-data';

interface PlaygroundControlsProps {
  font: FontEntry;
  mode: 'light' | 'dark';
  onModeChange: (v: 'light' | 'dark') => void;
  activeTemplate: TemplateId;
  onTemplateChange: (v: TemplateId) => void;
  size: number;
  onSizeChange: (v: number) => void;
  leading: number;
  onLeadingChange: (v: number) => void;
  spacing: number;
  onSpacingChange: (v: number) => void;
  weight: number;
  onWeightChange: (v: number) => void;
  align: 'left' | 'center' | 'right';
  onAlignChange: (v: 'left' | 'center' | 'right') => void;
  glow: boolean;
  onGlowChange: (v: boolean) => void;
}

export function PlaygroundControls({
  font,
  mode,
  onModeChange,
  activeTemplate,
  onTemplateChange,
  size,
  onSizeChange,
  leading,
  onLeadingChange,
  spacing,
  onSpacingChange,
  weight,
  onWeightChange,
  align,
  onAlignChange,
  glow,
  onGlowChange,
}: PlaygroundControlsProps) {
  return (
    <div className="space-y-3">
      {/* Mode (flips light/dark on preview) */}
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-1">
          Mode
        </div>
        <div className="flex flex-wrap gap-1">
          <Button quiet={mode !== 'light'} size="sm" compact onClick={() => onModeChange('light')}>Sun</Button>
          <Button quiet={mode !== 'dark'} size="sm" compact onClick={() => onModeChange('dark')}>Moon</Button>
        </div>
      </div>

      {/* Template picker */}
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-1">
          Template
        </div>
        <div className="flex flex-wrap gap-1">
          {TEMPLATES.map((t) => (
            <Button
              key={t.id}
              quiet={activeTemplate !== t.id}
              size="sm"
              compact
              onClick={() => onTemplateChange(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Size */}
      <Slider
        label="Size"
        value={size}
        onChange={onSizeChange}
        min={8}
        max={120}
        step={1}
        size="sm"
        showValue
      />

      {/* Leading */}
      <Slider
        label="Leading"
        value={leading}
        onChange={onLeadingChange}
        min={5}
        max={20}
        step={1}
        size="sm"
        showValue
      />

      {/* Spacing */}
      <Slider
        label="Spacing"
        value={spacing}
        onChange={onSpacingChange}
        min={-50}
        max={100}
        step={1}
        size="sm"
        showValue
      />

      {/* Weight / Align / Glow — compact group */}
      <div className="space-y-2">
        <div>
          <div className="font-heading text-xs text-mute uppercase tracking-tight mb-1">
            Weight
          </div>
          <div className="flex flex-wrap gap-1">
            {font.weights.map((w) => (
              <Button
                key={w.value}
                quiet={weight !== w.value}
                size="sm"
                compact
                onClick={() => onWeightChange(w.value)}
              >
                {w.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="font-heading text-xs text-mute uppercase tracking-tight mb-1">
            Align
          </div>
          <div className="flex gap-1">
            <Button quiet={align !== 'left'} size="sm" compact iconOnly onClick={() => onAlignChange('left')} aria-label="Align left">
              <AlignLeft size={12} />
            </Button>
            <Button quiet={align !== 'center'} size="sm" compact iconOnly onClick={() => onAlignChange('center')} aria-label="Align center">
              <AlignCenter size={12} />
            </Button>
            <Button quiet={align !== 'right'} size="sm" compact iconOnly onClick={() => onAlignChange('right')} aria-label="Align right">
              <AlignRight size={12} />
            </Button>
          </div>
        </div>

        <div>
          <div className="font-heading text-xs text-mute uppercase tracking-tight mb-1">
            Glow
          </div>
          <div className="flex gap-1">
            <Button quiet={!glow} size="sm" compact onClick={() => onGlowChange(true)}>On</Button>
            <Button quiet={glow} size="sm" compact onClick={() => onGlowChange(false)}>Off</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
