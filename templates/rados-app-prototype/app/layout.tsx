import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '__APP_PASCAL_NAME__',
  description: 'A desktop-OS interface built with the RDNA design system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
