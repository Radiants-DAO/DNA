'use client';

import React from 'react';
import { ToggleGroup, Slider } from '@rdna/radiants/components/core';
import { type FontEntry, type TemplateId, getTemplatesForMode } from './typography-data';

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
  const templates = getTemplatesForMode(mode);

  return (
    <div className="space-y-4">
      {/* Mode (filters templates) */}
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">
          Mode
        </div>
        <ToggleGroup
          value={[mode]}
          onValueChange={(v) =>
            v.length && onModeChange(v[0] as 'light' | 'dark')
          }
          size="sm"
        >
          <ToggleGroup.Item value="light">Sun</ToggleGroup.Item>
          <ToggleGroup.Item value="dark">Moon</ToggleGroup.Item>
        </ToggleGroup>
      </div>

      {/* Template picker */}
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">
          Template
        </div>
        <ToggleGroup
          value={[activeTemplate]}
          onValueChange={(v) =>
            v.length && onTemplateChange(v[0] as TemplateId)
          }
          size="sm"
        >
          {templates.map((t) => (
            <ToggleGroup.Item key={t.id} value={t.id}>
              {t.label}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup>
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
      <div>
        <Slider
          label="Leading"
          value={leading}
          onChange={onLeadingChange}
          min={5}
          max={20}
          step={1}
          size="sm"
        />
        <div className="text-right font-mono text-xs text-mute mt-0.5">
          {(leading / 10).toFixed(1)}
        </div>
      </div>

      {/* Spacing */}
      <div>
        <Slider
          label="Spacing"
          value={spacing}
          onChange={onSpacingChange}
          min={-50}
          max={100}
          step={1}
          size="sm"
        />
        <div className="text-right font-mono text-xs text-mute mt-0.5">
          {spacing}
        </div>
      </div>

      {/* Weight */}
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">
          Weight
        </div>
        <ToggleGroup
          value={[String(weight)]}
          onValueChange={(v) => v.length && onWeightChange(Number(v[0]))}
          size="sm"
        >
          {font.weights.map((w) => (
            <ToggleGroup.Item key={w.value} value={String(w.value)}>
              {w.label}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup>
      </div>

      {/* Align */}
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">
          Align
        </div>
        <ToggleGroup
          value={[align]}
          onValueChange={(v) =>
            v.length && onAlignChange(v[0] as 'left' | 'center' | 'right')
          }
          size="sm"
        >
          <ToggleGroup.Item value="left">L</ToggleGroup.Item>
          <ToggleGroup.Item value="center">C</ToggleGroup.Item>
          <ToggleGroup.Item value="right">R</ToggleGroup.Item>
        </ToggleGroup>
      </div>

      {/* Glow -- default on */}
      <div>
        <div className="font-heading text-xs text-mute uppercase tracking-tight mb-2">
          Glow
        </div>
        <ToggleGroup
          value={[glow ? 'on' : 'off']}
          onValueChange={(v) => v.length && onGlowChange(v[0] === 'on')}
          size="sm"
        >
          <ToggleGroup.Item value="on">On</ToggleGroup.Item>
          <ToggleGroup.Item value="off">Off</ToggleGroup.Item>
        </ToggleGroup>
      </div>
    </div>
  );
}
