# ASK FOR TASK — visual language audit and minimal design system

**Status:** Implemented, deployed, and live-verified
**Audit date:** 25 August 2026 (Europe/Athens)
**Scope:** Repository source, public asset inventory, active local render at desktop and 390px mobile widths
**Release:** Nikita Piazenko authorised production deployment on 25 August 2026. Worker version `2cfc9a0b-ea27-43dc-8398-543ca0becb64` is live.

## Executive direction

Keep the current public blue/lime direction and make it explicit as the company system. It already communicates managed delivery, clarity, confidence, and momentum. The smallest useful intervention is consolidation: one token set, one type scale, one spacing rhythm, a small component vocabulary, and clear rules for when colour, imagery, and motion are allowed.

Do not revive the older dark-first identity as the default. Retain dark navy as a deliberate trust / proof surface and as a useful campaign variant, not as a parallel global system.

## Concept: Signal-led managed delivery

- **Objective:** Make ASK FOR TASK feel like the calm, accountable route from an unclear brief to a finished result, while preserving the existing proof-led website structure.
- **Visual idea:** A light editorial canvas carries strong black-green typography, blue route markers, and lime signals. Rules, numbering, evidence labels, and practical facts make the delivery path visible. Dark navy appears only when a page needs concentrated trust, depth, or campaign contrast.
- **System:** One shared token set, system sans typography, restrained radii and shadows, editorial grids, proof cards, numbered route lists, fact strips, and a consistent two-action hierarchy.
- **Required assets:** Existing A4T SVG mark, social lockup, Pinglo and website evidence, photography library, founder portrait, and controlled A4T outline motif. No new illustration library is required.
- **Responsive behaviour:** Preserve the current desktop-to-mobile information order, collapse navigation at the existing breakpoint, stack proof and route grids before they become dense, and use full-width primary actions on small screens.
- **Implementation notes:** Treat this as a consolidation pass in the active `public/` asset tree. Do not add another visual override layer, alter page copy, consolidate duplicate routes, or deploy without a separately approved implementation and QA pass.

## Audit findings

### What is working

- The public home page has a clear hierarchy: proposition, proof, capability routes, practical facts, and enquiry CTA.
- Blue is a credible action colour; lime is a distinctive signal colour when used as a highlight or filled action with dark text.
- The A4T mark and wordmark are simple, legible, and flexible across navigation, favicon, social, and case-study contexts.
- Editorial photography and inspectable work provide useful commercial evidence rather than generic decoration.
- The local 390px render showed no horizontal overflow, a 44px-plus mobile CTA, an appropriate collapsed navigation, and readable hero copy.
- The public pages include reduced-motion handling and use real links, buttons, landmarks, and labelled navigation.

### What is inconsistent or costly

- The repository contains duplicate root and `public/` route trees. Root routes still use the original dark `styles.css` / `updates.css` stack, while the deployed asset directory is `public/` and most of its routes use `a4t-evolution-20260724.css` plus `a4t-polish-20260805.css`.
- There are several overlapping token vocabularies: `--ink` / `--paper`, `--background` / `--surface`, `--blue` / `--signal-blue`, `--lime` / `--signal-lime`, and route-specific aliases. This increases the risk of visually similar but technically different components.
- The codebase contains several historical visual directions: dark glass surfaces, light service-company layouts, refined navy hero compositions, and older rounded-card / shadow treatments. They are useful references but should not remain equally authoritative.
- Typography is broadly system sans, but the CSS names optional `Avenir Next` and older files reference `Space Grotesk`. Without a controlled font asset and usage rule, this can render differently by platform.
- Border radii, shadows, button heights, and accent treatments vary between the shared and refined layers. The current public direction is strongest when it is flatter, more editorial, and more structured.
- A4T is visible as a large outline motif in the hero. It is distinctive, but it should be treated as a controlled brand graphic rather than a general-purpose decorative pattern.

## Proposed minimal company design system

### 1. Design principles

1. Make the route to delivery visible: use sequence, labels, facts, and proof.
2. Prefer evidence over atmosphere: every image, accent, or animation must support understanding or trust.
3. Use one strong signal at a time: blue for action and navigation, lime for momentum / emphasis, coral only for bounded editorial or status use.
4. Keep surfaces calm and information dense: white and warm-grey canvases, fine rules, restrained shadows, short cards.
5. Make the founder-led service feel personal without becoming informal or visually casual.

### 2. Core tokens

These are proposed names and values, consolidated from the currently active public palette.

