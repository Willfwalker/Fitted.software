"use client"

import { useActionState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createActivity, type ActivityActionState } from "@/lib/actions/activities"

interface NoteFormProps {
  entityType: "contact" | "deal" | "company"
  entityId: string
}

export function NoteForm({ entityType, entityId }: NoteFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const action = createActivity.bind(null, entityType, entityId)
  const [state, formAction, isPending] = useActionState<ActivityActionState, FormData>(action, {})

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="flex gap-2">
        <Select name="type" defaultValue="NOTE">
          <SelectTrigger className="w-[130px] bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.82rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
            <SelectItem value="NOTE" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Note</SelectItem>
            <SelectItem value="EMAIL" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Email</SelectItem>
            <SelectItem value="CALL" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Call</SelectItem>
            <SelectItem value="MEETING" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Meeting</SelectItem>
          </SelectContent>
        </Select>
        <Input
          name="title"
          placeholder="Title"
          required
          className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.85rem] placeholder:text-[var(--text-dim)]"
        />
      </div>
      <Textarea
        name="content"
        placeholder="Write a note..."
        rows={3}
        className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.85rem] resize-none placeholder:text-[var(--text-dim)]"
      />
      {state.error && <p className="text-[0.82rem] text-red-400">{state.error}</p>}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5 text-[0.82rem]"
        >
          {isPending ? "Saving..." : "Add Note"}
        </Button>
      </div>
    </form>
  )
}
