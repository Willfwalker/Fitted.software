"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Check, X } from "lucide-react"
import { disconnectGoogleCalendar } from "@/lib/actions/google-calendar"
import type { Integration } from "@/lib/types/integrations"

interface GoogleCalendarConnectProps {
  integration: Integration | null
}

export function GoogleCalendarConnect({ integration }: GoogleCalendarConnectProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${window.location.origin}/api/auth/google-calendar`
    const scope = "https://www.googleapis.com/auth/calendar"

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    url.searchParams.set("client_id", clientId || "")
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("response_type", "code")
    url.searchParams.set("scope", scope)
    url.searchParams.set("access_type", "offline")
    url.searchParams.set("prompt", "consent")

    window.location.href = url.toString()
  }

  const handleDisconnect = async () => {
    setLoading(true)
    await disconnectGoogleCalendar()
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-[var(--border)] p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
            <Calendar className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-[0.9rem] font-medium text-[var(--text)]">
              Google Calendar
            </p>
            <p className="text-[0.78rem] text-[var(--text-muted)]">
              Sync events between Fitted and Google Calendar
            </p>
          </div>
        </div>

        {integration ? (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[0.7rem] px-2 py-0.5 border-0 font-medium gap-1"
              style={{ color: "#5EC69A", backgroundColor: "#5EC69A15" }}
            >
              <Check className="h-3 w-3" />
              Connected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={loading}
              className="text-[var(--text-dim)] hover:text-red-400 gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            size="sm"
            className="bg-[var(--accent)] text-white hover:opacity-90"
          >
            Connect
          </Button>
        )}
      </div>

      {integration && integration.token_expiry && (
        <p className="text-[0.72rem] text-[var(--text-dim)] mt-3">
          Token expires: {new Date(integration.token_expiry).toLocaleString()}
        </p>
      )}
    </div>
  )
}
