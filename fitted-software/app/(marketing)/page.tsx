import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <span className="text-2xl font-semibold tracking-tight">fitted.</span>
        <Link
          href="/login"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            White-label SaaS,<br />
            <span className="text-[var(--accent)]">provisioned in minutes</span>
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-lg mx-auto">
            Each client gets their own codebase, database, and deployment —
            fully configured and ready to use.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="px-6 py-3 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
