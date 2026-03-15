import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadCanvasState, saveCanvasState, clearCanvasState } from "../storage";
import type { CanvasState } from "../../types";

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
};

// Provide window + localStorage in the test environment
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", localStorageMock);
  vi.clearAllMocks();
});

const VALID_STATE: CanvasState = {
  nodes: [
    {
      id: "__group__Actions",
      type: "section",
      position: { x: 80, y: 80 },
      data: {
        groupName: "Actions",
        entryIds: ["button"],
      },
    },
  ],
  edges: [],
  counter: 1,
};

describe("loadCanvasState", () => {
  it("returns null when no data is stored", () => {
    expect(loadCanvasState()).toBeNull();
  });

  it("returns parsed state when valid JSON is stored", () => {
    store["playground-canvas-state"] = JSON.stringify(VALID_STATE);
    const result = loadCanvasState();
    expect(result).toEqual(VALID_STATE);
  });

  it("returns null when stored data is invalid JSON", () => {
    store["playground-canvas-state"] = "{bad json";
    expect(loadCanvasState()).toBeNull();
  });

  it("returns null when window is undefined (SSR)", () => {
    vi.stubGlobal("window", undefined);
    expect(loadCanvasState()).toBeNull();
  });
});

describe("saveCanvasState", () => {
  it("serializes state to localStorage", () => {
    saveCanvasState(VALID_STATE);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "playground-canvas-state",
      JSON.stringify(VALID_STATE),
    );
  });

  it("does nothing when window is undefined (SSR)", () => {
    vi.stubGlobal("window", undefined);
    saveCanvasState(VALID_STATE);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });
});

describe("clearCanvasState", () => {
  it("removes the key from localStorage", () => {
    store["playground-canvas-state"] = "data";
    clearCanvasState();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      "playground-canvas-state",
    );
  });

  it("swallows errors when localStorage throws", () => {
    localStorageMock.removeItem.mockImplementationOnce(() => {
      throw new Error("SecurityError");
    });
    expect(() => clearCanvasState()).not.toThrow();
  });

  it("does nothing when window is undefined (SSR)", () => {
    vi.stubGlobal("window", undefined);
    clearCanvasState();
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
  });
});
