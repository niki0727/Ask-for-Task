const form = document.getElementById("contact-form");
const status = document.getElementById("contact-status");
const photoCarousel = document.querySelector("[data-photo-carousel]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const primaryNavigation = document.querySelector(".nav-links");
const menuLabel = document.querySelector("[data-menu-label]");
const topicField = document.getElementById("contact-topic");
const messageField = document.getElementById("contact-message");
const regionField = document.getElementById("contact-region");
const budgetField = document.getElementById("contact-budget");
const targetDateField = document.getElementById("contact-target-date");
const professionalForm = document.getElementById("professional-form");
const professionalStatus = document.getElementById("professional-status");
const professionalCv = document.getElementById("professional-cv");
const professionalCvName = document.getElementById("professional-cv-name");
const pageNavigation = document.querySelector(".nav");
const homeProjectRoute = document.querySelector("[data-home-project-route]");
const reviewForm = document.getElementById("review-form");
const reviewStatus = document.getElementById("review-status");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const pageProgress = document.createElement("div");
pageProgress.className = "page-progress";
pageProgress.setAttribute("aria-hidden", "true");
pageProgress.innerHTML = '<progress max="1" value="0"></progress>';
document.body.prepend(pageProgress);

const pageProgressBar = pageProgress.querySelector("progress");
let scrollFrame = 0;

const updatePagePosition = () => {
  scrollFrame = 0;
  const scrollable = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    1
  );
  const progress = Math.min(Math.max(window.scrollY / scrollable, 0), 1);

  if (pageProgressBar) {
    pageProgressBar.value = progress;
  }
  pageNavigation?.classList.toggle("is-scrolled", window.scrollY > 12);
};

const schedulePagePosition = () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(updatePagePosition);
};

window.addEventListener("scroll", schedulePagePosition, { passive: true });
window.addEventListener("resize", schedulePagePosition);
updatePagePosition();

const projectRoutes = {
  "/services/": ["Brief", "Scope", "Team", "Delivery"],
  "/brand-development/": ["Direction", "Identity", "Build", "Launch", "Develop"],
  "/app-development/": ["Discover", "Design", "Build", "Test", "Launch"],
  "/design/": ["Brief", "Concepts", "Refine", "Files"],
  "/ventures/": ["Idea", "Route", "Work", "Result"]
};

const pageRouteSteps = projectRoutes[window.location.pathname];
const cleanSubhero = document.querySelector(".clean-subhero");

if (cleanSubhero && pageRouteSteps) {
  const pageRoute = document.createElement("div");
  pageRoute.className = `page-route page-route-count-${pageRouteSteps.length}`;
  pageRoute.innerHTML = `
    <div class="container page-route-inner">
      <span class="page-route-label">Typical project route</span>
      <ol>${pageRouteSteps.map((step, index) => (
        `<li${index === 0 ? ' class="is-route-active"' : ""}><span>${step}</span></li>`
      )).join("")}</ol>
    </div>
  `;
  cleanSubhero.append(pageRoute);

  if (!reducedMotion.matches) {
    const routeItems = [...pageRoute.querySelectorAll("li")];
    let activeRouteItem = 0;
    const routeTimer = window.setInterval(() => {
      activeRouteItem += 1;
      routeItems.forEach((item, index) => {
        item.classList.toggle("is-route-active", index === activeRouteItem);
      });
      if (activeRouteItem >= routeItems.length - 1) {
        window.clearInterval(routeTimer);
      }
    }, 950);
  }
}

