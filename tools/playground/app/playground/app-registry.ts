import type { RegistryEntry } from "./types";
import {
  ComposerShellDemo,
  AnnotationPinDemo,
  AnnotationDetailDemo,
  AnnotationBadgeDemo,
} from "./components/playground-ui-demos";

/**
 * App-local registry entries.
 *
 * Components here appear on the playground canvas alongside package components.
 * They use `packageName: "@rdna/radiants"` so they render in the same canvas
 * view — the `group` field separates them into their own section.
 */
export const appRegistry: RegistryEntry[] = [
  // ── Current (v1) ──────────────────────────────────────────────────────
  {
    id: "composershell",
    componentName: "ComposerShell",
    label: "ComposerShell.tsx",
    group: "Playground UI",
    packageName: "@rdna/radiants",
    Component: ComposerShellDemo as RegistryEntry["Component"],
    rawComponent: null,
    renderMode: "custom",
    defaultProps: {},
    props: {},
    sourcePath: "tools/playground/app/playground/components/ComposerShell.tsx",
  },
  {
    id: "annotationpin",
    componentName: "AnnotationPin",
    label: "AnnotationPin.tsx",
    group: "Playground UI",
    packageName: "@rdna/radiants",
    Component: AnnotationPinDemo as RegistryEntry["Component"],
    rawComponent: null,
    renderMode: "custom",
    defaultProps: {},
    props: {},
    sourcePath: "tools/playground/app/playground/components/AnnotationPin.tsx",
  },
  {
    id: "annotationbadge",
    componentName: "AnnotationBadge",
    label: "AnnotationBadge.tsx",
    group: "Playground UI",
    packageName: "@rdna/radiants",
    Component: AnnotationBadgeDemo as RegistryEntry["Component"],
    rawComponent: null,
    renderMode: "custom",
    defaultProps: {},
    props: {},
    sourcePath: "tools/playground/app/playground/components/AnnotationBadge.tsx",
  },
  {
    id: "annotationdetail",
    componentName: "AnnotationDetail",
    label: "AnnotationDetail.tsx",
    group: "Playground UI",
    packageName: "@rdna/radiants",
    Component: AnnotationDetailDemo as RegistryEntry["Component"],
    rawComponent: null,
    renderMode: "custom",
    defaultProps: {},
    props: {},
    sourcePath: "tools/playground/app/playground/components/AnnotationDetail.tsx",
  },
];
