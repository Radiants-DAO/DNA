// app/intern/layout.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Block access on production - only allow preview/development
const isProduction = process.env.VERCEL_ENV === 'production';

export const metadata: Metadata = {
  title: 'INTERN.exe | Internal Dashboard',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return 404 on production deployments
  if (isProduction) {
    notFound();
  }

  return <>{children}</>;
}
