import { defineCollection, z } from "astro:content";

const work = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    period: z.string(),
    order: z.number(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    coverCaption: z.string().optional(),
    links: z
      .array(
        z.object({
          label: z.string(),
          href: z.string().url(),
        }),
      )
      .default([]),
  }),
});

const writing = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string(),
    order: z.number(),
    tags: z.array(z.string()),
  }),
});

const resume = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    audience: z.string(),
    order: z.number(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { work, writing, resume };
