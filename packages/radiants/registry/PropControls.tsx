"use client";

import { useEffect, useState } from "react";
import type { PropDef, RenderMode } from "./types";
import { Toggle } from "../components/core/Toggle/Toggle";
import { ToggleGroup } from "../components/core/ToggleGroup/ToggleGroup";

const SKIP_TYPES = new Set(["function", "array", "object"]);

const CONTROLLED_UNCONTROLLED_PAIRS: Record<string, string> = {
  checked: "defaultChecked",
  pressed: "defaultPressed",
  open: "defaultOpen",
  value: "defaultValue",
};

/**
 * Known semantic color values → CSS custom property for swatch rendering.
 * A prop is considered "color-like" when the majority of its enum values
 * appear in this map.
 */
const SEMANTIC_COLORS: Record<string, string> = {
  accent: "var(--color-accent)",
  danger: "var(--color-status-error)",
  error: "var(--color-status-error)",
  success: "var(--color-status-success)",
  warning: "var(--color-status-warning)",
  info: "var(--color-status-info)",
  neutral: "var(--color-line)",
  cream: "var(--color-page)",
  white: "var(--color-inv)",
  tinted: "var(--color-tinted)",
};

export interface PropControlsProps {
  props: Record<string, PropDef>;
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  onReset: () => void;
  controlledProps?: string[];
  renderMode?: RenderMode;
  className?: string;
}

function getEnumValues(prop: PropDef): Array<string | number> | undefined {
  if (prop.options?.length) return prop.options;
  if (prop.values?.length) return prop.values;

  const legacyEnum = (prop as PropDef & { enum?: Array<string | number> }).enum;
  if (legacyEnum?.length) return legacyEnum;

  return undefined;
}

function shouldSkipProp(prop: PropDef): boolean {
  const type = prop.type ?? "";
  return SKIP_TYPES.has(type) || type.endsWith("[]") || type.includes("=>");
}

function isColorLikeEnum(values: Array<string | number>): boolean {
  const matches = values.filter(
    (v) => typeof v === "string" && v in SEMANTIC_COLORS,
  ).length;
  return matches > values.length / 2;
}

export function getControllableProps({
  props,
  controlledProps,
  renderMode,
}: Pick<PropControlsProps, "props" | "controlledProps" | "renderMode">): Array<
  [string, PropDef]
> {
  return Object.entries(props).filter(([name, prop]) => {
    if (shouldSkipProp(prop)) return false;

    const uncontrolled = CONTROLLED_UNCONTROLLED_PAIRS[name];
    if (uncontrolled && uncontrolled in props) return false;

    if (
      renderMode === "custom" &&
      controlledProps &&
      !controlledProps.includes(name)
    ) {
      return false;
    }

    return true;
  });
}

// ── Controls ──────────────────────────────────────────────────────────────

function BooleanControl({
  name,
  value,
  onChange,
}: {
  name: string;
  value: boolean;
  onChange: (name: string, value: boolean) => void;
}) {
  return (
    <Toggle
      pressed={value}
      onPressedChange={(pressed) => onChange(name, pressed)}
      size="sm"
      compact
      quiet
    >
      {name}
    </Toggle>
  );
}

