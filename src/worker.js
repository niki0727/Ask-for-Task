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

function makeEmailText({ name, email, topic, message }) {
  return [
    "New Ask for Task enquiry",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Topic: ${topic || "Not specified"}`,
    "",
    "Message:",
    message
  ].join("\n");
}

function makeEmailHtml({ name, email, topic, message }) {
  return `
    <h2>New Ask for Task enquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Topic:</strong> ${escapeHtml(topic || "Not specified")}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space: pre-line;">${escapeHtml(message)}</p>
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

      try {
        if (!env.DB) {
          throw new Error("DB binding is not configured.");
        }

        await env.DB.prepare(
          `INSERT INTO contact_messages (name, email, topic, message, consent, source, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(name, email, topic || null, message, 1, "askfortask.co.uk", new Date().toISOString())
          .run();
      } catch (error) {
        console.error("Failed to store contact message", error);
      }

      let emailResult;
      try {
        emailResult = await sendContactEmail(env, { name, email, topic, message });
      } catch (error) {
        console.error("Failed to send contact email", error);
        return json({ ok: false, error: "Email service failed to send the message." }, 500);
      }

      if (!emailResult.ok) {
        return json({ ok: false, error: emailResult.error }, 500);
      }

      return json({ ok: true });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "Not found." }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
