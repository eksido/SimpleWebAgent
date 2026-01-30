// crawl-from-sitemap.mjs
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { XMLParser } from "fast-xml-parser";
import slugify from "slugify";
import pLimit from "p-limit";
import fs from "fs/promises";
import path from "path";

const SITEMAP_URL = process.env.SITEMAP_URL || "https://example.com/sitemap.xml";
const OUT_DIR = process.env.OUT_DIR || "./out";
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);

// Simple filter to avoid junk pages; adjust if needed
function shouldInclude(url) {
  const u = url.toLowerCase();
  if (u.includes("/wp-json")) return false;
  if (u.includes("/feed")) return false;
  if (u.includes("/tag/")) return false;
  if (u.includes("/author/")) return false;
  return true;
}

function mdEscape(s = "") {
  return s.replace(/\u00A0/g, " ").trim();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "SimpleWebAgent-Crawler/1.0 (+https://example.com)",
      "Accept": "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

function htmlToMarkdown({ url, title, textContent }) {
  // Keep it simple: headings + plain text is great for retrieval
  const cleaned = mdEscape(textContent)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n");

  return `# ${mdEscape(title || "Untitled")}

**Source:** ${url}

---

${cleaned}
`;
}

async function extractReadable(html, url) {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Remove obvious clutter before readability
  doc.querySelectorAll("script, style, noscript, nav, footer, header, aside").forEach(el => el.remove());

  const reader = new Readability(doc);
  const article = reader.parse();

  // Fallback if readability fails
  const title = article?.title || doc.title || url;
  const textContent = article?.textContent || doc.body?.textContent || "";

  return { title, textContent };
}

async function loadSitemapUrls(sitemapUrl) {
  const xml = await (await fetch(sitemapUrl)).text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);

  // Support sitemapindex or urlset
  if (parsed.sitemapindex?.sitemap) {
    const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
      ? parsed.sitemapindex.sitemap
      : [parsed.sitemapindex.sitemap];

    const urls = [];
    for (const sm of sitemaps) {
      if (!sm.loc) continue;
      const childUrls = await loadSitemapUrls(sm.loc);
      urls.push(...childUrls);
    }
    return urls;
  }

  if (parsed.urlset?.url) {
    const entries = Array.isArray(parsed.urlset.url) ? parsed.urlset.url : [parsed.urlset.url];
    return entries.map(e => e.loc).filter(Boolean);
  }

  throw new Error("Unrecognized sitemap format");
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("Loading sitemap:", SITEMAP_URL);
  let urls = await loadSitemapUrls(SITEMAP_URL);
  urls = urls.filter(Boolean).filter(shouldInclude);

  // de-dupe
  urls = Array.from(new Set(urls));

  console.log(`Found ${urls.length} URLs`);

  const limit = pLimit(CONCURRENCY);
  let ok = 0, fail = 0;

  await Promise.all(urls.map(url => limit(async () => {
    try {
      const html = await fetchText(url);
      const { title, textContent } = await extractReadable(html, url);

      // Basic: skip empty pages
      if (!textContent || textContent.trim().length < 200) {
        console.log("SKIP (too short):", url);
        return;
      }

      const slug = slugify(title || url, { lower: true, strict: true }).slice(0, 80);
      const filename = `${slug || "page"}-${Buffer.from(url).toString("base64url").slice(0, 8)}.md`;
      const outPath = path.join(OUT_DIR, filename);

      const md = htmlToMarkdown({ url, title, textContent });
      await fs.writeFile(outPath, md, "utf8");

      ok++;
      console.log("OK:", url, "->", filename);
    } catch (e) {
      fail++;
      console.log("FAIL:", url, e.message);
    }
  })));

  console.log(`Done. OK=${ok} FAIL=${fail}. Files in ${OUT_DIR}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
