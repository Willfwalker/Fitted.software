"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square } from "lucide-react"
import { startTimer, pauseTimer, resumeTimer, stopTimer } from "@/lib/actions/time-entries"
import type { TimeEntry } from "@/lib/types/time-tracking"

interface TimerButtonProps {
  taskId?: string
  runningEntry?: TimeEntry | null
}

export function TimerButton({ taskId, runningEntry }: TimerButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const isRunning = runningEntry && runningEntry.timer_started_at && !runningEntry.timer_paused_at
  const isPaused = runningEntry && runningEntry.timer_paused_at
  // When no taskId prop (e.g. general time-tracking page), show controls for any running timer
  const isForThisTask = taskId === undefined || runningEntry?.task_id === taskId

  // Calculate elapsed time
  useEffect(() => {
    if (!isRunning || !runningEntry?.timer_started_at) {
      if (isPaused && runningEntry) {
        setElapsed(runningEntry.duration_minutes * 60)
      }
      return
    }

    const startedAt = new Date(runningEntry.timer_started_at).getTime()
    const baseSeconds = (runningEntry.duration_minutes || 0) * 60

    const tick = () => {
      const now = Date.now()
      setElapsed(baseSeconds + Math.floor((now - startedAt) / 1000))
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [isRunning, isPaused, runningEntry])

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleStart = useCallback(async () => {
    setLoading(true)
    await startTimer({ task_id: taskId })
    setLoading(false)
    router.refresh()
  }, [taskId, router])

  const handlePause = useCallback(async () => {
    if (!runningEntry) return
    setLoading(true)
    await pauseTimer(runningEntry.id)
    setLoading(false)
    router.refresh()
  }, [runningEntry, router])

  const handleResume = useCallback(async () => {
    if (!runningEntry) return
    setLoading(true)
    await resumeTimer(runningEntry.id)
    setLoading(false)
    router.refresh()
  }, [runningEntry, router])

  const handleStop = useCallback(async () => {
    if (!runningEntry) return
    setLoading(true)
    await stopTimer(runningEntry.id)
    setElapsed(0)
    setLoading(false)
    router.refresh()
  }, [runningEntry, router])

  // No running timer or running for a different task
  if (!runningEntry || !isForThisTask) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleStart}
        disabled={loading || (!!runningEntry && !isForThisTask)}
        className="gap-1.5 border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]"
      >
        <Play className="h-3.5 w-3.5" />
        Start Timer
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[0.85rem] text-[var(--accent)] tabular-nums">
        {formatTime(elapsed)}
      </span>

      {isRunning ? (
        <Button
          variant="outline"
          size="icon"
          onClick={handlePause}
          disabled={loading}
          className="h-7 w-7 border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)]"
        >
          <Pause className="h-3.5 w-3.5" />
        </Button>
      ) : isPaused ? (
        <Button
          variant="outline"
          size="icon"
          onClick={handleResume}
          disabled={loading}
          className="h-7 w-7 border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)]"
        >
          <Play className="h-3.5 w-3.5" />
        </Button>
      ) : null}

      <Button
        variant="outline"
        size="icon"
        onClick={handleStop}
        disabled={loading}
        className="h-7 w-7 border-[var(--border)] text-[var(--text-muted)] hover:text-red-400"
      >
        <Square className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
