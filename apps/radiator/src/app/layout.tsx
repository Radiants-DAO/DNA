import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'The Radiator',
  description: 'Irradiate your collection into 1/1 art',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-page text-main">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
