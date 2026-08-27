import { Buffer } from "node:buffer";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

const securityHeaders = {
  "content-security-policy": "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-attr 'none'; upgrade-insecure-requests",
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY"
};

export const PARTNER_DESTINATIONS = Object.freeze({
  "dmar-international": "https://www.dmarinternational.com/",
  "dmar-linkedin": "https://www.linkedin.com/company/dmar-international/",
  "nikita-linkedin": "https://www.linkedin.com/in/nikita-piazenko-530566113/",
  "nk-sports": "https://nksports.eu/",
  "photography-instagram": "https://www.instagram.com/piazenko_nikita/",
  "photography-portfolio": "https://npiazenko.myportfolio.com/",
  "pinglo": "https://pingloapp.com/",
  "pinglo-app-store": "https://apps.apple.com/gb/app/pinglo-lost-found/id6768083250",
  "pulse-point-events": "https://www.instagram.com/pulsepointevents/"
});

export const CONSOLIDATED_PAGES = Object.freeze({
  "/design/": "/brand-development/#visual-development",
  "/history/": "/about/#company-timeline",
  "/responsible-growth/": "/services/#business-development"
});

export const PARTNER_SOURCE_PAGES = new Set([
  "404",
  "about",
  "app-development",
  "brand-development",
  "contact",
  "cookies",
  "design",
  "dmar-case-study",
  "faq",
  "history",
  "home",
  "photography",
  "pinglo-case-study",
  "privacy",
  "professionals",
  "responsible-growth",
  "reviews",
  "services",
  "terms",
  "trust",
  "ventures",
  "website-development"
]);

const MAX_CV_BYTES = 5 * 1024 * 1024;
const MAX_APPLICATION_BODY_BYTES = 7 * 1024 * 1024;
const MAX_JSON_BODY_BYTES = 32 * 1024;
const FORM_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const FORM_RATE_LIMITS = Object.freeze({
  contact: 5,
  reviews: 4,
  professionals: 3
});
const CONTACT_REGIONS = new Set([
  "United Kingdom",
  "European Union",
  "United States",
  "International / multiple regions",
  "Not location-specific"
]);
const CONTACT_BUDGETS = new Set([
  "Under £1,000",
  "£1,000–£5,000",
  "£5,000–£10,000",
  "£10,000–£25,000",
  "£25,000–£50,000 / phased"
]);
const PROFESSIONAL_CATEGORIES = new Set([
  "Brand development",
  "Apps & product development",
  "Design & brand",
  "Photography & content",
  "Writing & editorial",
  "Business & growth",
  "Project delivery & operations",
  "Drone & aerial content"
]);
const RESPONSIBILITY_LEVELS = new Set([
  "Specialist contributor",
  "Workstream owner",
  "Project lead",
  "Studio or delivery partner"
]);
const AVAILABILITY_OPTIONS = new Set([
  "Available now",
  "Within one month",
  "Within three months",
  "Open to the right project"
]);
const REVIEW_SERVICES = new Set([
  "Managed project delivery",
  "App or website development",
  "Brand development and design",
  "Photography and visual content",
  "Business development",
  "Specialist writing",
  "Project collaboration",
  "Other"
]);
const REVIEW_RELATIONSHIPS = new Set([
  "Client",
  "Photography client",
  "Project collaborator",
  "Professional partner",
  "Other"
]);

function json(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...jsonHeaders, ...additionalHeaders }
  });
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function logTechnicalError(event, error, status) {
  console.error(event, {
    errorType: error instanceof Error ? error.name : "UnknownError",
    ...(Number.isInteger(status) ? { status } : {})
  });
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function isJsonContentType(contentType) {
  return /^(application\/json|[^;]+\+json)(?:\s*;|$)/i.test(contentType);
}

async function readJsonBody(request, maxBytes = MAX_JSON_BODY_BYTES) {
  if (!isJsonContentType(request.headers.get("content-type") || "")) {
    throw new HttpError(415, "Content-Type must be application/json.");
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(413, "The request is too large.");
  }

  if (!request.body) {
    throw new HttpError(400, "Invalid request body.");
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel("The request is too large.");
      throw new HttpError(413, "The request is too large.");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(body));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Expected an object.");
    }
    return payload;
  } catch {
    throw new HttpError(400, "Invalid request body.");
  }
}

