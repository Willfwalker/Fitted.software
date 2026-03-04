"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

type Step = 1 | 2 | "3a" | "3b"
type Role = "OWNER" | "MEMBER" | null

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1)
  const [role, setRole] = useState<Role>(null)

  // Step 1
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({})

  // Step 3a
  const [orgName, setOrgName] = useState("")

  // Step 3b
  const [inviteCode, setInviteCode] = useState("")

  // Shared
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

  function handleRoleSelect(selectedRole: "OWNER" | "MEMBER") {
    setRole(selectedRole)
    setStep(selectedRole === "OWNER" ? "3a" : "3b")
  }

  async function handleOwnerSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim()) {
      setError("Organization name is required")
      return
    }
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          signup_role: "OWNER",
          org_name: orgName.trim(),
        },
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    window.location.href = "/dashboard"
  }

  async function handleEmployeeSignup(e: React.FormEvent) {
    e.preventDefault()
    const normalized = inviteCode.trim().toUpperCase()
    if (!normalized) {
      setError("Invite code is required")
      return
    }
    setError("")
    setLoading(true)

    // Validate invite code first
    try {
      const res = await fetch("/api/auth/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      })
      const data = await res.json()

      if (!data.valid) {
        setError(data.error || "Invalid invite code")
        setLoading(false)
        return
      }
    } catch {
      setError("Failed to validate invite code")
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          signup_role: "MEMBER",
          invite_code: normalized,
        },
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    window.location.href = "/dashboard"
  }

  function handleBack() {
    setError("")
    if (step === 2) setStep(1)
    else if (step === "3a" || step === "3b") setStep(2)
  }

  const currentStep = step === 1 ? 0 : step === 2 ? 1 : 2

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

        {/* Step indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center justify-center gap-2"
          style={{ marginBottom: 24 }}
        >
          {[0, 1, 2].map((i) => (
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

        {/* Auth card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]"
          style={{ padding: 40 }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Credentials */}
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
                  Get started with Fitted
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

            {/* Step 2: Role selection */}
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
                  How will you use Fitted?
                </h2>
                <p
                  className="text-sm text-[var(--text-muted)]"
                  style={{ marginBottom: 24 }}
                >
                  Choose your role to get started
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect("OWNER")}
                    className="flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-left cursor-pointer transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/[0.03]"
                    style={{ padding: "20px" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] shrink-0"
                      style={{ width: 44, height: 44 }}
                    >
                      {/* Building2 icon */}
                      <svg
                        style={{ width: 22, height: 22 }}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">
                        I&apos;m starting an organization
                      </p>
                      <p
                        className="text-xs text-[var(--text-muted)]"
                        style={{ marginTop: 4 }}
                      >
                        Create a new workspace and invite your team
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect("MEMBER")}
                    className="flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-left cursor-pointer transition-all duration-200 hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/[0.03]"
                    style={{ padding: "20px" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] shrink-0"
                      style={{ width: 44, height: 44 }}
                    >
                      {/* Users icon */}
                      <svg
                        style={{ width: 22, height: 22 }}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">
                        I&apos;m joining an organization
                      </p>
                      <p
                        className="text-xs text-[var(--text-muted)]"
                        style={{ marginTop: 4 }}
                      >
                        Enter an invite code from your team
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3a: Owner — Org name */}
            {step === "3a" && (
              <motion.div
                key="step3a"
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
                  Name your organization
                </h2>
                <p
                  className="text-sm text-[var(--text-muted)]"
                  style={{ marginBottom: 32 }}
                >
                  You can change this later in settings
                </p>

                <form onSubmit={handleOwnerSignup}>
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
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
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
                      "Create organization"
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 3b: Employee — Invite code */}
            {step === "3b" && (
              <motion.div
                key="step3b"
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

                <form onSubmit={handleEmployeeSignup}>
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

        {/* Footer */}
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
