# DESIGN.md

Read this before writing any UI code. It works together with the `frontend-design` skill. The skill gives the process (plan, review, build, critique). This file gives the project's hard rules. If the two ever conflict, this file wins.

## In plain words

Every UI you generate drifts to the same look: gradient washes, glowing accents, cards that lift on hover, and everything fading up on scroll. That look is the default, not a decision. This project wants a UI that looks designed for its own subject, with one memorable element and a quiet, disciplined layout around it.

## 1. Project brief

- Product: DrawFlow transforms hand drawn whiteboard sketches into validated runnable n8n workflows with intelligent architectural gap recommendations.
- Audience: Backend developers, automation engineers, and workflow architects building production pipelines.
- Primary job of the UI: Allow developers to upload or inspect a whiteboard photo, view recognized steps side by side in an interactive React Flow canvas, evaluate architectural gap advice, and copy valid n8n JSON for direct canvas paste.
- Visual direction: High contrast technical dark theme with flat slate surfaces, crisp dividers, one flat n8n orange accent, clean Inter typography, and zero decorative gradients or glow.

## 2. Banned by default

Do not use any of these unless the brief explicitly asks for it.

Color and effects

- Glowing accents: no `box-shadow` or `drop-shadow` with a colored blur, no neon outlines, no glow on buttons, inputs, icons, or focus states.
- Gradients as decoration: no gradient text, gradient buttons, gradient borders, gradient backgrounds, or blurred color blobs behind the hero.
- Glassmorphism: no frosted blur panels unless the content truly sits over imagery.
- The same soft grey shadow under every card.
- Warm cream background with a terracotta accent, or near-black with a single acid-green accent. Both are common generated defaults.

Layout

- Content chopped into identical rounded cards with one border radius everywhere.
- Hero made of a big number, a small label, supporting stats, and an accent.
- Centered everything. Choose alignment on purpose.

Typography

- Accenting one word in a headline with italic, bold, or a different color.
- ALL-CAPS tracked-out eyebrow labels above headings.
- Numbered markers (01 / 02 / 03) when the content is not a real sequence.
- Monospace for small labels just to look technical.
- Meta strings like `A · B · C`, labels like `WORD — fragment`, and `→` on every button or link.

Motion

- Fade-and-slide-up entrance on every section.
- Hover lift, scale, or glow on every card.
- Looping ambient animation with no purpose.

## 3. Design tokens (set once, reuse everywhere)

Defined as CSS variables in `client/src/index.css`:

Color:

- `--bg: #0F172A` (page background: deep slate)
- `--surface: #1E293B` (panels and cards: solid slate)
- `--surface-active: #273549` (hover and active rows)
- `--text: #F8FAFC` (main text: high contrast off white)
- `--text-muted: #94A3B8` (secondary text: passes WCAG AA)
- `--accent: #F97316` (one accent: flat n8n orange for primary actions)
- `--accent-hover: #EA580C` (hover state for primary button)
- `--line: #334155` (borders and dividers)
- `--status-warning: #F59E0B` (flat amber for gap recommendations)
- `--status-success: #10B981` (flat emerald for validation success)

Shape:

- `--radius-sm: 4px` (buttons, badges, inputs)
- `--radius-md: 8px` (cards, dropdowns)
- `--radius-lg: 12px` (outer layout panels)
- `--shadow-panel: 0 4px 6px -1px rgba(0, 0, 0, 0.3)` (real elevation only)

Typography:

- `--font-sans: 'Inter', system-ui, -apple-system, sans-serif`
- Scale: 12px (caption), 14px (body small), 16px (body), 18px (h3), 22px (h2), 28px (h1)

Type

- One family, or two that are clearly different. Do not reach for the first typeface you would use on any project.
- Set a real type scale (for example 1.25 ratio) with intentional weights. Write the scale down in the config.
- Body line length under 80 characters. Serif body text gets slightly more line-height than sans.

Shape

- Radius follows hierarchy: small for inputs and buttons, larger only for containers that need it. Never one radius for everything.
- Shadows only to show real elevation (menus, dialogs). One subtle neutral shadow, never colored.

Spacing

- Use a fixed spacing scale (4 or 8 px base). Consistent rhythm matters more than decoration.

## 4. Layout rules

- Before building, write a short layout plan with an ASCII wireframe for each key screen, and state the alignment (left, center, justified) and why.
- Structure must carry meaning. Borders, dividers, numbers, and labels appear only when they tell the user something about the content.
- Group by relationship, not by putting everything in a box. Whitespace is a valid separator.
- Dashboards and data UIs: prioritize density and scan speed. Tables and lists are fine. Do not turn rows into cards.

## 5. Motion rules

- Allowed: motion that answers a user action (open, expand, confirm, drag, loading states).
- Allowed: one orchestrated page-load moment, at most.
- Not allowed: scattered entrance effects, hover transitions on everything, parallax for its own sake.
- Keep durations short (150 to 250 ms for interactions) and use one easing curve across the project.
- Respect `prefers-reduced-motion`. When set, remove non-essential motion.
- If using GSAP or Framer Motion, each animation needs a one-line reason in a code comment. No reason, remove it.

## 6. Interaction states (without glow)

- Hover: change color, underline, or background by a small, visible amount. No lift, no scale, no glow.
- Focus: a clear 2 px solid outline in `--accent` with a 2 px offset. Never remove focus outlines.
- Active, disabled, loading, error, and empty states must all be designed, not left as browser defaults.

## 7. Spend boldness in one place

Pick one memorable element for the product (a distinctive typographic treatment, a real data visualization, a custom layout, a signature interaction). Keep everything around it quiet. Before finishing, remove one decorative element.

## 8. Writing in the UI

- Plain language from the user's side. Say "Manage notifications", not "Webhook config".
- Sentence case. Active voice. Buttons say what happens ("Save changes", not "Submit").
- Keep action names consistent through the flow ("Publish" button, "Published" toast).
- Errors say what went wrong and how to fix it. They do not apologize.
- Empty states tell the user what to do next.
- No filler copy, no marketing slogans inside product screens.

## 9. Quality floor

- Responsive down to 360 px width.
- Visible keyboard focus everywhere.
- Text contrast meets WCAG AA.
- Touch targets at least 44 px on mobile.
- No horizontal page scroll.
- Check CSS specificity so section and component classes do not cancel each other out.

## 10. Process every time

1. Read the brief in section 1. Confirm anything missing.
2. Write the plan: tokens (section 3), layout wireframe, and the one memorable element.
3. Review the plan against section 2. If any part matches the banned list or looks like what you would build for any similar project, change it and say what you changed.
4. Build only after the review.
5. Take a screenshot if the environment allows, critique it against sections 2 and 7, and fix what fails.

## 11. Before you say it's done

- [ ] No glow, gradient decoration, or colored shadow anywhere
- [ ] One accent color, used flat
- [ ] Radius and shadow vary by hierarchy
- [ ] No banned typography patterns
- [ ] Motion only where it answers an action or has a stated reason
- [ ] One clear memorable element
- [ ] Focus, hover, empty, and error states exist
- [ ] Passes the quality floor in section 9