async function readBodyBytes(request, maxBytes) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(413, "The request is too large.");
  }

  if (!request.body) {
    throw new HttpError(400, "Invalid request body.");
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel("The request is too large.");
      throw new HttpError(413, "The request is too large.");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function readString(payload, field, maxLength, { required = false, singleLine = false } = {}) {
  const rawValue = payload[field];
  if (rawValue === undefined || rawValue === null) {
    if (required) throw new HttpError(400, `${field} is required.`);
    return "";
  }
  if (typeof rawValue !== "string") {
    throw new HttpError(400, `${field} must be a string.`);
  }

  const value = (singleLine ? rawValue.replace(/\s+/g, " ") : rawValue).trim();
  if (required && !value) throw new HttpError(400, `${field} is required.`);
  if (value.length > maxLength) {
    throw new HttpError(400, `${field} must be ${maxLength} characters or fewer.`);
  }
  return value;
}

function clean(value, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isMultipartContentType(contentType) {
  return /^multipart\/form-data\s*;[^;]*boundary=/i.test(contentType);
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function checkSubmissionRateLimit(request, db, route, reference = new Date()) {
  const limit = FORM_RATE_LIMITS[route];
  if (!limit) throw new TypeError("A valid form route is required.");
  if (!db) throw new Error("DB binding is required for form rate limiting.");

  const referenceSeconds = Math.floor(reference.getTime() / 1000);
  if (!Number.isFinite(referenceSeconds)) {
    throw new TypeError("A valid rate-limit reference date is required.");
  }

  const clientAddress = request.headers.get("cf-connecting-ip") || "unavailable";
  const keyHash = await sha256Hex(`${route}\n${clientAddress}`);
  const windowStartedAt = Math.floor(referenceSeconds / FORM_RATE_LIMIT_WINDOW_SECONDS)
    * FORM_RATE_LIMIT_WINDOW_SECONDS;
  const expiresAt = windowStartedAt + (FORM_RATE_LIMIT_WINDOW_SECONDS * 2);
  const result = await db.prepare(
    `INSERT INTO form_rate_limits (
       key_hash, route, window_started_at, request_count, expires_at
     ) VALUES (?1, ?2, ?3, 1, ?4)
     ON CONFLICT(key_hash, route, window_started_at)
     DO UPDATE SET
       request_count = request_count + 1,
       expires_at = excluded.expires_at
     RETURNING request_count`
  )
    .bind(keyHash, route, windowStartedAt, expiresAt)
    .first();

  const requestCount = Number(result?.request_count);
  if (!Number.isInteger(requestCount) || requestCount < 1) {
    throw new Error("Form rate limit did not return a valid request count.");
  }

  return {
    allowed: requestCount <= limit,
    limit,
    remaining: Math.max(0, limit - requestCount),
    retryAfter: Math.max(1, (windowStartedAt + FORM_RATE_LIMIT_WINDOW_SECONDS) - referenceSeconds)
  };
}

async function enforceSubmissionRateLimit(request, env, route) {
  if (!env.DB) {
    return json({ ok: false, error: "This form is temporarily unavailable." }, 503);
  }

  try {
    const result = await checkSubmissionRateLimit(request, env.DB, route);
    if (result.allowed) return null;

    return json(
      { ok: false, error: "Too many submissions. Please wait a few minutes and try again." },
      429,
      { "retry-after": String(result.retryAfter) }
    );
  } catch (error) {
    logTechnicalError(`${route}_rate_limit_failed`, error);
    return json({ ok: false, error: "This form is temporarily unavailable." }, 503);
  }
}

export function validateContactPayload(payload) {
  const name = readString(payload, "name", 160, { required: true, singleLine: true });
  const email = readString(payload, "email", 254, { required: true, singleLine: true }).toLowerCase();
  const topic = readString(payload, "topic", 120, { singleLine: true });
  const region = readString(payload, "region", 120, { singleLine: true });
  const budget = readString(payload, "budget", 120, { singleLine: true });
  const rawTargetDate = readString(payload, "targetDate", 20, { singleLine: true });
  const targetDate = rawTargetDate ? validIsoDate(rawTargetDate) : "";
  const message = readString(payload, "message", 4000, { required: true });

  if (!isValidEmail(email)) {
    throw new HttpError(400, "Enter a valid email address.");
  }
  if (region && !CONTACT_REGIONS.has(region)) {
    throw new HttpError(400, "Choose a valid project region.");
  }
  if (budget && !CONTACT_BUDGETS.has(budget)) {
    throw new HttpError(400, "Choose a valid budget range.");
  }
  if (rawTargetDate && !targetDate) {
    throw new HttpError(400, "Choose a valid target date.");
  }
  if (payload.consent !== true) {
    throw new HttpError(400, "Consent is required.");
  }

  return { name, email, topic, region, budget, targetDate, message };
}

function validIsoDate(value) {
  const candidate = clean(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return "";

  const date = new Date(`${candidate}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== candidate
    ? ""
    : candidate;
}

function validHttpUrl(value) {
  const candidate = clean(value, 500);
  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function safePdfFilename(value) {
  const filename = clean(value, 180)
    .replace(/[^a-zA-Z0-9._ ()-]/g, "_")
    .replace(/\s+/g, " ");

  return filename.toLowerCase().endsWith(".pdf") ? filename : "cv.pdf";
}

function escapeHtml(value) {
  return clean(value).replace(/[&<>"']/g, (char) => (
    {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]
  ));
}

function makeEmailText({ name, email, topic, region, budget, targetDate, message }) {
  return [
    "New A4T Studio enquiry",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Topic: ${topic || "Not specified"}`,
    `Region: ${region || "Not specified"}`,
    `Budget: ${budget || "Not specified"}`,
    `Target date: ${targetDate || "Not specified"}`,
    "",
    "Message:",
    message
  ].join("\n");
}

export function makeEmailHtml({ name, email, topic, region, budget, targetDate, message }) {
  return `
    <h2>New A4T Studio enquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Topic:</strong> ${escapeHtml(topic || "Not specified")}</p>
    <p><strong>Region:</strong> ${escapeHtml(region || "Not specified")}</p>
    <p><strong>Budget:</strong> ${escapeHtml(budget || "Not specified")}</p>
    <p><strong>Target date:</strong> ${escapeHtml(targetDate || "Not specified")}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space: pre-line;">${escapeHtml(message)}</p>
  `;
}

function makeReviewEmailText(payload) {
  return [
    "New A4T Studio review",
    "",
    `Review ID: ${payload.id}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Company / project: ${payload.companyProject || "Not supplied"}`,
    `Service: ${payload.service}`,
    `Relationship: ${payload.relationship}`,
    `Permission to publish: ${payload.publishConsent ? "Yes, after confirmation" : "No, private feedback only"}`,
    "",
    "Review:",
    payload.reviewText
  ].join("\n");
}

function makeReviewEmailHtml(payload) {
  return `
    <h2>New A4T Studio review</h2>
    <p><strong>Review ID:</strong> ${escapeHtml(payload.id)}</p>
    <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Company / project:</strong> ${escapeHtml(payload.companyProject || "Not supplied")}</p>
    <p><strong>Service:</strong> ${escapeHtml(payload.service)}</p>
    <p><strong>Relationship:</strong> ${escapeHtml(payload.relationship)}</p>
    <p><strong>Permission to publish:</strong> ${payload.publishConsent ? "Yes, after confirmation" : "No, private feedback only"}</p>
    <p><strong>Review:</strong></p>
    <p style="white-space: pre-line;">${escapeHtml(payload.reviewText)}</p>
  `;
}

function makeProfessionalEmailText(payload) {
  return [
    "New A4T Studio professional profile",
    "",
    `Application ID: ${payload.id}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Location / time zone: ${payload.location}`,
    `Categories: ${payload.categories.join(", ")}`,
    `Preferred responsibility: ${payload.responsibility}`,
    `Availability: ${payload.availability}`,
    `Profile link: ${payload.profileUrl || "Not supplied"}`,
    "",
    "Specialisms:",
    payload.specialisms,
    "",
    "Projects they would like to join:",
    payload.projectInterest,
    "",
    `CV attached: ${payload.cvFilename}`
  ].join("\n");
}

function makeProfessionalEmailHtml(payload) {
  const categoryItems = payload.categories
    .map((category) => `<li>${escapeHtml(category)}</li>`)
    .join("");
  const profileLink = payload.profileUrl
    ? `<a href="${escapeHtml(payload.profileUrl)}">${escapeHtml(payload.profileUrl)}</a>`
    : "Not supplied";

  return `
    <h2>New A4T Studio professional profile</h2>
    <p><strong>Application ID:</strong> ${escapeHtml(payload.id)}</p>
    <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Location / time zone:</strong> ${escapeHtml(payload.location)}</p>
    <p><strong>Preferred responsibility:</strong> ${escapeHtml(payload.responsibility)}</p>
    <p><strong>Availability:</strong> ${escapeHtml(payload.availability)}</p>
    <p><strong>Profile link:</strong> ${profileLink}</p>
    <p><strong>Categories:</strong></p>
    <ul>${categoryItems}</ul>
    <p><strong>Specialisms:</strong></p>
    <p style="white-space: pre-line;">${escapeHtml(payload.specialisms)}</p>
    <p><strong>Projects they would like to join:</strong></p>
    <p style="white-space: pre-line;">${escapeHtml(payload.projectInterest)}</p>
    <p><strong>CV attached:</strong> ${escapeHtml(payload.cvFilename)}</p>
  `;
}

async function sendContactEmail(env, payload) {
  if (!env.RESEND_API_KEY) {
    return { ok: false, error: "Email service is not configured yet." };
  }

  const to = env.CONTACT_TO || "admin@askfortask.co.uk";
  const from = env.CONTACT_FROM || "A4T Studio <contact@askfortask.co.uk>";
  const subject = `New A4T Studio enquiry${payload.topic ? ` - ${payload.topic}` : ""}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: makeEmailText(payload),
      html: makeEmailHtml(payload),
      reply_to: payload.email
    })
  });

  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    logTechnicalError("contact_email_rejected", null, response.status);
    return { ok: false, error: "Email provider rejected the message." };
  }

  return { ok: true };
}

async function sendProfessionalEmail(env, payload, cvBuffer) {
  if (!env.RESEND_API_KEY) {
    return { ok: false, error: "Application email is not configured yet." };
  }

  const to = env.CONTACT_TO || "admin@askfortask.co.uk";
  const from = env.CONTACT_FROM || "A4T Studio <contact@askfortask.co.uk>";
  const primaryCategory = payload.categories[0] || "Professional network";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": `professional-application/${payload.id}`
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Professional profile - ${payload.name} - ${primaryCategory}`,
      text: makeProfessionalEmailText(payload),
      html: makeProfessionalEmailHtml(payload),
      reply_to: payload.email,
      attachments: [
        {
          content: Buffer.from(cvBuffer).toString("base64"),
          filename: payload.cvFilename
        }
      ]
    })
  });

  const details = await response.text().catch(() => "");
  if (!response.ok) {
    logTechnicalError("professional_email_rejected", null, response.status);
    return { ok: false, error: "The CV could not be delivered. Please try again." };
  }

  let emailId = null;
  try {
    emailId = JSON.parse(details).id || null;
  } catch {
    console.warn("Professional application email returned no message id");
  }

  return { ok: true, emailId };
}

