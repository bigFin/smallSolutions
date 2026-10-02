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

test("local links, fragments, images, scripts, and styles resolve under the configured base", () => {
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    const url = new URL(base + relative(output, page).replace(/index\.html$/, ""), origin);
    for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
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

test("contact and optional experiments are present in the static homepage", () => {
  const html = readFileSync(join(output, "index.html"), "utf8");
  assert.match(html, /id="contact"/);
  assert.match(html, /href="mailto:fsmall90@gmail\.com"/);
  assert.match(html, /<details class="shader-controls"[^>]*>/);
  assert.doesNotMatch(html, /<details class="shader-controls"[^>]*\bopen\b/);
  assert.match(html, /id="visuals-toggle"[^>]*aria-pressed="false"/);
});
