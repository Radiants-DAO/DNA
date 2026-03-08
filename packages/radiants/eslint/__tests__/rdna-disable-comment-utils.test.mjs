import { describe, expect, it } from 'vitest';
import {
  extractAddedRdnaDisableCommentsFromDiff,
  parseRdnaDisableComment,
  validateExceptionMetadata,
} from '../rdna-disable-comment-utils.mjs';

describe('rdna-disable-comment-utils', () => {
  it('parses rdna disable-next-line comments with metadata', () => {
    const parsed = parseRdnaDisableComment(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-04-01 issue:DNA-123'
    );

    expect(parsed).toMatchObject({
      kind: 'disable-next-line',
      rdnaRules: ['rdna/no-hardcoded-colors'],
      metadataText: 'reason:legacy owner:design-system expires:2026-04-01 issue:DNA-123',
    });
  });

  it('parses ESLint block-comment bodies with leading star prefixes', () => {
    const parsed = parseRdnaDisableComment(`
 * eslint-disable-next-line rdna/no-hardcoded-colors --
 * reason:legacy
 * owner:design-system
 * expires:2026-04-01
 * issue:DNA-123
`);

    expect(parsed).toMatchObject({
      kind: 'disable-next-line',
      rdnaRules: ['rdna/no-hardcoded-colors'],
    });
    expect(parsed?.metadataText).toContain('reason:legacy');
    expect(parsed?.metadataText).toContain('owner:design-system');
  });

  it('does not mistake string literals for disable comments', () => {
    const parsed = parseRdnaDisableComment(
      'const fixture = "// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy";'
    );

    expect(parsed).toBeNull();
  });

  it('does not treat field-like substrings inside issue urls as metadata fields', () => {
    const validation = validateExceptionMetadata(
      'reason:legacy owner:design-system expires:2026-04-01 issue:https://dna.test/exceptions?owner:fake',
      { today: '2026-03-07' }
    );

    expect(validation.missing).toHaveLength(0);
    expect(validation.malformed).toHaveLength(0);
    expect(validation.expired).toBeNull();
  });

  it('extracts newly added rdna disable comments from a unified diff', () => {
    const additions = extractAddedRdnaDisableCommentsFromDiff(`
diff --git a/apps/example.tsx b/apps/example.tsx
index 1234567..89abcde 100644
--- a/apps/example.tsx
+++ b/apps/example.tsx
@@ -10,0 +11,2 @@
+// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-04-01 issue:DNA-123
+const x = 1;
`);

    expect(additions).toHaveLength(1);
    expect(additions[0]).toMatchObject({
      filePath: 'apps/example.tsx',
      line: 11,
      kind: 'disable-next-line',
      rdnaRules: ['rdna/no-hardcoded-colors'],
    });
  });

  it('extracts newly added inline eslint-disable-line comments from a unified diff', () => {
    const additions = extractAddedRdnaDisableCommentsFromDiff(`
diff --git a/apps/example.tsx b/apps/example.tsx
index 1234567..89abcde 100644
--- a/apps/example.tsx
+++ b/apps/example.tsx
@@ -10,0 +11,1 @@
+const x = 1; // eslint-disable-line rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-04-01 issue:DNA-123
`);

    expect(additions).toHaveLength(1);
    expect(additions[0]).toMatchObject({
      filePath: 'apps/example.tsx',
      line: 11,
      kind: 'disable-line',
      rdnaRules: ['rdna/no-hardcoded-colors'],
    });
  });

  it('extracts newly added formatted block-comment disables from a unified diff', () => {
    const additions = extractAddedRdnaDisableCommentsFromDiff(`
diff --git a/apps/example.tsx b/apps/example.tsx
index 1234567..89abcde 100644
--- a/apps/example.tsx
+++ b/apps/example.tsx
@@ -10,0 +11,7 @@
+/*
+ * eslint-disable-next-line rdna/no-hardcoded-colors --
+ * reason:legacy
+ * owner:design-system
+ * expires:2026-04-01
+ * issue:DNA-123
+ */
`);

    expect(additions).toHaveLength(1);
    expect(additions[0]).toMatchObject({
      filePath: 'apps/example.tsx',
      line: 11,
      kind: 'disable-next-line',
      rdnaRules: ['rdna/no-hardcoded-colors'],
    });
  });

  it('extracts newly added star-prefixed disables inside an existing block comment', () => {
    const additions = extractAddedRdnaDisableCommentsFromDiff(`
diff --git a/apps/example.tsx b/apps/example.tsx
index 1234567..89abcde 100644
--- a/apps/example.tsx
+++ b/apps/example.tsx
@@ -10,0 +11,5 @@
+ * eslint-disable-next-line rdna/no-hardcoded-colors --
+ * reason:legacy
+ * owner:design-system
+ * expires:2026-04-01
+ * issue:DNA-123
`);

    expect(additions).toHaveLength(1);
    expect(additions[0]).toMatchObject({
      filePath: 'apps/example.tsx',
      line: 11,
      kind: 'disable-next-line',
      rdnaRules: ['rdna/no-hardcoded-colors'],
    });
  });
});
