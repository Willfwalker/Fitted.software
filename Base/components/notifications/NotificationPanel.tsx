"use client"

import { useTransition } from "react"
import { CheckCheck } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { markAllAsRead } from "@/lib/actions/notifications"
import { NotificationItem } from "./NotificationItem"
import type { Notification } from "@/lib/types/notifications"

export function NotificationPanel({
  notifications,
  loading,
  onUpdate,
}: {
  notifications: Notification[]
  loading?: boolean
  onUpdate: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const hasUnread = notifications.some((n) => n.status === "UNREAD")

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead()
      onUpdate()
    })
  }

  return (
    <div className="w-[360px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
          Notifications
        </span>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="flex items-center gap-1 text-[0.72rem] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>
      <ScrollArea className="h-[400px]">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-4 h-4 rounded bg-[var(--border)] mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[var(--border)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--border)] rounded w-1/2" />
                  <div className="h-2.5 bg-[var(--border)] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-[0.82rem] text-[var(--text-muted)]">No notifications</p>
            <p className="text-[0.72rem] text-[var(--text-dim)] mt-1">You&apos;re all caught up</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onUpdate}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
