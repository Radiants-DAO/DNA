/**
 * Build a test matrix for visual QA from manifest props + contract fields.
 *
 * Reads:
 * - props (enum values, boolean flags)        → standard prop combos
 * - styleOwnership.themeOwned                  → data-attribute variant combos (Phase 2)
 * - pixelCorners, shadowSystem                 → QA flags (Phase 2)
 * - a11y.contrastRequirement                   → QA flags (Phase 2)
 * - states                                     → forced state combos
 *
 * Output: Array<{ label, props, dataAttributes, colorMode, state, qaFlags }>
 */

const MAX_MATRIX = 50;
const COLOR_MODES = ["light", "dark"];
const DEFAULT_STATES = ["default"];

/**
 * @param {object} component - Component manifest entry (props + optional contract fields)
 * @returns {Array<{label: string, props: Record<string, unknown>, dataAttributes: Record<string, string>, colorMode: string, state: string, qaFlags: string[]}>}
 */
export function buildTestMatrix(component) {
  const enumProps = extractEnumProps(component.props ?? {});
  const booleanProps = extractBooleanProps(component.props ?? {}, component.states);
  const forcedStates = [...DEFAULT_STATES, ...extractForcedStates(component.states)];
  const themeVariants = extractThemeVariants(component.styleOwnership);
  const qaFlags = deriveQaFlags(component);

  // Build base combos from enum cross-product
  let baseCombos = cartesian(enumProps);
  if (baseCombos.length === 0) baseCombos = [{}];

  // Booleans: add each boolean=true as a separate variant of the first
  // base combo, rather than cross-producting all booleans (which explodes).
  // This gives: all enum combos + one extra combo per boolean flag.
  let propCombos = [...baseCombos];
  if (booleanProps.length > 0) {
    const firstBase = baseCombos[0];
    for (const bp of booleanProps) {
      propCombos.push({ ...firstBase, [bp.key]: true });
    }
  }

  // Cross with theme variant dimension if present
  let combos;
  if (themeVariants.length > 0) {
    combos = [];
    for (const props of propCombos) {
      for (const variant of themeVariants) {
        combos.push({ props, dataAttributes: variant });
      }
    }
  } else {
    combos = propCombos.map((props) => ({ props, dataAttributes: {} }));
  }

  // Cross with color modes and forced states
  let matrix = [];
  for (const combo of combos) {
    for (const colorMode of COLOR_MODES) {
      for (const state of forcedStates) {
        matrix.push({
          label: buildLabel(combo.props, combo.dataAttributes, colorMode, state),
          props: combo.props,
          dataAttributes: combo.dataAttributes,
          colorMode,
          state,
          qaFlags,
        });
      }
    }
  }

  // Prune if too large
  if (matrix.length > MAX_MATRIX) {
    matrix = pruneMatrix(matrix, MAX_MATRIX);
  }

  return matrix;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract enum-type props as {key, values} arrays */
function extractEnumProps(props) {
  const dims = [];
  for (const [key, def] of Object.entries(props)) {
    if (def.type === "enum" && Array.isArray(def.values) && def.values.length > 0) {
      dims.push({ key, values: def.values });
    }
  }
  return dims;
}

/** Extract boolean-type props as {key, values: [true]} for additive mode */
function extractBooleanProps(props, states) {
  const stateManagedBooleanProps = extractStateManagedBooleanProps(props, states);
  const dims = [];
  for (const [key, def] of Object.entries(props)) {
    if (def.type === "boolean" && !stateManagedBooleanProps.has(key)) {
      dims.push({ key, values: [true] });
    }
  }
  return dims;
}

function extractStateManagedBooleanProps(props, states) {
  const propNames = new Set();
  if (!Array.isArray(states)) return propNames;

  for (const state of states) {
    if (
      typeof state === "object" &&
      state !== null &&
      typeof state.name === "string" &&
      props[state.name]?.type === "boolean"
    ) {
      propNames.add(state.name);
    }

    if (
      typeof state === "object" &&
      state !== null &&
      state.driver === "prop" &&
      typeof state.prop === "string" &&
      props[state.prop]?.type === "boolean"
    ) {
      propNames.add(state.prop);
    }
  }

  return propNames;
}

function extractForcedStates(states) {
  if (!Array.isArray(states)) return [];
  return states
    .map((state) => (typeof state === "string" ? state : state?.name))
    .filter((state) => typeof state === "string");
}

/** Extract theme-owned data-attribute variants from styleOwnership */
function extractThemeVariants(styleOwnership) {
  if (!Array.isArray(styleOwnership) || styleOwnership.length === 0) return [];

  const dims = styleOwnership
    .filter((so) => Array.isArray(so.themeOwned) && so.themeOwned.length > 0)
    .map((so) => ({
      attribute: so.attribute,
      values: so.themeOwned,
    }));

  if (dims.length === 0) return [];

  let results = [{}];
  for (const dim of dims) {
    const next = [];
    for (const existing of results) {
      for (const value of dim.values) {
        next.push({ ...existing, [dim.attribute]: value });
      }
    }
    results = next;
  }

  return results;
}

/** Derive QA flags from contract fields */
function deriveQaFlags(component) {
  const flags = [];
  if (component.pixelCorners) flags.push("pixel-corners");
  if (component.shadowSystem === "pixel") flags.push("pixel-shadow");
  if (component.a11y?.contrastRequirement) {
    flags.push(`contrast-${component.a11y.contrastRequirement}`);
  }
  return flags;
}

/** Cartesian product of dimensions [{key, values}] → array of prop objects */
function cartesian(dimensions) {
  if (dimensions.length === 0) return [];

  let results = [{}];
  for (const dim of dimensions) {
    const next = [];
    for (const existing of results) {
      for (const value of dim.values) {
        next.push({ ...existing, [dim.key]: value });
      }
    }
    results = next;
  }

  return results;
}

/** Build a human-readable label from combo properties */
function buildLabel(props, dataAttributes, colorMode, state) {
  const parts = [];

  for (const [key, value] of Object.entries(props)) {
    if (value === true) {
      parts.push(key);
    } else if (value !== false && value !== undefined) {
      parts.push(String(value));
    }
  }

  for (const value of Object.values(dataAttributes)) {
    parts.push(String(value));
  }

  parts.push(colorMode);
  if (state !== "default") parts.push(state);

  return parts.join("-");
}

/** Prune matrix to maxSize by sampling evenly across color modes and states */
function pruneMatrix(matrix, maxSize) {
  const sorted = [...matrix].sort((a, b) => {
    if (a.state === "default" && b.state !== "default") return -1;
    if (a.state !== "default" && b.state === "default") return 1;
    if (a.colorMode === "light" && b.colorMode === "dark") return -1;
    if (a.colorMode === "dark" && b.colorMode === "light") return 1;
    return 0;
  });

  return sorted.slice(0, maxSize);
}
