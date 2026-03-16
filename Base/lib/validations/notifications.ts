import { z } from "zod"

export const createNotificationSchema = z.object({
  userId: z.string().uuid("Valid user ID required"),
  orgId: z.string().uuid("Valid org ID required"),
  title: z.string().min(1, "Title is required").max(500),
  body: z.string().max(2000).optional().or(z.literal("")),
  link: z.string().max(500).optional().or(z.literal("")),
  icon: z.string().max(50).optional().or(z.literal("")),
  sourceType: z.string().max(50).optional().or(z.literal("")),
  sourceId: z.string().uuid().optional().or(z.literal("")),
})

export type CreateNotificationData = z.infer<typeof createNotificationSchema>

const VALID_CATEGORIES = [
  "task", "deal", "contact", "invoice", "event", "file", "message", "form_submission",
] as const

export const updatePreferencesSchema = z.array(
  z.object({
    category: z.enum(VALID_CATEGORIES),
    enabled: z.boolean(),
  })
).min(1, "At least one preference required")

export type UpdatePreferencesData = z.infer<typeof updatePreferencesSchema>
