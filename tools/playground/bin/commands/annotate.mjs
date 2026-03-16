import { get, post } from "../lib/api.mjs";

export async function annotate(args) {
  const componentId = args[0];

  if (!componentId) {
    throw new Error(
      "Usage: rdna-playground annotate <component> <message> [--intent fix|change|question] [--priority P1|P2|P3|P4]",
    );
  }

  // Extract flags before building message so they don't leak into text
  const intent = extractFlag(args, "--intent") || "change";
  const priority = extractFlag(args, "--priority") || extractFlag(args, "-p") || undefined;

  // Build message from remaining args (skip componentId at [0], strip flags + their values)
  const message = args
    .filter((a, i) => {
      if (a === "--intent" || a === "--priority" || a === "-p") return false;
      if (i > 0 && (args[i - 1] === "--intent" || args[i - 1] === "--priority" || args[i - 1] === "-p"))
        return false;
      return true;
    })
    .slice(1)
    .join(" ");

  if (!message) {
    throw new Error(
      "Usage: rdna-playground annotate <component> <message> [--intent fix|change|question] [--priority P1|P2|P3|P4]",
    );
  }

  const result = await post("/agent/annotation", {
    action: "annotate",
    componentId,
    message,
    intent,
    priority,
  });

  console.log(`Annotation created: ${result.annotation.id}`);
  console.log(`  [${result.annotation.intent}/${result.annotation.priority ?? "-"}] ${result.annotation.message}`);
}

export async function list(args) {
  const componentId = args[0];
  const statusFilter = extractFlag(args, "--status");

  let url = "/agent/annotation";
  const params = [];
  if (componentId && !componentId.startsWith("--")) params.push(`componentId=${componentId}`);
  if (statusFilter) params.push(`status=${statusFilter}`);
  if (params.length) url += `?${params.join("&")}`;

  const result = await get(url);
  const annotations = result.annotations || [];

  if (annotations.length === 0) {
    console.log("No annotations found.");
    return;
  }

  console.log(`${annotations.length} annotation(s):`);
  for (const a of annotations) {
    const status = a.status.toUpperCase().padEnd(12);
    console.log(`  ${a.id.slice(0, 8)} ${status} [${a.intent}/${a.priority ?? "-"}] ${a.componentId}: ${a.message}`);
    if (a.resolution) {
      console.log(`           resolved: ${a.resolution}`);
    }
  }
}

export async function resolve(args) {
  const id = args[0];
  const summary = args.slice(1).join(" ") || undefined;

  if (!id) {
    throw new Error("Usage: rdna-playground resolve <annotation-id> [summary]");
  }

  const result = await post("/agent/annotation", {
    action: "resolve",
    id,
    summary,
  });

  console.log(`Resolved: ${result.annotation.id.slice(0, 8)}`);
  if (summary) console.log(`  Summary: ${summary}`);
}

export async function dismiss(args) {
  const id = args[0];
  const reason = args.slice(1).join(" ");

  if (!id || !reason) {
    throw new Error("Usage: rdna-playground dismiss <annotation-id> <reason>");
  }

  const result = await post("/agent/annotation", {
    action: "dismiss",
    id,
    reason,
  });

  console.log(`Dismissed: ${result.annotation.id.slice(0, 8)}`);
  console.log(`  Reason: ${reason}`);
}

function extractFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}
