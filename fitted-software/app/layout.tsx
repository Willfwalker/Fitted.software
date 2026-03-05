import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Fitted Software",
  description: "Provision and manage Fitted client instances",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