if (homeProjectRoute) {
  const routeButtons = [...homeProjectRoute.querySelectorAll("[data-home-route-step]")];
  const routeCopy = homeProjectRoute.querySelector("[data-home-route-copy]");
  let activeRoute = 0;
  let homeRouteTimer = 0;

  const showHomeRoute = (index) => {
    activeRoute = (index + routeButtons.length) % routeButtons.length;
    routeButtons.forEach((button, buttonIndex) => {
      button.setAttribute("aria-pressed", String(buttonIndex === activeRoute));
    });
    if (routeCopy) {
      routeCopy.textContent = routeButtons[activeRoute].dataset.copy || "";
    }
  };

  const stopHomeRoute = () => {
    if (!homeRouteTimer) return;
    window.clearInterval(homeRouteTimer);
    homeRouteTimer = 0;
  };

  const startHomeRoute = () => {
    if (reducedMotion.matches || homeRouteTimer) return;
    homeRouteTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") showHomeRoute(activeRoute + 1);
    }, 3600);
  };

  routeButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      stopHomeRoute();
      showHomeRoute(index);
    });
  });
  homeProjectRoute.addEventListener("pointerenter", stopHomeRoute);
  homeProjectRoute.addEventListener("pointerleave", startHomeRoute);
  homeProjectRoute.addEventListener("focusin", stopHomeRoute);
  homeProjectRoute.addEventListener("focusout", startHomeRoute);
  startHomeRoute();
}

const staggerGroups = document.querySelectorAll([
  ".home-service-list",
  ".home-evidence-grid",
  ".home-process-list",
  ".brand-route-grid",
  ".brand-example-list",
  ".brand-start-grid",
  ".app-type-grid",
  ".app-example-grid",
  ".app-package-grid",
  ".design-category-grid",
  ".photo-service-grid",
  ".photo-process-grid",
  ".work-evidence-grid",
  ".dmar-delivery-list",
  ".dmar-project-route",
  ".dmar-relationship-grid",
  ".review-process-grid",
  ".pricing-route",
  ".faq-grid"
].join(","));

staggerGroups.forEach((group) => {
  [...group.children].slice(0, 12).forEach((item, index) => {
    item.dataset.revealItem = "";
    item.classList.add(`reveal-order-${index}`);
  });
});

const revealHashTarget = () => {
  if (!window.location.hash) return;

  const targetId = decodeURIComponent(window.location.hash.slice(1));
  const target = document.getElementById(targetId);
  if (!target) return;

  if (target instanceof HTMLDetailsElement) target.open = true;

  window.requestAnimationFrame(() => {
    target.scrollIntoView({ block: "start", behavior: "auto" });
  });
};

window.addEventListener("load", revealHashTarget);
window.addEventListener("hashchange", revealHashTarget);

if (!reducedMotion.matches && "IntersectionObserver" in window) {
  const pageSections = [...document.querySelectorAll(
    "main > section, main > article, main > .container"
  )].slice(1);

  if (pageSections.length) {
    pageSections.forEach((section) => section.classList.add("motion-section"));
    document.documentElement.classList.add("motion-ready");

    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -4% 0px" });

    pageSections.forEach((section) => sectionObserver.observe(section));
  }
}

if (topicField) {
  const query = new URLSearchParams(window.location.search);
  const requestedTopic = query.get("topic");
  const requestedBrief = query.get("brief");
  const matchingOption = [...topicField.options].find((option) => (
    option.value.toLowerCase() === requestedTopic?.toLowerCase()
  ));

  if (matchingOption) topicField.value = matchingOption.value;
  if (messageField && requestedBrief) messageField.value = requestedBrief;
}

if (targetDateField) {
  targetDateField.min = new Date().toISOString().slice(0, 10);
}

