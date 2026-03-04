import { z } from "zod"

export const boardSchema = z.object({
  name: z.string().min(1, "Board name is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const boardColumnSchema = z.object({
  name: z.string().min(1, "Column name is required").max(100),
  position: z.coerce.number().int().min(0).default(0),
  wip_limit: z.coerce.number().int().min(1).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color").optional().or(z.literal("")),
})

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(500),
  description: z.string().max(10000).optional().or(z.literal("")),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).default("NONE"),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).default("TODO"),
  due_date: z.string().optional().or(z.literal("")),
  assigned_to: z.string().uuid().optional().or(z.literal("")),
  contact_id: z.string().uuid().optional().or(z.literal("")),
  company_id: z.string().uuid().optional().or(z.literal("")),
  deal_id: z.string().uuid().optional().or(z.literal("")),
  board_id: z.string().uuid(),
  column_id: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const labelSchema = z.object({
  name: z.string().min(1, "Label name is required").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
})

export type BoardFormData = z.infer<typeof boardSchema>
export type BoardColumnFormData = z.infer<typeof boardColumnSchema>
export type TaskFormData = z.infer<typeof taskSchema>
export type LabelFormData = z.infer<typeof labelSchema>
