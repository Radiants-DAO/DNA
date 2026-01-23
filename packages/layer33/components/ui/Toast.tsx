'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/icons';

// ============================================================================
// Types
// ============================================================================

type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  /** Icon name (filename without .svg extension) - overrides variant default */
  iconName?: string;
}

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// Toast Provider
// ============================================================================

interface ToastProviderProps {
  /** Children */
  children: React.ReactNode;
  /** Default duration in ms */
  defaultDuration?: number;
}

export function ToastProvider({ children, defaultDuration = 5000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = toast.duration ?? defaultDuration;

    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, [defaultDuration]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {mounted && createPortal(
        <ToastViewport toasts={toasts} removeToast={removeToast} />,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// ============================================================================
// Toast Viewport
// ============================================================================

interface ToastViewportProps {
  toasts: ToastData[];
  removeToast: (id: string) => void;
}

function ToastViewport({ toasts, removeToast }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// ============================================================================
// Toast Component
// ============================================================================

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-surface-primary',
  success: 'bg-status-success/20',
  warning: 'bg-status-warning/10',
  error: 'bg-status-error/10',
  info: 'bg-status-info/20',
};

const variantIconMap: Record<ToastVariant, string | null> = {
  default: null,
  success: 'checkmark-filled',
  warning: 'warning-triangle-filled-2',
  error: 'close',
  info: 'information-circle',
};

interface ToastProps {
  toast: ToastData;
  onClose: () => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const variant = toast.variant || 'default';
  const displayIconName = toast.iconName || variantIconMap[variant];

  return (
    <div
      className={`
        pointer-events-auto
        p-4
        border border-edge-primary
        rounded-none
        shadow-[2px_2px_0_0_var(--color-edge-primary)]
        animate-slideIn
        ${variantStyles[variant]}
      `.trim()}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {displayIconName && (
          <span className="flex-shrink-0" aria-hidden="true">
            <Icon name={displayIconName} size={16} />
          </span>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-alfacad text-sm uppercase font-medium text-content-primary">
            {toast.title}
          </p>
          {toast.description && (
            <p className="font-space-mono text-sm text-content-primary/70 mt-1">
              {toast.description}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-content-primary/50 hover:text-content-primary flex-shrink-0 -mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus rounded-sm"
          aria-label="Close"
        >
          <Icon name="close" size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default ToastProvider;
