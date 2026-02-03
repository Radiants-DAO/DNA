# Dead Code Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Delete orphaned wizardSlice and all dead type definitions left behind by previously deleted slices (targetProjectSlice, themeSlice, smartAnnotateSlice).

**Architecture:** Pure deletion — no new code. Three deleted slices left orphaned type definitions in `types.ts` (lines 224–303). One file (`wizardSlice.ts`) was never wired into the store. Remove all of it.

**Tech Stack:** TypeScript, Zustand

---

### Task 1: Delete wizardSlice.ts

**Files:**
- Delete: `app/stores/slices/wizardSlice.ts`

**Step 1: Verify no imports exist**

Run: `grep -r "wizardSlice\|WizardSlice\|createWizardSlice\|wizardActive\|wizardStep\|startWizard\|closeWizard\|wizardProject\|wizardLoading\|wizardError\|installProgress\|installComplete\|configConfirmed\|serverConnecting\|serverConnected\|resetWizardState\|setWizardStep\|setWizardProject\|setWizardError\|setWizardLoading\|addInstallProgress\|setInstallComplete\|setConfigConfirmed\|setServerConnecting\|setServerConnected\|nextStep\|prevStep" app/ --include="*.ts" --include="*.tsx" -l`

Expected: Only `app/stores/slices/wizardSlice.ts` itself. If ANY other file appears, investigate before deleting.

**Step 2: Delete the file**

```bash
rm app/stores/slices/wizardSlice.ts
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors introduced.

**Step 4: Commit**

```bash
git add app/stores/slices/wizardSlice.ts
git commit -m "chore: delete orphaned wizardSlice (never wired to store)"
```

---

### Task 2: Delete dead type definitions from types.ts

Six interfaces in `app/stores/types.ts` lines 224–303 belong to deleted slices. None are referenced anywhere in the codebase.

**Files:**
- Modify: `app/stores/types.ts` (lines 224–303)

**Step 1: Verify no imports of dead types exist**

Run: `grep -r "TargetProject\|TargetProjectSlice\|HealthResponse\|DiscoveredTheme\|DiscoveredApp\|ThemeSlice" app/ --include="*.ts" --include="*.tsx" -l`

Expected: Only `app/stores/types.ts` itself. If any other file appears, investigate before deleting.

**Step 2: Delete the dead type blocks**

Remove these exact lines from `app/stores/types.ts`:

```
// ============================================================================
// Target Project (external dev servers)
// ============================================================================

export interface TargetProject {
  name: string;
  url: string;
  port: number;
  status: "online" | "offline" | "checking";
}

export interface TargetProjectSlice {
  targetProjects: TargetProject[];
  activeTarget: TargetProject | null;
  isScanning: boolean;

  scanForProjects: () => Promise<void>;
  setActiveTarget: (target: TargetProject | null) => void;
  addTargetProject: (project: TargetProject) => void;
  removeTargetProject: (url: string) => void;
}

// ============================================================================
// Theme Discovery
// ============================================================================

export interface HealthResponse {
  ok: true;
  version: string;
  timestamp: number;
  theme?: {
    name: string;
    displayName: string;
    root: string;
  };
  app?: {
    name: string;
    displayName: string;
    path: string;
  };
  apps?: Array<{
    name: string;
    displayName: string;
    port: number;
  }>;
  project?: string;
}

export interface DiscoveredTheme {
  name: string;
  displayName: string;
  root: string;
  apps: DiscoveredApp[];
  isLegacy: boolean;
}

export interface DiscoveredApp {
  name: string;
  displayName: string;
  port: number;
  url: string;
  status: "online" | "offline" | "checking";
  bridgeVersion?: string;
}

export interface ThemeSlice {
  discoveredThemes: DiscoveredTheme[];
  activeTheme: DiscoveredTheme | null;
  activeApp: DiscoveredApp | null;
  isThemeScanning: boolean;
  lastScanAt: number | null;
  scanError: string | null;

  scanForThemes: () => Promise<void>;
  setActiveTheme: (theme: DiscoveredTheme | null) => void;
  setActiveApp: (app: DiscoveredApp | null) => void;
  checkAppHealth: (app: DiscoveredApp) => Promise<DiscoveredApp>;
  refreshActiveApp: () => Promise<void>;
  getAppByPort: (port: number) => DiscoveredApp | null;
}
```

That's everything from the `// Target Project` section header through the end of `ThemeSlice`.

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors.

**Step 4: Commit**

```bash
git add app/stores/types.ts
git commit -m "chore: remove dead type defs (TargetProject, ThemeSlice, DiscoveredTheme)"
```

---

### Task 3: Final verification

**Step 1: Grep for any remaining dead references**

```bash
grep -r "smartAnnotate\|SmartAnnotate\|targetProject\|TargetProject\|themeSlice\|ThemeSlice\|wizardSlice\|WizardSlice\|DiscoveredTheme\|DiscoveredApp\|HealthResponse" app/ --include="*.ts" --include="*.tsx"
```

Expected: Zero matches. If anything remains, delete it.

**Step 2: Verify app builds**

Run: `npx tsc --noEmit`
Expected: Clean.

**Step 3: Squash or leave as-is**

Two clean commits. Done.

---

## Summary

| Action | File | Lines removed |
|--------|------|---------------|
| Delete file | `app/stores/slices/wizardSlice.ts` | 127 |
| Delete types | `app/stores/types.ts` lines 224–303 | ~80 |
| **Total** | | **~207 lines** |
