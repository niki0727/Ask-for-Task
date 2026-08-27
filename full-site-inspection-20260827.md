# A4T Studio full-site inspection

**Date:** 27 August 2026
**Scope:** All routes not covered by the earlier conversion review, plus redirects, indexing, consistency, and utility pages.
**Standard:** Commercial clarity and verifiable proof take priority over visual preference.

## Route verdicts

| Page | Exact title at inspection | Verdict | Finding that matters most | Severity |
|---|---|---|---|---|
| `/brand-development/` | Brand Development Services for Businesses \| A4T Studio | Rewrite | It is the right lead offer, but six capabilities and three illustrative scenarios make it longer than the proof supports. The scenarios are clearly labelled as examples. | High |
| `/app-development/` | International App Development Services \| A4T Studio | Keep | Pinglo is strong owned proof. The previous fixed-price and fixed-duration packages implied certainty the studio could not support; they have been replaced with scoped delivery stages. | High, resolved |
| `/website-development/` | Website Development Services for Businesses \| A4T Studio | Keep | DMAR is relevant delivered work, but the family relationship must stay visible wherever it is used as proof. | Medium |
| `/design/` | International Graphic Design Services \| A4T Studio | Merge | This repeats the visual-development part of Brand Development and has no arms-length client case study of its own. | High |
| `/responsible-growth/` | Responsible Growth and ESG Project Support \| A4T Studio | Delete or merge | It presents a standalone indexed offer without delivered proof and re-expands a proposition that was deliberately narrowed. | High |
| `/professionals/` | Join Professional Project Teams \| A4T Studio | Keep | It serves professional recruitment rather than buyers. Keep it as a utility route, but remove it from the primary buyer journey. | Medium |
| `/history/` | A4T Studio History \| Company Timeline & Pinglo | Merge | The separate timeline duplicates the stronger founder timeline on `/about/`. | Medium |
| `/faq/` | Project Delivery Questions and Answers \| A4T Studio | Keep | Useful trust content, but some answers repeat service-page copy and should remain concise. | Low |
| `/safety/` | Trust, Privacy and Project Standards \| A4T Studio | Keep | This is the strongest due-diligence page and correctly links to the registered company and policies. | Low |
| `/case-studies/pinglo/` | Pinglo App Development Case Study \| A4T Studio | Keep | Clear owned-product evidence with a live App Store destination. It should not be described as an independent client result. | Low |
| `/privacy/` | Privacy Policy and Personal Data Rights \| A4T Studio | Keep | The policy covers forms, reviews, CVs, and support routes; keep the legal entity name visible here. | Low |
| `/cookies/` | Cookies and Analytics Policy \| A4T Studio | Keep | The cookie-light claim matches the current first-party implementation. Recheck whenever analytics changes. | Low |
| `/terms/` | Website Terms and Conditions of Use \| A4T Studio | Keep | The legal entity and service-information caveats are appropriately explicit. | Low |
| `/reviews/` | Share a Review \| A4T Studio | Keep private | `noindex, follow` is correct for a submission form. It is no longer promoted publicly as if it contained testimonials. | Medium, resolved |
| `/design-system/` | Design System Reference \| A4T Studio | Keep private | Internal reference is correctly `noindex, nofollow` and should not enter customer navigation. | Low |
| `/404` | Page Not Found \| A4T Studio | Keep | Correctly noindexed. The clean and trailing-slash forms must continue to resolve without a redirect loop. | Low |

## Pages that should not remain separate

1. **`/responsible-growth/`** — fold genuinely supportable material into business or brand-development guidance, then redirect the old URL. Do not market ESG as a proved standalone service until there is qualified delivery evidence.
2. **`/design/`** — merge its useful deliverables into the visual-development section of `/brand-development/`. Keep the old URL as a redirect so existing links are not lost.
3. **`/history/`** — merge the company milestones into `/about/`, which already contains the clearer founder narrative and timeline.

`/professionals/` should remain available for recruitment and CV submissions, but it is not part of the main customer proposition.

## Cross-site contradictions

- **Budget ceiling:** the published range ends at £50,000 while the form previously offered “Over £50,000.” The form and project assistant now both end at “£25,000–£50,000 / phased.”
- **App certainty:** the app page previously showed zero-price entry offers, fixed onboarding, and fixed delivery periods that did not match the scoped-project model. These have been replaced with definition, prototype, build, and support stages.
- **Response time:** one website page still said two business days while the rest promised the end of the next business day. It now uses the sitewide wording.
- **Responsible growth:** it was removed from the main service proposition but remains an indexed standalone page and a professional category. This is unresolved pending a redirect decision.
- **Proof relationships:** Pinglo is owned work; DMAR is a family-connected project; NK Sports and Pulse Point are partner or connected references. None should be presented as an independent client testimonial.
- **Illustrative work:** the brand-development scenarios are explicitly labelled as examples, not completed projects. This wording must remain attached if they are reused elsewhere.

## Redirect and index checks

All eight tracked `/go/` routes resolved to their expected external destination during the inspection: Pinglo App Store, DMAR website, DMAR LinkedIn, NK Sports, photography portfolio, photography Instagram, Pulse Point Events, and Nikita Piazenko’s LinkedIn.

The sitemap contains the public canonical routes. Submission-only `/reviews/`, internal `/design-system/`, and the 404 page are appropriately excluded from search indexing. Canonical, sitemap, robots, and metadata receive a separate technical SEO pass.

## Three fixes with the best impact-to-effort ratio

1. **Remove unsupported breadth.** Merge `/responsible-growth/`, `/design/`, and `/history/` into stronger pages once redirects are approved. Suggested services lead: “Brand, website and app projects, managed from the first brief to delivery.”
2. **Keep estimates honest.** The app page now invites one scoped discussion instead of presenting invented fixed packages. Suggested pricing line: “The quote depends on the product, integrations, release scope and support required. We define the first useful stage before pricing the build.”
3. **Put proof before explanation.** Keep Pinglo, DMAR and photography close to the homepage introduction, with the relationship stated beside each item: “Owned product,” “Family-connected project,” or “Founder portfolio.”

## Evidence and limits

This report is based on repository HTML, Worker routes, the site audit script, and live redirect responses checked during the review. It does not treat social profiles as proof of commercial results, and it does not infer client satisfaction where no named published testimonial exists.
