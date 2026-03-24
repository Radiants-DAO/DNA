#!/usr/bin/env node

const [command, ...args] = process.argv.slice(2);

const COMMANDS = {
  "work-start": () => import("./commands/work-signal.mjs").then((m) => m.workStart(args)),
  "work-end": () => import("./commands/work-signal.mjs").then((m) => m.workEnd(args)),
  status: () => import("./commands/status.mjs").then((m) => m.run()),
  variations: () => import("./commands/variations.mjs").then((m) => m.run(args)),
  "create-variants": () => import("./commands/create-variants.mjs").then((m) => m.run(args)),
  fix: () => import("./commands/agent-fix.mjs").then((m) => m.run(args)),
  annotate: () => import("./commands/annotate.mjs").then((m) => m.annotate(args)),
  annotations: () => import("./commands/annotate.mjs").then((m) => m.list(args)),
  resolve: () => import("./commands/annotate.mjs").then((m) => m.resolve(args)),
  dismiss: () => import("./commands/annotate.mjs").then((m) => m.dismiss(args)),
  "list-states": () => import("./commands/list-states.mjs").then((m) => m.run(args)),
  "set-props": () => import("./commands/set-props.mjs").then((m) => m.run(args)),
  help: () => printHelp(),
};

function printHelp() {
  console.log(`
rdna-playground

Usage:
  rdna-playground work-start <component>
  rdna-playground work-end [component]
  rdna-playground status
  rdna-playground variations <subcommand>
  rdna-playground create-variants <component> [count]
  rdna-playground fix <component> --annotation <id>
  rdna-playground annotate <component> <message> [--intent fix|change|question] [--priority P1|P2|P3|P4]
  rdna-playground annotations [component] [--status pending]
  rdna-playground resolve <annotation-id> [summary]
  rdna-playground dismiss <annotation-id> <reason>
  rdna-playground list-states <component> [--json]
  rdna-playground set-props <component> key=value [...] [--color-mode light|dark] [--state hover]
  rdna-playground screenshot <component> [--out path] [--props key=val...] [--color-mode light|dark] [--state hover]
  rdna-playground sweep <component> [--out-dir path] [--max N]
`);
}

if (!command || command === "help" || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

const handler = COMMANDS[command];
if (!handler) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

handler().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
