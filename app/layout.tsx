import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./dashboard.css";
import "./judge.css";
import "./questions.css";
import "./coding-hub.css";
import "./coding-compact.css";
import "./code-editor.css";
import "./accounts.css";

export const viewport: Viewport = {width:"device-width",initialScale:1,interactiveWidget:"resizes-content"};

export const metadata: Metadata = {
  title: "Placement Path — Your preparation dashboard",
  description: "Your daily placement dashboard with 59 topic guides, 590 practice questions, Java coding tasks, and GeeksforGeeks references.",
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
