import { z } from "zod"

export const timeEntrySchema = z.object({
  task_id: z.string().uuid().optional().or(z.literal("")),
  deal_id: z.string().uuid().optional().or(z.literal("")),
  contact_id: z.string().uuid().optional().or(z.literal("")),
  company_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  duration_minutes: z.coerce.number().int().min(1, "Duration must be at least 1 minute"),
  date: z.string().min(1, "Date is required"),
  billable: z.coerce.boolean().default(true),
  rate: z.coerce.number().min(0).default(0),
})

export const timerStartSchema = z.object({
  task_id: z.string().uuid().optional().or(z.literal("")),
  deal_id: z.string().uuid().optional().or(z.literal("")),
  contact_id: z.string().uuid().optional().or(z.literal("")),
  company_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  billable: z.coerce.boolean().default(true),
  rate: z.coerce.number().min(0).default(0),
})

export const timerStopSchema = z.object({
  id: z.string().uuid(),
})

export type TimeEntryFormData = z.infer<typeof timeEntrySchema>
export type TimerStartFormData = z.infer<typeof timerStartSchema>
export type TimerStopFormData = z.infer<typeof timerStopSchema>
