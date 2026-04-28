'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, TextArea } from '@rdna/radiants/components/core';
import { useRadOSStore } from '@/store';
import type { MonolithGradientMapValues } from '@/store/slices/preferencesSlice';

type MonolithTunerValues = {
  portalBgScale: number;
  portalBgX: number;
  portalBgY: number;
  portalMidScale: number;
  portalMidX: number;
  portalMidY: number;
  portalOpacity: number;
  doorScale: number;
  logoScale: number;
  portalDark: number;
  portalTeal: number;
  portalSky: number;
  portalMist: number;
  portalCream: number;
  doorTeal: number;
  doorSky: number;
  doorMist: number;
  doorCream: number;
};

type TunerControl = {
  key: keyof MonolithTunerValues;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix?: string;
};

const STORAGE_KEY = 'monolith-theme-tuner';

const DEFAULT_VALUES: MonolithTunerValues = {
  portalBgScale: 1.12,
  portalBgX: 0,
  portalBgY: 0,
  portalMidScale: 1.44,
  portalMidX: 1.75,
  portalMidY: -3,
  portalOpacity: 1,
  doorScale: 0.86,
  logoScale: 1,
  portalDark: 1,
  portalTeal: 1,
  portalSky: 1,
  portalMist: 1,
  portalCream: 1,
  doorTeal: 1,
  doorSky: 1,
  doorMist: 1,
  doorCream: 1,
};

function toGradientMapValues(values: MonolithTunerValues): MonolithGradientMapValues {
  return {
    portalDark: values.portalDark,
    portalTeal: values.portalTeal,
    portalSky: values.portalSky,
    portalMist: values.portalMist,
    portalCream: values.portalCream,
    doorTeal: values.doorTeal,
    doorSky: values.doorSky,
    doorMist: values.doorMist,
    doorCream: values.doorCream,
  };
}

const POSITION_CONTROLS: TunerControl[] = [
  { key: 'portalBgScale', label: 'Outer portal scale', min: 0.5, max: 1.8, step: 0.01 },
  { key: 'portalBgX', label: 'Outer portal X', min: -20, max: 20, step: 0.25, suffix: 'vmin' },
  { key: 'portalBgY', label: 'Outer portal Y', min: -20, max: 20, step: 0.25, suffix: 'vmin' },
  { key: 'portalMidScale', label: 'Inner portal scale', min: 0.5, max: 1.8, step: 0.01 },
  { key: 'portalMidX', label: 'Inner portal X', min: -20, max: 20, step: 0.25, suffix: 'vmin' },
  { key: 'portalMidY', label: 'Inner portal Y', min: -20, max: 20, step: 0.25, suffix: 'vmin' },
  { key: 'portalOpacity', label: 'AVIF portal opacity', min: 0, max: 1, step: 0.01 },
  { key: 'doorScale', label: 'Door scale', min: 0.5, max: 1.8, step: 0.01 },
  { key: 'logoScale', label: 'Logo scale', min: 0.5, max: 1.8, step: 0.01 },
];

const GRADIENT_CONTROLS: TunerControl[] = [
  { key: 'portalDark', label: 'Portal deep teal stop', min: 0, max: 1.8, step: 0.01 },
  { key: 'portalTeal', label: 'Portal teal stop', min: 0, max: 1.8, step: 0.01 },
  { key: 'portalSky', label: 'Portal sky stop', min: 0, max: 1.8, step: 0.01 },
  { key: 'portalMist', label: 'Portal mist stop', min: 0, max: 1.8, step: 0.01 },
  { key: 'portalCream', label: 'Portal cream stop', min: 0, max: 1.8, step: 0.01 },
  { key: 'doorTeal', label: 'Door teal stop', min: 0, max: 1.8, step: 0.01 },
  { key: 'doorSky', label: 'Door sky stop', min: 0, max: 1.8, step: 0.01 },
  { key: 'doorMist', label: 'Door mist stop', min: 0, max: 1.8, step: 0.01 },
  { key: 'doorCream', label: 'Door cream stop', min: 0, max: 1.8, step: 0.01 },
];

