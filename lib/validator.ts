import * as z from "zod"

export const projectFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(3, 'Description must be at least 3 characters').max(400, 'Description must be less than 400 characters'),
  imageUrl: z.string(),
  programId: z.string(),
  url: z.string().url()
})