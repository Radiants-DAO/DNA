'use client';

import dynamic from 'next/dynamic';

const DesignSystemShowcase = dynamic(
  () => import('./DesignSystemShowcase'),
  { ssr: false }
);

export default function ComponentsPage() {
  return <DesignSystemShowcase />;
}
