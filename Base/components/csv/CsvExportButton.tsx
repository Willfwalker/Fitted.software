"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CsvExportButtonProps {
  exportAction: () => Promise<{ error?: string; csv?: string }>
  filename: string
}

export function CsvExportButton({ exportAction, filename }: CsvExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const result = await exportAction()
      if (result.csv) {
        const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${filename}.csv`
        link.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleExport}
      disabled={loading}
      className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
    >
      <Download className="h-3.5 w-3.5 mr-1.5" />
      {loading ? "Exporting..." : "Export"}
    </Button>
  )
}
