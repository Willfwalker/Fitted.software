"use client"

import { useState, useTransition } from "react"
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
  type NotificationPreference,
} from "@/lib/types/notifications"
import { updateNotificationPreferences } from "@/lib/actions/notifications"

interface NotificationPreferencesProps {
  preferences: NotificationPreference[]
}

export function NotificationPreferences({ preferences }: NotificationPreferencesProps) {
  // Build initial state: default true (opt-out model), override with saved prefs
  const prefMap = new Map(preferences.map((p) => [p.category, p.enabled]))
  const initialState = Object.fromEntries(
    NOTIFICATION_CATEGORIES.map((c) => [c.key, prefMap.get(c.key as NotificationCategory) ?? true])
  ) as Record<NotificationCategory, boolean>

  const [enabled, setEnabled] = useState(initialState)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const toggle = (key: NotificationCategory) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  const save = () => {
    startTransition(async () => {
      const prefs = NOTIFICATION_CATEGORIES.map((c) => ({
        category: c.key,
        enabled: enabled[c.key],
      }))
      const result = await updateNotificationPreferences(prefs)
      if (!result.error) setSaved(true)
    })
  }

  const hasChanges =
    JSON.stringify(enabled) !==
    JSON.stringify(
      Object.fromEntries(
        NOTIFICATION_CATEGORIES.map((c) => [c.key, prefMap.get(c.key as NotificationCategory) ?? true])
      )
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[0.9rem] text-[var(--text)] font-light">Notifications</h3>
          <p className="text-[0.72rem] text-[var(--text-dim)] mt-0.5">Choose which notifications you receive</p>
        </div>
      </div>

      <div className="space-y-1">
        {NOTIFICATION_CATEGORIES.map((cat) => {
          const isEnabled = enabled[cat.key]
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => toggle(cat.key)}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 ${
                isEnabled
                  ? "bg-[rgba(212,115,78,0.06)] border border-[rgba(212,115,78,0.2)]"
                  : "bg-transparent border border-[var(--border)] opacity-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[0.82rem] text-[var(--text)] font-light">{cat.label}</p>
                <p className="text-[0.68rem] text-[var(--text-dim)] mt-0.5">{cat.description}</p>
              </div>
              <div
                className={`w-8 h-[18px] rounded-full transition-colors duration-200 flex items-center ${
                  isEnabled ? "bg-[var(--accent)] justify-end" : "bg-[var(--border)] justify-start"
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
        <p className="text-[0.72rem] text-[var(--accent)] text-center">Notification preferences updated</p>
      )}
    </div>
  )
}
