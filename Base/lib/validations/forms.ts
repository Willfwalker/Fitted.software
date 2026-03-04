import { z } from "zod"
import type { FormField } from "@/lib/types/forms"

export const formFieldSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    "TEXT", "TEXTAREA", "EMAIL", "PHONE", "NUMBER", "DATE",
    "SELECT", "MULTI_SELECT", "CHECKBOX", "RADIO", "FILE", "HIDDEN",
  ]),
  label: z.string().min(1, "Label is required").max(200),
  placeholder: z.string().max(200).optional().or(z.literal("")),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional().default([]),
  default_value: z.string().max(500).optional().or(z.literal("")),
})

export const formSchema = z.object({
  name: z.string().min(1, "Form name is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  slug: z.string().max(100).optional().or(z.literal("")),
  fields: z.array(formFieldSchema).default([]),
  settings: z.record(z.string(), z.unknown()).optional().default({}),
})

export type FormFormData = z.infer<typeof formSchema>

/**
 * Build a Zod schema dynamically from form field definitions.
 * Used to validate public form submissions at runtime.
 */
export function buildSubmissionValidator(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    if (field.type === "HIDDEN") continue

    let fieldSchema: z.ZodTypeAny

    switch (field.type) {
      case "EMAIL":
        fieldSchema = z.string().email("Invalid email")
        break
      case "NUMBER":
        fieldSchema = z.coerce.number()
        break
      case "CHECKBOX":
        fieldSchema = z.coerce.boolean()
        break
      case "MULTI_SELECT":
        fieldSchema = z.array(z.string())
        break
      case "DATE":
        fieldSchema = z.string().min(1, "Date is required")
        break
      default:
        fieldSchema = z.string().max(10000)
        break
    }

    if (!field.required) {
      fieldSchema = fieldSchema.optional().or(z.literal(""))
    }

    shape[field.id] = fieldSchema
  }

  return z.object(shape)
}
