'use client';

import { Component, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { type AppProps } from '@/lib/apps';
import { AppWindow, Menubar } from '@rdna/radiants/components/core';
import { useScratchpadDocs } from './scratchpad/use-scratchpad-docs';

interface EditorErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
}

class EditorErrorBoundary extends Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
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
        <div className="flex h-full items-center justify-center gap-2 text-sm text-mute">
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

const ScratchpadEditor = dynamic(
  () => import('./scratchpad/ScratchpadEditor'),
  { ssr: false },
);

function useRenamePrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const [onConfirm, setOnConfirm] = useState<((value: string) => void) | null>(
    null,
  );

  function open(currentTitle: string, callback: (newTitle: string) => void) {
    setValue(currentTitle);
    setOnConfirm(() => callback);
    setIsOpen(true);
  }

  function confirm() {
    if (value.trim() && onConfirm) {
      onConfirm(value.trim());
    }
    setIsOpen(false);
  }

  function cancel() {
    setIsOpen(false);
  }

  return { isOpen, value, setValue, open, confirm, cancel };
}

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
      <div className="relative flex h-full flex-col">
        <div className="relative shrink-0">
          <div
            className="absolute left-0 right-0 top-0 z-10 h-1 rdna-pat rdna-pat--diagonal-dots"
            style={{ ['--pat-color' as string]: 'var(--color-ink)' }}
          />
          <div
            className="absolute left-0 right-0 top-1 z-10 h-1 rdna-pat rdna-pat--spray-grid"
            style={{ ['--pat-color' as string]: 'var(--color-ink)' }}
          />
        </div>

        <div className="shrink-0 border-b border-line bg-card pt-2">
          <Menubar.Root>
            <Menubar.Menu>
              <Menubar.Trigger>Documents</Menubar.Trigger>
              <Menubar.Content>
                <Menubar.Item shortcut="Ctrl+N" onClick={newDoc}>
                  New Document
                </Menubar.Item>
                <Menubar.Item onClick={newSpecPage}>New Spec Page</Menubar.Item>
                <Menubar.Separator />
                <Menubar.Label>Open</Menubar.Label>
                {docs.map((doc) => (
                  <Menubar.Item key={doc.id} onClick={() => switchDoc(doc.id)}>
                    {doc.id === activeId ? `● ${doc.title}` : `  ${doc.title}`}
                  </Menubar.Item>
                ))}
                <Menubar.Separator />
                <Menubar.Item onClick={() => rename.open(activeDoc.title, renameDoc)}>
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

        {rename.isOpen ? (
          <div className="flex shrink-0 items-center gap-2 border-b border-line bg-card px-3 py-2">
            <span className="font-joystix text-sm text-mute">Rename:</span>
            <input
              className="flex-1 border border-line bg-page px-2 py-1 text-sm text-main outline-none"
              style={{ fontFamily: 'var(--font-sans)' }}
              value={rename.value}
              onChange={(event) => rename.setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  rename.confirm();
                }
                if (event.key === 'Escape') {
                  rename.cancel();
                }
              }}
              autoFocus
            />
            <button
              className="px-2 py-1 text-sm text-accent"
              onClick={rename.confirm}
            >
              Save
            </button>
            <button
              className="px-2 py-1 text-sm text-mute"
              onClick={rename.cancel}
            >
              Cancel
            </button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-hidden bg-card">
          <EditorErrorBoundary key={activeId} onReset={() => saveContent([])}>
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
