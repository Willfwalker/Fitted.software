"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { setupOrganization } from "@/lib/actions/setup"

const ease = [0.22, 1, 0.36, 1] as const

export function SetupForm() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [orgName, setOrgName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const fd = new FormData()
    fd.set("fullName", fullName)
    fd.set("email", email)
    fd.set("password", password)
    fd.set("orgName", orgName)

    const result = await setupOrganization(fd)

    setLoading(false)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg)] px-5 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 600px 400px at 50% 30%, rgba(212, 115, 78, 0.07) 0%, transparent 70%),
            radial-gradient(ellipse 900px 600px at 50% 50%, rgba(26, 24, 22, 0.5) 0%, transparent 70%)
          `,
        }}
      />

      <div className="relative w-full max-w-[400px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <span className="block text-center font-[family-name:var(--font-display)] text-[2.5rem] text-[var(--text)] tracking-tight mb-12">
            fitted.
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]"
          style={{ padding: 40 }}
        >
          <h2
            className="font-[family-name:var(--font-display)] text-xl text-[var(--text)]"
            style={{ marginBottom: 8 }}
          >
            Set up your workspace
          </h2>
          <p
            className="text-sm text-[var(--text-muted)]"
            style={{ marginBottom: 32 }}
          >
            Create your organization and admin account
          </p>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="orgName"
              className="block text-xs font-medium text-[var(--text-muted)] tracking-wide"
              style={{ marginBottom: 10 }}
            >
              Organization name
            </label>
            <input
              id="orgName"
              type="text"
              placeholder="Acme Agency"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="block w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] outline-none transition-colors duration-200 focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/10"
              style={{ height: 52, padding: "0 16px" }}
            />

            <label
              htmlFor="fullName"
              className="block text-xs font-medium text-[var(--text-muted)] tracking-wide"
              style={{ marginBottom: 10, marginTop: 20 }}
            >
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Jane Smith"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] outline-none transition-colors duration-200 focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/10"
              style={{ height: 52, padding: "0 16px" }}
            />

            <label
              htmlFor="email"
              className="block text-xs font-medium text-[var(--text-muted)] tracking-wide"
              style={{ marginBottom: 10, marginTop: 20 }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] outline-none transition-colors duration-200 focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/10"
              style={{ height: 52, padding: "0 16px" }}
            />

            <label
              htmlFor="password"
              className="block text-xs font-medium text-[var(--text-muted)] tracking-wide"
              style={{ marginBottom: 10, marginTop: 20 }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] outline-none transition-colors duration-200 focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/10"
              style={{ height: 52, padding: "0 16px" }}
            />

            {error && (
              <p className="text-sm text-red-400" style={{ marginTop: 16 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-[var(--accent)] text-white text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[0_4px_24px_rgba(212,115,78,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ height: 52, marginTop: 24 }}
            >
              {loading ? (
                <div
                  className="border-2 border-white/30 border-t-white rounded-full animate-spin"
                  style={{ width: 16, height: 16 }}
                />
              ) : (
                "Create workspace"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
