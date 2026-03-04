"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Save,
  Eye,
  Send,
  ArrowLeft,
  Inbox,
  Archive,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormFieldEditor } from "./FormFieldEditor"
import { FormPreview } from "./FormPreview"
import { ShareFormButton } from "./ShareFormButton"
import type { Form, FormField } from "@/lib/types/forms"
import {
  updateForm,
  publishForm,
  archiveForm,
  unpublishForm,
} from "@/lib/actions/forms"

interface FormBuilderProps {
  form: Form
}

export function FormBuilder({ form }: FormBuilderProps) {
  const router = useRouter()
  const [name, setName] = useState(form.name)
  const [description, setDescription] = useState(form.description || "")
  const [fields, setFields] = useState<FormField[]>(form.fields)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const addField = () => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type: "TEXT",
      label: "",
      placeholder: "",
      required: false,
      options: [],
    }
    setFields([...fields, newField])
  }

  const updateField = (index: number, updated: FormField) => {
    const next = [...fields]
    next[index] = updated
    setFields(next)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    setError("")
    startTransition(async () => {
      const result = await updateForm(form.id, {
        name,
        description,
        fields: fields as unknown[],
      })
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const handlePublish = () => {
    startTransition(async () => {
      // Save first
      const saveResult = await updateForm(form.id, {
        name,
        description,
        fields: fields as unknown[],
      })
      if (saveResult.error) {
        setError(saveResult.error)
        return
      }
      const result = await publishForm(form.id)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveForm(form.id)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  const handleUnpublish = () => {
    startTransition(async () => {
      const result = await unpublishForm(form.id)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/forms"
          className="flex items-center gap-1.5 text-[0.82rem] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Forms
        </Link>

        <div className="flex items-center gap-2">
          {form.status === "ACTIVE" && (
            <ShareFormButton formId={form.id} existingToken={form.share_token} />
          )}

          <Link href={`/forms/${form.id}/submissions`}>
            <Button
              variant="ghost"
              className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
            >
              <Inbox className="h-3.5 w-3.5 mr-1.5" />
              Submissions ({form.submission_count})
            </Button>
          </Link>

          <Button
            variant="ghost"
            onClick={() => setShowPreview(!showPreview)}
            className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            {showPreview ? "Editor" : "Preview"}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isPending}
            variant="ghost"
            className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save
          </Button>

          {form.status === "DRAFT" && (
            <Button
              onClick={handlePublish}
              disabled={isPending || fields.length === 0}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5 text-[0.82rem]"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Publish
            </Button>
          )}

          {form.status === "ACTIVE" && (
            <Button
              onClick={handleUnpublish}
              disabled={isPending}
              variant="ghost"
              className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Unpublish
            </Button>
          )}

          {form.status !== "ARCHIVED" && (
            <Button
              onClick={handleArchive}
              disabled={isPending}
              variant="ghost"
              className="text-[var(--text-dim)] hover:text-[#EF5B5B] text-[0.82rem]"
            >
              <Archive className="h-3.5 w-3.5 mr-1.5" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[0.82rem] text-[#EF5B5B]">{error}</p>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor:
              form.status === "ACTIVE" ? "#5EC69A" : form.status === "ARCHIVED" ? "#E8A84C" : "#8A817A",
          }}
        />
        <span
          className="text-[0.72rem] font-medium uppercase tracking-wider"
          style={{
            color:
              form.status === "ACTIVE" ? "#5EC69A" : form.status === "ARCHIVED" ? "#E8A84C" : "#8A817A",
          }}
        >
          {form.status}
        </span>
      </div>

      {showPreview ? (
        <FormPreview name={name} description={description} fields={fields} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Fields editor */}
          <div className="space-y-4">
            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)]">
                <p className="text-[var(--text-muted)] text-[0.88rem] font-light mb-1">
                  No fields yet
                </p>
                <p className="text-[var(--text-dim)] text-[0.82rem] font-light mb-4">
                  Add fields to start building your form
                </p>
                <Button
                  onClick={addField}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5 text-[0.82rem]"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Field
                </Button>
              </div>
            ) : (
              <>
                {fields.map((field, index) => (
                  <FormFieldEditor
                    key={field.id}
                    field={field}
                    onUpdate={(f) => updateField(index, f)}
                    onRemove={() => removeField(index)}
                  />
                ))}
                <button
                  onClick={addField}
                  className="w-full py-3 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors text-[0.82rem] flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Field
                </button>
              </>
            )}
          </div>

          {/* Form settings sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
              <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                Settings
              </h3>
              <div>
                <Label className="text-[var(--text-muted)] text-[0.78rem]">Form Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)]"
                />
              </div>
              <div>
                <Label className="text-[var(--text-muted)] text-[0.78rem]">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1.5 bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] resize-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-2">
              <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                Summary
              </h3>
              <div className="flex justify-between text-[0.82rem]">
                <span className="text-[var(--text-muted)] font-light">Fields</span>
                <span className="text-[var(--text)]">{fields.length}</span>
              </div>
              <div className="flex justify-between text-[0.82rem]">
                <span className="text-[var(--text-muted)] font-light">Required</span>
                <span className="text-[var(--text)]">
                  {fields.filter((f) => f.required).length}
                </span>
              </div>
              <div className="flex justify-between text-[0.82rem]">
                <span className="text-[var(--text-muted)] font-light">Submissions</span>
                <span className="text-[var(--text)]">{form.submission_count}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
