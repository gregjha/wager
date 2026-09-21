---
name: wager-frontend-style
description: >-
  Frontend styling conventions for the Wager web app (apps/web) — Tailwind CSS 4
  + shadcn/radix-ui, no CSS-in-JS. Covers the "city rec court" color palette and
  design tokens, typography (Barlow / Barlow Condensed), the shadcn component
  setup (new-york style, neutral base), how to add new shadcn primitives, class
  composition with cn()/cva, and the interactive-card pattern used throughout
  the match UI. Use when building or styling any UI in apps/web: new pages,
  components, forms, cards, badges, or when asked to "match the existing
  style", add a shadcn component, or theme something consistently with the
  rest of the app.
metadata:
  scope: apps/web
---

# Wager frontend style

Wager's web app styles exclusively with **Tailwind CSS 4** and **shadcn/radix-ui**
components. There is no CSS-in-JS (no styled-components, emotion, etc.) — don't
introduce one. See `apps/web/components.json` for the live shadcn config:
style `new-york`, base color `neutral`, CSS variables on, no class prefix,
Lucide for icons.

## Adding a new shadcn primitive

Run from `apps/web`:

```bash
bunx shadcn@latest add <component>
```

It lands in `src/components/ui/` and wires up the existing aliases
(`@/components`, `@/components/ui`, `@/lib/utils`, `@/lib`, `@/hooks`) and the
tokens in `src/app/globals.css` automatically. Don't hand-write a primitive
that shadcn already ships — add it via the CLI, then customize.

## Class composition

- Merge conditional classes with `cn()` from `@/lib/utils` (clsx + tailwind-merge).
- Component variants (button, badge, etc.) use `cva` from `class-variance-authority`,
  following the pattern in `src/components/ui/button.tsx`: a `cva(base, { variants, defaultVariants })`
  call, spread into `cn()` inside the component.
- Never write raw inline `style={}` for anything themeable — use a Tailwind
  class or add a token if one doesn't exist yet.

## Design tokens — the "city rec court" palette

Defined in `src/app/globals.css`, mapped through `@theme inline` into shadcn's
semantic color variables. Always reach for the **semantic** name
(`bg-primary`, `text-muted-foreground`, `border-border`) in ordinary UI;
reach for the **raw palette** name only for a deliberate brand accent:

| Raw token | Hex | Semantic mapping | Use for |
|---|---|---|---|
| `--asphalt` | `#2b3036` | `--color-foreground` | body text, dark surfaces |
| `--court` | `#2f5da8` | `--color-primary` | primary actions, links, sport label accents |
| `--line` | `#f2c230` | (accent only, not semantic) | underline/decoration accents (see `match-card.tsx`'s title underline) |
| `--turf` | `#3f7d4e` | (accent only) | positive/success states (e.g. "Payouts are on") |
| `--concrete` | `#eef1f3` | `--color-background` | page background |

Use Tailwind utilities against these directly, e.g. `text-court`,
`border-court`, `decoration-line`, `text-turf` — they're registered as real
Tailwind colors via `@theme inline`, not arbitrary values.

There is currently **no dark mode** — a single `:root` palette. Don't add
`dark:` variants unless the user asks for dark mode support; it doesn't
exist yet and shouldn't be half-implemented.

## Typography

- `--font-sans` (Barlow) is the default body font.
- `--font-display` (Barlow Condensed) is applied automatically to `h1`/`h2`/`h3`
  via the base layer (`@layer base` in `globals.css`) — don't add
  `font-display` to headings manually, it's already global.
- Do apply `font-display` explicitly to large non-heading numerals/labels that
  want the condensed treatment (see the "Payouts are on" status text in
  `host/payouts/page.tsx`, or price displays in `price-tag.tsx`).

## Custom utility classes

Two bespoke utilities live in `globals.css` under `@layer utilities` — reuse
them rather than re-deriving the effect:

- `.perforation` — the ticket-stub perforated edge between a match card's date
  stub and its body.
- `.tabular` — `font-variant-numeric: tabular-nums`, for aligned numeric columns.

## Component organization

- `src/components/ui/` — shadcn primitives only (button, card, dialog, form,
  input, select, badge, …). Don't add app-specific logic here.
- `src/components/<feature>/` — domain components grouped by feature:
  `match/`, `auth/`, `payouts/`, `profile/`, `suspense-fallbacks/`. A new
  feature area gets its own folder the same way.
- Filenames are kebab-case (`match-card.tsx`, `entry-status-badge.tsx`).

## Interactive card pattern

The recurring "clickable card" recipe (see `match-card.tsx`) is: a `Link`
(or button) wrapping the whole card, with a hover accent on `court` and the
standard shadcn focus ring:

```tsx
<Link
  href={...}
  className="group flex overflow-hidden rounded-lg border bg-card transition-colors hover:border-court focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
>
  {/* content; use group-hover:underline decoration-line decoration-4 underline-offset-4 on the title for the hover accent */}
</Link>
```

Reuse this shape for any new clickable card rather than inventing a new hover/focus treatment.
