import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claude Code — ResearchOS",
};

export default function ClaudeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full antialiased dark">
      <body className="h-full bg-background text-foreground overflow-hidden">
        {children}
      </body>
    </html>
  );
}
