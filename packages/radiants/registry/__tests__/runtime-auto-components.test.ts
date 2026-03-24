import { describe, expect, it } from "vitest";
import { Icon, Select } from "../../components/core";
import { runtimeAttachments } from "../runtime-attachments";

describe("runtime attachments auto component wiring", () => {
  it("derives plain component refs from core exports", () => {
    expect(runtimeAttachments.Icon?.component).toBe(Icon);
  });

  it("preserves custom demo overrides while keeping component refs", () => {
    expect(runtimeAttachments.Select?.component).toBe(Select);
    expect(typeof runtimeAttachments.Select?.Demo).toBe("function");
  });
});
