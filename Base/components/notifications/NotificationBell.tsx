"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getUnreadCount, getNotifications } from "@/lib/actions/notifications"
import { NotificationPanel } from "./NotificationPanel"
import type { Notification } from "@/lib/types/notifications"

const POLL_INTERVAL = 30_000 // 30 seconds

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    const count = await getUnreadCount()
    setUnreadCount(count)
    if (open) {
      const result = await getNotifications(30, 0)
      setNotifications(result.data)
    }
  }, [open])

  // Poll for unread count
  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [refresh])

  // Load notifications when panel opens
  useEffect(() => {
    if (open) {
      setLoading(true)
      getNotifications(30, 0).then((result) => {
        setNotifications(result.data)
        setLoading(false)
      })
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex items-center justify-center w-8 h-8 rounded-md hover:bg-[rgba(232,224,212,0.03)] transition-colors cursor-pointer">
          <Bell className="w-4 h-4 text-[var(--text-muted)]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[0.6rem] font-medium text-white bg-[var(--accent)] rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="p-0 bg-[var(--bg-elevated)] border-[var(--border)] shadow-xl w-auto"
      >
        <NotificationPanel notifications={notifications} loading={loading} onUpdate={refresh} />
      </PopoverContent>
    </Popover>
  )
}
