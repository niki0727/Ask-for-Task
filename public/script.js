const form = document.getElementById("contact-form");
const status = document.getElementById("contact-status");
const recipient = "admin@askfortask.co.uk";

function buildMailto({ name, email, topic, message }) {
  const subject = `Ask for Task enquiry${topic ? ` - ${topic}` : ""}`;
  const body = [
    "New Ask for Task enquiry",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Topic: ${topic || "Not specified"}`,
    "",
    "Message:",
    message
  ].join("\n");

  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = {
    name: document.getElementById("contact-name").value.trim(),
    email: document.getElementById("contact-email").value.trim(),
    topic: document.getElementById("contact-topic").value.trim(),
    message: document.getElementById("contact-message").value.trim(),
    consent: document.getElementById("contact-consent").checked
  };

  if (!payload.consent) {
    status.textContent = "Please confirm consent before sending.";
    return;
  }

  if (!payload.name || !payload.email || !payload.message) {
    status.textContent = "Please complete name, email, and message.";
    return;
  }

  status.textContent = "Opening your email app...";
  window.location.href = buildMailto(payload);
});
