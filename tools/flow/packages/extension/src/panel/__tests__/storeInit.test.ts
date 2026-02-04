import { describe, it, expect } from "vitest";
import { useAppStore } from "../stores/appStore";

describe("app store", () => {
  it("initializes with default editor mode", () => {
    expect(useAppStore.getState().editorMode).toBeDefined();
  });

  it("has mutation slice methods", () => {
    expect(useAppStore.getState().addMutationDiff).toBeDefined();
    expect(useAppStore.getState().mutationDiffs).toBeDefined();
  });

  it("can set editor mode", () => {
    const store = useAppStore.getState();
    store.setEditorMode("designer");
    expect(useAppStore.getState().editorMode).toBe("designer");
  });

  it("has tokens state", () => {
    expect(useAppStore.getState().tokens).toBeDefined();
  });
});
