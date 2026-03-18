import { z } from "zod"

export const automationSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  trigger_type: z.enum([
    "DEAL_STAGE_CHANGED",
    "TASK_STATUS_CHANGED",
    "INVOICE_STATUS_CHANGED",
    "FORM_SUBMITTED",
    "TIME_LOGGED",
    "PAYMENT_RECEIVED",
    "EMAIL_RECEIVED",
  ]),
  trigger_config: z.record(z.string(), z.unknown()).default({}),
  action_type: z.enum([
    "CREATE_TASK",
    "SEND_EMAIL",
    "CREATE_INVOICE",
    "SEND_NOTIFICATION",
    "UPDATE_DEAL_STAGE",
    "CREATE_EVENT",
  ]),
  action_config: z.record(z.string(), z.unknown()).default({}),
  enabled: z.coerce.boolean().default(true),
})

export type AutomationFormData = z.infer<typeof automationSchema>
