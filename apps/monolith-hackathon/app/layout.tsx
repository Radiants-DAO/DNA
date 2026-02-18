import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solanamobile.radiant.nexus';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Monolith | Solana Mobile Hackathon',
  description: 'Solana Mobile & Radiants present Monolith — the second Solana Mobile Hackathon. Build the future of mobile crypto.',
  keywords: ['Solana', 'Mobile', 'Hackathon', 'Monolith', 'Crypto', 'Web3', 'Seeker', 'Radiants'],
  authors: [{ name: 'Solana Mobile' }, { name: 'Radiants' }],
  openGraph: {
    title: 'Monolith | Solana Mobile Hackathon',
    description: 'Solana Mobile & Radiants present Monolith — the second Solana Mobile Hackathon. Build the future of mobile crypto.',
    type: 'website',
    siteName: 'Monolith Hackathon',
    images: [
      {
        url: '/og-image.png',
        width: 1440,
        height: 810,
        alt: 'Monolith Hackathon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Monolith | Solana Mobile Hackathon',
    description: 'Solana Mobile & Radiants present Monolith — the second Solana Mobile Hackathon. Build the future of mobile crypto.',
    images: ['/og-image.png'],
    creator: '@solanamobile',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/PixeloidSans-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PixeloidMono.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Mondwest-Regular.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PixeloidSans.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="monolith-body">{children}</body>
    </html>
  );
}
