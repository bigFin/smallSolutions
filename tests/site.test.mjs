import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(new URL("../dist/", import.meta.url));
const base = `${(process.env.PUBLIC_SITE_BASE || "/").replace(/\/$/, "")}/`;
const origin = "https://site.test";
const filesIn = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? filesIn(path) : [path];
});
const pages = filesIn(output).filter((file) => file.endsWith(".html"));

test("the site builds its main sections without publishing résumé routes or drafts", () => {
  for (const file of ["index.html", "projects/index.html", "writing/index.html"]) {
    assert.ok(existsSync(join(output, file)), file);
  }
  assert.ok(pages.length >= 3);
  assert.ok(!existsSync(join(output, "resume")));
  assert.ok(!existsSync(join(output, "docs")));
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${page}: one main heading`);
    assert.match(html, /<main\b[^>]*id="main"/);
    assert.doesNotMatch(html, /href="[^"]*\/resume(?:\/|")/);
  }
});

test("GitHub Pages gets a custom 404 with recovery links that work from nested missing URLs", () => {
  const html = readFileSync(join(output, "404.html"), "utf8");
  assert.match(html, /<title>Page not found \| smallSolutions<\/title>/);
  const navigation = html.match(/<nav class="link-list" aria-label="Find a page">([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(navigation);
  const links = [...navigation.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(links, [base, `${base}projects/`, `${base}writing/`]);
  const missingUrl = new URL(`${base}old/blog/missing-post/`, origin);
  for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (value.startsWith("#")) continue;
    const target = new URL(value.replaceAll("&amp;", "&"), missingUrl);
    if (target.origin !== origin) continue;
    assert.ok(target.pathname.startsWith(base), value);
    const path = join(output, decodeURIComponent(target.pathname.slice(base.length)), target.pathname.endsWith("/") ? "index.html" : "");
    assert.ok(existsSync(path), `404 resource breaks at a nested URL: ${value}`);
  }
});

test("local links, fragments, images, scripts, and styles resolve under the configured base", () => {
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    const url = new URL(base + relative(output, page).replace(/index\.html$/, ""), origin);
    const targets = [
      ...[...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]),
      ...[...html.matchAll(/\bsrcset="([^"]+)"/g)].flatMap((match) =>
        match[1].split(",").map((candidate) => candidate.trim().split(/\s+/)[0])),
    ];
    for (const value of targets) {
      const target = new URL(value.replaceAll("&amp;", "&"), url);
      if (target.origin !== origin) continue;
      assert.ok(target.pathname.startsWith(base), `${page}: link escapes base: ${value}`);
      const path = join(output, decodeURIComponent(target.pathname.slice(base.length)), target.pathname.endsWith("/") ? "index.html" : "");
      assert.ok(existsSync(path), `${page}: missing target: ${value}`);
      if (target.hash && path.endsWith(".html")) {
        const id = decodeURIComponent(target.hash.slice(1));
        assert.ok(readFileSync(path, "utf8").includes(`id="${id}"`), `${page}: missing fragment: ${value}`);
      }
    }
  }
});

test("project images are local, responsive, described, and dimensioned", () => {
  const projectPages = pages.filter((page) => relative(output, page).startsWith("projects/"));
  for (const page of [join(output, "index.html"), ...projectPages]) {
    const html = readFileSync(page, "utf8");
    const images = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
    assert.ok(images.length > 0, `${page}: project imagery is present`);
    for (const image of images) {
      const attributes = Object.fromEntries([...image.matchAll(/([\w:-]+)="([^"]*)"/g)]
        .map((match) => [match[1], match[2]]));
      assert.ok(attributes.src.startsWith(`${base}_astro/`), `${page}: self-hosted image`);
      assert.ok(attributes.alt.trim(), `${page}: meaningful alternative text`);
      assert.ok(Number(attributes.width) > 0 && Number(attributes.height) > 0, `${page}: intrinsic dimensions`);
      assert.ok(attributes.srcset && attributes.sizes, `${page}: responsive sources`);
    }
    if (page === join(output, "index.html") || page === join(output, "projects/index.html")) {
      assert.ok(images.every((image) => image.includes('loading="lazy"')), `${page}: previews load lazily`);
      continue;
    }
    const cover = html.match(/<figure class="detail-page__cover">([\s\S]*?)<\/figure>/)?.[1];
    assert.ok(cover, `${page}: project cover`);
    assert.match(cover, /loading="eager"/);
    assert.match(cover, /<figcaption>/);
    assert.match(cover, /aria-label="View full-size image:/);
    for (const [, figure] of html.matchAll(/<figure class="project-gallery__figure[^\"]*">([\s\S]*?)<\/figure>/g)) {
      assert.match(figure, /loading="lazy"/, `${page}: gallery images load lazily`);
      assert.match(figure, /<figcaption>/, `${page}: gallery images have captions`);
      assert.match(figure, /aria-label="View full-size image:/, `${page}: full-size image link`);
    }
  }
});

test("the self-hosted Gallant font and its license are published", () => {
  const font = filesIn(output).find((file) => /gallant\.[^/]+\.woff2$/.test(file));
  assert.ok(font, "bundled Gallant WOFF2 font");
  assert.equal(readFileSync(font).toString("ascii", 0, 4), "wOF2");
  assert.match(readFileSync(join(output, "fonts/gallant-LICENSE.txt"), "utf8"), /BSD 2-Clause License/);
  for (const page of pages) {
    assert.match(readFileSync(page, "utf8"), /<link[^>]*rel="preload"[^>]*as="font"/);
  }
});

test("page typography uses the single Gallant font system", () => {
  const css = filesIn(output).filter((file) => file.endsWith(".css"))
    .map((file) => readFileSync(file, "utf8")).join("\n");
  const families = [...css.matchAll(/(?:^|[;{])\s*font-family:\s*([^;}]+)/g)]
    .map((match) => match[1].replace(/["']/g, "").trim());
  assert.ok(families.includes("var(--font-site)"), "page text inherits the shared font");
  assert.ok(families.every((family) => ["Sun Gallant", "var(--font-site)", "inherit"].includes(family)),
    `unexpected font family: ${families.join(", ")}`);
});

test("the site keeps email contact without a hiring pitch, and exposes background controls", () => {
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    assert.doesNotMatch(html, /Work with me|contact-section|id="contact"/);
    assert.match(html, /href="mailto:fsmall90@gmail\.com"/);
    assert.match(html, /href="#background" data-open-background/);
    assert.match(html, /<details id="background" class="shader-controls"[^>]*>/);
    assert.doesNotMatch(html, /<details id="background"[^>]*\bopen\b/);
    assert.match(html, /id="audio-off"[^>]*aria-pressed="true"/);
  }
});

test("writing pages link to their neighbours in the index order without wrapping at the ends", () => {
  const index = readFileSync(join(output, "writing/index.html"), "utf8");
  const slugs = [...index.matchAll(/href="[^"]*\/writing\/([^"/]+)\/"/g)].map((match) => match[1]);
  assert.ok(slugs.length > 1);
  for (const [position, slug] of slugs.entries()) {
    const html = readFileSync(join(output, "writing", slug, "index.html"), "utf8");
    const nav = html.match(/<nav class="writing-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(nav, `${slug}: end-of-post navigation`);
    const links = [...nav.matchAll(/href="([^"]+)" rel="(prev|next)"/g)];
    const expected = [];
    if (position > 0) expected.push([`${base}writing/${slugs[position - 1]}/`, "prev"]);
    if (position < slugs.length - 1) expected.push([`${base}writing/${slugs[position + 1]}/`, "next"]);
    assert.deepEqual(links.map((match) => [match[1], match[2]]), expected, slug);
  }
});

test("the four Nepal posts retain their dates, source links, and local photographs", () => {
  const posts = [
    ["2015-himalayan-earthquake", "2015-04-28", 10],
    ["high-up-in-the-hills", "2015-02-18", 16],
    ["swayambhunath", "2015-02-18", 9],
    ["down-the-rabbit-hole", "2015-02-10", 2],
  ];
  for (const [slug, date, count] of posts) {
    const html = readFileSync(join(output, "writing", slug, "index.html"), "utf8");
    assert.ok(html.includes(`<time datetime="${date}">`), `${slug}: original publication date`);
    assert.match(html, /href="https:\/\/nepalcando\.blogspot\.com\/2015\//);
    assert.match(html, /About this archived post/);
    const images = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
    assert.equal(images.length, count, `${slug}: all original photos restored`);
    for (const image of images) {
      assert.ok(image.includes(`src="${base}_astro/`), `${slug}: locally hosted photo`);
      assert.match(image, /alt="[^"]+"/);
      assert.match(image, /width="\d+"/);
      assert.match(image, /height="\d+"/);
      assert.match(image, /loading="lazy"/);
    }
    assert.doesNotMatch(html, /href="[^"]*(?:youcaring|goo\.gl)/);
  }
});
