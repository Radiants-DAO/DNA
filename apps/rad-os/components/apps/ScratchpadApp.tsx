'use client';

import { Component, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { type AppProps } from '@/lib/apps';
import { AppWindow, Menubar } from '@rdna/radiants/components/core';
import { useScratchpadDocs } from './scratchpad/use-scratchpad-docs';

// ============================================================================
// Error Boundary — catches BlockNote initialContent parse failures
// ============================================================================

interface EditorErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
}

class EditorErrorBoundary extends Component<EditorErrorBoundaryProps, EditorErrorBoundaryState> {
  state: EditorErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): EditorErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    if (error.message?.includes('initialContent')) {
      this.props.onReset();
    }
  }

  componentDidUpdate(prevProps: EditorErrorBoundaryProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-mute text-sm gap-2">
          <span>Document was corrupted.</span>
          <button
            className="text-accent underline"
            onClick={() => {
              this.props.onReset();
              this.setState({ hasError: false });
            }}
          >
            Reset
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// BlockNote requires browser APIs — load client-only
const ScratchpadEditor = dynamic(
  () => import('./scratchpad/ScratchpadEditor'),
  { ssr: false },
);

// ============================================================================
// Rename Dialog (inline prompt — keeps it simple)
// ============================================================================

function useRenamePrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const [onConfirm, setOnConfirm] = useState<((v: string) => void) | null>(null);

  function open(currentTitle: string, cb: (newTitle: string) => void) {
    setValue(currentTitle);
    setOnConfirm(() => cb);
    setIsOpen(true);
  }

  function confirm() {
    if (value.trim() && onConfirm) onConfirm(value.trim());
    setIsOpen(false);
  }

  function cancel() {
    setIsOpen(false);
  }

  return { isOpen, value, setValue, open, confirm, cancel };
}

// ============================================================================
// Component
// ============================================================================

export function ScratchpadApp({ windowId: _windowId }: AppProps) {
  const {
    docs,
    activeDoc,
    activeId,
    switchDoc,
    newDoc,
    newSpecPage,
    saveContent,
    renameDoc,
    deleteDoc,
  } = useScratchpadDocs();

  const rename = useRenamePrompt();

  return (
    <AppWindow.Content layout="bleed">
      <div className="h-full relative flex flex-col">
        {/* Pattern shadow strips */}
        <div className="relative shrink-0">
          <div
            className="absolute top-0 left-0 right-0 h-1 z-10"
            style={{ backgroundImage: 'var(--pat-diagonal-dots)', backgroundRepeat: 'repeat' }}
          />
          <div
            className="absolute top-1 left-0 right-0 h-1 z-10"
            style={{ backgroundImage: 'var(--pat-spray-grid)', backgroundRepeat: 'repeat' }}
          />
        </div>

        {/* Menubar */}
        <div className="bg-card border-b border-line shrink-0 pt-2">
          <Menubar.Root>
            <Menubar.Menu>
              <Menubar.Trigger>Documents</Menubar.Trigger>
              <Menubar.Content>
                <Menubar.Item shortcut="Ctrl+N" onClick={newDoc}>
                  New Document
                </Menubar.Item>
                <Menubar.Item onClick={newSpecPage}>
                  New Spec Page
                </Menubar.Item>
                <Menubar.Separator />
                <Menubar.Label>Open</Menubar.Label>
                {docs.map((doc) => (
                  <Menubar.Item
                    key={doc.id}
                    onClick={() => switchDoc(doc.id)}
                  >
                    {doc.id === activeId ? `● ${doc.title}` : `  ${doc.title}`}
                  </Menubar.Item>
                ))}
                <Menubar.Separator />
                <Menubar.Item
                  onClick={() => rename.open(activeDoc.title, renameDoc)}
                >
                  Rename...
                </Menubar.Item>
                <Menubar.Item
                  destructive
                  onClick={deleteDoc}
                  disabled={docs.length <= 1}
                >
                  Delete Current
                </Menubar.Item>
              </Menubar.Content>
            </Menubar.Menu>
          </Menubar.Root>
        </div>

        {/* Rename inline prompt */}
        {rename.isOpen && (
          <div className="bg-card border-b border-line px-3 py-2 flex items-center gap-2 shrink-0">
            <span className="text-sm text-mute font-joystix">Rename:</span>
            <input
              className="flex-1 bg-page text-main text-sm px-2 py-1 border border-line outline-none"
              style={{ fontFamily: 'var(--font-sans)' }}
              value={rename.value}
              onChange={(e) => rename.setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') rename.confirm();
                if (e.key === 'Escape') rename.cancel();
              }}
              autoFocus
            />
            <button
              className="text-sm text-accent px-2 py-1"
              onClick={rename.confirm}
            >
              Save
            </button>
            <button
              className="text-sm text-mute px-2 py-1"
              onClick={rename.cancel}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Editor surface */}
        <div className="bg-card flex-1 overflow-hidden min-h-0">
          <EditorErrorBoundary
            key={activeId}
            onReset={() => saveContent([])}
          >
            <ScratchpadEditor
              initialContent={activeDoc.content}
              onSave={saveContent}
            />
          </EditorErrorBoundary>
        </div>
      </div>
    </AppWindow.Content>
  );
}

export default ScratchpadApp;