const CSS_VAR_NAMES = {
  portalBgScale: '--monolith-portal-bg-scale',
  portalBgX: '--monolith-portal-bg-x',
  portalBgY: '--monolith-portal-bg-y',
  portalMidScale: '--monolith-portal-mid-scale',
  portalMidX: '--monolith-portal-mid-x',
  portalMidY: '--monolith-portal-mid-y',
  portalOpacity: '--monolith-portal-opacity',
  doorScale: '--monolith-door-scale',
  logoScale: '--monolith-logo-scale',
} as const satisfies Partial<Record<keyof MonolithTunerValues, string>>;

const GRADIENT_VAR_NAMES = {
  portalDark: '--monolith-map-portal-dark',
  portalTeal: '--monolith-map-portal-teal',
  portalSky: '--monolith-map-portal-sky',
  portalMist: '--monolith-map-portal-mist',
  portalCream: '--monolith-map-portal-cream',
  doorTeal: '--monolith-map-door-teal',
  doorSky: '--monolith-map-door-sky',
  doorMist: '--monolith-map-door-mist',
  doorCream: '--monolith-map-door-cream',
} as const satisfies Partial<Record<keyof MonolithTunerValues, string>>;

const COLORS = {
  dark: [0.063, 0.157, 0.173],
  teal: [0.380, 0.686, 0.741],
  sky: [0.584, 0.824, 0.902],
  mist: [0.812, 0.902, 0.894],
  cream: [0.980, 0.976, 0.957],
} as const;

function readStoredValues(): MonolithTunerValues {
  if (typeof window === 'undefined') return DEFAULT_VALUES;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_VALUES;
    return { ...DEFAULT_VALUES, ...JSON.parse(stored) } as MonolithTunerValues;
  } catch {
    return DEFAULT_VALUES;
  }
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function scaledColor(color: readonly number[], strength: number): number[] {
  return color.map((channel) => Math.min(1, channel * strength));
}

function channelTable(colors: number[][], channel: number): string {
  return colors.map((color) => formatNumber(color[channel])).join(' ');
}

function gradientTables(values: MonolithTunerValues) {
  const portal = [
    scaledColor(COLORS.dark, values.portalDark),
    scaledColor(COLORS.teal, values.portalTeal),
    scaledColor(COLORS.sky, values.portalSky),
    scaledColor(COLORS.mist, values.portalMist),
    scaledColor(COLORS.cream, values.portalCream),
  ];
  const door = [
    scaledColor(COLORS.teal, values.doorTeal),
    scaledColor(COLORS.sky, values.doorSky),
    scaledColor(COLORS.mist, values.doorMist),
    scaledColor(COLORS.cream, values.doorCream),
    scaledColor(COLORS.cream, values.doorCream),
  ];

  return {
    portalR: channelTable(portal, 0),
    portalG: channelTable(portal, 1),
    portalB: channelTable(portal, 2),
    doorR: channelTable(door, 0),
    doorG: channelTable(door, 1),
    doorB: channelTable(door, 2),
  };
}

function buildOutput(values: MonolithTunerValues): string {
  const css = Object.entries(CSS_VAR_NAMES)
    .map(([key, cssVar]) => `  ${cssVar}: ${formatNumber(values[key as keyof MonolithTunerValues])};`)
    .join('\n');
  const gradientCss = Object.entries(GRADIENT_VAR_NAMES)
    .map(([key, cssVar]) => `  ${cssVar}: ${formatNumber(values[key as keyof MonolithTunerValues])};`)
    .join('\n');
  const tables = gradientTables(values);

  return [
    '/* Paste positioning into packages/monolith/effects.css */',
    "[data-theme='monolith'] {",
    css,
    gradientCss,
    '}',
    '',
    '/* Paste tableValues into MonolithWallpaper.tsx */',
    `<feFuncR type="table" tableValues="${tables.portalR}" />`,
    `<feFuncG type="table" tableValues="${tables.portalG}" />`,
    `<feFuncB type="table" tableValues="${tables.portalB}" />`,
    '',
    `<feFuncR type="table" tableValues="${tables.doorR}" />`,
    `<feFuncG type="table" tableValues="${tables.doorG}" />`,
    `<feFuncB type="table" tableValues="${tables.doorB}" />`,
    '',
    '// JSON preset',
    JSON.stringify(values, null, 2),
  ].join('\n');
}

