"use client"

import { useTransition } from "react"
import {
  Bell, CheckSquare, Handshake, User, Building2, FileText,
  Calendar, ClipboardList, Mail, Paperclip,
} from "lucide-react"
import { markAsRead } from "@/lib/actions/notifications"
import type { Notification } from "@/lib/types/notifications"

const ICON_MAP: Record<string, React.ElementType> = {
  CheckSquare, Handshake, User, Building2, FileText,
  Calendar, ClipboardList, Mail, Paperclip, Bell,
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification
  onRead?: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const isUnread = notification.status === "UNREAD"

  const IconComponent = ICON_MAP[notification.icon ?? ""] ?? Bell

  function handleClick() {
    if (isUnread) {
      startTransition(async () => {
        await markAsRead(notification.id)
        onRead?.()
      })
    }
    if (notification.link) {
      window.location.href = notification.link
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
        isUnread
          ? "bg-[rgba(212,115,78,0.04)]"
          : "bg-transparent"
      } hover:bg-[rgba(232,224,212,0.03)] disabled:opacity-60`}
    >
      <div className="mt-0.5 flex-shrink-0">
        <IconComponent className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[0.82rem] leading-snug ${
          isUnread ? "text-[var(--text)] font-medium" : "text-[var(--text-muted)]"
        }`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-[0.75rem] text-[var(--text-dim)] mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-[0.7rem] text-[var(--text-dim)] mt-1">
          {formatTimeAgo(notification.created_at)}
        </p>
      </div>
      {isUnread && (
        <div className="mt-2 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
        </div>
      )}
    </button>
  )
}
