import type { ForcedState, PreviewState } from "./types";

export type ActivePreviewState = "default" | ForcedState;

interface PreviewStateResolution {
  wrapperState: ForcedState | undefined;
  propOverrides: Record<string, unknown>;
}

export function getPreviewStateNames(states?: readonly PreviewState[]): ForcedState[] {
  return (states ?? []).map((state) => state.name);
}

export function resolvePreviewState(
  state: ActivePreviewState,
  states?: readonly PreviewState[],
): PreviewStateResolution {
  if (state === "default") {
    return { wrapperState: undefined, propOverrides: {} };
  }

  const spec = states?.find((candidate) => candidate.name === state);
  if (!spec || spec.driver === "wrapper") {
    return { wrapperState: state, propOverrides: {} };
  }

  if (!spec.prop) {
    return { wrapperState: undefined, propOverrides: {} };
  }

  return {
    wrapperState: undefined,
    propOverrides: {
      [spec.prop]: spec.value ?? true,
    },
  };
}