function ControlGroup({
  controls,
  values,
  onChange,
}: {
  controls: TunerControl[];
  values: MonolithTunerValues;
  onChange: (key: keyof MonolithTunerValues, next: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {controls.map((control) => {
        const value = values[control.key];
        return (
          <label key={control.key} className="flex flex-col gap-1">
            <span className="flex items-center justify-between gap-3 font-mondwest text-xs uppercase text-mute">
              <span>{control.label}</span>
              <span className="text-main">
                {formatNumber(value)}
                {control.suffix ?? ''}
              </span>
            </span>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={value}
              onChange={(event) => onChange(control.key, Number(event.currentTarget.value))}
              className="w-full accent-current"
            />
          </label>
        );
      })}
    </div>
  );
}

export function MonolithThemeTuner() {
  const theme = useRadOSStore((state) => state.theme);
  const setGradientMapValues = useRadOSStore((state) => state.setMonolithGradientMapValues);
  const [values, setValues] = useState<MonolithTunerValues>(() => readStoredValues());
  const [isOpen, setIsOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy');

  useEffect(() => {
    const root = document.documentElement;
    for (const key of Object.keys(CSS_VAR_NAMES) as Array<keyof typeof CSS_VAR_NAMES>) {
      root.style.setProperty(CSS_VAR_NAMES[key], formatNumber(values[key]));
    }
    for (const key of Object.keys(GRADIENT_VAR_NAMES) as Array<keyof typeof GRADIENT_VAR_NAMES>) {
      root.style.setProperty(GRADIENT_VAR_NAMES[key], formatNumber(values[key]));
    }
    setGradientMapValues(toGradientMapValues(values));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [setGradientMapValues, values]);

  const output = useMemo(() => buildOutput(values), [values]);

  if (theme !== 'monolith') return null;

  const handleChange = (key: keyof MonolithTunerValues, next: number) => {
    setValues((current) => ({ ...current, [key]: next }));
  };

  const handleReset = () => {
    setValues(DEFAULT_VALUES);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopyLabel('Copied');
    window.setTimeout(() => setCopyLabel('Copy'), 900);
  };

  return (
    <div className="fixed bottom-4 right-4 z-system w-[22rem] max-w-[calc(100vw-2rem)] pointer-events-auto">
      <Button size="sm" onClick={() => setIsOpen((current) => !current)}>
        MONOLITH TUNER
      </Button>
      {isOpen ? (
        <div className="mt-2 max-h-[calc(100vh-6rem)] overflow-auto bg-page p-3 text-main pixel-rounded-6 pixel-shadow-floating">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="font-joystix text-sm uppercase">Theme Knobs</div>
            <div className="flex gap-2">
              <Button size="xs" mode="flat" tone="neutral" onClick={handleReset}>Reset</Button>
              <Button size="xs" onClick={handleCopy}>{copyLabel}</Button>
            </div>
          </div>

          <div className="mb-2 font-mondwest text-xs uppercase text-mute">Positioning</div>
          <ControlGroup controls={POSITION_CONTROLS} values={values} onChange={handleChange} />

          <div className="mb-2 mt-4 font-mondwest text-xs uppercase text-mute">Light Gradient Map</div>
          <ControlGroup controls={GRADIENT_CONTROLS} values={values} onChange={handleChange} />

          <TextArea
            readOnly
            value={output}
            className="mt-3 h-52 resize-none font-mono text-xs"
            aria-label="Copyable Monolith theme tuning output"
          />
        </div>
      ) : null}
    </div>
  );
}