if (menuToggle && primaryNavigation) {
  const setMenuOpen = (open) => {
    document.body.classList.toggle("nav-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    primaryNavigation.dataset.open = String(open);
    if (menuLabel) menuLabel.textContent = open ? "Close menu" : "Open menu";
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  primaryNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  const desktopNavigation = window.matchMedia("(min-width: 901px)");
  desktopNavigation.addEventListener?.("change", (event) => {
    if (event.matches) setMenuOpen(false);
  });
}

if (photoCarousel) {
  const tabs = [...photoCarousel.querySelectorAll("[data-photo-tab]")];
  const slides = [...photoCarousel.querySelectorAll("[data-photo-slide]")];
  const previous = photoCarousel.querySelector("[data-photo-prev]");
  const next = photoCarousel.querySelector("[data-photo-next]");
  let activePhotoSlide = 0;

  const showPhotoSlide = (index) => {
    activePhotoSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activePhotoSlide;
      slide.hidden = !active;
      slide.classList.toggle("active", active);
    });

    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === activePhotoSlide;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  };

  tabs.forEach((tab, tabIndex) => {
    tab.addEventListener("click", () => {
      showPhotoSlide(Number(tab.dataset.photoTab));
    });
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextTab = tabIndex;
      if (event.key === "ArrowLeft") nextTab -= 1;
      if (event.key === "ArrowRight") nextTab += 1;
      if (event.key === "Home") nextTab = 0;
      if (event.key === "End") nextTab = tabs.length - 1;
      nextTab = (nextTab + tabs.length) % tabs.length;
      showPhotoSlide(nextTab);
      tabs[nextTab].focus();
    });
  });

  previous?.addEventListener("click", () => showPhotoSlide(activePhotoSlide - 1));
  next?.addEventListener("click", () => showPhotoSlide(activePhotoSlide + 1));
}

const sendContactPayload = async (payload) => {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Something went wrong. Please try again.");
  }

  return result;
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const region = regionField?.value.trim() || "";
  const projectMessage = document.getElementById("contact-message").value.trim();

  const payload = {
    name: document.getElementById("contact-name").value.trim(),
    email: document.getElementById("contact-email").value.trim(),
    topic: document.getElementById("contact-topic").value.trim(),
    region,
    budget: budgetField?.value.trim() || "",
    targetDate: targetDateField?.value || "",
    message: projectMessage,
    website: String(new FormData(form).get("website") || "").trim(),
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

  try {
    await sendContactPayload(payload);
    form.reset();
    status.textContent = "Message sent. A person will read it and reply as soon as possible.";
  } catch (error) {
    status.textContent = error.message;
  }
});

const projectAssistantOptions = {
  category: [
    "A managed project with several parts",
    "An app or website",
    "Brand, content, or launch work",
    "Photography or visual production",
    "Business, writing, or ESG support",
    "Not sure yet"
  ],
  stage: [
    "A new idea",
    "An existing project",
    "Something that needs improving",
    "A project ready to start"
  ],
  region: [
    "United Kingdom",
    "European Union",
    "United States",
    "International / multiple regions",
    "Not location-specific"
  ]
};

