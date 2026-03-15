import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DNA Playground",
  description: "Component iteration and design comparison tool",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans bg-surface-primary text-content-primary antialiased">
        {children}
      </body>
    </html>
  );
}
