import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Tester",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0B0B0B", color: "#E8E0D4", fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
