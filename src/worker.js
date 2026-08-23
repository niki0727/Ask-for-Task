import { Buffer } from "node:buffer";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

const MAX_CV_BYTES = 5 * 1024 * 1024;
const MAX_APPLICATION_BODY_BYTES = 7 * 1024 * 1024;
const MAX_JSON_BODY_BYTES = 32 * 1024;
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
  "£25,000–£50,000",
  "Over £50,000 / phased"
]);
const PROFESSIONAL_CATEGORIES = new Set([
  "Apps & product development",
  "Design & brand",
  "Photography & content",
  "Writing & editorial",
  "Business & growth",
  "Project delivery & operations",
  "Drone & aerial content",
  "Sustainability & ESG"
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
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
    "New Ask for Task enquiry",
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
    <h2>New Ask for Task enquiry</h2>
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
    "New Ask for Task review",
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
    <h2>New Ask for Task review</h2>
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
    "New Ask for Task professional profile",
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
    <h2>New Ask for Task professional profile</h2>
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
  const from = env.CONTACT_FROM || "Ask for Task <contact@askfortask.co.uk>";
  const subject = `New Ask for Task enquiry${payload.topic ? ` - ${payload.topic}` : ""}`;

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
    const details = await response.text().catch(() => "");
    console.error("Email provider rejected the message", details);
    return { ok: false, error: "Email provider rejected the message." };
  }

  return { ok: true };
}

async function sendProfessionalEmail(env, payload, cvBuffer) {
  if (!env.RESEND_API_KEY) {
    return { ok: false, error: "Application email is not configured yet." };
  }

  const to = env.CONTACT_TO || "admin@askfortask.co.uk";
  const from = env.CONTACT_FROM || "Ask for Task <contact@askfortask.co.uk>";
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
    console.error("Email provider rejected the professional application", details);
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
  const from = env.CONTACT_FROM || "Ask for Task <contact@askfortask.co.uk>";
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
    console.error("Email provider rejected the review notification", details);
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

export default {
  async fetch(request, env) {
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
      && !url.pathname.startsWith("/api/");

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

      let payload;
      try {
        payload = await readJsonBody(request);
      } catch (error) {
        if (error instanceof HttpError) {
          return json({ ok: false, error: error.message }, error.status);
        }
        console.error("Failed to read contact request", error);
        return json({ ok: false, error: "Invalid request body." }, 400);
      }

      let contact;
      try {
        contact = validateContactPayload(payload);
      } catch (error) {
        if (error instanceof HttpError) {
          return json({ ok: false, error: error.message }, error.status);
        }
        console.error("Failed to validate contact request", error);
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
        console.error("Failed to store contact message", error);
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
        console.error("Failed to send contact email", error);
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

      if (!env.DB) {
        return json({ ok: false, error: "Reviews are temporarily unavailable." }, 503);
      }

      let payload;
      try {
        payload = await readJsonBody(request);
      } catch (error) {
        if (error instanceof HttpError) {
          return json({ ok: false, error: error.message }, error.status);
        }
        console.error("Failed to read review request", error);
        return json({ ok: false, error: "Invalid request body." }, 400);
      }

      if (clean(payload.website, 160)) {
        return json({ ok: true });
      }

      const name = clean(payload.name, 160);
      const email = clean(payload.email, 254).toLowerCase();
      const companyProject = clean(payload.companyProject, 240);
      const service = clean(payload.service, 120);
      const relationship = clean(payload.relationship, 120);
      const reviewText = clean(payload.reviewText, 2000);
      const contactConsent = payload.contactConsent === true;
      const publishConsent = payload.publishConsent === true;

      if (!name || !email || !service || !relationship || !reviewText) {
        return json({ ok: false, error: "Complete all required review fields." }, 400);
      }

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
        console.error("Failed to store client review", error);
        return json({ ok: false, error: "The review could not be saved." }, 500);
      }

      let emailResult;
      try {
        emailResult = await sendReviewEmail(env, reviewPayload);
      } catch (error) {
        console.error("Failed to deliver review notification", error);
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
        console.error("Failed to update review notification status", error);
      }

      return json({ ok: true, reviewId: id });
    }

    if (url.pathname === "/api/professionals") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed." }, 405);
      }

      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > MAX_APPLICATION_BODY_BYTES) {
        return json({ ok: false, error: "The application is too large. Use a PDF under 5 MB." }, 413);
      }

      if (!env.DB || !env.RESEND_API_KEY) {
        return json({ ok: false, error: "Applications are temporarily unavailable." }, 503);
      }

      let formData;
      try {
        formData = await request.formData();
      } catch {
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
      if (!cv.name.toLowerCase().endsWith(".pdf")) {
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
        console.error("Failed to store professional application", error);
        return json({ ok: false, error: "The application could not be saved." }, 500);
      }

      let emailResult;
      try {
        emailResult = await sendProfessionalEmail(env, payload, cvBuffer);
      } catch (error) {
        console.error("Failed to deliver professional application", error);
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
        console.error("Failed to update professional application status", error);
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
};
