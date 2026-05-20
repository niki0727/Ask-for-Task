const form = document.getElementById("contact-form");
const status = document.getElementById("contact-status");

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

  status.textContent = "Sending message...";

  fetch("/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Something went wrong. Please try again.");
      }

      form.reset();
      status.textContent = "Message sent. We will reply as soon as we can.";
    })
    .catch((error) => {
      status.textContent = error.message;
    });
});
