import { defineCollection, z } from "astro:content";

const work = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    title: z.string(),
    summary: z.string(),
    period: z.string(),
    order: z.number(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    coverCaption: z.string().optional(),
    gallery: z.array(z.object({
      src: image(),
      alt: z.string().min(1),
      caption: z.string().min(1),
      wide: z.boolean().default(false),
    })).default([]),
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
    source: z.object({
      label: z.string(),
      href: z.string().url(),
      published: z.string().date(),
    }).optional(),
    archiveNote: z.string().optional(),
    order: z.number(),
    tags: z.array(z.string()),
  }),
});

export const collections = { work, writing };