```css
:root {
  --color-ink: #17201d;
  --color-ink-soft: #34403b;
  --color-muted: #67716c;
  --color-paper: #ffffff;
  --color-canvas: #f6f7f3;
  --color-canvas-deep: #eef1ec;
  --color-line: #d7dcd6;
  --color-line-strong: #b9c1ba;
  --color-blue: #2858d6;
  --color-blue-deep: #173b8f;
  --color-blue-soft: #eaf0ff;
  --color-lime: #cbff58;
  --color-lime-soft: #f0ffd1;
  --color-coral: #ff7864;
  --color-coral-soft: #fff0ea;
  --color-yellow-soft: #fff6ce;

  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  --measure-copy: 68ch;
  --measure-wide: 1200px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;

  --radius-control: 4px;
  --radius-card: 6px;
  --shadow-soft: 0 18px 48px rgb(23 32 29 / 9%);
}
```

Usage rules:

- `--color-blue` is the primary interactive colour; use it for links, focus-adjacent emphasis, and primary buttons.
- `--color-lime` is not body text on light backgrounds. Use it for filled actions with `--color-ink`, small signal marks, selected states, and controlled hero highlights.
- `--color-coral` is reserved for an editorial accent, warning, or photography-related signal; never use it as a second primary CTA.
- `--color-blue-deep` is the preferred dark trust surface. The old near-black palette becomes a legacy variant, not a default.
- Use rules and blocks before shadows. Shadows are for elevation or image framing only.

### 3. Type system

Use one reliable sans-serif family until a licensed webfont is deliberately added.

| Role | Desktop | Mobile | Line height | Use |
| --- | ---: | ---: | ---: | --- |
| Display / H1 | 56–72px | 36–44px | 0.98–1.04 | One proposition per page or hero |
| H2 | 40–52px | 32–36px | 1.04–1.10 | Section-level promise |
| H3 | 20–26px | 19–22px | 1.15–1.25 | Card / route title |
| Lead | 18–20px | 16–18px | 1.50–1.60 | Explanation under a heading |
| Body | 16px | 16px | 1.55–1.65 | Core reading copy |
| Meta / label | 10–12px | 10–12px | 1.30–1.45 | Kicker, status, evidence label |

Headlines should be weight 650–750, not ultra-black. Labels may be uppercase with modest tracking, but long paragraphs should never be set in all caps.

### 4. Layout and components

- **Container:** maximum 1200px; 32px side gutters on desktop, 20–22px on small screens.
- **Section rhythm:** 64–96px vertical padding on desktop, 48–64px on mobile.
- **Grid:** prefer two-column editorial layouts and 3–5 item route lists. Collapse before content becomes cramped.
- **Header:** white / paper surface, 68–72px height, one primary “Start a project” action, menu button with a 44px target on mobile.
- **Kicker:** short label plus a small blue rule or lime signal; use consistently at section starts.
- **Primary button:** blue fill, white text, 48px minimum height, 4px radius.
- **Secondary link:** text link with underline offset; avoid adding a second filled button beside the primary action.
- **Proof card:** image or evidence first, short classification label, title, one-sentence explanation, and explicit next link.
- **Fact strip:** four or five practical facts separated by rules; use for founder, budget, response, registration, or process clarity.
- **Route list:** numbered rows with one capability, one explanation, and one action. Use this for service navigation instead of decorative card grids when the content is sequential.
- **Disclosure:** native `details` / `summary` for supporting detail; keep the closed state useful and the expanded state calm.
- **Forms:** visible labels, short grouped fields, inline privacy link, clear focus state, and full-width mobile controls.
- **Footer:** company/legal identity first, navigational links second, contact metadata last; preserve generous tap targets.

### 5. Imagery and graphic language

- Use real work, people, places, interfaces, and process details. Prefer images that show context or outcome.
- Maintain a consistent crop language: editorial horizontal images for proof, portrait crops for people, tall device captures for app evidence.
- Keep image treatment natural. Avoid global filters; use overlays only where text legibility requires them.
- The outlined `A4T` hero motif is a signature device. Use it once per major composition, at low contrast, and never behind essential copy.
- Use the mark as a mark. Do not stretch, rotate, or combine every logo asset variant in one route.
- Concept work must be labelled as illustrative; completed work must be linked to an inspectable reference.

### 6. Responsive behaviour

- **≥ 1100px:** use the full navigation and two-column hero / proof layouts.
- **901–1099px:** keep the editorial grid but reduce gaps and heading sizes; prevent dense three-column cards.
- **≤ 900px:** collapse navigation, stack hero content before proof, and reduce multi-column lists to two or one columns.
- **≤ 640px:** use 20–22px gutters, one-column cards, full-width primary CTAs, 16px body copy, and 32–44px headings.
- Preserve the current no-overflow behaviour. Images must have explicit dimensions or aspect ratios; long labels must wrap rather than force a horizontal scroll.
- Respect `prefers-reduced-motion`. Default motion should be short entrance / disclosure transitions only; no essential content may depend on animation.

### 7. Accessibility and production rules

