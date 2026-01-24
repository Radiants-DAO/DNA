/**
 * CSS State Detection Utilities
 *
 * Detects existing CSS pseudo-state styles for elements by scanning
 * stylesheets and computing which states have style definitions.
 *
 * V1: Read-only detection, no creation of new state variants.
 */

/** Supported CSS pseudo-states for detection */
export type CSSPseudoState =
  | "default"
  | ":hover"
  | ":focus"
  | ":focus-visible"
  | ":active"
  | ":disabled"
  | ":checked"
  | ":first-child"
  | ":last-child"
  | "::before"
  | "::after";

/** State detection result for a single state */
export interface DetectedState {
  state: CSSPseudoState;
  hasStyles: boolean;
  /** Number of CSS rules/declarations found for this state */
  ruleCount: number;
  /** Sample properties found (first 3) */
  sampleProperties?: string[];
}

/** Complete state detection result for an element */
export interface StateDetectionResult {
  element: string;
  selector: string;
  states: DetectedState[];
}

/** All pseudo-states we scan for */
export const ALL_PSEUDO_STATES: CSSPseudoState[] = [
  "default",
  ":hover",
  ":focus",
  ":focus-visible",
  ":active",
  ":disabled",
  ":checked",
  ":first-child",
  ":last-child",
  "::before",
  "::after",
];

/** Common element states (subset shown in dropdown by default) */
export const COMMON_STATES: CSSPseudoState[] = [
  "default",
  ":hover",
  ":focus",
  ":focus-visible",
  ":active",
  ":disabled",
];

/** Pseudo-elements (::before, ::after) */
export const PSEUDO_ELEMENTS: CSSPseudoState[] = ["::before", "::after"];

/** Structural pseudo-classes */
export const STRUCTURAL_STATES: CSSPseudoState[] = [":first-child", ":last-child"];

/**
 * Check if a CSS selector contains a specific pseudo-state
 */
