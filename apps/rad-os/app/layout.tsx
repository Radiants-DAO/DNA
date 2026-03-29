import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RadOS",
    template: "%s — RadOS",
  },
  description: "A desktop-OS interface built with the RDNA design system.",
  metadataBase: new URL("https://rad-os.vercel.app"),
  openGraph: {
    title: "RadOS",
    description: "A desktop-OS interface built with the RDNA design system.",
    siteName: "RadOS",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "RadOS",
    description: "A desktop-OS interface built with the RDNA design system.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        {/* TODO: Add font preload hints once fonts are served from public/.
            Currently fonts are resolved via CSS @import from @rdna/radiants,
            so <link rel="preload"> cannot target them by URL.
            When migrated to public/fonts/:
            <link rel="preload" href="/fonts/Mondwest.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/Mondwest-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        */}
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
