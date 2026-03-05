'use client';

import React, { createContext, use, useCallback, useRef } from 'react';
import { Toast as BaseToast } from '@base-ui/react/toast';

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
// Context — preserves existing useToast() contract
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = use(ToastContext);
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
  const managerRef = useRef(BaseToast.createToastManager<ToastExtraData>());

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const duration = toast.duration ?? defaultDuration;
    const id = managerRef.current.add({
      title: toast.title,
      description: toast.description,
      type: toast.variant || 'default',
      timeout: duration,
      data: {
        variant: toast.variant || 'default',
        icon: toast.icon,
      },
    });
    return id;
  }, [defaultDuration]);

  const removeToast = useCallback((id: string) => {
    managerRef.current.close(id);
  }, []);

  // Provide an empty toasts array — the actual toast list is managed by Base UI's useToastManager
  const contextValue: ToastContextValue = {
    toasts: [],
    addToast,
    removeToast,
  };

  return (
    <ToastContext value={contextValue}>
      <BaseToast.Provider toastManager={managerRef.current} timeout={defaultDuration}>
        {children}
        <ToastViewportInternal renderIcon={renderIcon} renderCloseIcon={renderCloseIcon} />
      </BaseToast.Provider>
    </ToastContext>
  );
}

// ============================================================================
// Internal Types
// ============================================================================

interface ToastExtraData {
  variant: ToastVariant;
  icon?: React.ReactNode;
}

// ============================================================================
// Toast Viewport (internal, uses Base UI useToastManager)
// ============================================================================

interface ToastViewportInternalProps {
  renderIcon?: (variant: ToastVariant) => React.ReactNode;
  renderCloseIcon?: () => React.ReactNode;
}

function ToastViewportInternal({ renderIcon, renderCloseIcon }: ToastViewportInternalProps) {
  const { toasts } = BaseToast.useToastManager<ToastExtraData>();

  if (toasts.length === 0) return null;

  return (
    <BaseToast.Viewport
      className="fixed top-4 right-4 z-[400] flex flex-col gap-2 w-[24rem] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          renderIcon={renderIcon}
          renderCloseIcon={renderCloseIcon}
        />
      ))}
    </BaseToast.Viewport>
  );
}

// ============================================================================
// Toast Item
// ============================================================================

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-surface-primary border-edge-primary',
  success: 'bg-status-success border-status-success',
  warning: 'bg-status-warning border-status-warning',
  error: 'bg-status-error border-status-error',
  info: 'bg-status-info border-status-info',
};

interface ToastItemProps {
  toast: BaseToast.Root.ToastObject<ToastExtraData>;
  renderIcon?: (variant: ToastVariant) => React.ReactNode;
  renderCloseIcon?: () => React.ReactNode;
}

function ToastItem({ toast, renderIcon, renderCloseIcon }: ToastItemProps) {
  const variant = toast.data?.variant || 'default';
  const displayIcon = toast.data?.icon ?? (renderIcon ? renderIcon(variant) : null);

  return (
    <BaseToast.Root
      toast={toast}
      className={`
        pointer-events-auto
        p-4
        border
        rounded-sm
        shadow-raised
        animate-slideIn
        ${variantStyles[variant]}
      `.trim()}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {displayIcon && (
          <span className="flex-shrink-0">
            {displayIcon}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <BaseToast.Title
            render={(props) => (
              <span
                {...props}
                className="block font-heading text-sm uppercase text-content-primary"
              />
            )}
          />
          {toast.description && (
            <BaseToast.Description
              render={(props) => (
                <span
                  {...props}
                  className="block text-content-secondary mt-1"
                />
              )}
            />
          )}
        </div>

        <BaseToast.Close
          className="text-content-muted hover:text-content-primary flex-shrink-0 -mt-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
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
        </BaseToast.Close>
      </div>
    </BaseToast.Root>
  );
}

export default ToastProvider;
