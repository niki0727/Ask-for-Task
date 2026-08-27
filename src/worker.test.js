import assert from "node:assert/strict";
import test from "node:test";

import worker, {
  makeEmailHtml,
  CONSOLIDATED_PAGES,
  PARTNER_DESTINATIONS,
  runRetentionCleanup,
  validateContactPayload
} from "./worker.js";

function createEnv(overrides = {}) {
  return {
    ASSETS: {
      fetch: async (request) => new Response(new URL(request.url).pathname)
    },
    RESEND_API_KEY: "test-key",
    CONTACT_TO: "admin@example.com",
    CONTACT_FROM: "A4T Studio <contact@example.com>",
    DB: createRecordingDb().binding,
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
  const rateLimitCalls = [];
  const rateLimits = new Map();
  return {
    calls,
    rateLimitCalls,
    binding: {
      prepare(sql) {
        return {
          bind(...values) {
            if (sql.includes("INSERT INTO form_rate_limits")) {
              rateLimitCalls.push({ sql, values });
              return {
                async first() {
                  const key = values.slice(0, 3).join(":");
                  const requestCount = (rateLimits.get(key) || 0) + 1;
                  rateLimits.set(key, requestCount);
                  return { request_count: requestCount };
                }
              };
            }
            calls.push({ sql, values });
            return { run: async () => ({ success: true }) };
          }
        };
      }
    }
  };
}

function assertSecurityHeaders(response) {
  const csp = response.headers.get("content-security-policy") || "";
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /form-action 'self'/);
  assert.match(csp, /script-src-attr 'none'/);
  assert.match(csp, /style-src-attr 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("set-cookie"), null);
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
            if (values.length === 4 && typeof values[2] === "number") {
              return { first: async () => ({ request_count: 1 }) };
            }
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

test("rate limits repeated contact submissions without storing or emailing the excess request", async (t) => {
  let emailCount = 0;
  t.mock.method(globalThis, "fetch", async () => {
    emailCount += 1;
    return new Response(JSON.stringify({ id: `email-${emailCount}` }), { status: 202 });
  });

  const db = createRecordingDb();
  const env = createEnv({ DB: db.binding });
  let response;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    response = await worker.fetch(contactRequest(validPayload, {
      headers: { "cf-connecting-ip": "203.0.113.10" }
    }), env);
  }

  assert.equal(response.status, 429);
  assert.match(response.headers.get("retry-after"), /^\d+$/);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "Too many submissions. Please wait a few minutes and try again."
  });
  assert.equal(emailCount, 5);
  assert.equal(db.calls.filter(({ sql }) => /INSERT INTO contact_messages/.test(sql)).length, 5);
  assert.equal(db.rateLimitCalls.length, 6);
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

for (const [oldPath, destination] of Object.entries(CONSOLIDATED_PAGES)) {
  test(`consolidates ${oldPath} aliases in one hop and preserves queries`, async () => {
    const stem = oldPath.slice(0, -1);
    for (const alias of [stem, oldPath, `${stem}.html`, `${oldPath}index.html`]) {
      for (const method of ["GET", "HEAD"]) {
        const response = await worker.fetch(
          new Request(`http://www.askfortask.co.uk${alias}?ref=legacy&topic=Design`, { method }),
          createEnv()
        );
        const expected = new URL(destination, "https://askfortask.co.uk");
        expected.search = "?ref=legacy&topic=Design";
        assert.equal(response.status, 301);
        assert.equal(response.headers.get("location"), expected.href);
        assert.equal(response.headers.get("x-content-type-options"), "nosniff");
        const final = await worker.fetch(new Request(expected, { method }), createEnv());
        assert.equal(final.status, 200);
        assert.equal(final.headers.get("location"), null);
      }
    }
  });
}

test("consolidated redirects do not capture unrelated nested paths", async () => {
  const response = await worker.fetch(new Request("https://askfortask.co.uk/design/unknown/"), createEnv());
  assert.equal(response.headers.get("location"), null);
  assert.equal(await response.text(), "/design/unknown/");
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
    new Blob(["%PDF-1.4\nA4T Studio test CV"], { type: "application/pdf" }),
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

for (const [slug, destination] of Object.entries(PARTNER_DESTINATIONS)) {
  test(`redirects the approved ${slug} partner route`, async () => {
    const db = createRecordingDb();
    const response = await worker.fetch(
      new Request(`https://askfortask.co.uk/go/${slug}?source=home`),
      createEnv({ DB: db.binding })
    );

    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), destination);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(db.calls.length, 1);
    assert.match(db.calls[0].sql, /ON CONFLICT\(partner_slug, source_page, click_date\)/);
    assert.match(db.calls[0].sql, /request_count = request_count \+ 1/);
    assert.equal(db.calls[0].values[0], slug);
    assert.equal(db.calls[0].values[1], "home");
    assert.match(db.calls[0].values[2], /^\d{4}-\d{2}-\d{2}$/);
    assertSecurityHeaders(response);
  });
}

test("returns 404 for an unknown partner slug", async () => {
  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/go/not-approved?source=home"),
    createEnv()
  );

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("location"), null);
  assertSecurityHeaders(response);
});

test("does not accept an arbitrary redirect destination", async () => {
  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/go/pinglo?source=home&url=https://example.net/steal"),
    createEnv()
  );

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), PARTNER_DESTINATIONS.pinglo);
  assert.notEqual(response.headers.get("location"), "https://example.net/steal");
});

test("normalises an invalid partner source to the controlled direct label", async () => {
  const db = createRecordingDb();
  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/go/nk-sports?source=../../private"),
    createEnv({ DB: db.binding })
  );

  assert.equal(response.status, 302);
  assert.equal(db.calls[0].values[1], "direct");
});

