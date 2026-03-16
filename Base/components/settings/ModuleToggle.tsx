"use client"

import { useState, useTransition } from "react"
import { ALL_MODULES, type ModuleKey } from "@/lib/config/modules"
import { updateEnabledModules } from "@/lib/actions/modules"

interface ModuleToggleProps {
  enabledModules: ModuleKey[]
}

export function ModuleToggle({ enabledModules }: ModuleToggleProps) {
  const [modules, setModules] = useState<ModuleKey[]>(enabledModules)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const toggle = (key: ModuleKey) => {
    setModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
    setSaved(false)
  }

  const save = () => {
    startTransition(async () => {
      const result = await updateEnabledModules(modules)
      if (!result.error) setSaved(true)
    })
  }

  const hasChanges = JSON.stringify([...modules].sort()) !== JSON.stringify([...enabledModules].sort())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[0.9rem] text-[var(--text)] font-light">Modules</h3>
          <p className="text-[0.72rem] text-[var(--text-dim)] mt-0.5">Choose which modules appear in the sidebar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {ALL_MODULES.map((mod) => {
          const enabled = modules.includes(mod.key)
          return (
            <button
              key={mod.key}
              type="button"
              onClick={() => toggle(mod.key)}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 ${
                enabled
                  ? "bg-[rgba(212,115,78,0.06)] border border-[rgba(212,115,78,0.2)]"
                  : "bg-transparent border border-[var(--border)] opacity-50"
              }`}
            >
              <mod.icon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" strokeWidth={1.8} />
              <div className="flex-1 min-w-0">
                <p className="text-[0.82rem] text-[var(--text)] font-light">{mod.label}</p>
                <p className="text-[0.68rem] text-[var(--text-dim)] mt-0.5">{mod.description}</p>
              </div>
              <div
                className={`w-8 h-[18px] rounded-full transition-colors duration-200 flex items-center ${
                  enabled ? "bg-[var(--accent)] justify-end" : "bg-[var(--border)] justify-start"
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white mx-[2px]" />
              </div>
            </button>
          )
        })}
      </div>

      {hasChanges && (
        <button
          onClick={save}
          disabled={isPending}
          className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-white text-[0.82rem] font-light transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      )}

      {saved && !hasChanges && (
        <p className="text-[0.72rem] text-[var(--accent)] text-center">Modules updated</p>
      )}
    </div>
  )
}
