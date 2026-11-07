import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Whisper — Every image has a story",
  description: "On-demand AI image descriptions. Read or listen, only when you ask.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