- Keep text and interactive contrast at WCAG AA. Lime is a background accent, not a text colour on white.
- Maintain 44px minimum pointer targets, visible keyboard focus, and logical heading order.
- Every meaningful image needs a useful alt description; decorative marks remain hidden from assistive technology.
- Keep the primary action language stable: “Start a project” in navigation and “Describe your project” when the user is entering a brief.
- Treat colour as a supplement, not the only status or category cue.
- Consolidate tokens before changing page styling. Avoid appending another dated override file for a small visual correction.
- Keep the source-of-truth site under `public/`; audit or remove duplicate root pages only as a separately approved implementation task.

## Required asset set

The existing assets are sufficient for the minimal system:

- A4T mark / wordmark: keep SVG as the source of truth; retain PNG derivatives for contexts that require them.
- Social / open-graph lockup: keep the existing 1200×630 asset and align its palette to the core tokens.
- Pinglo app assets: use for owned-venture proof only.
- Website screenshots: use for case studies and service evidence with explicit captions.
- Photography library: retain AVIF for delivery performance with JPG fallback where required.
- Founder portrait: use selectively for founder-led trust moments, not as a generic hero image.

No new illustration or icon library is required for the first system pass. The existing rule, number, arrow, and signal devices are enough.

## Implementation completion checklist

1. **Complete:** `public/a4t-system.css` is the single documented token and interaction layer.
2. **Complete:** Active shared and route components resolve typography, route colours, layout measures, spacing primitives, radii, shadows, and motion timing through the system vocabulary.
3. **Complete:** `public/assets/a4t-mark-soft.svg` is enforced for navigation, favicon, and structured company-logo contexts; `public/assets/askfortask-social.png` is the canonical company social card. Active font declarations resolve through the shared font stack.
4. **Complete:** `/design-system/` is a noindex internal visual-QA route covering colour, type, actions, evidence components, forms, focus states, dark surfaces, and responsive layouts.
5. **Complete:** Automated checks, desktop and mobile browser checks, computed contrast checks, image checks, heading checks, overflow checks, touch-target checks, and the Cloudflare dry run pass.
6. **Complete:** The former root site, assets, and its uncommitted homepage hardening work are preserved under `archive/legacy-site/`. `public/` is the only deployment source, and the consolidated release is live.

## Decision boundary

The current light blue/lime public direction is the approved company baseline, with dark navy retained as a controlled variant. The complete design system is implemented and live. Future production changes still require separate approval.

## 25 August 2026 implementation record

- Added `public/a4t-system.css` as the canonical token and interaction layer.
- Converted the existing evolution and polish token blocks into compatibility aliases, preserving current component selectors and route treatments.
- Standardised the active typography stack on the shared system-sans token.
- Added a visible keyboard-focus baseline and encoded the single-use, decorative A4T motif rule.
- Loaded the system layer before the component layers on all 22 deployed HTML pages.
- Extended the static audit to reject missing, reordered, or legacy public stylesheet links.
- Documented `public/` as the deployment source of truth; legacy root pages remain preserved and are not treated as active website source.
- Verification: `npm run check` passed 36 tests and the audit of 22 HTML pages / 20 indexable routes. `npx wrangler deploy --dry-run` passed. No production action was taken.

## 25 August 2026 completion record

- Migrated the active typography, route palette, layout measures, spacing primitives, radii, shadows, motion timing, focus states, and mobile interaction targets to the canonical system vocabulary.
- Formalised the logo and social-preview asset matrix and added automated checks for active logo, font, radius, shadow, and stylesheet drift.
- Added the noindex `/design-system/` visual-QA route.
- Corrected muted-text, teal-action, dark-result, and photography-caption contrast discovered during computed browser testing.
- Enforced 44px mobile targets across representative text controls without changing desktop hierarchy.
- Archived the complete former root site under `archive/legacy-site/`, preserving its uncommitted root-homepage hardening changes and eliminating the duplicate active source tree.
- Final automated verification: 36 tests pass; the audit passes for 23 HTML pages and 20 indexable routes; `git diff --check` passes; and the Cloudflare dry run reads 114 public assets successfully.
- Final browser verification: homepage, design-system reference, contact, photography, and DMAR case study pass at 1280px desktop and 390px mobile with one H1, no horizontal overflow, no missing images, no computed WCAG contrast failures, and no active target below 44px. The mobile menu is present on every checked route.
- **Deployed:** Nikita Piazenko authorised the production release on 25 August 2026. Worker version `2cfc9a0b-ea27-43dc-8398-543ca0becb64` is live.

## 25 August 2026 production verification

- The apex homepage, contact, photography, DMAR case study, internal design-system reference, and canonical system stylesheet returned HTTP 200 with HSTS and CSP present.
- All checked pages loaded `a4t-system.css`; the internal reference remained `noindex, nofollow`.
- The live 1280px homepage used the canonical canvas and action colours, contained one H1, loaded all visible images, and had no horizontal overflow.
- The live 390px homepage contained one H1, showed the collapsed menu, had no horizontal overflow, and had no visible interactive target below 44px. The off-screen NK Sports lazy image returned HTTP 200 when checked directly.
