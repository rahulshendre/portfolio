import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const link = z.object({ label: z.string(), url: z.string().url() });

// One markdown file per project in src/content/builds.
const builds = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/builds' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    for: z.string().optional(),
    year: z.number().optional(),
    stack: z.array(z.string()),
    metric: z.string().optional(),
    links: z.array(link).default([]),
    order: z.number().default(100),
  }),
});

// Writing. Files starting with _ (the template) are ignored.
const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { builds, notes };
