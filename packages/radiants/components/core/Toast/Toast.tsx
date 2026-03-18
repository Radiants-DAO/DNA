'use client';

import React, { createContext, use, useCallback, useMemo, useRef } from 'react';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { Alert } from '../Alert/Alert';

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
  update: (id: string, updates: Partial<Omit<ToastData, 'id'>>) => void;
  promise: <T>(promiseFn: Promise<T>, options: {
    loading: string;
    success: string | ((value: T) => string);
    error: string | ((error: unknown) => string);
    variant?: ToastVariant;
  }) => Promise<T>;
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

  return (
    <BaseToast.Provider toastManager={managerRef.current} timeout={defaultDuration}>
      <ToastProviderInner
        managerRef={managerRef}
        defaultDuration={defaultDuration}
        renderIcon={renderIcon}
        renderCloseIcon={renderCloseIcon}
      >
        {children}
      </ToastProviderInner>
    </BaseToast.Provider>
  );
}

/** Inner provider — lives inside BaseToast.Provider so it can call useToastManager */
function ToastProviderInner({
  children,
  managerRef,
  defaultDuration,
  renderIcon,
  renderCloseIcon,
}: ToastProviderProps & { managerRef: React.RefObject<BaseToast.ToastManager<ToastExtraData>> }) {
  const { toasts: rawToasts } = BaseToast.useToastManager<ToastExtraData>();

  const toasts = useMemo(() => rawToasts.map((toast) => ({
    id: toast.id,
    title: typeof toast.title === 'string' ? toast.title : '',
    description: typeof toast.description === 'string' ? toast.description : undefined,
    variant: toast.data?.variant || 'default',
    icon: toast.data?.icon,
  })), [rawToasts]);

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
  }, [defaultDuration, managerRef]);

  const removeToast = useCallback((id: string) => {
    managerRef.current.close(id);
  }, [managerRef]);

  const update = useCallback((id: string, updates: Partial<Omit<ToastData, 'id'>>) => {
    managerRef.current.update(id, {
      title: updates.title,
      description: updates.description,
      type: updates.variant,
      timeout: updates.duration,
      data: updates.variant || updates.icon
        ? { variant: updates.variant || 'default', icon: updates.icon }
        : undefined,
    });
  }, [managerRef]);

  const promise = useCallback(<T,>(
    promiseFn: Promise<T>,
    options: { loading: string; success: string | ((v: T) => string); error: string | ((e: unknown) => string); variant?: ToastVariant },
  ): Promise<T> => {
    return managerRef.current.promise(promiseFn, {
      loading: { title: options.loading },
      success: (value: T) => ({ title: typeof options.success === 'function' ? options.success(value) : options.success }),
      error: (err: unknown) => ({ title: typeof options.error === 'function' ? options.error(err) : options.error }),
    });
  }, [managerRef]);

  const contextValue: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    update,
    promise,
  };

  return (
    <ToastContext value={contextValue}>
      {children}
      <ToastViewportInternal
        rawToasts={rawToasts}
        renderIcon={renderIcon}
        renderCloseIcon={renderCloseIcon}
      />
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
  rawToasts: BaseToast.Root.ToastObject<ToastExtraData>[];
  renderIcon?: (variant: ToastVariant) => React.ReactNode;
  renderCloseIcon?: () => React.ReactNode;
}

function ToastViewportInternal({ rawToasts, renderIcon, renderCloseIcon }: ToastViewportInternalProps) {
  if (rawToasts.length === 0) return null;

  return (
    <BaseToast.Viewport
      className="fixed top-4 right-4 z-[400] flex flex-col gap-2 w-[24rem] pointer-events-none"
    >
      {rawToasts.map((toast) => (
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
// Toast Item — renders using the Alert compound component
// ============================================================================

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
      data-rdna="toast"
      className="pointer-events-auto shadow-raised animate-slideIn"
    >
      <Alert.Root variant={variant}>
        {displayIcon && <Alert.Icon>{displayIcon}</Alert.Icon>}
        <Alert.Content>
          <BaseToast.Title
            render={(props) => (
              <Alert.Title {...props}>{props.children}</Alert.Title>
            )}
          />
          {toast.description && (
            <BaseToast.Description
              render={(props) => (
                <Alert.Description {...props}>{props.children}</Alert.Description>
              )}
            />
          )}
        </Alert.Content>
        <BaseToast.Close aria-label="Close alert">
          {renderCloseIcon ? renderCloseIcon() : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </BaseToast.Close>
      </Alert.Root>
    </BaseToast.Root>
  );
}

/** Renders an action button inside a toast. Must be used within a BaseToast.Root context. */
export const ToastAction = BaseToast.Action;

export default ToastProvider;
