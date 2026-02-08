import { useState, useEffect, useCallback } from "react";
import { sendToContent, onContentMessage } from "../../api/contentBridge";
import { RefreshCw, AlertTriangle, Check, Info, AlertCircle } from "../ui/icons";
import { useInspection } from "../../../entrypoints/panel/Panel";
import {
  isAccessibilityResponse,
  type AccessibilityInfo,
  type ContrastInfo,
  type AccessibilityViolation,
} from "@flow/shared";

/**
 * AccessibilityPanel - Display accessibility info for selected element
 *
 * Features:
 * - ARIA labels and roles
 * - WCAG contrast checking
 * - Accessibility violations
 * - Suggested fixes
 */

// ============================================================================
// Types
// ============================================================================

interface AccessibilityData {
  info: AccessibilityInfo;
  contrast: ContrastInfo | null;
  violations: AccessibilityViolation[];
}

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  refresh: <RefreshCw className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3.5 h-3.5" />,
  error: <AlertCircle className="w-3.5 h-3.5" />,
  info: <Info className="w-3.5 h-3.5" />,
  check: <Check className="w-3.5 h-3.5" />,
  accessibility: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v4" />
      <path d="m8 10 4 4 4-4" />
      <path d="m8 20 4-6 4 6" />
    </svg>
  ),
};

// ============================================================================
// Severity Badge
// ============================================================================

