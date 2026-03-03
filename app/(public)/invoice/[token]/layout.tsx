export default function PublicInvoiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-[900px]">{children}</div>
    </div>
  )
}
