/**
 * Theme Preview Component
 *
 * Renders a theme component using dynamic ESM import.
 * Includes error boundary for graceful error handling.
 */

import React, { useState, useEffect } from "react";
import { getComponent } from "../services/themeLoader";

// ============================================================================
// Types
// ============================================================================

interface ThemePreviewProps {
  componentName: string;
  props?: Record<string, unknown>;
  variant?: string;
  className?: string;
}

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; Component: React.ComponentType }
  | { status: "error"; message: string };

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryProps {
  componentName: string;
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[ThemePreview] ${this.props.componentName} render error:`,
      error,
      info
    );
    this.props.onError?.(error);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when component name changes
    if (prevProps.componentName !== this.props.componentName) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center gap-2 text-red-400 text-xs p-3 bg-red-400/10 rounded border border-red-400/20">
          <span className="text-base">💥</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium">Render Error</div>
            <div className="text-red-400/70 truncate">
              {this.state.error?.message}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// ThemePreview Component
// ============================================================================

export function ThemePreview({
  componentName,
  props = {},
  variant,
  className = "",
}: ThemePreviewProps) {
  const [state, setState] = useState<PreviewState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    setState({ status: "loading" });

    getComponent(componentName)
      .then((Component) => {
        if (cancelled) return;

        if (Component) {
          setState({ status: "ready", Component });
        } else {
          setState({
            status: "error",
            message: `Component "${componentName}" not found`,
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [componentName]);

  // Merge variant into props if provided
  const finalProps = variant ? { ...props, variant } : props;

  return (
    <div className={`theme-preview ${className}`}>
      {state.status === "loading" && (
        <div className="flex items-center gap-2 text-text-muted text-xs p-3">
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading {componentName}...</span>
        </div>
      )}

      {state.status === "error" && (
        <div className="flex items-center gap-2 text-red-400 text-xs p-3 bg-red-400/10 rounded border border-red-400/20">
          <span className="text-base">⚠</span>
          <span>{state.message}</span>
        </div>
      )}

      {state.status === "ready" && (
        <ErrorBoundary componentName={componentName}>
          <state.Component {...finalProps} />
        </ErrorBoundary>
      )}
    </div>
  );
}

// ============================================================================
// Variant Preview Component
// ============================================================================

interface VariantPreviewProps {
  componentName: string;
  variants: string[];
  baseProps?: Record<string, unknown>;
}

export function VariantPreview({
  componentName,
  variants,
  baseProps = {},
}: VariantPreviewProps) {
  return (
    <div className="space-y-3">
      {variants.map((variant) => (
        <div key={variant} className="space-y-1">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">
            {variant}
          </div>
          <ThemePreview
            componentName={componentName}
            props={baseProps}
            variant={variant}
          />
        </div>
      ))}
    </div>
  );
}

export default ThemePreview;
