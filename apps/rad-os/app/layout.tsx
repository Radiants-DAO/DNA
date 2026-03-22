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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
