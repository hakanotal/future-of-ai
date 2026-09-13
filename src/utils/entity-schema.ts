import { z } from 'zod';

export const entitySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'ID must be kebab-case'),
  label: z.string().min(1),
  type: z.enum(['person', 'concept', 'organization', 'place', 'work', 'event', 'fund']),
  aliases: z.array(z.string()).optional().default([]),
  strands: z.array(z.enum(['T', 'E', 'S', 'C', 'R', 'EA', 'L'])).min(1),
  short: z.string().min(1).max(280),
  dates: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  located_in: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  image: z.string().optional(),
  external_ids: z.object({
    wikidata: z.string().optional(),
    viaf: z.string().optional(),
  }).optional(),
  sources: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'review', 'published']).default('draft'),
});

export type Entity = z.infer<typeof entitySchema>;

export function validateEntity(data: unknown) {
  return entitySchema.safeParse(data);
}
