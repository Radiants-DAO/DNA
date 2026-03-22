import { useMemo, useState } from "react";
import type { RegistryMetadataEntry } from "./types";

export function useShowcaseProps(
  entry: Pick<RegistryMetadataEntry, "defaultProps">,
) {
  const [overrides, setOverrides] = useState<Record<string, unknown>>({});
  const props = { ...entry.defaultProps, ...overrides };

  const remountKey = useMemo(() => {
    const defaultEntries = Object.entries(overrides).filter(([name]) =>
      name.startsWith("default"),
    );

    return defaultEntries.length > 0
      ? JSON.stringify(defaultEntries)
      : "stable";
  }, [overrides]);

  return {
    props,
    overrides,
    remountKey,
    setPropValue: (name: string, value: unknown) =>
      setOverrides((current) => ({ ...current, [name]: value })),
    resetProps: () => setOverrides({}),
  };
}
