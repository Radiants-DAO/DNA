/** Extract TSX code blocks from Claude's stdout */
export function extractCodeBlocks(stdout: string): string[] {
  const blocks: string[] = [];
  const fenceRegex = /```tsx?\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = fenceRegex.exec(stdout)) !== null) {
    const code = match[1].trim();
    if (code.length > 50) blocks.push(code);
  }
  // If no fenced blocks, try treating entire output as code
  // (when Claude responds with just the file content)
  if (blocks.length === 0) {
    const trimmed = stdout.trim();
    if (trimmed.includes("'use client'") || trimmed.includes('"use client"')) {
      blocks.push(trimmed);
    }
  }
  return blocks;
}