test("still redirects when partner counting fails", async (t) => {
  t.mock.method(console, "error", () => {});
  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/go/dmar-international?source=services"),
    createEnv({
      DB: {
        prepare() {
          return {
            bind() {
              return { run: async () => { throw new Error("D1 unavailable"); } };
            }
          };
        }
      }
    })
  );

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), PARTNER_DESTINATIONS["dmar-international"]);
});

test("does not count HEAD requests to partner routes", async () => {
  const db = createRecordingDb();
  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/go/pinglo?source=home", { method: "HEAD" }),
    createEnv({ DB: db.binding })
  );

  assert.equal(response.status, 302);
  assert.equal(db.calls.length, 0);
});

test("silently accepts a filled contact honeypot without storing or emailing", async (t) => {
  let emailCalled = false;
  t.mock.method(globalThis, "fetch", async () => {
    emailCalled = true;
    return new Response(null, { status: 202 });
  });
  const db = createRecordingDb();
  const response = await worker.fetch(
    contactRequest({ website: "spam.example", consent: false }),
    createEnv({ DB: db.binding })
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(emailCalled, false);
  assert.equal(db.calls.length, 0);
});

test("rejects an oversized review field instead of truncating it", async () => {
  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Client",
        email: "client@example.com",
        service: "Managed project delivery",
        relationship: "Client",
        reviewText: "x".repeat(2001),
        contactConsent: true,
        website: ""
      })
    }),
    createEnv({ DB: createRecordingDb().binding })
  );

  assert.equal(response.status, 400);
});

test("requires multipart form data for professional applications", async () => {
  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/api/professionals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    }),
    createEnv({ DB: createRecordingDb().binding })
  );

  assert.equal(response.status, 415);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "Content-Type must be multipart/form-data."
  });
});

test("rejects a professional CV with a misleading MIME type", async () => {
  const formData = new FormData();
  formData.append("name", "Professional Name");
  formData.append("email", "professional@example.com");
  formData.append("location", "London, UK");
  formData.append("categories", "Brand development");
  formData.append("specialisms", "Product and brand design");
  formData.append("responsibility", "Workstream owner");
  formData.append("availability", "Open to the right project");
  formData.append("projectInterest", "A suitable project.");
  formData.append("consent", "on");
  formData.append("cv", new Blob(["%PDF-1.4\n"], { type: "text/plain" }), "cv.pdf");

  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/api/professionals", { method: "POST", body: formData }),
    createEnv({ DB: createRecordingDb().binding })
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: "Your CV must be a PDF file." });
});

test("rejects a professional CV without a PDF signature", async () => {
  const formData = new FormData();
  formData.append("name", "Professional Name");
  formData.append("email", "professional@example.com");
  formData.append("location", "London, UK");
  formData.append("categories", "Brand development");
  formData.append("specialisms", "Product and brand design");
  formData.append("responsibility", "Workstream owner");
  formData.append("availability", "Open to the right project");
  formData.append("projectInterest", "A suitable project.");
  formData.append("consent", "on");
  formData.append("cv", new Blob(["not a pdf"], { type: "application/pdf" }), "cv.pdf");

  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/api/professionals", { method: "POST", body: formData }),
    createEnv({ DB: createRecordingDb().binding })
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "The attached file is not a valid PDF."
  });
});

test("applies security and no-cookie headers to static and API responses", async () => {
  const pageResponse = await worker.fetch(
    new Request("https://askfortask.co.uk/about/"),
    createEnv()
  );
  const apiResponse = await worker.fetch(
    new Request("https://askfortask.co.uk/api/contact-config"),
    createEnv()
  );

  assertSecurityHeaders(pageResponse);
  assertSecurityHeaders(apiResponse);
  assert.equal(apiResponse.headers.get("cache-control"), "no-store");
  assert.equal(apiResponse.headers.get("set-cookie"), null);
});

test("retention cleanup uses explicit cutoffs and protects held or published records", async () => {
  const prepared = [];
  let batchStatements;
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          const statement = { sql, values };
          prepared.push(statement);
          return statement;
        }
      };
    },
    async batch(statements) {
      batchStatements = statements;
      return statements.map(() => ({ success: true }));
    }
  };

  await runRetentionCleanup(db, new Date("2026-08-24T12:00:00.000Z"));

  assert.equal(prepared.length, 5);
  assert.equal(batchStatements.length, 5);
  assert.match(prepared[0].sql, /DELETE FROM contact_messages/);
  assert.match(prepared[0].sql, /retention_hold = 0/);
  assert.match(prepared[0].sql, /COALESCE\(retention_reference_at, created_at\) < \?1/);
  assert.equal(prepared[0].values[0], "2024-08-24T12:00:00.000Z");
  assert.match(prepared[1].sql, /moderation_status IN \('approved', 'published'\)/);
  assert.equal(prepared[1].values[0], "2024-08-24T12:00:00.000Z");
  assert.match(prepared[2].sql, /DELETE FROM professional_applications/);
  assert.equal(prepared[2].values[0], "2025-08-24T12:00:00.000Z");
  assert.match(prepared[3].sql, /DELETE FROM partner_click_daily/);
  assert.equal(prepared[3].values[0], "2024-08-24");
  assert.match(prepared[4].sql, /DELETE FROM form_rate_limits/);
  assert.equal(prepared[4].values[0], 1787572800);
});

test("does not expose retention cleanup as a public API", async () => {
  const response = await worker.fetch(
    new Request("https://askfortask.co.uk/api/retention-cleanup", { method: "POST" }),
    createEnv()
  );

  assert.equal(response.status, 404);
  assertSecurityHeaders(response);
});
