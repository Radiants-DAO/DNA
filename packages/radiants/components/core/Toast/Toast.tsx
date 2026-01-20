'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  /** Custom icon element - overrides variant default */
  icon?: React.ReactNode;
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
  /** Optional render function for variant icons */
  renderIcon?: (variant: ToastVariant) => React.ReactNode;
  /** Optional render function for close icon */
  renderCloseIcon?: () => React.ReactNode;
}

export function ToastProvider({
  children,
  defaultDuration = 5000,
  renderIcon,
  renderCloseIcon,
}: ToastProviderProps) {
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
        <ToastViewport
          toasts={toasts}
          removeToast={removeToast}
          renderIcon={renderIcon}
          renderCloseIcon={renderCloseIcon}
        />,
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
  renderIcon?: (variant: ToastVariant) => React.ReactNode;
  renderCloseIcon?: () => React.ReactNode;
}

function ToastViewport({ toasts, removeToast, renderIcon, renderCloseIcon }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
          renderIcon={renderIcon}
          renderCloseIcon={renderCloseIcon}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Toast Component
// ============================================================================

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-warm-cloud border-black',
  success: 'bg-success-green border-success-green',
  warning: 'bg-sun-yellow border-sunset-fuzz',
  error: 'bg-error-red border-error-red',
  info: 'bg-sky-blue border-sky-blue',
};

interface ToastProps {
  toast: ToastData;
  onClose: () => void;
  renderIcon?: (variant: ToastVariant) => React.ReactNode;
  renderCloseIcon?: () => React.ReactNode;
}

function Toast({ toast, onClose, renderIcon, renderCloseIcon }: ToastProps) {
  const variant = toast.variant || 'default';

  // Use custom icon if provided, otherwise use renderIcon function if available
  const displayIcon = toast.icon ?? (renderIcon ? renderIcon(variant) : null);

  return (
    <div
      className={`
        pointer-events-auto
        p-4
        border-2
        rounded-sm
        shadow-[2px_2px_0_0_var(--color-black)]
        animate-slideIn
        ${variantStyles[variant]}
      `.trim()}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {displayIcon && (
          <span className="flex-shrink-0">
            {displayIcon}
          </span>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-joystix text-xs uppercase text-black">
            {toast.title}
          </p>
          {toast.description && (
            <p className="font-mondwest text-base text-black/70 mt-1">
              {toast.description}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-black/50 hover:text-black flex-shrink-0 -mt-1"
          aria-label="Close"
        >
          {renderCloseIcon ? renderCloseIcon() : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default ToastProvider;