export function selectorContainsState(
  selector: string,
  state: CSSPseudoState
): boolean {
  if (state === "default") {
    // Default state - selector should NOT contain any pseudo-states
    const hasPseudo = ALL_PSEUDO_STATES.slice(1).some(
      (s) => selector.includes(s)
    );
    return !hasPseudo;
  }

  // For pseudo-elements (::before, ::after), match exactly
  if (state.startsWith("::")) {
    return selector.includes(state);
  }

  // For pseudo-classes, match the state (allowing for combinators after)
  // e.g., ":hover" should match ".btn:hover", ".btn:hover:focus", etc.
  const escapedState = state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escapedState}(?:[^a-zA-Z-]|$)`);
  return pattern.test(selector);
}

/**
 * Extract matching selectors for an element from a CSS rule
 * Returns selectors that would match the given element
 */
export function getMatchingSelectors(
  rule: CSSStyleRule,
  elementSelector: string
): string[] {
  const selectorText = rule.selectorText;
  const selectors = selectorText.split(",").map((s) => s.trim());

  // Simple matching: check if any selector starts with or contains the element selector
  // This is a simplified heuristic - real matching would use CSSOM
  const baseSelector = elementSelector.replace(/[>~+\s]+/g, " ").trim();
  const parts = baseSelector.split(" ");
  const lastPart = parts[parts.length - 1];

  return selectors.filter((sel) => {
    // Remove pseudo parts for base comparison
    const baseSel = sel.replace(/:[a-zA-Z-]+(\([^)]*\))?/g, "").replace(/::[a-zA-Z-]+/g, "").trim();
    const selParts = baseSel.split(/[>~+\s]+/).map((s) => s.trim()).filter(Boolean);
    const lastSelPart = selParts[selParts.length - 1];

    // Check if the last parts match (element/class comparison)
    return lastSelPart === lastPart || sel.includes(lastPart);
  });
}

/**
 * Detect existing CSS states for an element by scanning stylesheets
 *
 * @param element - DOM element to analyze (or null for mock data)
 * @param elementSelector - CSS selector for the element (e.g., ".button", "div.card")
 * @returns StateDetectionResult with detected states
 */
export function detectElementStates(
  element: Element | null,
  elementSelector: string
): StateDetectionResult {
  const result: StateDetectionResult = {
    element: element?.tagName.toLowerCase() ?? "unknown",
    selector: elementSelector,
    states: ALL_PSEUDO_STATES.map((state) => ({
      state,
      hasStyles: false,
      ruleCount: 0,
      sampleProperties: [],
    })),
  };

  // If no document available (SSR or mock), return empty detection
  if (typeof document === "undefined") {
    return result;
  }

  try {
    // Scan all stylesheets
    const styleSheets = Array.from(document.styleSheets);

    for (const sheet of styleSheets) {
      try {
        // Skip external stylesheets we can't access (CORS)
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) continue;

        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSStyleRule) {
            const matchingSelectors = getMatchingSelectors(rule, elementSelector);

            for (const selector of matchingSelectors) {
              // Check which state this selector belongs to
              for (const stateInfo of result.states) {
                if (selectorContainsState(selector, stateInfo.state)) {
                  stateInfo.hasStyles = true;
                  stateInfo.ruleCount++;

                  // Collect sample properties (up to 3)
                  if (stateInfo.sampleProperties && stateInfo.sampleProperties.length < 3) {
                    const style = rule.style;
                    for (let i = 0; i < Math.min(style.length, 3 - stateInfo.sampleProperties.length); i++) {
                      const prop = style[i];
                      if (!stateInfo.sampleProperties.includes(prop)) {
                        stateInfo.sampleProperties.push(prop);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch {
        // Skip stylesheets we can't access (CORS restrictions)
        continue;
      }
    }
  } catch {
    // If stylesheet scanning fails, return empty result
    console.warn("CSS state detection failed, returning default states");
  }

  return result;
}

/**
 * Get computed styles for a specific state using the :state() pseudo-class
 * Note: This is a simplified version - real implementation would need
 * the element to actually be in that state
 */
export function getStateStyles(
  element: Element | null,
  state: CSSPseudoState
): Record<string, string> | null {
  if (!element || typeof window === "undefined") {
    return null;
  }

  if (state === "default") {
    // For default state, return computed styles
    const computed = window.getComputedStyle(element);
    const styles: Record<string, string> = {};
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      styles[prop] = computed.getPropertyValue(prop);
    }
    return styles;
  }

  // For other states, we'd need the element to be in that state
  // In V1, we just return null and show a "view in browser" message
  return null;
}

/**
 * Check if a state is a pseudo-element (::before, ::after)
 */
export function isPseudoElement(state: CSSPseudoState): boolean {
  return state.startsWith("::");
}

/**
 * Check if a state is a structural pseudo-class (:first-child, :last-child)
 */
export function isStructuralState(state: CSSPseudoState): boolean {
  return STRUCTURAL_STATES.includes(state);
}

/**
 * Get display name for a state (without colon prefix for UI)
 */
export function getStateDisplayName(state: CSSPseudoState): string {
  if (state === "default") return "Default";
  if (state === ":focus-visible") return "Focus Visible";
  if (state === ":first-child") return "First Child";
  if (state === ":last-child") return "Last Child";
  // Remove : prefix and capitalize
  return state.replace(/^::?/, "").replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Mock state detection for demo/development
 * Returns simulated detection results
 */
export function getMockStateDetection(elementType: string): StateDetectionResult {
  // Simulate different elements having different states defined
  const mockStates: Record<string, CSSPseudoState[]> = {
    button: ["default", ":hover", ":focus", ":focus-visible", ":active", ":disabled"],
    a: ["default", ":hover", ":focus", ":visited" as CSSPseudoState],
    input: ["default", ":focus", ":focus-visible", ":disabled", ":checked"],
    div: ["default"],
    span: ["default"],
  };

  const statesWithStyles = mockStates[elementType] || ["default"];

  return {
    element: elementType,
    selector: `.${elementType}`,
    states: COMMON_STATES.map((state) => ({
      state,
      hasStyles: statesWithStyles.includes(state),
      ruleCount: statesWithStyles.includes(state) ? Math.floor(Math.random() * 5) + 1 : 0,
      sampleProperties: statesWithStyles.includes(state)
        ? ["background-color", "color", "border-color"].slice(0, Math.floor(Math.random() * 3) + 1)
        : [],
    })),
  };
}
