import fs from "node:fs";
import path from "node:path";

import { CONSOLIDATED_PAGES, PARTNER_DESTINATIONS, PARTNER_SOURCE_PAGES } from "../src/worker.js";

const publicDir = path.resolve("public");
const origin = "https://askfortask.co.uk";
const errors = [];
const titlesByValue = new Map();
const descriptionsByValue = new Map();
const statutorySentence = "A4T Studio is the trading name of ASK FOR TASK LTD, registered in England and Wales under company number 14697408. Registered office: The Matilda House, St. Katharines Way, London, England, E1W 1LF.";
const requiredFooterRoutes = ["/safety/", "/privacy/", "/cookies/", "/faq/", "/terms/"];
const privacyAtCollectionRoutes = new Set(["/contact/", "/professionals/", "/reviews/"]);
const requiredStylesheetOrder = [
  "/a4t-system.css",
  "/a4t-evolution-20260724.css",
  "/a4t-polish-20260805.css",
];
const legacyPublicStylesheets = [
  "/styles.css",
  "/updates.css",
  "/updates-simple-20260723.css",
  "/a4t-light-20260723.css",
  "/a4t-refined-20260724.css",
  "/a4t-professional-20260724.css",
];
const canonicalBrandMark = "/assets/a4t-mark-soft.svg";
const canonicalCompanySocialImage = "https://askfortask.co.uk/assets/a4t-studio-social.png";
const activeComponentStylesheets = [
  "a4t-evolution-20260724.css",
  "a4t-polish-20260805.css",
];