function EnumControl({
  name,
  value,
  values,
  onChange,
}: {
  name: string;
  value: string | number;
  values: Array<string | number>;
  onChange: (name: string, value: string | number) => void;
}) {
  const colorLike = isColorLikeEnum(values);
  const hasNumeric = values.some((v) => typeof v === "number");

  return (
    <ToggleGroup
      value={[String(value)]}
      onValueChange={(next) => {
        if (next.length === 0) return;
        const raw = next[0];
        onChange(name, hasNumeric && !Number.isNaN(Number(raw)) ? Number(raw) : raw);
      }}
      size="sm"
    >
      {values.map((optionValue) => {
        const label = String(optionValue);
        const colorVar =
          colorLike && typeof optionValue === "string"
            ? SEMANTIC_COLORS[optionValue]
            : undefined;

        return (
          <ToggleGroup.Item key={label} value={label} aria-label={label}>
            {colorVar && (
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-line"
                style={{ backgroundColor: colorVar }}
              />
            )}
            {label}
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup>
  );
}

function StringControl({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
      placeholder={name}
      className="w-full rounded-xs border border-line bg-page px-1.5 py-0.5 font-mono text-[10px] text-main outline-none placeholder:text-mute focus:border-main"
    />
  );
}

function NumberControl({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (name: string, value: number) => void;
}) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  return (
    <input
      type="number"
      value={raw}
      onChange={(event) => {
        setRaw(event.target.value);
        const nextValue = Number(event.target.value);

        if (event.target.value !== "" && !Number.isNaN(nextValue)) {
          onChange(name, nextValue);
        }
      }}
      onBlur={() => setRaw(String(value))}
      className="w-full rounded-xs border border-line bg-page px-1.5 py-0.5 font-mono text-[10px] text-main outline-none focus:border-main"
    />
  );
}

function ReactNodeControl({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
      placeholder={name}
      rows={2}
      className="w-full resize-none rounded-xs border border-line bg-page px-1.5 py-0.5 font-mono text-[10px] text-main outline-none placeholder:text-mute focus:border-main"
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export function PropControls({
  props,
  values,
  onChange,
  onReset,
  controlledProps,
  renderMode,
  className,
}: PropControlsProps) {
  const controllable = getControllableProps({
    props,
    controlledProps,
    renderMode,
  });

  if (controllable.length === 0) {
    return (
      <div className="px-2 py-3">
        <span className="font-mono text-[10px] text-mute">
          No controllable props
        </span>
      </div>
    );
  }

  return (
    <div
      className={[
        "nodrag nopan flex flex-col gap-0 overflow-y-auto bg-page text-main",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center justify-between border-b border-line px-2 py-1.5">
        <span className="font-mono text-[9px] uppercase tracking-wide text-mute">
          Props
        </span>
        <button
          type="button"
          onClick={onReset}
          className="cursor-pointer font-mono text-[9px] text-mute transition-colors hover:text-main"
          title="Reset to defaults"
        >
          reset
        </button>
      </div>

      <div className="flex flex-col gap-1.5 px-2 py-2">
        {/* Enum + string + number controls */}
        {controllable
          .filter(([, prop]) => prop.type !== "boolean")
          .map(([name, prop]) => {
            const enumValues = getEnumValues(prop);
            return (
              <div key={name} className="flex flex-col gap-0.5">
                <label className="font-mono text-[10px] text-mute">
                  {name}
                </label>
                {enumValues ? (
                  <EnumControl
                    name={name}
                    value={values[name] as string | number ?? prop.default ?? enumValues[0]}
                    values={enumValues}
                    onChange={onChange}
                  />
                ) : prop.type === "number" ? (
                  <NumberControl
                    name={name}
                    value={Number(values[name] ?? prop.default ?? 0)}
                    onChange={onChange}
                  />
                ) : prop.type === "node" || prop.type === "ReactNode" ? (
                  <ReactNodeControl
                    name={name}
                    value={String(values[name] ?? prop.default ?? "")}
                    onChange={onChange}
                  />
                ) : (
                  <StringControl
                    name={name}
                    value={String(values[name] ?? prop.default ?? "")}
                    onChange={onChange}
                  />
                )}
              </div>
            );
          })}

        {/* Boolean toggles — compact flow layout */}
        {controllable.some(([, prop]) => prop.type === "boolean") && (
          <div className="flex flex-wrap gap-1 pt-1">
            {controllable
              .filter(([, prop]) => prop.type === "boolean")
              .map(([name, prop]) => (
                <BooleanControl
                  key={name}
                  name={name}
                  value={Boolean(values[name] ?? prop.default ?? false)}
                  onChange={onChange}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
