# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**bideez** — an AI-powered bid & proposal response engine (multi-tenant B2B SaaS). The thesis: a GO/NO-GO decision gate *before* drafting and a rehearsal stage *after*, around a pipeline of `DECIDE → CREATE → VERIFY → DEFEND`. This repo currently contains the **marketing landing page** for that product (the app itself is not built here yet).

## ⚠️ Next.js version caveat (read first)

This is **Next.js 16 with Turbopack** — it has breaking changes vs. older Next.js you may know from training data (APIs, conventions, file structure). Per `AGENTS.md`: **read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code**, and heed deprecation notices. Don't assume older `pages/`-era or pre-16 App Router patterns.

## Commands

```bash
npm run dev        # start dev server (Turbopack) at localhost:3000
npm run build      # production build (use to verify static generation / catch runtime render errors)
npm run start      # serve the production build
npm run lint       # eslint (next core-web-vitals + typescript configs)
npm run typecheck  # tsc --noEmit
npm run format     # prettier --write on **/*.{ts,tsx}
```

There is **no test runner configured**. Verification = `typecheck` + `lint` + `build` (the build statically prerenders `/`, so a successful build confirms the page renders without runtime errors).

Add shadcn/ui components with `npx shadcn@latest add <name>` — they land in `components/ui/`.

## Architecture

- **App Router**, fully static. `app/layout.tsx` wires fonts + `ThemeProvider`; `app/page.tsx` is the landing page, composed of section components (`Hero`, `Pipeline`, `GateSection`, etc.) defined in the same file, plus shared primitives (`SectionHead`, `Gauge`, `ChecklistIcon`).
- **Landing-specific components** live in `components/landing/` (`site-nav.tsx`, `pipeline.tsx`). Interactive ones are `"use client"`; everything else is a Server Component.
- **shadcn/ui primitives** live in `components/ui/` (radix-luma style, see `components.json`). Use the `cn()` helper from `@/lib/utils` for class merging.
- **Path alias**: `@/*` maps to the repo root (e.g. `@/components/ui/button`).

## Styling / theming (Tailwind v4)

- **No `tailwind.config`** — Tailwind v4 is configured CSS-first inside `app/globals.css` via `@theme inline { ... }`. Color/radius/font/animation tokens are declared there.
- **Theme = CSS variables** (oklch) defined in `:root` (light) and `.dark` (dark). This is the stock shadcn **Zinc** palette plus a Geist Mono `--font-mono`; `--font-sans`, `--font-heading`, and `--font-display` all resolve to **Inter**. Keep `:root`/`.dark` aligned with the shadcn default unless intentionally re-theming.
- **Dark mode** via `next-themes` (`attribute="class"`, system default). `components/theme-provider.tsx` adds a global **`d` keypress** hotkey to toggle light/dark (ignored while typing in inputs).
- **Semantic status aliases**: `--color-go` / `--color-gap` / `--color-scored` are mapped in `@theme` to the default palette (`primary` / `destructive` / `muted-foreground`) so utilities like `text-gap`, `bg-go/10` exist without introducing off-palette colors. If re-theming, change the alias targets here rather than hardcoding colors in components.
- Custom utilities/animations in `globals.css`: `.grain` (noise overlay), `.text-balance`, and `animate-rise` (load-in via `animation-delay`).

## Content constraints (landing page)

This is pitched at a hackathon for a pre-launch product. **Do not add** customer logos, testimonials, real product screenshots, compliance badges (SOC 2, etc.), or invented metrics — only represent what actually exists. Code-rendered "how it works" diagrams are fine; mockups dressed as real app screenshots are not. The Vapi voice-rehearsal (DEFEND) phase is an **add-on** — keep it de-emphasized.

## Installed skills

`.agents/skills/vercel-react-best-practices/` — Vercel's React/Next.js performance rules. Consult its `rules/` when writing or refactoring React/Next.js components.
