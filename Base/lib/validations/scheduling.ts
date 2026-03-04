import { z } from "zod"

export const calendarEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(10000).optional().or(z.literal("")),
  location: z.string().max(500).optional().or(z.literal("")),
  start_at: z.string().min(1, "Start time is required"),
  end_at: z.string().optional().or(z.literal("")),
  all_day: z.coerce.boolean().default(false),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).default("SCHEDULED"),
  color: z.string().optional().or(z.literal("")).or(z.literal("__none__")),
  contact_id: z.string().uuid().optional().or(z.literal("")).or(z.literal("__none__")),
  company_id: z.string().uuid().optional().or(z.literal("")).or(z.literal("__none__")),
  deal_id: z.string().uuid().optional().or(z.literal("")).or(z.literal("__none__")),
  assigned_to: z.string().uuid().optional().or(z.literal("")).or(z.literal("__none__")),
})

export type CalendarEventFormData = z.infer<typeof calendarEventSchema>
