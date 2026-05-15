import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitGarden",
  description: "Grow a garden and care for a pet with every GitHub push."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