async function sendReviewEmail(env, payload) {
  if (!env.RESEND_API_KEY) {
    return { ok: false, error: "Review notification is not configured yet." };
  }

  const to = env.CONTACT_TO || "admin@askfortask.co.uk";
  const from = env.CONTACT_FROM || "A4T Studio <contact@askfortask.co.uk>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": `client-review/${payload.id}`
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Review submitted - ${payload.name} - ${payload.service}`,
      text: makeReviewEmailText(payload),
      html: makeReviewEmailHtml(payload),
      reply_to: payload.email
    })
  });

  const details = await response.text().catch(() => "");
  if (!response.ok) {
    logTechnicalError("review_email_rejected", null, response.status);
    return { ok: false, error: "The review notification could not be delivered." };
  }

  let emailId = null;
  try {
    emailId = JSON.parse(details).id || null;
  } catch {
    console.warn("Review notification returned no message id");
  }

  return { ok: true, emailId };
}

function controlledPartnerSource(value) {
  const source = clean(value, 80);
  return PARTNER_SOURCE_PAGES.has(source) ? source : "direct";
}

async function handlePartnerRedirect(request, env, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  const match = url.pathname.match(/^\/go\/([a-z0-9-]+)\/?$/);
  const slug = match?.[1] || "";
  const destination = PARTNER_DESTINATIONS[slug];

  if (!destination) {
    return json({ ok: false, error: "Partner link not found." }, 404);
  }

  if (request.method === "GET" && env.DB) {
    try {
      await env.DB.prepare(
        `INSERT INTO partner_click_daily (
           partner_slug, source_page, click_date, request_count
         ) VALUES (?1, ?2, ?3, 1)
         ON CONFLICT(partner_slug, source_page, click_date)
         DO UPDATE SET request_count = request_count + 1`
      )
        .bind(
          slug,
          controlledPartnerSource(url.searchParams.get("source")),
          new Date().toISOString().slice(0, 10)
        )
        .run();
    } catch (error) {
      logTechnicalError("partner_click_count_failed", error);
    }
  }

  return new Response(null, {
    status: 302,
    headers: {
      "cache-control": "private, no-store",
      location: destination,
      "x-robots-tag": "noindex, nofollow"
    }
  });
}

function subtractUtcMonths(reference, months) {
  const date = new Date(reference);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("A valid retention reference date is required.");
  }

  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  const daysInTargetMonth = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    0
  )).getUTCDate();
  date.setUTCDate(Math.min(day, daysInTargetMonth));
  return date;
}

export async function runRetentionCleanup(db, reference = new Date()) {
  if (!db) throw new Error("DB binding is required for retention cleanup.");

  const enquiryCutoff = subtractUtcMonths(reference, 24).toISOString();
  const professionalCutoff = subtractUtcMonths(reference, 12).toISOString();
  const partnerCutoff = subtractUtcMonths(reference, 24).toISOString().slice(0, 10);
  const rateLimitCutoff = Math.floor(reference.getTime() / 1000);

  return db.batch([
    db.prepare(
      `DELETE FROM contact_messages
       WHERE retention_hold = 0
         AND COALESCE(retention_reference_at, created_at) < ?1`
    ).bind(enquiryCutoff),
    db.prepare(
      `DELETE FROM client_reviews
       WHERE retention_hold = 0
         AND COALESCE(retention_reference_at, created_at) < ?1
         AND NOT (
           publish_consent = 1
           AND moderation_status IN ('approved', 'published')
         )`
    ).bind(enquiryCutoff),
    db.prepare(
      `DELETE FROM professional_applications
       WHERE retention_hold = 0
         AND COALESCE(retention_reference_at, created_at) < ?1`
    ).bind(professionalCutoff),
    db.prepare(
      `DELETE FROM partner_click_daily
       WHERE click_date < ?1`
    ).bind(partnerCutoff),
    db.prepare(
      `DELETE FROM form_rate_limits
       WHERE expires_at < ?1`
    ).bind(rateLimitCutoff)
  ]);
}

async function handleRequest(request, env) {
    const url = new URL(request.url);
    let redirectToCanonical = false;

    const isPublicHost = url.hostname === "askfortask.co.uk"
      || url.hostname === "www.askfortask.co.uk";

    if (isPublicHost && url.protocol !== "https:") {
      url.protocol = "https:";
      redirectToCanonical = true;
    }

    if (url.hostname === "www.askfortask.co.uk") {
      url.hostname = "askfortask.co.uk";
      redirectToCanonical = true;
    }

    // Resolve retired page aliases before slash/host redirects to avoid extra hops.
    const retiredPath = url.pathname.replace(/(?:\/index\.html|\.html|\/)?$/, "/");
    const destination = CONSOLIDATED_PAGES[retiredPath];
    if (destination && (request.method === "GET" || request.method === "HEAD")) {
      const target = new URL(destination, url);
      target.search = url.search;
      return Response.redirect(target.toString(), 301);
    }

    if (redirectToCanonical && url.pathname.startsWith("/go/")) {
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname.startsWith("/go/")) {
      return handlePartnerRedirect(request, env, url);
    }

    const isNotFoundAlias = ["/404", "/404/", "/404.html"].includes(url.pathname);
    if (isNotFoundAlias) {
      if (redirectToCanonical) {
        return Response.redirect(url.toString(), 301);
      }

      const notFoundUrl = new URL("/__ask-for-task-not-found__", url);
      return env.ASSETS.fetch(new Request(notFoundUrl, request));
    }

    const isPagePath = url.pathname.length > 1
      && !url.pathname.endsWith("/")
      && !url.pathname.split("/").pop().includes(".")
      && !url.pathname.startsWith("/api/")
      && !url.pathname.startsWith("/go/");

    if (isPagePath) {
      url.pathname += "/";
      redirectToCanonical = true;
    }

    if (redirectToCanonical) {
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/contact-config") {
      return json({
        ok: true,
        resendConfigured: Boolean(env.RESEND_API_KEY),
        contactToConfigured: Boolean(env.CONTACT_TO),
        contactFromConfigured: Boolean(env.CONTACT_FROM),
        dbConfigured: Boolean(env.DB)
      });
    }

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed." }, 405);
      }

      const rateLimitResponse = await enforceSubmissionRateLimit(request, env, "contact");
      if (rateLimitResponse) return rateLimitResponse;

      let payload;
      try {
        payload = await readJsonBody(request);
      } catch (error) {
        if (error instanceof HttpError) {
          return json({ ok: false, error: error.message }, error.status);
        }
        logTechnicalError("contact_request_read_failed", error);
        return json({ ok: false, error: "Invalid request body." }, 400);
      }

      try {
        if (readString(payload, "website", 160, { singleLine: true })) {
          return json({ ok: true });
        }
      } catch (error) {
        if (error instanceof HttpError) {
          return json({ ok: false, error: error.message }, error.status);
        }
        return json({ ok: false, error: "Invalid contact details." }, 400);
      }

      let contact;
      try {
        contact = validateContactPayload(payload);
      } catch (error) {
        if (error instanceof HttpError) {
          return json({ ok: false, error: error.message }, error.status);
        }
        logTechnicalError("contact_validation_failed", error);
        return json({ ok: false, error: "Invalid contact details." }, 400);
      }

      const { name, email, topic, region, budget, targetDate, message } = contact;

      try {
        if (!env.DB) {
          throw new Error("DB binding is not configured.");
        }

        await env.DB.prepare(
          `INSERT INTO contact_messages (
             name, email, topic, region, budget, target_date, message, consent, source, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            name,
            email,
            topic || null,
            region || null,
            budget || null,
            targetDate || null,
            message,
            1,
            "askfortask.co.uk",
            new Date().toISOString()
          )
          .run();
      } catch (error) {
        logTechnicalError("contact_store_failed", error);
      }

      let emailResult;
      try {
        emailResult = await sendContactEmail(env, {
          name,
          email,
          topic,
          region,
          budget,
          targetDate,
          message
        });
      } catch (error) {
        logTechnicalError("contact_email_failed", error);
        return json({ ok: false, error: "Email service failed to send the message." }, 500);
      }

      if (!emailResult.ok) {
        return json({ ok: false, error: emailResult.error }, 500);
      }

      return json({ ok: true });
    }

    if (url.pathname === "/api/reviews") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed." }, 405);
      }

      const rateLimitResponse = await enforceSubmissionRateLimit(request, env, "reviews");
      if (rateLimitResponse) return rateLimitResponse;

      let payload;
      try {
        payload = await readJsonBody(request);
      } catch (error) {
        if (error instanceof HttpError) {
          return json({ ok: false, error: error.message }, error.status);
        }
        logTechnicalError("review_request_read_failed", error);
        return json({ ok: false, error: "Invalid request body." }, 400);
      }

      let name;
      let email;
      let companyProject;
      let service;
      let relationship;
      let reviewText;
      try {
        if (readString(payload, "website", 160, { singleLine: true })) {
          return json({ ok: true });
        }
        name = readString(payload, "name", 160, { required: true, singleLine: true });
        email = readString(payload, "email", 254, { required: true, singleLine: true }).toLowerCase();
        companyProject = readString(payload, "companyProject", 240, { singleLine: true });
        service = readString(payload, "service", 120, { required: true, singleLine: true });
        relationship = readString(payload, "relationship", 120, { required: true, singleLine: true });
        reviewText = readString(payload, "reviewText", 2000, { required: true });
      } catch (error) {
        if (error instanceof HttpError) {
          return json({ ok: false, error: error.message }, error.status);
        }
        return json({ ok: false, error: "Invalid review details." }, 400);
      }
      const contactConsent = payload.contactConsent === true;
      const publishConsent = payload.publishConsent === true;

      if (!isValidEmail(email)) {
        return json({ ok: false, error: "Enter a valid email address." }, 400);
      }

      if (!REVIEW_SERVICES.has(service) || !REVIEW_RELATIONSHIPS.has(relationship)) {
        return json({ ok: false, error: "Choose valid review details." }, 400);
      }

      if (!contactConsent) {
        return json({ ok: false, error: "Consent is required." }, 400);
      }

      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const reviewPayload = {
        id,
        name,
        email,
        companyProject,
        service,
        relationship,
        reviewText,
        publishConsent
      };

      try {
        await env.DB.prepare(
          `INSERT INTO client_reviews (
             id, name, email, company_project, service, relationship, review_text,
             contact_consent, publish_consent, moderation_status, email_status, source, created_at
           ) VALUES (
             ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13
           )`
        )
          .bind(
            id,
            name,
            email,
            companyProject || null,
            service,
            relationship,
            reviewText,
            1,
            publishConsent ? 1 : 0,
            "pending",
            "sending",
            "askfortask.co.uk/reviews",
            createdAt
          )
          .run();
      } catch (error) {
        logTechnicalError("review_store_failed", error);
        return json({ ok: false, error: "The review could not be saved." }, 500);
      }

      let emailResult;
      try {
        emailResult = await sendReviewEmail(env, reviewPayload);
      } catch (error) {
        logTechnicalError("review_email_failed", error);
        emailResult = { ok: false, error: "The review notification could not be delivered." };
      }

      try {
        await env.DB.prepare(
          `UPDATE client_reviews
           SET email_status = ?1, resend_email_id = ?2
           WHERE id = ?3`
        )
          .bind(
            emailResult.ok ? "received" : "delivery_failed",
            emailResult.emailId || null,
            id
          )
          .run();
      } catch (error) {
        logTechnicalError("review_status_update_failed", error);
      }

      return json({ ok: true, reviewId: id });
    }

    if (url.pathname === "/api/professionals") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed." }, 405);
      }

      const rateLimitResponse = await enforceSubmissionRateLimit(request, env, "professionals");
      if (rateLimitResponse) return rateLimitResponse;

      if (!isMultipartContentType(request.headers.get("content-type") || "")) {
        return json({ ok: false, error: "Content-Type must be multipart/form-data." }, 415);
      }

      if (!env.DB || !env.RESEND_API_KEY) {
        return json({ ok: false, error: "Applications are temporarily unavailable." }, 503);
      }

      let formData;
      try {
        const body = await readBodyBytes(request, MAX_APPLICATION_BODY_BYTES);
        formData = await new Request(request.url, {
          method: "POST",
          headers: request.headers,
          body
        }).formData();
      } catch (error) {
        if (error instanceof HttpError) {
          const message = error.status === 413
            ? "The application is too large. Use a PDF under 5 MB."
            : error.message;
          return json({ ok: false, error: message }, error.status);
        }
        return json({ ok: false, error: "The application could not be read." }, 400);
      }

      if (clean(formData.get("company"), 160)) {
        return json({ ok: true });
      }

      const name = clean(formData.get("name"), 160);
      const email = clean(formData.get("email"), 254).toLowerCase();
      const location = clean(formData.get("location"), 180);
      const categories = [...new Set(
        formData
          .getAll("categories")
          .map((value) => clean(value, 120))
          .filter((value) => PROFESSIONAL_CATEGORIES.has(value))
      )];
      const specialisms = clean(formData.get("specialisms"), 2000);
      const responsibility = clean(formData.get("responsibility"), 120);
      const availability = clean(formData.get("availability"), 120);
      const rawProfileUrl = clean(formData.get("profileUrl"), 500);
      const profileUrl = validHttpUrl(rawProfileUrl);
      const projectInterest = clean(formData.get("projectInterest"), 2500);
      const consent = formData.get("consent") === "on";
      const cv = formData.get("cv");

      if (
        !name
        || !email
        || !location
        || !categories.length
        || !specialisms
        || !RESPONSIBILITY_LEVELS.has(responsibility)
        || !AVAILABILITY_OPTIONS.has(availability)
        || !projectInterest
      ) {
        return json({ ok: false, error: "Complete all required profile fields." }, 400);
      }

      if (!isValidEmail(email)) {
        return json({ ok: false, error: "Enter a valid email address." }, 400);
      }

      if (rawProfileUrl && !profileUrl) {
        return json({ ok: false, error: "Enter a valid portfolio or LinkedIn URL." }, 400);
      }

      if (!consent) {
        return json({ ok: false, error: "Consent is required." }, 400);
      }

      if (!cv || typeof cv.arrayBuffer !== "function" || !cv.name) {
        return json({ ok: false, error: "Attach your CV as a PDF." }, 400);
      }

      if (!cv.size || cv.size > MAX_CV_BYTES) {
        return json({ ok: false, error: "Your CV must be a PDF under 5 MB." }, 413);
      }

      const cvFilename = safePdfFilename(cv.name);
      if (!cv.name.toLowerCase().endsWith(".pdf") || cv.type !== "application/pdf") {
        return json({ ok: false, error: "Your CV must be a PDF file." }, 400);
      }

      const cvBuffer = await cv.arrayBuffer();
      const pdfHeader = Buffer.from(cvBuffer).subarray(0, 5).toString("ascii");
      if (pdfHeader !== "%PDF-") {
        return json({ ok: false, error: "The attached file is not a valid PDF." }, 400);
      }

      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const payload = {
        id,
        name,
        email,
        location,
        categories,
        specialisms,
        responsibility,
        availability,
        profileUrl,
        projectInterest,
        cvFilename
      };

      try {
        await env.DB.prepare(
          `INSERT INTO professional_applications (
             id, name, email, location, categories, specialisms, responsibility,
             profile_url, availability, project_interest, cv_filename, cv_size,
             status, consent, source, created_at
           ) VALUES (
             ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16
           )`
        )
          .bind(
            id,
            name,
            email,
            location,
            JSON.stringify(categories),
            specialisms,
            responsibility,
            profileUrl || null,
            availability,
            projectInterest,
            cvFilename,
            cv.size,
            "sending",
            1,
            "askfortask.co.uk/professionals",
            createdAt
          )
          .run();
      } catch (error) {
        logTechnicalError("professional_store_failed", error);
        return json({ ok: false, error: "The application could not be saved." }, 500);
      }

      let emailResult;
      try {
        emailResult = await sendProfessionalEmail(env, payload, cvBuffer);
      } catch (error) {
        logTechnicalError("professional_email_failed", error);
        emailResult = { ok: false, error: "The CV could not be delivered. Please try again." };
      }

      try {
        await env.DB.prepare(
          `UPDATE professional_applications
           SET status = ?1, resend_email_id = ?2
           WHERE id = ?3`
        )
          .bind(
            emailResult.ok ? "received" : "delivery_failed",
            emailResult.emailId || null,
            id
          )
          .run();
      } catch (error) {
        logTechnicalError("professional_status_update_failed", error);
      }

      if (!emailResult.ok) {
        return json({ ok: false, error: emailResult.error }, 500);
      }

      return json({ ok: true, applicationId: id });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "Not found." }, 404);
    }

    return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env) {
    return withSecurityHeaders(await handleRequest(request, env));
  },

  async scheduled(controller, env) {
    const reference = Number.isFinite(controller?.scheduledTime)
      ? new Date(controller.scheduledTime)
      : new Date();
    await runRetentionCleanup(env.DB, reference);
  }
};
