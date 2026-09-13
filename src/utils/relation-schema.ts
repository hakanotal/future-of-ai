import { z } from 'zod';

export const relationSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  type: z.string().min(1),
  start: z.string().optional(),
  end: z.string().optional(),
  note: z.string().optional(),
  amount: z.string().optional(),
  sources: z.array(z.string()).optional().default([]),
});

export type Relation = z.infer<typeof relationSchema>;

export function validateRelation(data: unknown) {
  return relationSchema.safeParse(data);
}
