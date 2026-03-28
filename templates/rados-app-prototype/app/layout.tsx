import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '__APP_PASCAL_NAME__',
  description: 'Standalone RadOS prototype scaffold for __APP_PASCAL_NAME__.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
