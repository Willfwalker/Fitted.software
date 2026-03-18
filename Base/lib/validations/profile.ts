import { z } from "zod"

export const profileSchema = z.object({
  avatar_url: z.string().url().nullable().optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").nullable().optional(),
  job_title: z.string().max(100, "Job title must be under 100 characters").nullable().optional(),
  phone: z.string().max(30, "Phone must be under 30 characters").nullable().optional(),
  location: z.string().max(100, "Location must be under 100 characters").nullable().optional(),
  website: z.string().url("Must be a valid URL").nullable().optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>