const createProjectAssistant = () => {
  const assistant = document.createElement("section");
  assistant.className = "project-assistant";
  assistant.dataset.projectAssistant = "";
  assistant.hidden = true;
  assistant.innerHTML = `
    <div class="project-assistant-backdrop" data-project-assistant-close></div>
    <div class="project-assistant-panel" role="dialog" aria-modal="true" aria-labelledby="project-assistant-title">
      <header class="project-assistant-header">
        <div><span>A few practical questions</span><h2 id="project-assistant-title">Let's define your project</h2></div>
        <button type="button" class="project-assistant-close" data-project-assistant-close aria-label="Close project assistant">&times;</button>
      </header>
      <div class="project-assistant-progress"><span data-assistant-progress>Step 1 of 5</span><progress max="5" value="1" data-assistant-progress-bar aria-hidden="true"></progress></div>
      <div class="project-assistant-summary" data-assistant-summary aria-label="Your answers"></div>
      <div class="project-assistant-body" data-assistant-body></div>
      <footer class="project-assistant-footer"><button type="button" class="text-link" data-assistant-back hidden>&larr; Back</button><span>Every project enquiry is read by a person.</span></footer>
    </div>
  `;

  document.body.append(assistant);

  const assistantBody = assistant.querySelector("[data-assistant-body]");
  const assistantSummary = assistant.querySelector("[data-assistant-summary]");
  const assistantProgress = assistant.querySelector("[data-assistant-progress]");
  const assistantProgressBar = assistant.querySelector("[data-assistant-progress-bar]");
  const assistantBack = assistant.querySelector("[data-assistant-back]");
  const assistantClose = assistant.querySelector(".project-assistant-close");
  const state = { category: "", stage: "", region: "", objective: "", budget: "", targetDate: "" };
  let step = 0;
  let complete = false;
  let previousFocus = null;

  const updateSummary = () => {
    const formattedTargetDate = state.targetDate
      ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${state.targetDate}T12:00:00`))
      : "";
    const entries = [
      ["Service", state.category],
      ["Stage", state.stage],
      ["Region", state.region],
      ["Budget", state.budget],
      ["Target", formattedTargetDate]
    ].filter((entry) => entry[1]);

    assistantSummary.replaceChildren();
    entries.forEach(([label, value]) => {
      const item = document.createElement("p");
      const name = document.createElement("span");
      const answer = document.createElement("strong");
      name.textContent = label;
      answer.textContent = value;
      item.append(name, answer);
      assistantSummary.append(item);
    });
    assistantSummary.hidden = entries.length === 0;
  };

  const renderChoiceStep = (title, description, key, options) => {
    const heading = document.createElement("h3");
    const copy = document.createElement("p");
    const choices = document.createElement("div");
    heading.textContent = title;
    copy.textContent = description;
    choices.className = "project-assistant-options";

    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = option;
      button.classList.toggle("is-selected", state[key] === option);
      button.addEventListener("click", () => {
        state[key] = option;
        step += 1;
        renderAssistant();
      });
      choices.append(button);
    });

    assistantBody.append(heading, copy, choices);
  };

  const renderObjectiveStep = () => {
    assistantBody.innerHTML = `
      <h3>What would you like to make or improve?</h3>
      <p>Write it in your own words, then add any budget or date you already have. Those two fields are optional.</p>
      <label class="project-assistant-field" for="assistant-objective">Your idea<textarea id="assistant-objective" rows="6" maxlength="2000" placeholder="I would like to create, improve, launch, or solve..."></textarea></label>
      <div class="project-assistant-field-grid">
        <label class="project-assistant-field" for="assistant-budget">Budget (optional)<select id="assistant-budget">
          <option value="">Not set yet</option>
          <option>Under £1,000</option>
          <option>£1,000–£5,000</option>
          <option>£5,000–£10,000</option>
          <option>£10,000–£25,000</option>
          <option>£25,000–£50,000</option>
          <option>Over £50,000 / phased</option>
        </select></label>
        <label class="project-assistant-field" for="assistant-target-date">Target date (optional)<input id="assistant-target-date" type="date"></label>
      </div>
      <button class="button button-primary" type="button" data-assistant-next>Continue</button>
      <p class="project-assistant-status" data-assistant-status aria-live="polite"></p>
    `;
    const objective = assistantBody.querySelector("#assistant-objective");
    const budget = assistantBody.querySelector("#assistant-budget");
    const targetDate = assistantBody.querySelector("#assistant-target-date");
    const statusMessage = assistantBody.querySelector("[data-assistant-status]");
    objective.value = state.objective;
    budget.value = state.budget;
    targetDate.value = state.targetDate;
    assistantBody.querySelector("[data-assistant-next]").addEventListener("click", () => {
      state.objective = objective.value.trim();
      state.budget = budget.value;
      state.targetDate = targetDate.value;
      if (!state.objective) {
        statusMessage.textContent = "Add a short description of what you have in mind.";
        objective.focus();
        return;
      }
      step += 1;
      renderAssistant();
    });
  };

  const renderContactStep = () => {
    assistantBody.innerHTML = `
      <h3>Where should we reply?</h3>
      <p>We will review the outline and reply within 48 hours with questions or a proposed first stage.</p>
      <form class="project-assistant-form" data-assistant-form>
        <label class="project-assistant-field" for="assistant-name">Name<input id="assistant-name" name="name" autocomplete="name" required></label>
        <label class="project-assistant-field" for="assistant-email">Email<input id="assistant-email" name="email" type="email" autocomplete="email" required></label>
        <label class="form-honeypot" for="assistant-website" aria-hidden="true">Website<input id="assistant-website" name="website" tabindex="-1" autocomplete="off"></label>
        <label class="consent" for="assistant-consent"><input id="assistant-consent" name="consent" type="checkbox" required><span>I agree that Ask for Task may use these details to respond to my enquiry.</span></label>
        <button class="button button-primary" type="submit">Send my project</button>
        <p class="project-assistant-status" data-assistant-status aria-live="polite"></p>
      </form>
    `;

    const assistantForm = assistantBody.querySelector("[data-assistant-form]");
    const assistantStatus = assistantBody.querySelector("[data-assistant-status]");
    const submitButton = assistantForm.querySelector('button[type="submit"]');

    assistantForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(assistantForm);
      const payload = {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        topic: `Project assistant - ${state.category}`.slice(0, 120),
        region: state.region,
        budget: state.budget,
        targetDate: state.targetDate,
        website: String(formData.get("website") || "").trim(),
        message: [
          "Guided project enquiry",
          "",
          `Stage: ${state.stage}`,
          "",
          "Objective:",
          state.objective
        ].join("\n"),
        consent: formData.get("consent") === "on"
      };

      if (!payload.name || !payload.email || !payload.consent) {
        assistantStatus.textContent = "Complete your name, email, and consent before sending.";
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
      assistantStatus.textContent = "Sending your project outline...";

      try {
        await sendContactPayload(payload);
        complete = true;
        renderAssistant();
      } catch (error) {
        assistantStatus.textContent = error.message;
        submitButton.disabled = false;
        submitButton.textContent = "Send my project";
      }
    });
  };

  const resetAssistant = () => {
    Object.keys(state).forEach((key) => { state[key] = ""; });
    step = 0;
    complete = false;
    renderAssistant();
  };

  const renderAssistant = () => {
    assistantBody.replaceChildren();
    updateSummary();
    assistantBack.hidden = step === 0 || complete;
    assistantProgress.textContent = complete ? "Enquiry sent" : `Step ${step + 1} of 5`;
    assistantProgressBar.value = complete ? 5 : step + 1;

    if (complete) {
      assistantSummary.hidden = true;
      assistantBody.innerHTML = `
        <div class="project-assistant-success"><span aria-hidden="true">Sent</span><h3>Thank you. We have your project outline.</h3><p>We will review it and reply to your email within 48 hours.</p><button class="button button-secondary" type="button" data-assistant-reset>Share another idea</button></div>
      `;
      assistantBody.querySelector("[data-assistant-reset]").addEventListener("click", resetAssistant);
      return;
    }

    if (step === 0) renderChoiceStep("What needs to be delivered?", "Choose the nearest option. We can define the exact mix after reading your brief.", "category", projectAssistantOptions.category);
    if (step === 1) renderChoiceStep("Where is the project now?", "This gives us a better sense of where to begin.", "stage", projectAssistantOptions.stage);
    if (step === 2) renderChoiceStep("Where will the work be used?", "We coordinate work across the UK, EU, USA, and internationally.", "region", projectAssistantOptions.region);
    if (step === 3) renderObjectiveStep();
    if (step === 4) renderContactStep();

    assistantBody.querySelector("button, textarea, input")?.focus();
  };

  const openAssistant = () => {
    previousFocus = document.activeElement;
    assistant.hidden = false;
    document.body.classList.add("assistant-open");
    renderAssistant();
    assistantClose.focus();
  };

  const closeAssistant = () => {
    assistant.hidden = true;
    document.body.classList.remove("assistant-open");
    if (previousFocus && previousFocus.offsetParent !== null) {
      previousFocus.focus();
    } else {
      menuToggle?.focus();
    }
  };

  const assistantTriggers = [...document.querySelectorAll("[data-project-assistant-open]")];
  if (!document.body.classList.contains("contact-page")) {
    assistantTriggers.push(...document.querySelectorAll(
      '.top-action[href*="/contact"], .nav-mobile-contact[href*="/contact"]'
    ));
  }

  [...new Set(assistantTriggers)].forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openAssistant();
    });
  });
  assistant.querySelectorAll("[data-project-assistant-close]").forEach((button) => {
    button.addEventListener("click", closeAssistant);
  });
  assistantBack.addEventListener("click", () => {
    if (step > 0) step -= 1;
    renderAssistant();
  });
  document.addEventListener("keydown", (event) => {
    if (assistant.hidden) return;
    if (event.key === "Escape") {
      closeAssistant();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = [...assistant.querySelectorAll(
      'button:not([hidden]):not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]'
    )].filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  renderAssistant();
};

createProjectAssistant();

reviewForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = reviewForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent || "Submit review";
  const formData = new FormData(reviewForm);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    companyProject: String(formData.get("companyProject") || "").trim(),
    service: String(formData.get("service") || "").trim(),
    relationship: String(formData.get("relationship") || "").trim(),
    reviewText: String(formData.get("reviewText") || "").trim(),
    website: String(formData.get("website") || "").trim(),
    contactConsent: formData.get("contactConsent") === "on",
    publishConsent: formData.get("publishConsent") === "on"
  };

  if (
    !payload.name
    || !payload.email
    || !payload.service
    || !payload.relationship
    || !payload.reviewText
    || !payload.contactConsent
  ) {
    reviewStatus.textContent = "Complete the required fields and confirm consent.";
    reviewStatus.dataset.state = "error";
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
  }
  reviewStatus.textContent = "Submitting your review securely...";
  reviewStatus.dataset.state = "";

  try {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "The review could not be submitted.");
    }

    reviewForm.reset();
    reviewStatus.textContent = "Thank you. Your review has been received and will be verified before any publication.";
    reviewStatus.dataset.state = "success";
  } catch (error) {
    reviewStatus.textContent = error.message || "The review could not be submitted. Please try again.";
    reviewStatus.dataset.state = "error";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});

const setProfessionalStatus = (message, state = "") => {
  if (!professionalStatus) return;
  professionalStatus.textContent = message;
  professionalStatus.dataset.state = state;
};

professionalCv?.addEventListener("change", () => {
  const file = professionalCv.files?.[0];
  if (!professionalCvName) return;

  professionalCvName.textContent = file
    ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`
    : "Choose a PDF up to 5 MB";
});

professionalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = professionalForm.querySelector('button[type="submit"]');
  const selectedCategories = professionalForm.querySelectorAll(
    'input[name="categories"]:checked'
  );
  const cv = professionalCv?.files?.[0];

  if (!selectedCategories.length) {
    setProfessionalStatus("Choose at least one project category.", "error");
    return;
  }

  if (!cv) {
    setProfessionalStatus("Attach your CV as a PDF.", "error");
    return;
  }

  if (!cv.name.toLowerCase().endsWith(".pdf") || (
    cv.type && cv.type !== "application/pdf"
  )) {
    setProfessionalStatus("Your CV must be a PDF file.", "error");
    return;
  }

  if (cv.size > 5 * 1024 * 1024) {
    setProfessionalStatus("Your CV must be under 5 MB.", "error");
    return;
  }

  const originalButtonText = submitButton?.textContent || "Add my profile";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Adding profile...";
  }
  setProfessionalStatus("Securely sending your profile and CV...");

  try {
    const response = await fetch("/api/professionals", {
      method: "POST",
      body: new FormData(professionalForm)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "The application could not be sent.");
    }

    professionalForm.reset();
    if (professionalCvName) {
      professionalCvName.textContent = "Choose a PDF up to 5 MB";
    }
    setProfessionalStatus(
      "Profile received. We will contact you when a suitable project comes up.",
      "success"
    );
  } catch (error) {
    setProfessionalStatus(
      error.message || "The application could not be sent. Please try again.",
      "error"
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});
