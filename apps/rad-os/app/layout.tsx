import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RadOS",
  description: "Desktop-OS UI built with RDNA",
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
