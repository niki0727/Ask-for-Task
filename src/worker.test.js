import assert from "node:assert/strict";
import test from "node:test";

import worker, { makeEmailHtml, validateContactPayload } from "./worker.js";

function createEnv(overrides = {}) {
  return {
    ASSETS: {
      fetch: async (request) => new Response(new URL(request.url).pathname)
    },
    RESEND_API_KEY: "test-key",
    CONTACT_TO: "admin@example.com",
    CONTACT_FROM: "Ask for Task <contact@example.com>",
    ...overrides
  };
}

function contactRequest(body, init = {}) {
  return new Request("https://askfortask.co.uk/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", ...init.headers },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

function createRecordingDb() {
  const calls = [];
  return {
    calls,
    binding: {
      prepare(sql) {
        return {
          bind(...values) {
            calls.push({ sql, values });
            return { run: async () => ({ success: true }) };
          }
        };
      }
    }
  };
}

const validPayload = {
  name: "Niki",
  email: "NIKI@example.com",
  topic: "Build a product",
  region: "United Kingdom",
  budget: "£5,000–£10,000",
  targetDate: "2026-12-01",
  message: "Please tell me more.",
  consent: true
};

test("validates and normalises a complete contact payload", () => {
  assert.deepEqual(validateContactPayload({
    ...validPayload,
    name: "  Niki   P  ",
    topic: " Build\n a product "
  }), {
    name: "Niki P",
    email: "niki@example.com",
    topic: "Build a product",
    region: "United Kingdom",
    budget: "£5,000–£10,000",
    targetDate: "2026-12-01",
    message: "Please tell me more."
  });
});

test("escapes user content in the contact email", () => {
  const html = makeEmailHtml({
    name: "<Niki>",
    email: "niki@example.com",
    topic: "A & B",
    region: "United Kingdom",
    budget: "£1,000–£5,000",
    targetDate: "2026-12-01",
    message: "Hello <script>"
  });

  assert.match(html, /&lt;Niki&gt;/);
  assert.match(html, /A &amp; B/);
  assert.doesNotMatch(html, /<script>/);
});

test("rejects unsupported JSON content types", async () => {
  const request = contactRequest(JSON.stringify(validPayload), {
    headers: { "content-type": "text/plain" }
  });
  const response = await worker.fetch(request, createEnv());

  assert.equal(response.status, 415);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "Content-Type must be application/json."
  });
});

test("rejects oversized contact bodies", async () => {
  const response = await worker.fetch(
    contactRequest({ ...validPayload, message: "x".repeat(40_000) }),
    createEnv()
  );

  assert.equal(response.status, 413);
});

test("rejects invalid contact details", async () => {
  const response = await worker.fetch(
    contactRequest({ ...validPayload, email: "not-an-email" }),
    createEnv()
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "Enter a valid email address."
  });
});

test("stores and emails a valid contact request", async (t) => {
  let emailRequest;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    emailRequest = { url, init };
    return new Response(JSON.stringify({ id: "email-1" }), { status: 202 });
  });

  let boundValues;
  const env = createEnv({
    DB: {
      prepare() {
        return {
          bind(...values) {
            boundValues = values;
            return { run: async () => ({ success: true }) };
          }
        };
      }
    }
  });
  const response = await worker.fetch(contactRequest(validPayload), env);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(emailRequest.url, "https://api.resend.com/emails");
  assert.equal(JSON.parse(emailRequest.init.body).reply_to, "niki@example.com");
  assert.deepEqual(boundValues.slice(0, 7), [
    "Niki",
    "niki@example.com",
    "Build a product",
    "United Kingdom",
    "£5,000–£10,000",
    "2026-12-01",
    "Please tell me more."
  ]);
});

test("returns a safe error when the email provider fails", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
  t.mock.method(console, "error", () => {});

  const response = await worker.fetch(contactRequest(validPayload), createEnv());

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "Email provider rejected the message."
  });
});

test("forces HTTPS and the apex host while preserving path and query", async () => {
  const response = await worker.fetch(
    new Request("http://www.askfortask.co.uk/about?from=test"),
    createEnv()
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://askfortask.co.uk/about/?from=test"
  );
});

test("forces HTTPS for an apex-host request without changing its query", async () => {
  const response = await worker.fetch(
    new Request("http://askfortask.co.uk/services?ref=test"),
    createEnv()
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://askfortask.co.uk/services/?ref=test"
  );
});

test("keeps direct 404 aliases on the error page without a redirect loop", async () => {
  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/404"),
    createEnv()
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "/__ask-for-task-not-found__");
});

test("delegates canonical page requests to static assets", async () => {
  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/about/"),
    createEnv()
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "/about/");
});

test("stores a review and records the notification result", async (t) => {
  let emailPayload;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    emailPayload = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: "review-email-1" }), { status: 200 });
  });

  const db = createRecordingDb();
  const request = new Request("https://askfortask.co.uk/api/reviews", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Client Name",
      email: "client@example.com",
      companyProject: "Website project",
      service: "App or website development",
      relationship: "Client",
      reviewText: "Clear communication and a useful finished result.",
      contactConsent: true,
      publishConsent: true,
      website: ""
    })
  });

  const response = await worker.fetch(request, createEnv({ DB: db.binding }));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.match(result.reviewId, /^[0-9a-f-]{36}$/i);
  assert.equal(db.calls.length, 2);
  assert.match(db.calls[0].sql, /INSERT INTO client_reviews/);
  assert.match(db.calls[1].sql, /UPDATE client_reviews/);
  assert.deepEqual(db.calls[1].values.slice(0, 2), ["received", "review-email-1"]);
  assert.equal(emailPayload.reply_to, "client@example.com");
});

test("accepts a valid professional profile with a PDF CV", async (t) => {
  let emailPayload;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    emailPayload = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: "application-email-1" }), { status: 200 });
  });

  const formData = new FormData();
  formData.append("name", "Professional Name");
  formData.append("email", "professional@example.com");
  formData.append("location", "London, UK");
  formData.append("categories", "Apps & product development");
  formData.append("specialisms", "Product design and frontend development");
  formData.append("responsibility", "Workstream owner");
  formData.append("availability", "Open to the right project");
  formData.append("profileUrl", "https://example.com/portfolio");
  formData.append("projectInterest", "Useful digital products with a clear delivery route.");
  formData.append("consent", "on");
  formData.append(
    "cv",
    new Blob(["%PDF-1.4\nAsk for Task test CV"], { type: "application/pdf" }),
    "professional-cv.pdf"
  );

  const db = createRecordingDb();
  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/api/professionals", {
      method: "POST",
      body: formData
    }),
    createEnv({ DB: db.binding })
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.match(result.applicationId, /^[0-9a-f-]{36}$/i);
  assert.equal(db.calls.length, 2);
  assert.match(db.calls[0].sql, /INSERT INTO professional_applications/);
  assert.match(db.calls[1].sql, /UPDATE professional_applications/);
  assert.deepEqual(db.calls[1].values.slice(0, 2), ["received", "application-email-1"]);
  assert.equal(emailPayload.reply_to, "professional@example.com");
  assert.equal(emailPayload.attachments[0].filename, "professional-cv.pdf");
  assert.match(emailPayload.attachments[0].content, /^JVBERi0/);
});
