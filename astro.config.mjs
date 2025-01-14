import { defineConfig } from "astro/config";

const site = process.env.PUBLIC_SITE_URL ?? "https://bigfin.github.io";
const base = process.env.PUBLIC_SITE_BASE ?? "/";

export default defineConfig({
  output: "static",
  site,
  base,
});

