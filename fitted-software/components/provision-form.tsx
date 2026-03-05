"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const ALL_MODULES = [
  { key: "crm", label: "CRM", description: "Contacts, companies, deals" },
  { key: "tasks", label: "Projects", description: "Tasks and project management" },
  { key: "calendar", label: "Calendar", description: "Scheduling and events" },
  { key: "invoicing", label: "Invoices", description: "Billing and invoicing" },
  { key: "messaging", label: "Messages", description: "Email and messaging" },
  { key: "files", label: "Files", description: "File storage" },
  { key: "forms", label: "Forms", description: "Form builder" },
  { key: "reports", label: "Reports", description: "Analytics" },
] as const

export function ProvisionForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [accentColor, setAccentColor] = useState("#D4734E")
  const [customDomain, setCustomDomain] = useState("")
  const [modules, setModules] = useState<string[]>(
    ALL_MODULES.map((m) => m.key)
  )

  const toggleModule = (key: string) => {
    setModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          contactEmail,
          accentColor,
          customDomain: customDomain || undefined,
          modules,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Provisioning failed")

      router.push(`/provision/${data.slug}/status`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Name */}
      <div className="space-y-2">
        <label className="block text-sm text-[var(--text)]">Business Name *</label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
          placeholder="Acme Agency"
          className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Contact Email */}
      <div className="space-y-2">
        <label className="block text-sm text-[var(--text)]">Contact Email *</label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          required
          placeholder="admin@acme.com"
          className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Accent Color */}
      <div className="space-y-2">
        <label className="block text-sm text-[var(--text)]">Accent Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-10 h-10 rounded border border-[var(--border)] bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Custom Domain */}
      <div className="space-y-2">
        <label className="block text-sm text-[var(--text)]">Custom Domain (optional)</label>
        <input
          type="text"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
          placeholder="app.acme.com"
          className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Modules */}
      <div className="space-y-3">
        <label className="block text-sm text-[var(--text)]">Modules</label>
        <div className="grid grid-cols-2 gap-2">
          {ALL_MODULES.map((mod) => {
            const enabled = modules.includes(mod.key)
            return (
              <button
                key={mod.key}
                type="button"
                onClick={() => toggleModule(mod.key)}
                className={`text-left rounded-lg px-4 py-3 border transition-all duration-200 ${
                  enabled
                    ? "border-[rgba(212,115,78,0.3)] bg-[rgba(212,115,78,0.06)]"
                    : "border-[var(--border)] opacity-50"
                }`}
              >
                <p className="text-sm text-[var(--text)]">{mod.label}</p>
                <p className="text-xs text-[var(--text-dim)] mt-0.5">{mod.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Starting provisioning..." : "Provision Client"}
      </button>
    </form>
  )
}
