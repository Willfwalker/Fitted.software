import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
              fitted.
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                Clients
              </Link>
              <Link href="/provision" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                Provision
              </Link>
            </nav>
          </div>
          <p className="text-xs text-[var(--text-dim)]">{user.email}</p>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-8 py-8">
        {children}
      </main>
    </div>
  )
}
