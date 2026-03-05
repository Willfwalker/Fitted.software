"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { signupWithInvite } from "@/lib/actions/signup"

const ease = [0.22, 1, 0.36, 1] as const

type Step = 1 | 2

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({})

  const [inviteCode, setInviteCode] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function validateStep1(): boolean {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = "Full name is required"
    if (!email.trim()) errors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Enter a valid email"
    if (password.length < 8)
      errors.password = "Password must be at least 8 characters"
    setStep1Errors(errors)
    return Object.keys(errors).length === 0
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    const normalized = inviteCode.trim().toUpperCase()
    if (!normalized) {
      setError("Invite code is required")
      return
    }
    setError("")
    setLoading(true)

    const fd = new FormData()
    fd.set("fullName", fullName.trim())
    fd.set("email", email.trim())
    fd.set("password", password)
    fd.set("inviteCode", normalized)

    const result = await signupWithInvite(fd)

    setLoading(false)
    if (result?.error) {
      setError(result.error)
    }
  }

  function handleBack() {
    setError("")
    setStep(1)
  }

  const currentStep = step === 1 ? 0 : 1

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
          <Link
            href="/login"
            className="block text-center font-[family-name:var(--font-display)] text-[2.5rem] text-[var(--text)] tracking-tight mb-12"
          >
            fitted.
          </Link>
        </motion.div>

        {/* Step indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center justify-center gap-2"
          style={{ marginBottom: 24 }}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentStep ? 24 : 8,
                height: 8,
                background:
                  i === currentStep
                    ? "var(--accent)"
                    : i < currentStep
                      ? "var(--accent)"
                      : "var(--border)",
                opacity: i <= currentStep ? 1 : 0.5,
              }}
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]"
          style={{ padding: 40 }}
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease }}
              >
                <h2
                  className="font-[family-name:var(--font-display)] text-xl text-[var(--text)]"
                  style={{ marginBottom: 8 }}
                >
                  Create your account
                </h2>
                <p
                  className="text-sm text-[var(--text-muted)]"
                  style={{ marginBottom: 32 }}
                >
                  Join your team on Fitted
                </p>

                <form onSubmit={handleStep1}>
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-medium text-[var(--text-muted)] tracking-wide"
                    style={{ marginBottom: 10 }}
                  >
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] outline-none transition-colors duration-200 focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/10"
                    style={{ height: 52, padding: "0 16px" }}
                  />
                  {step1Errors.fullName && (
                    <p className="text-xs text-red-400" style={{ marginTop: 6 }}>
                      {step1Errors.fullName}
                    </p>
                  )}

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] outline-none transition-colors duration-200 focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/10"
                    style={{ height: 52, padding: "0 16px" }}
                  />
                  {step1Errors.email && (
                    <p className="text-xs text-red-400" style={{ marginTop: 6 }}>
                      {step1Errors.email}
                    </p>
                  )}

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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] outline-none transition-colors duration-200 focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/10"
                    style={{ height: 52, padding: "0 16px" }}
                  />
                  {step1Errors.password && (
                    <p className="text-xs text-red-400" style={{ marginTop: 6 }}>
                      {step1Errors.password}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-xl bg-[var(--accent)] text-white text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[0_4px_24px_rgba(212,115,78,0.2)]"
                    style={{ height: 52, marginTop: 24 }}
                  >
                    Continue
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease }}
              >
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  style={{ marginBottom: 24 }}
                >
                  <svg
                    style={{ width: 16, height: 16 }}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                  Back
                </button>

                <h2
                  className="font-[family-name:var(--font-display)] text-xl text-[var(--text)]"
                  style={{ marginBottom: 8 }}
                >
                  Enter your invite code
                </h2>
                <p
                  className="text-sm text-[var(--text-muted)]"
                  style={{ marginBottom: 32 }}
                >
                  Ask your team admin for an invite code
                </p>

                <form onSubmit={handleSignup}>
                  <label
                    htmlFor="inviteCode"
                    className="block text-xs font-medium text-[var(--text-muted)] tracking-wide"
                    style={{ marginBottom: 10 }}
                  >
                    Invite code
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    placeholder="XXXX-XXXX"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="block w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] outline-none transition-colors duration-200 focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/10 tracking-widest font-mono"
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
                      "Join organization"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-8 text-center text-sm text-[var(--text-dim)] leading-relaxed"
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--accent)] hover:underline"
          >
            Sign in
          </Link>
        </motion.p>
      </div>
    </div>
  )
}
