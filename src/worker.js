import { EmailMessage } from "cloudflare:email";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function clean(value, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHeader(value) {
  return clean(value, 300).replace(/[\r\n"]/g, " ");
}

function makeEmailBody({ name, email, topic, message }) {
  return [
    `New Ask for Task enquiry`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    `Topic: ${topic || "Not specified"}`,
    ``,
    `Message:`,
    message
  ].join("\n");
}

function makeRawEmail({ name, email, topic, message }) {
  const sender = "Ask for Task <no-reply@askfortask.co.uk>";
  const recipient = "admin@askfortask.co.uk";
  const safeName = escapeHeader(name);
  const safeEmail = escapeHeader(email);
  const subjectTopic = topic ? ` - ${escapeHeader(topic)}` : "";
  const subject = `New Ask for Task enquiry${subjectTopic}`;
  const body = makeEmailBody({ name, email, topic, message });

  return [
    `From: ${sender}`,
    `To: ${recipient}`,
    `Reply-To: "${safeName}" <${safeEmail}>`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    body
  ].join("\r\n");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "www.askfortask.co.uk") {
      url.hostname = "askfortask.co.uk";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed." }, 405);
      }

      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid request body." }, 400);
      }

      const name = clean(payload.name, 160);
      const email = clean(payload.email, 254).toLowerCase();
      const topic = clean(payload.topic, 120);
      const message = clean(payload.message, 4000);
      const consent = payload.consent === true;

      if (!name || !email || !message) {
        return json({ ok: false, error: "Name, email, and message are required." }, 400);
      }

      if (!isValidEmail(email)) {
        return json({ ok: false, error: "Enter a valid email address." }, 400);
      }

      if (!consent) {
        return json({ ok: false, error: "Consent is required." }, 400);
      }

      await env.DB.prepare(
        `INSERT INTO contact_messages (name, email, topic, message, consent, source, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(name, email, topic || null, message, 1, "askfortask.co.uk", new Date().toISOString())
        .run();

      if (!env.EMAIL) {
        return json({ ok: false, error: "Email sending is not configured yet." }, 500);
      }

      const rawEmail = makeRawEmail({ name, email, topic, message });
      const notification = new EmailMessage(
        "no-reply@askfortask.co.uk",
        "admin@askfortask.co.uk",
        rawEmail
      );

      await env.EMAIL.send(notification);

      return json({ ok: true });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "Not found." }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
