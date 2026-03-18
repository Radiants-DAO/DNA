"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { ManifestProp } from "../../../generated/registry";

// ---------------------------------------------------------------------------
// Prop type → skip list
// ---------------------------------------------------------------------------

const SKIP_TYPES = new Set(["function", "array", "object"]);

/**
 * Controlled props to skip when their uncontrolled counterpart exists.
 * e.g. skip `checked` when `defaultChecked` is in the schema.
 */
const CONTROLLED_UNCONTROLLED_PAIRS: Record<string, string> = {
  checked: "defaultChecked",
  pressed: "defaultPressed",
  open: "defaultOpen",
  value: "defaultValue",
};

/** Normalise the two enum schema patterns into a single values array */
function getEnumValues(prop: ManifestProp): string[] | undefined {
  if (prop.type === "enum" && prop.values) return prop.values;
  // Toggle/ToggleGroup pattern: type:"string" with an `enum` key
  if (prop.type === "string" && (prop as Record<string, unknown>).enum) {
    return (prop as Record<string, unknown>).enum as string[];
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Individual controls
// ---------------------------------------------------------------------------

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
    <button
      type="button"
      onClick={() => onChange(name, !value)}
      className={`relative h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors ${
        value
          ? "bg-[rgba(254,248,226,0.5)]"
          : "bg-[rgba(254,248,226,0.12)]"
      }`}
      title={`${name}: ${value}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 block h-3 w-3 rounded-full bg-[#FEF8E2] transition-transform ${
          value ? "translate-x-3" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function EnumControl({
  name,
  value,
  values,
  onChange,
}: {
  name: string;
  value: string;
  values: string[];
  onChange: (name: string, value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      className="w-full cursor-pointer rounded-xs border border-[rgba(254,248,226,0.1)] bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-[#FEF8E2] outline-none focus:border-[rgba(254,248,226,0.3)]"
    >
      {values.map((v) => (
        <option key={v} value={v} className="bg-[#0F0E0C]">
          {v}
        </option>
      ))}
    </select>
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
      onChange={(e) => onChange(name, e.target.value)}
      placeholder={name}
      className="w-full rounded-xs border border-[rgba(254,248,226,0.1)] bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-[#FEF8E2] outline-none placeholder:text-[rgba(254,248,226,0.2)] focus:border-[rgba(254,248,226,0.3)]"
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
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(name, Number(e.target.value))}
      className="w-full rounded-xs border border-[rgba(254,248,226,0.1)] bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-[#FEF8E2] outline-none focus:border-[rgba(254,248,226,0.3)]"
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
      onChange={(e) => onChange(name, e.target.value)}
      placeholder={name}
      rows={2}
      className="w-full resize-none rounded-xs border border-[rgba(254,248,226,0.1)] bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-[#FEF8E2] outline-none placeholder:text-[rgba(254,248,226,0.2)] focus:border-[rgba(254,248,226,0.3)]"
    />
  );
}

// ---------------------------------------------------------------------------
// PropsPanel
// ---------------------------------------------------------------------------

interface PropsPanelProps {
  manifestProps: Record<string, ManifestProp>;
  propValues: Record<string, unknown>;
  onPropChange: (name: string, value: unknown) => void;
  onReset: () => void;
}

export function PropsPanel({
  manifestProps,
  propValues,
  onPropChange,
  onReset,
}: PropsPanelProps) {
  // Filter to controllable props, skipping controlled props when uncontrolled exists
  const controllable = Object.entries(manifestProps).filter(
    ([name, prop]) => {
      if (SKIP_TYPES.has(prop.type ?? "")) return false;
      const uncontrolled = CONTROLLED_UNCONTROLLED_PAIRS[name];
      if (uncontrolled && uncontrolled in manifestProps) return false;
      return true;
    },
  );

  if (controllable.length === 0) {
    return (
      <div className="px-2 py-3">
        <span className="font-mono text-[10px] text-[rgba(254,248,226,0.3)]">
          No controllable props
        </span>
      </div>
    );
  }

  return (
    <div className="nodrag nopan flex flex-col gap-0 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(254,248,226,0.1)] px-2 py-1.5">
        <span className="font-mono text-[9px] uppercase tracking-wide text-[rgba(254,248,226,0.4)]">
          Props
        </span>
        <button
          type="button"
          onClick={onReset}
          className="cursor-pointer font-mono text-[9px] text-[rgba(254,248,226,0.3)] transition-colors hover:text-[#FEF8E2]"
          title="Reset to defaults"
        >
          reset
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-1.5 px-2 py-2">
        {controllable.map(([name, prop]) => {
          const enumValues = getEnumValues(prop);

          return (
            <div key={name} className="flex flex-col gap-0.5">
              {/* Label row — for booleans, put toggle inline */}
              {prop.type === "boolean" ? (
                <div className="flex items-center justify-between gap-2">
                  <label className="font-mono text-[10px] text-[rgba(254,248,226,0.5)]">
                    {name}
                  </label>
                  <BooleanControl
                    name={name}
                    value={Boolean(propValues[name] ?? prop.default ?? false)}
                    onChange={onPropChange}
                  />
                </div>
              ) : (
                <>
                  <label className="font-mono text-[10px] text-[rgba(254,248,226,0.5)]">
                    {name}
                  </label>
                  {enumValues ? (
                    <EnumControl
                      name={name}
                      value={String(propValues[name] ?? prop.default ?? enumValues[0])}
                      values={enumValues}
                      onChange={onPropChange}
                    />
                  ) : prop.type === "number" ? (
                    <NumberControl
                      name={name}
                      value={Number(propValues[name] ?? prop.default ?? 0)}
                      onChange={onPropChange}
                    />
                  ) : prop.type === "ReactNode" ? (
                    <ReactNodeControl
                      name={name}
                      value={String(propValues[name] ?? prop.default ?? "")}
                      onChange={onPropChange}
                    />
                  ) : (
                    /* Default: string input */
                    <StringControl
                      name={name}
                      value={String(propValues[name] ?? prop.default ?? "")}
                      onChange={onPropChange}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
