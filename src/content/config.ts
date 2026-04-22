import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.enum(['esej', 'obserwacja', 'fragment', 'zespol']),
    lead: z.string().min(1),
    readingTime: z.string(), // słownie, np. "sześć minut"
    draft: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
    slug: z.string().optional(),
    ogImage: z.string().optional(),
  }),
});

export const collections = { blog };

// Kategorie w kolejności wyświetlania (używane przez /blog i filtry)
export const CATEGORY_ORDER = ['esej', 'obserwacja', 'fragment', 'zespol'] as const;
export const CATEGORY_LABEL: Record<string, string> = {
  esej: 'esej',
  obserwacja: 'obserwacja',
  fragment: 'fragment',
  zespol: 'zespół',
};
