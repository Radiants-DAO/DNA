/**
 * Re-export from the canonical implementation in bin/lib/prompt.mjs.
 * CLI commands import prompt.mjs directly; server routes import this wrapper.
 */
export { extractCodeBlocks } from "../../../bin/lib/prompt.mjs";