function recordValue(map, value, label) {
  if (!value) return;
  map.set(value, [...(map.get(value) || []), label]);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function routeFor(file) {
  const relative = path.relative(publicDir, file).replaceAll(path.sep, "/");
  if (relative === "index.html") return "/";
  if (relative === "404.html") return "/404.html";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"index.html".length)}`;
  return `/${relative}`;
}

function textContent(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function attributeValue(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1];
}

function hasAccessibleName(tag, inner = "") {
  if (attributeValue(tag, "aria-label")?.trim()) return true;
  if (attributeValue(tag, "aria-labelledby")?.trim()) return true;
  if (textContent(inner)) return true;
  return [...inner.matchAll(/<img\b[^>]*\balt="([^"]+)"[^>]*>/gi)]
    .some((match) => match[1].trim());
}

const htmlFiles = walk(publicDir).filter((file) => file.endsWith(".html")).sort();
const routes = new Map(htmlFiles.map((file) => [routeFor(file), file]));
const indexableRoutes = new Set();

for (const [retired, destination] of Object.entries(CONSOLIDATED_PAGES)) {
  if (routes.has(retired)) errors.push(`${retired}: retired content must stay outside public/`);
  const target = new URL(destination, origin);
  const targetFile = routes.get(target.pathname);
  if (!targetFile) {
    errors.push(`${retired}: redirect destination does not exist (${destination})`);
  } else if (target.hash && !fs.readFileSync(targetFile, "utf8").includes(`id="${target.hash.slice(1)}"`)) {
    errors.push(`${retired}: redirect destination anchor does not exist (${destination})`);
  }
}

for (const file of htmlFiles) {
  const route = routeFor(file);
  const html = fs.readFileSync(file, "utf8");
  const label = path.relative(process.cwd(), file);
  const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1] || "";
  const noindex = /noindex/i.test(robots);

  if (!html.includes(statutorySentence)) {
    errors.push(`${label}: statutory company information is missing`);
  }
  for (const footerRoute of requiredFooterRoutes) {
    if (!new RegExp(`<footer[\\s\\S]*?href="${footerRoute.replaceAll("/", "\\/")}"`, "i").test(html)) {
      errors.push(`${label}: footer is missing ${footerRoute}`);
    }
  }
  if (/\sstyle="/i.test(html)) {
    errors.push(`${label}: inline style attribute is not allowed by the CSP`);
  }
  const stylesheetHrefs = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/gi)]
    .map((match) => match[1].split(/[?#]/)[0]);
  const designSystemPositions = requiredStylesheetOrder.map((href) => stylesheetHrefs.indexOf(href));
  if (designSystemPositions.some((position) => position === -1)) {
    errors.push(`${label}: required design-system stylesheets are missing`);
  } else if (designSystemPositions.some((position, index) => index > 0 && position < designSystemPositions[index - 1])) {
    errors.push(`${label}: design-system stylesheets are in the wrong order`);
  }
  for (const legacyStylesheet of legacyPublicStylesheets) {
    if (stylesheetHrefs.includes(legacyStylesheet)) {
      errors.push(`${label}: legacy stylesheet is active (${legacyStylesheet})`);
    }
  }
  const iconHrefs = [...html.matchAll(/<link\b[^>]*\brel="icon"[^>]*\bhref="([^"]+)"[^>]*>/gi)]
    .map((match) => match[1].split(/[?#]/)[0]);
  if (!iconHrefs.includes(canonicalBrandMark)) {
    errors.push(`${label}: canonical SVG brand mark is missing from the favicon set`);
  }
  for (const match of html.matchAll(/<img\b[^>]*\bclass="[^"]*brand-mark[^"]*"[^>]*\bsrc="([^"]+)"[^>]*>/gi)) {
    if (match[1].split(/[?#]/)[0] !== canonicalBrandMark) {
      errors.push(`${label}: navigation uses a non-canonical brand mark (${match[1]})`);
    }
  }
  if (/\bwithin 48 hours\b/i.test(textContent(html))) {
    errors.push(`${label}: absolute 48-hour response wording conflicts with the qualified service target`);
  }
  if (
    privacyAtCollectionRoutes.has(route)
    && !/<label\b[^>]*class="[^"]*consent[^"]*"[\s\S]{0,1200}?href="\/privacy\/"/i.test(html)
  ) {
    errors.push(`${label}: form consent must link to the Privacy Policy at collection`);
  }
  for (const destination of Object.values(PARTNER_DESTINATIONS)) {
    if (html.includes(`href="${destination}"`)) {
      errors.push(`${label}: partner destination must use a controlled /go/ route (${destination})`);
    }
  }

  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((match) => textContent(match[1]));
  if (titles.length !== 1) errors.push(`${label}: expected one title, found ${titles.length}`);
  if (!noindex && route !== "/404.html" && (titles[0]?.length < 38 || titles[0]?.length > 60)) {
    errors.push(`${label}: title length is ${titles[0]?.length || 0}, expected about 38-60 characters`);
  }
  if (!noindex && route !== "/404.html") recordValue(titlesByValue, titles[0], label);

  const descriptions = [...html.matchAll(/<meta\s+name="description"\s+content="([^"]*)"/gi)];
  if (descriptions.length !== 1) errors.push(`${label}: expected one meta description, found ${descriptions.length}`);
  const descriptionLength = descriptions[0]?.[1].length || 0;
  if (!noindex && route !== "/404.html" && (descriptionLength < 140 || descriptionLength > 160)) {
    errors.push(`${label}: description length is ${descriptionLength}, expected 140-160 characters`);
  }
  if (!noindex && route !== "/404.html") {
    recordValue(descriptionsByValue, descriptions[0]?.[1], label);
  }

  for (const field of ["og:title", "twitter:title", "og:description", "twitter:description"]) {
    const value = html.match(new RegExp(`<meta (?:property|name)="${field}" content="([^"]*)"`, "i"))?.[1];
    if (noindex && !value) continue;
    const expected = field.endsWith(":title") ? titles[0] : textContent(descriptions[0]?.[1] || "");
    if (!value || textContent(value) !== expected) {
      errors.push(`${label}: ${field} must match the current page title or description`);
    }
    if (/\bESG\b|six-month development partnerships/i.test(value || "")) {
      errors.push(`${label}: ${field} advertises a retired offering`);
    }
  }

  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (headings.length !== 1) errors.push(`${label}: expected one H1, found ${headings.length}`);
  if (/title-full|title-short/.test(headings[0]?.[1] || "")) {
    errors.push(`${label}: H1 still contains alternate responsive text`);
  }

  const ids = [...html.matchAll(/\bid="([^"]+)"/gi)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  for (const id of duplicateIds) errors.push(`${label}: duplicate id "${id}"`);

  for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    if (!hasAccessibleName(match[0], match[2])) {
      errors.push(`${label}: button has no accessible name (${match[0].slice(0, 120)})`);
    }
  }

  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    if (!hasAccessibleName(match[0], match[2])) {
      errors.push(`${label}: link has no accessible name (${match[0].slice(0, 120)})`);
    }
    if (/\btarget="_blank"/i.test(match[0]) && !/\brel="[^"]*noopener/i.test(match[0])) {
      errors.push(`${label}: new-window link is missing rel="noopener" (${match[0].slice(0, 120)})`);
    }
  }

  for (const match of html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
    const tag = match[0];
    if (/\btype="hidden"/i.test(tag)) continue;
    const id = attributeValue(tag, "id");
    const hasExplicitLabel = id
      ? new RegExp(`<label\\b[^>]*\\bfor="${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "i").test(html)
      : false;
    const beforeControl = html.slice(0, match.index);
    const nestedInLabel = beforeControl.lastIndexOf("<label") > beforeControl.lastIndexOf("</label>");
    if (!hasExplicitLabel && !nestedInLabel && !hasAccessibleName(tag)) {
      errors.push(`${label}: form control has no accessible label (${tag.slice(0, 120)})`);
    }
  }

  for (const match of html.matchAll(/\btabindex="([1-9]\d*)"/gi)) {
    errors.push(`${label}: avoid positive tabindex (${match[0]})`);
  }

  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (route !== "/404.html") {
    const expectedCanonical = `${origin}${route}`;
    if (canonical !== expectedCanonical) {
      errors.push(`${label}: canonical is ${canonical || "missing"}; expected ${expectedCanonical}`);
    }
  }

  for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const schema = JSON.parse(match[1]);
      const entities = schema["@graph"] || [schema];
      for (const entity of entities) {
        if (entity["@id"] === `${origin}/#organization` && entity.sameAs?.some(url =>
          /linkedin\.com\/in\/|instagram\.com\/piazenko_nikita|apps\.apple\.com/.test(url))) {
          errors.push(`${label}: company sameAs must not identify a founder profile or app listing`);
        }
      }
    } catch (error) {
      errors.push(`${label}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\bwidth="\d+"/i.test(tag) || !/\bheight="\d+"/i.test(tag)) {
      errors.push(`${label}: image is missing numeric width and height (${tag.slice(0, 120)})`);
    }
    if (!/\balt="[^"]*"/i.test(tag)) {
      errors.push(`${label}: image is missing an alt attribute (${tag.slice(0, 120)})`);
    }
    if (/\balt=""/i.test(tag) && !/\baria-hidden="true"/i.test(tag)) {
      errors.push(`${label}: decorative image with empty alt should be aria-hidden (${tag.slice(0, 120)})`);
    }

    const source = tag.match(/\bsrc="([^"]+)"/i)?.[1];
    if (source?.startsWith("/") && !source.startsWith("//")) {
      const pathname = source.split(/[?#]/)[0];
      if (!fs.existsSync(path.join(publicDir, pathname.slice(1)))) {
        errors.push(`${label}: local image source does not exist (${source})`);
      }
    }
  }

  for (const match of html.matchAll(/<source\b[^>]*\bsrcset="([^"]+)"[^>]*>/gi)) {
    for (const candidate of match[1].split(",")) {
      const source = candidate.trim().split(/\s+/)[0];
      if (!source.startsWith("/") || source.startsWith("//")) continue;
      const pathname = source.split(/[?#]/)[0];
      if (!fs.existsSync(path.join(publicDir, pathname.slice(1)))) {
        errors.push(`${label}: local responsive image source does not exist (${source})`);
      }
    }
  }

  for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
    const href = match[1];
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const pathname = href.split(/[?#]/)[0] || "/";
    if (pathname.startsWith("/go/")) {
      const partnerUrl = new URL(href, origin);
      const slug = partnerUrl.pathname.match(/^\/go\/([a-z0-9-]+)\/?$/)?.[1];
      const source = partnerUrl.searchParams.get("source");
      if (!slug || !PARTNER_DESTINATIONS[slug]) {
        errors.push(`${label}: unknown controlled partner route (${href})`);
      }
      if (!source || !PARTNER_SOURCE_PAGES.has(source)) {
        errors.push(`${label}: invalid controlled partner source (${href})`);
      }
      continue;
    }
    if (/\.[a-z0-9]+$/i.test(pathname)) {
      if (!fs.existsSync(path.join(publicDir, pathname.slice(1)))) {
        errors.push(`${label}: local link target does not exist (${href})`);
      }
      continue;
    }
    const canonicalPath = pathname === "/" ? "/" : `${pathname.replace(/\/+$/, "")}/`;
    if (!routes.has(canonicalPath)) errors.push(`${label}: internal page does not exist (${href})`);
    const targetFile = routes.get(canonicalPath);
    const fragment = new URL(href, origin).hash.slice(1);
    if (targetFile && fragment && !fs.readFileSync(targetFile, "utf8").includes(`id="${decodeURIComponent(fragment)}"`)) {
      errors.push(`${label}: internal anchor does not exist (${href})`);
    }
  }

  if (!noindex && route !== "/404.html") indexableRoutes.add(route);
}

const sitemap = fs.readFileSync(path.join(publicDir, "sitemap.xml"), "utf8");
const sitemapRoutes = new Set(
  [...sitemap.matchAll(/<loc>https:\/\/askfortask\.co\.uk([^<]*)<\/loc>/g)]
    .map((match) => match[1] || "/")
);

for (const [value, labels] of titlesByValue) {
  if (labels.length > 1) errors.push(`duplicate title "${value}" in ${labels.join(", ")}`);
}
for (const [value, labels] of descriptionsByValue) {
  if (labels.length > 1) errors.push(`duplicate meta description in ${labels.join(", ")}`);
}

const now = new Date();
const today = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
].join("-");
for (const block of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = block[1].match(/<loc>([^<]+)<\/loc>/)?.[1] || "unknown URL";
  const lastmod = block[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  if (!lastmod || !/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
    errors.push(`sitemap.xml: ${loc} needs a valid YYYY-MM-DD lastmod date`);
  } else if (lastmod > today) {
    errors.push(`sitemap.xml: ${loc} has a future lastmod date (${lastmod})`);
  }
}

for (const route of indexableRoutes) {
  if (!sitemapRoutes.has(route)) errors.push(`sitemap.xml: missing indexable route ${route}`);
}
for (const route of sitemapRoutes) {
  if (!indexableRoutes.has(route)) errors.push(`sitemap.xml: includes non-indexable or unknown route ${route}`);
}

const robots = fs.readFileSync(path.join(publicDir, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) {
  errors.push("robots.txt: canonical sitemap directive is missing");
}

const headerRules = fs.readFileSync(path.join(publicDir, "_headers"), "utf8");
const requiredSecurityHeaderFragments = [
  "Content-Security-Policy:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src-attr 'none'",
  "style-src-attr 'none'",
  "Strict-Transport-Security:",
  "X-Content-Type-Options: nosniff",
  "Referrer-Policy:",
  "Permissions-Policy:",
  "X-Frame-Options: DENY"
];
for (const fragment of requiredSecurityHeaderFragments) {
  if (!headerRules.includes(fragment)) errors.push(`_headers: missing ${fragment}`);
}
if (headerRules.includes("'unsafe-inline'")) {
  errors.push("_headers: CSP must not contain 'unsafe-inline'");
}

const clientScript = fs.readFileSync(path.join(publicDir, "script.js"), "utf8");
if (/\.style\b|setAttribute\(\s*["']style["']/i.test(clientScript)) {
  errors.push("script.js: inline style mutation is not allowed by the CSP");
}
if (/\bwithin 48 hours\b/i.test(clientScript)) {
  errors.push("script.js: absolute 48-hour response wording conflicts with the qualified service target");
}
if (!/assistant-consent[\s\S]{0,600}?href="\/privacy\/"/i.test(clientScript)) {
  errors.push("script.js: project assistant consent must link to the Privacy Policy at collection");
}

for (const stylesheet of activeComponentStylesheets) {
  const css = fs.readFileSync(path.join(publicDir, stylesheet), "utf8");
  const fontFamilies = [...css.matchAll(/font-family:\s*([^;]+);/gi)].map((match) => match[1].trim());
  if (fontFamilies.some((value) => !/^var\(--(?:font-sans|body-font|display-font)\)$/i.test(value))) {
    errors.push(`${stylesheet}: active font-family must resolve through the design system`);
  }
  if (/border-radius:\s*(?:0|\d+(?:\.\d+)?(?:px|rem|em)|50%)(?:\s*!important)?\s*;/i.test(css)) {
    errors.push(`${stylesheet}: active border radius must resolve through the design system`);
  }
  if (/box-shadow:\s*(?:none|inset|0|\d)/i.test(css)) {
    errors.push(`${stylesheet}: active box shadow must resolve through the design system`);
  }
  if (/--(?:max|radius|shadow):/i.test(css)) {
    errors.push(`${stylesheet}: legacy global design token is still declared`);
  }
}

const systemReference = fs.readFileSync(path.join(publicDir, "design-system", "index.html"), "utf8");
if (!/name="robots"\s+content="[^"]*noindex/i.test(systemReference)) {
  errors.push("design-system/index.html: internal visual QA route must remain noindex");
}
if (!systemReference.includes(canonicalCompanySocialImage) && /property="og:image"/i.test(systemReference)) {
  errors.push("design-system/index.html: internal visual QA route must not introduce a second company social image");
}

if (errors.length) {
  console.error(`Site audit failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Site audit passed for ${htmlFiles.length} HTML pages and ${indexableRoutes.size} indexable routes.`);
}
