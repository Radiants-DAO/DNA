import type { AccessibilityAudit, AuditViolation, AXNodeSummary, HeadingEntry, LandmarkEntry } from '@flow/shared';
import { cdp } from '../api/cdpBridge';

/**
 * Audit page accessibility via CDP Accessibility.getFullAXTree.
 * Returns the browser's actual computed accessibility tree — the same data
 * Chrome DevTools' Accessibility panel shows.
 *
 * Checks: images without alt, buttons/links without names, form inputs
 * without labels, heading hierarchy order.
 */
export async function auditAccessibility(): Promise<AccessibilityAudit> {
  try {
    // Enable required domains
    await cdp('Accessibility.enable');
    await cdp('DOM.enable');

    // Get full accessibility tree (depth 10 to avoid excessive data)
    const { nodes } = await cdp('Accessibility.getFullAXTree', { depth: 10 }) as {
      nodes: Array<{
        nodeId: string;
        ignored: boolean;
        role?: { value: string };
        name?: { value: string };
        properties?: Array<{ name: string; value: { value: unknown } }>;
        childIds?: string[];
      }>;
    };

    const violations: AuditViolation[] = [];
    const headings: HeadingEntry[] = [];
    const landmarks: LandmarkEntry[] = [];
    const ariaTree: AXNodeSummary[] = [];

    const ARIA_TREE_LIMIT = 500;
    const LANDMARK_ROLES = ['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'form', 'search', 'region'];
    const FORM_ROLES = ['textbox', 'combobox', 'listbox', 'checkbox', 'radio', 'spinbutton', 'slider'];
    const CHECKED_ROLES = ['img', 'button', 'link', ...FORM_ROLES];
    let checkedCount = 0;
    let ariaTreeTruncated = false;

    for (const node of nodes) {
      if (node.ignored) continue;

      const role = node.role?.value || '';
      const name = node.name?.value || '';

      // Build tree summary (limit to avoid huge payloads)
      if (ariaTree.length < ARIA_TREE_LIMIT) {
        ariaTree.push({
          role,
          name,
          nodeId: node.nodeId,
          children: node.childIds || [],
          ignored: node.ignored,
        });
      } else {
        ariaTreeTruncated = true;
      }

      // Collect headings
      if (role === 'heading') {
        const levelProp = node.properties?.find(p => p.name === 'level');
        const level = levelProp ? Number(levelProp.value.value) : 0;
        headings.push({ level, text: name });
      }

      // Collect landmarks
      if (LANDMARK_ROLES.indexOf(role) !== -1) {
        landmarks.push({ role, name });
      }

      // ── Violation checks ──
      if (CHECKED_ROLES.indexOf(role) !== -1) {
        checkedCount++;
      }

      // Images without names
      if (role === 'img' && !name) {
        violations.push({
          nodeName: 'img',
          severity: 'error',
          rule: 'img-alt',
          message: 'Image missing accessible name',
          suggestion: 'Add alt text or aria-label',
        });
      }

      // Buttons without names
      if (role === 'button' && !name) {
        violations.push({
          nodeName: 'button',
          severity: 'error',
          rule: 'button-name',
          message: 'Button missing accessible name',
          suggestion: 'Add text content, aria-label, or aria-labelledby',
        });
      }

      // Links without names
      if (role === 'link' && !name) {
        violations.push({
          nodeName: 'a',
          severity: 'error',
          rule: 'link-name',
          message: 'Link missing accessible name',
          suggestion: 'Add text content or aria-label',
        });
      }

      // Form inputs without labels
      if (FORM_ROLES.indexOf(role) !== -1 && !name) {
        violations.push({
          nodeName: role,
          severity: 'error',
          rule: 'input-label',
          message: `${role} missing accessible label`,
          suggestion: 'Add a <label>, aria-label, or aria-labelledby',
        });
      }
    }

    // ── Heading hierarchy check ──
    // Start from the first heading's level to avoid false positives
    // (many pages legitimately start with h2 when h1 is in a shared header)
    let lastLevel = headings.length > 0 ? headings[0].level : 0;
    for (let i = 1; i < headings.length; i++) {
      const h = headings[i];
      if (h.level > lastLevel + 1) {
        violations.push({
          nodeName: `h${h.level}`,
          severity: 'warning',
          rule: 'heading-order',
          message: `Heading level skipped: h${lastLevel} → h${h.level}`,
          suggestion: `Use h${lastLevel + 1} instead`,
        });
      }
      lastLevel = h.level;
    }

    const summary = {
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      passed: Math.max(0, checkedCount - violations.filter(v => v.severity === 'error').length),
    };

    return { violations, summary, headingHierarchy: headings, landmarks, ariaTree, ariaTreeTruncated };
  } catch (e) {
    console.error('[accessibilityScanner] CDP error:', e);
    // Return empty audit on failure (CDP might not be available)
    return {
      violations: [],
      summary: { errors: 0, warnings: 0, passed: 0 },
      headingHierarchy: [],
      landmarks: [],
      ariaTree: [],
    };
  }
}
