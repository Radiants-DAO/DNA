import { post } from "../lib/api.mjs";

export async function workStart(args) {
  const componentId = args[0];
  if (!componentId) {
    throw new Error("Usage: rdna-playground work-start <component>");
  }

  const result = await post("/agent/signal", {
    action: "work-start",
    componentId,
  });

  console.log(`Work started: ${componentId}`);
  console.log(`Active: ${result.active.join(", ") || "(none)"}`);
}

export async function workEnd(args) {
  const componentId = args[0];

  const result = await post("/agent/signal", componentId
    ? { action: "work-end", componentId }
    : { action: "clear-all" });

  console.log(componentId ? `Work ended: ${componentId}` : "All work signals cleared");
  console.log(`Active: ${result.active.join(", ") || "(none)"}`);
}
