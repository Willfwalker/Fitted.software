import { z } from "zod"

export const clientPortalSchema = z.object({
  contact_id: z.string().uuid().optional().or(z.literal("")),
  company_id: z.string().uuid().optional().or(z.literal("")),
  permissions: z.object({
    invoices: z.boolean().default(true),
    projects: z.boolean().default(true),
    files: z.boolean().default(true),
    forms: z.boolean().default(true),
  }).default({ invoices: true, projects: true, files: true, forms: true }),
})

export type ClientPortalFormData = z.infer<typeof clientPortalSchema>
