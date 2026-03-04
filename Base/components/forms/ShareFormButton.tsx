"use client"

import { useState, useTransition } from "react"
import { Link2, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateShareToken } from "@/lib/actions/forms"

interface ShareFormButtonProps {
  formId: string
  existingToken?: string | null
}

export function ShareFormButton({ formId, existingToken }: ShareFormButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleCopy = () => {
    startTransition(async () => {
      let token = existingToken
      if (!token) {
        const result = await generateShareToken(formId)
        if (result.error || !result.shareToken) return
        token = result.shareToken
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const url = `${appUrl}/form/${token}`

      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Button
      variant="ghost"
      onClick={handleCopy}
      disabled={isPending}
      className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5 mr-1.5 text-[#5EC69A]" />
      ) : (
        <Link2 className="h-3.5 w-3.5 mr-1.5" />
      )}
      {copied ? "Copied!" : "Copy Link"}
    </Button>
  )
}
