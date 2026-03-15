import { get } from "../lib/api.mjs";

export async function run() {
  const [signals, iterations] = await Promise.all([
    get("/agent/signal?format=json"),
    get("/generate"),
  ]);

  console.log("Playground Status");
  console.log(`Active signals: ${signals.active.length}`);
  console.log(`Iteration files: ${iterations.files.length}`);
  console.log(`Generate locked: ${iterations.locked ? "yes" : "no"}`);
}