function SeverityBadge({ severity }: { severity: AccessibilityViolation["severity"] }) {
  const config = {
    error: {
      icon: Icons.error,
      className: "text-red-400 bg-red-500/20",
      label: "Error",
    },
    warning: {
      icon: Icons.warning,
      className: "text-yellow-400 bg-yellow-500/20",
      label: "Warning",
    },
    info: {
      icon: Icons.info,
      className: "text-blue-400 bg-blue-500/20",
      label: "Info",
    },
  };

  const { icon, className, label } = config[severity];

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${className}`}
      title={label}
    >
      {icon}
    </span>
  );
}

// ============================================================================
// Contrast Indicator
// ============================================================================

interface ContrastIndicatorProps {
  contrast: ContrastInfo;
}

function ContrastIndicator({ contrast }: ContrastIndicatorProps) {
  return (
    <div className="space-y-2 p-2 bg-neutral-800/50 rounded">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
          Contrast Ratio
        </span>
        <span className="text-sm font-mono text-neutral-200">
          {contrast.ratio.toFixed(2)}:1
        </span>
      </div>

      {/* Color swatches */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded border border-neutral-600"
            style={{ backgroundColor: contrast.foreground }}
            title={`Foreground: ${contrast.foreground}`}
          />
          <span className="text-[10px] text-neutral-500">Text</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded border border-neutral-600"
            style={{ backgroundColor: contrast.background }}
            title={`Background: ${contrast.background}`}
          />
          <span className="text-[10px] text-neutral-500">Background</span>
        </div>
      </div>

      {/* WCAG levels */}
      <div className="flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          {contrast.passesAA ? (
            <span className="text-green-400">{Icons.check}</span>
          ) : (
            <span className="text-red-400">{Icons.error}</span>
          )}
          <span className={contrast.passesAA ? "text-green-400" : "text-red-400"}>
            AA {contrast.largeText ? "(large)" : "(normal)"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {contrast.passesAAA ? (
            <span className="text-green-400">{Icons.check}</span>
          ) : (
            <span className="text-neutral-500">{Icons.error}</span>
          )}
          <span className={contrast.passesAAA ? "text-green-400" : "text-neutral-500"}>
            AAA
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Info Row
// ============================================================================

interface InfoRowProps {
  label: string;
  value: string | number | null;
  highlight?: boolean;
}

function InfoRow({ label, value, highlight = false }: InfoRowProps) {
  if (value === null || value === "") return null;

  return (
    <div className="flex items-start justify-between py-1 border-b border-neutral-700/50 last:border-0">
      <span className="text-[10px] text-neutral-500">{label}</span>
      <span
        className={`text-xs text-right max-w-[60%] truncate ${
          highlight ? "text-blue-400" : "text-neutral-200"
        }`}
        title={String(value)}
      >
        {String(value)}
      </span>
    </div>
  );
}

// ============================================================================
// Violation Card
// ============================================================================

interface ViolationCardProps {
  violation: AccessibilityViolation;
}

function ViolationCard({ violation }: ViolationCardProps) {
  return (
    <div className="p-2 bg-neutral-800/50 rounded space-y-1.5">
      <div className="flex items-start gap-2">
        <SeverityBadge severity={violation.severity} />
        <p className="text-xs text-neutral-200 flex-1">{violation.message}</p>
      </div>
      {violation.suggestion && (
        <p className="text-[10px] text-neutral-400 pl-6">
          Suggestion: {violation.suggestion}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Main AccessibilityPanel Component
// ============================================================================

export function AccessibilityPanel() {
  const { inspectionResult } = useInspection();
  const [data, setData] = useState<AccessibilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for accessibility results from content script
  useEffect(() => {
    const cleanup = onContentMessage((message: unknown) => {
      if (isAccessibilityResponse(message)) {
        setData(message.payload);
        setLoading(false);
        setError(null);
      }
    });

    return cleanup;
  }, []);

  const requestAccessibilityInfo = useCallback(() => {
    if (!inspectionResult?.selector) return;

    setLoading(true);
    setError(null);

    sendToContent({
      type: "panel:accessibility",
      payload: { selector: inspectionResult.selector },
    });

    // Real results come via onContentMessage callback
  }, [inspectionResult?.selector]);

  // Request accessibility info when element is selected
  useEffect(() => {
    if (inspectionResult?.selector) {
      requestAccessibilityInfo();
    }
  }, [inspectionResult?.selector, requestAccessibilityInfo]);

  if (!inspectionResult) {
    return (
      <div className="p-4 text-center">
        <div className="text-neutral-500 mb-2">{Icons.accessibility}</div>
        <p className="text-xs text-neutral-500">
          Select an element to view accessibility information.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin text-neutral-500 mb-2">{Icons.refresh}</div>
        <p className="text-xs text-neutral-500">Analyzing accessibility...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-400 mb-2">{Icons.error}</div>
        <p className="text-xs text-red-400">{error}</p>
        <button
          onClick={requestAccessibilityInfo}
          className="mt-2 px-3 py-1 text-xs text-neutral-200 bg-neutral-700 rounded hover:bg-neutral-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">{Icons.accessibility}</span>
            <span className="text-xs font-medium text-neutral-200">
              Accessibility
            </span>
          </div>
          <button
            onClick={requestAccessibilityInfo}
            className="p-1 text-neutral-500 hover:text-neutral-200 rounded hover:bg-neutral-700/50 transition-colors"
            title="Refresh"
          >
            {Icons.refresh}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {data ? (
          <>
            {/* ARIA Info */}
            <div className="space-y-1">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">
                ARIA Properties
              </div>
              <div className="bg-neutral-800/50 rounded p-2">
                <InfoRow label="Role" value={data.info.role} highlight />
                <InfoRow label="aria-label" value={data.info.ariaLabel} />
                <InfoRow label="aria-describedby" value={data.info.ariaDescribedBy} />
                <InfoRow label="aria-labelledby" value={data.info.ariaLabelledBy} />
                <InfoRow
                  label="aria-hidden"
                  value={data.info.ariaHidden ? "true" : null}
                />
                <InfoRow label="tabIndex" value={data.info.tabIndex} />
              </div>
            </div>

            {/* Interactivity */}
            <div className="space-y-1">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">
                Interactivity
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {data.info.isInteractive ? (
                    <span className="text-green-400">{Icons.check}</span>
                  ) : (
                    <span className="text-neutral-500">{Icons.error}</span>
                  )}
                  <span className="text-xs text-neutral-300">Interactive</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {data.info.hasFocusIndicator ? (
                    <span className="text-green-400">{Icons.check}</span>
                  ) : (
                    <span className="text-yellow-400">{Icons.warning}</span>
                  )}
                  <span className="text-xs text-neutral-300">Focus indicator</span>
                </div>
              </div>
            </div>

            {/* Contrast */}
            {data.contrast && (
              <div className="space-y-1">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">
                  Color Contrast
                </div>
                <ContrastIndicator contrast={data.contrast} />
              </div>
            )}

            {/* Violations */}
            {data.violations.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                  Issues ({data.violations.length})
                </div>
                {data.violations.map((violation) => (
                  <ViolationCard key={violation.id} violation={violation} />
                ))}
              </div>
            )}

            {data.violations.length === 0 && (
              <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded text-green-400">
                <span>{Icons.check}</span>
                <span className="text-xs">No accessibility issues detected</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-neutral-500 text-xs">
            No accessibility data available
          </div>
        )}
      </div>
    </div>
  );
}

export default AccessibilityPanel;
