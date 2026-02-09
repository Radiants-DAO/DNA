import { useState, useCallback, useEffect } from "react";
import type {
  AccessibilityAudit,
  AuditViolation,
  ContrastIssue,
  HeadingEntry,
  LandmarkEntry,
} from "@flow/shared";
import { RefreshCw, AlertTriangle, Check, AlertCircle, Info } from "./ui/icons";
import { CollapsibleSection } from "./ui/CollapsibleSection";
import { auditAccessibility } from "../scanners/accessibilityScanner";
import { checkContrast } from "../scanners/contrastScanner";
import { onPageNavigated } from "../api/navigationWatcher";

/**
 * AccessibilityAuditPanel - Page-wide accessibility audit.
 * Uses CDP Accessibility.getFullAXTree + eval-based contrast checking.
 * Shown as a full tab in the LeftTabBar.
 */

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  refresh: <RefreshCw className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3.5 h-3.5" />,
  error: <AlertCircle className="w-3.5 h-3.5" />,
  info: <Info className="w-3.5 h-3.5" />,
  check: <Check className="w-3.5 h-3.5" />,
};

// ============================================================================
// Severity Badge
// ============================================================================

function SeverityBadge({ severity }: { severity: AuditViolation["severity"] }) {
  const config = {
    error: { icon: Icons.error, className: "text-red-400 bg-red-500/20" },
    warning: { icon: Icons.warning, className: "text-yellow-400 bg-yellow-500/20" },
    info: { icon: Icons.info, className: "text-blue-400 bg-blue-500/20" },
  };
  const { icon, className } = config[severity];
  return (
    <span className={`inline-flex items-center px-1 py-0.5 rounded text-[10px] ${className}`}>
      {icon}
    </span>
  );
}

// ============================================================================
// Violation Row
// ============================================================================

