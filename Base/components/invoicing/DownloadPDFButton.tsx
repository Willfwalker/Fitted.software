"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DownloadPDFButtonProps {
  invoiceId: string
  invoiceNumber: string
}

export function DownloadPDFButton({ invoiceId, invoiceNumber }: DownloadPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (!res.ok) throw new Error("Failed to generate PDF")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Silently fail — could add toast later
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleDownload}
      disabled={loading}
      className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <FileDown className="h-3.5 w-3.5 mr-1.5" />
      )}
      PDF
    </Button>
  )
}
