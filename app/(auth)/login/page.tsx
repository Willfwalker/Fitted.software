"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    window.location.href = "/dashboard"
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg)] px-5 overflow-hidden">
      {/* Warm ambient glow */}
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
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <Link
            href="/"
            className="block text-center font-[family-name:var(--font-display)] text-[2.5rem] text-[var(--text)] tracking-tight mb-12"
          >
            fitted.
          </Link>
        </motion.div>

        {/* Auth card */}
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
            Welcome back
          </h2>
          <p
            className="text-sm text-[var(--text-muted)]"
            style={{ marginBottom: 32 }}
          >
            Sign in to your account
          </p>

          <form onSubmit={handleSignIn}>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-[var(--text-muted)] tracking-wide"
              style={{ marginBottom: 10 }}
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
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
              name="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] outline-none transition-colors duration-200 focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/10"
              style={{ height: 52, padding: "0 16px" }}
            />

            {error && (
              <p
                className="text-sm text-red-400"
                style={{ marginTop: 16 }}
              >
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
                "Sign in"
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-8 text-center text-sm text-[var(--text-dim)] leading-relaxed"
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[var(--accent)] hover:underline"
          >
            Sign up
          </Link>
        </motion.p>
      </div>
    </div>
  )
}