function ViolationRow({ violation }: { violation: AuditViolation }) {
  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50">
      <SeverityBadge severity={violation.severity} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-200">{violation.message}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-neutral-500 font-mono">{violation.nodeName}</span>
          <span className="text-[10px] text-neutral-600">{violation.rule}</span>
        </div>
        {violation.suggestion && (
          <p className="text-[10px] text-neutral-400 mt-0.5">{violation.suggestion}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Heading Row
// ============================================================================

function HeadingRow({ heading }: { heading: HeadingEntry }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1" style={{ paddingLeft: `${heading.level * 12}px` }}>
      <span className="text-[10px] text-blue-400 font-mono shrink-0">h{heading.level}</span>
      <span className="text-xs text-neutral-200 truncate">{heading.text || "(empty)"}</span>
    </div>
  );
}

// ============================================================================
// Landmark Row
// ============================================================================

function LandmarkRow({ landmark }: { landmark: LandmarkEntry }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="text-[9px] bg-purple-400/10 text-purple-400 px-1 rounded">{landmark.role}</span>
      <span className="text-xs text-neutral-200 truncate">{landmark.name || "(unnamed)"}</span>
    </div>
  );
}

// ============================================================================
// Contrast Issue Row
// ============================================================================

function ContrastRow({ issue }: { issue: ContrastIssue }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50">
      <div className="flex items-center gap-1 shrink-0">
        <div
          className="w-4 h-4 rounded border border-neutral-600"
          style={{ backgroundColor: issue.foreground }}
          title={`Text: ${issue.foreground}`}
        />
        <div
          className="w-4 h-4 rounded border border-neutral-600"
          style={{ backgroundColor: issue.background }}
          title={`Background: ${issue.background}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-neutral-200 truncate">{issue.text}</div>
        <div className="text-[10px] text-neutral-500 font-mono">{issue.selector}</div>
      </div>
      <span className="text-[10px] text-red-400 font-mono shrink-0">{issue.ratio}:1</span>
      <span className="text-[9px] bg-red-400/10 text-red-400 px-1 rounded">
        {issue.largeText ? "AA-L" : "AA"} fail
      </span>
    </div>
  );
}

// ============================================================================
// Summary Bar
// ============================================================================

function SummaryBar({ summary, contrastCount }: {
  summary: AccessibilityAudit["summary"];
  contrastCount: number;
}) {
  return (
    <div className="flex items-center gap-3 text-[10px]">
      {summary.errors > 0 && (
        <span className="flex items-center gap-1 text-red-400">
          {Icons.error} {summary.errors} error{summary.errors !== 1 ? "s" : ""}
        </span>
      )}
      {summary.warnings > 0 && (
        <span className="flex items-center gap-1 text-yellow-400">
          {Icons.warning} {summary.warnings} warning{summary.warnings !== 1 ? "s" : ""}
        </span>
      )}
      {contrastCount > 0 && (
        <span className="flex items-center gap-1 text-orange-400">
          {contrastCount} contrast
        </span>
      )}
      {summary.errors === 0 && summary.warnings === 0 && contrastCount === 0 && (
        <span className="flex items-center gap-1 text-green-400">
          {Icons.check} No issues found
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AccessibilityAuditPanel() {
  const [audit, setAudit] = useState<AccessibilityAudit | null>(null);
  const [contrastIssues, setContrastIssues] = useState<ContrastIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const runAudit = useCallback(() => {
    setLoading(true);
    // Run CDP audit and contrast check in parallel
    Promise.all([
      auditAccessibility(),
      checkContrast(),
    ]).then(([auditResult, contrastResult]) => {
      setAudit(auditResult);
      setContrastIssues(contrastResult);
      setLoading(false);
    });
  }, []);

  // Audit on mount + re-audit on SPA navigation
  useEffect(() => {
    runAudit();
    const unsubscribe = onPageNavigated(runAudit);
    return unsubscribe;
  }, [runAudit]);

  // Loading state
  if (loading) {
    return (
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-neutral-400">
          <div className="animate-spin">{Icons.refresh}</div>
          <span className="text-xs">Running accessibility audit...</span>
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="p-3 text-center text-neutral-500 text-xs">
        Failed to run accessibility audit.
      </div>
    );
  }

  const errorViolations = audit.violations.filter(v => v.severity === "error");
  const warningViolations = audit.violations.filter(v => v.severity === "warning");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-neutral-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-200">
            Accessibility Audit
          </span>
          <button
            onClick={runAudit}
            title="Re-run audit"
            className="p-1 rounded hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {Icons.refresh}
          </button>
        </div>
        <SummaryBar summary={audit.summary} contrastCount={contrastIssues.length} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Errors */}
        {errorViolations.length > 0 && (
          <CollapsibleSection
            title="Errors"
            count={errorViolations.length}
            defaultExpanded
            badge={<span className="text-[9px] bg-red-400/10 text-red-400 px-1 rounded">critical</span>}
          >
            {errorViolations.map((v, i) => (
              <ViolationRow key={`${v.rule}-${i}`} violation={v} />
            ))}
          </CollapsibleSection>
        )}

        {/* Warnings */}
        {warningViolations.length > 0 && (
          <CollapsibleSection title="Warnings" count={warningViolations.length} defaultExpanded>
            {warningViolations.map((v, i) => (
              <ViolationRow key={`${v.rule}-${i}`} violation={v} />
            ))}
          </CollapsibleSection>
        )}

        {/* Contrast Issues */}
        {contrastIssues.length > 0 && (
          <CollapsibleSection title="Contrast Issues" count={contrastIssues.length}>
            {contrastIssues.map((issue, i) => (
              <ContrastRow key={`${issue.selector}-${i}`} issue={issue} />
            ))}
          </CollapsibleSection>
        )}

        {/* Heading Hierarchy */}
        {audit.headingHierarchy.length > 0 && (
          <CollapsibleSection title="Heading Hierarchy" count={audit.headingHierarchy.length}>
            {audit.headingHierarchy.map((h, i) => (
              <HeadingRow key={`h${h.level}-${i}`} heading={h} />
            ))}
          </CollapsibleSection>
        )}

        {/* Landmarks */}
        {audit.landmarks.length > 0 && (
          <CollapsibleSection title="Landmarks" count={audit.landmarks.length}>
            {audit.landmarks.map((lm, i) => (
              <LandmarkRow key={`${lm.role}-${i}`} landmark={lm} />
            ))}
          </CollapsibleSection>
        )}

        {/* All clear */}
        {audit.violations.length === 0 && contrastIssues.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded text-green-400">
            <span>{Icons.check}</span>
            <span className="text-xs">No accessibility issues detected on this page.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccessibilityAuditPanel;
