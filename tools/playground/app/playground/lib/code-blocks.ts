/**
 * Re-export from the canonical implementation in bin/lib/prompt.mjs.
 * CLI commands import prompt.mjs directly; server routes import this wrapper.
 */
// @ts-expect-error -- .mjs import handled by Next.js/Turbopack
export { extractCodeBlocks } from "../../../bin/lib/prompt.mjs";
