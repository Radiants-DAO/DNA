"use client";

import { useEffect, useState } from "react";
import type { PropDef, RenderMode } from "./types";

const SKIP_TYPES = new Set(["function", "array", "object"]);

const CONTROLLED_UNCONTROLLED_PAIRS: Record<string, string> = {
  checked: "defaultChecked",
  pressed: "defaultPressed",
  open: "defaultOpen",
  value: "defaultValue",
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
        value ? "bg-main" : "bg-line"
      }`}
      title={`${name}: ${value}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 block h-3 w-3 rounded-full bg-page transition-transform ${
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
  value: string | number;
  values: Array<string | number>;
  onChange: (name: string, value: string | number) => void;
}) {
  const selectedIndex = values.findIndex((optionValue) =>
    Object.is(optionValue, value),
  );
  const fallbackIndex = values.findIndex(
    (optionValue) => String(optionValue) === String(value),
  );
  const resolvedIndex =
    selectedIndex >= 0 ? selectedIndex : fallbackIndex >= 0 ? fallbackIndex : 0;

  return (
    <select
      value={String(resolvedIndex)}
      onChange={(event) => onChange(name, values[Number(event.target.value)] ?? values[0])}
      className="w-full cursor-pointer rounded-xs border border-line bg-page px-1.5 py-0.5 font-mono text-[10px] text-main outline-none focus:border-main"
    >
      {values.map((optionValue, index) => {
        const option = String(optionValue);
        return (
          <option key={`${option}-${index}`} value={String(index)} className="bg-page text-main">
            {option}
          </option>
        );
      })}
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
        {controllable.map(([name, prop]) => {
          const enumValues = getEnumValues(prop);

          return (
            <div key={name} className="flex flex-col gap-0.5">
              {prop.type === "boolean" ? (
                <div className="flex items-center justify-between gap-2">
                  <label className="font-mono text-[10px] text-mute">
                    {name}
                  </label>
                  <BooleanControl
                    name={name}
                    value={Boolean(values[name] ?? prop.default ?? false)}
                    onChange={onChange}
                  />
                </div>
              ) : (
                <>
                  <label className="font-mono text-[10px] text-mute">
                    {name}
                  </label>
                  {enumValues ? (
                    <EnumControl
                      name={name}
                      value={String(values[name] ?? prop.default ?? enumValues[0])}
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
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
