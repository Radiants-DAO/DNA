#!/usr/bin/env node

const [command, ...args] = process.argv.slice(2);

const COMMANDS = {
  "work-start": () => import("./commands/work-signal.mjs").then((m) => m.workStart(args)),
  "work-end": () => import("./commands/work-signal.mjs").then((m) => m.workEnd(args)),
  status: () => import("./commands/status.mjs").then((m) => m.run()),
  variations: () => import("./commands/variations.mjs").then((m) => m.run(args)),
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
