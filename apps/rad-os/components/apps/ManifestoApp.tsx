'use client';
import { type AppProps } from '@/lib/apps';
import { ManifestoBook } from './manifesto/ManifestoBook';

export function ManifestoApp({ windowId: _windowId }: AppProps) {
  return <ManifestoBook />;
}

export default ManifestoApp;
