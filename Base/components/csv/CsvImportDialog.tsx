"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import Papa from "papaparse"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ColumnMapper } from "./ColumnMapper"
import { ImportPreviewTable } from "./ImportPreviewTable"
import { bulkImportContacts, bulkImportCompanies } from "@/lib/actions/csv"

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "contacts" | "companies"
}

const CONTACT_FIELDS = [
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "title", label: "Title" },
  { value: "notes", label: "Notes" },
]

const COMPANY_FIELDS = [
  { value: "name", label: "Company Name" },
  { value: "domain", label: "Domain" },
  { value: "industry", label: "Industry" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
  { value: "notes", label: "Notes" },
]

type Step = "upload" | "map" | "preview"

export function CsvImportDialog({ open, onOpenChange, type }: CsvImportDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>("upload")
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [mappedRows, setMappedRows] = useState<Record<string, string>[]>([])
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({})
  const [result, setResult] = useState<{ count?: number; error?: string } | null>(null)

  const fields = type === "contacts" ? CONTACT_FIELDS : COMPANY_FIELDS
  const requiredFields = type === "contacts" ? ["first_name", "last_name"] : ["name"]

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        setCsvHeaders(headers)
        setCsvData(results.data as Record<string, string>[])

        // Auto-map by name similarity
        const autoMapping: Record<string, string> = {}
        headers.forEach((h) => {
          const lower = h.toLowerCase().replace(/[^a-z]/g, "")
          const match = fields.find((f) =>
            f.value.replace("_", "") === lower || f.label.toLowerCase().replace(/\s/g, "") === lower
          )
          autoMapping[h] = match?.value || "_skip"
        })
        setMapping(autoMapping)
        setStep("map")
      },
    })
  }, [fields])

  const handleMapping = (csvHeader: string, schemaField: string) => {
    setMapping((prev) => ({ ...prev, [csvHeader]: schemaField }))
  }

  const handlePreview = () => {
    const mapped = csvData.map((row) => {
      const result: Record<string, string> = {}
      Object.entries(mapping).forEach(([csvH, field]) => {
        if (field !== "_skip") {
          result[field] = row[csvH] || ""
        }
      })
      return result
    })

    // Validate
    const validationErrors: Record<number, Record<string, string>> = {}
    mapped.forEach((row, i) => {
      requiredFields.forEach((f) => {
        if (!row[f]?.trim()) {
          if (!validationErrors[i]) validationErrors[i] = {}
          validationErrors[i][f] = "Required"
        }
      })
    })

    setMappedRows(mapped)
    setErrors(validationErrors)
    setStep("preview")
  }

  const handleImport = () => {
    const validRows = mappedRows.filter((_, i) => !errors[i])
    if (validRows.length === 0) return

    startTransition(async () => {
      const res = type === "contacts"
        ? await bulkImportContacts(validRows as { first_name: string; last_name: string; email?: string; phone?: string; title?: string; notes?: string }[])
        : await bulkImportCompanies(validRows as { name: string; domain?: string; industry?: string; email?: string; phone?: string; address?: string; notes?: string }[])

      setResult(res)
      if (res.count) {
        router.refresh()
      }
    })
  }

  const reset = () => {
    setStep("upload")
    setCsvHeaders([])
    setCsvData([])
    setMapping({})
    setMappedRows([])
    setErrors({})
    setResult(null)
  }

  const handleClose = (open: boolean) => {
    if (!open) reset()
    onOpenChange(open)
  }

  const targetFields = fields.map((f) => f.value)
  const previewHeaders = targetFields.filter((f) => Object.values(mapping).includes(f))
  const errorCount = Object.keys(errors).length
  const validCount = mappedRows.length - errorCount

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)]">
            Import {type === "contacts" ? "Contacts" : "Companies"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {step === "upload" && (
            <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center">
              <Upload className="h-8 w-8 mx-auto text-[var(--text-dim)] mb-3" />
              <p className="text-[0.88rem] text-[var(--text-muted)] font-light mb-3">
                Upload a CSV file
              </p>
              <label className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] text-[0.82rem] cursor-pointer transition-colors">
                Choose File
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}

          {step === "map" && (
            <>
              <ColumnMapper
                csvHeaders={csvHeaders}
                schemaFields={fields}
                mapping={mapping}
                onMappingChange={handleMapping}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={reset} className="text-[var(--text-muted)]">
                  Back
                </Button>
                <Button
                  onClick={handlePreview}
                  disabled={!requiredFields.every((f) => Object.values(mapping).includes(f))}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
                >
                  Preview
                </Button>
              </div>
            </>
          )}

          {step === "preview" && !result && (
            <>
              <div className="flex items-center gap-3 text-[0.82rem]">
                <span className="text-[var(--text-muted)] font-light">{mappedRows.length} rows found</span>
                {errorCount > 0 && (
                  <span className="text-red-400 font-light">{errorCount} with errors</span>
                )}
                <span className="text-[#5EC69A] font-light">{validCount} valid</span>
              </div>
              <ImportPreviewTable
                headers={previewHeaders}
                rows={mappedRows}
                errors={errors}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setStep("map")} className="text-[var(--text-muted)]">
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isPending || validCount === 0}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
                >
                  {isPending ? "Importing..." : `Import ${validCount} ${type}`}
                </Button>
              </div>
            </>
          )}

          {result && (
            <div className="text-center py-4">
              {result.error ? (
                <p className="text-red-400 text-[0.88rem]">{result.error}</p>
              ) : (
                <p className="text-[#5EC69A] text-[0.88rem]">
                  Successfully imported {result.count} {type}!
                </p>
              )}
              <Button
                onClick={handleClose.bind(null, false)}
                className="mt-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
