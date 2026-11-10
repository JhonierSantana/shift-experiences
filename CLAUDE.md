# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SHIFT: one SPA, three completely different storefront experiences (FASHION "Maison Vela", FOOD "Brasa & Co.", MARKET "Plaza") sharing one technical core. Portfolio project. Milestones 0–7 done (incl. a WCAG audit and Playwright smoke tests in `e2e/`); milestone 8 (README) drafted. The original plan file `.claude/plans/pasted-content-id-e295-act-a-como-compiled-milner.md` is not in the repo.

## Commands

```
npm run dev            # Vite dev server
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run format         # prettier --write .
npm run format:check   # prettier --check .
npm test               # vitest run
npm run test:watch     # vitest (watch)
npm run test:e2e       # playwright smoke tests (builds + previews on :4173; not in CI)
npm run build           # tsc --noEmit && vite build
```

Single test file: `npx vitest run path/to/file.test.ts`. Every milestone must leave `typecheck`, `lint`, `test`, and `build` passing — treat these four as the gate before reporting anything done.

Stack: React 19, Vite 8, TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals/Parameters` all on — no `any`), React Router 8, Tailwind CSS v4 (CSS-first `@theme`), TanStack Query 5, Zustand 5, React Hook Form + Zod. ESLint 9 (not 10 — `eslint-plugin-jsx-a11y` doesn't support 10 yet).

## Architecture

### Layers and the import-boundary rule

```
src/
  app/            bootstrap, router, providers, error boundaries
  core/            domain types, repository interfaces, cart logic — experience-agnostic
  design-system/   global tokens.css, contrast checker — experience-agnostic
  engine/          the Experience Engine (see below)
  infra/           mock repository implementations + TanStack Query wiring
  features/
    selector/      landing page ("Experience Selector")
    fashion/ food/ market/   one folder per business
  test/            shared test setup/factories
```

`eslint.config.js` enforces the dependency direction and is the source of truth — read it before changing imports:

- `core` and `design-system` may not import `engine`, `infra`, `features`, or `app`.
- `infra` may import `core` but not `engine`, `features`, or `app`.
- `engine` may not import `features` or `app` — **except** `src/engine/registry.ts`, the one file allowed to import experience packages.
- A feature (`features/fashion/**` etc.) may **not** import another feature, and may only reach `core`/`infra` through their public entry points (`@/core/domain`, `@/core/repositories`, `@/core/cart`, `@/infra/mock`, `@/infra/query`) — not their internal files.
- `app` may not deep-import `core`/`infra` internals either.

Consequence: the three experiences currently have near-duplicate `MediaImage`, `Modal`, and `useMediaQuery` implementations (and fashion/market each have their own wishlist store). This is intentional for now — see the plan's anti-over-engineering rule (don't abstract until duplication actually hurts) — but it's a known follow-up if a fourth experience needs the same pieces.

### The Experience Engine (`src/engine`)

The mechanism that lets one app "become" a different business, driven by a typed contract instead of scattered `if (experience === 'food')` checks.

- **`types.ts`** — the `ExperienceDefinition` contract: `brand`, `theme` (just the browser `theme-color`), `fonts`, `capabilities` (a `Set<CapabilityName>`), `shell`, `slots`, `routes`, `motion` (view-transition choreography), `domain` (an `AnyDomainAdapter`, see below). Semantic design tokens (colors, fonts, radius, spacing, easing) are **not** duplicated here — they live only as CSS custom properties in each experience's `tokens.css`, scoped under `[data-experience]`.
- **`registry.ts`** — the only module allowed to import experience packages. Each entry has an eager `manifest` (name/tagline/copy + importing `tokens.css`, so e.g. selector cards can preview real brand tokens without loading the experience's code) and a lazy `load()` that dynamic-imports the full `ExperienceDefinition` (one chunk per experience). `loadExperience()` caches per id and validates that the loaded `definition.id` and `definition.domain.kind` match what was requested.
- **`ExperienceProvider`** — resolves the active experience, sets `data-experience` on `<html>`, exposes it via context.
- **`slots.tsx`** (`Slot`/`useSlot`) — components the engine renders by default but an experience can override (`SlotPropsMap` in `types.ts`; currently `NotFound` and `ProductCard`). Add a new slot by extending `SlotPropsMap`, giving the engine a neutral default, and having experiences opt in via `definition.slots`.
- **`capabilities.tsx`** (`Capability`/`useCapability`) — gates UI by capability name (e.g. `sizeGuide`, `compare`, `wishlist`) instead of checking `experience.id`. Add new capability names to `CapabilityName` in `types.ts`.
- **`switch.tsx` / `transition.ts`** — `SwitchLink`/`useExperienceSwitch` for navigating between experiences: prefetches the target on hover/focus, then runs `document.startViewTransition` with the _target_ brand's `MotionPreset.switchIn` (own duration/easing/keyframes per brand), falls back to a plain fade without View Transitions support, and collapses to a short opacity fade under `prefers-reduced-motion`. Always falls back to a plain navigation on any failure.
- **`routes.tsx`** — lazy route discovery: the static route tree only has the selector + catch-all; visiting `/<id>` triggers `patchRoutesOnNavigation` to load that experience and mount its routes once.

### Domain layer (`src/core/domain`, `src/core/repositories`)

- Shared types: `Money` (safe-integer minor units; mixing currencies throws), `Media`, `User`, `Cart`/`CartLine`/`Order`, `Address`.
- Products are a discriminated union on `kind` (`'fashion' | 'food' | 'market'`): `FashionProduct` (size×color variants, collection, fit/care, lookIds), `FoodItem` (ingredients, allergens, nutrition, option groups/add-ons, prepTime), `MarketProduct` (specs, rating, reviews, stock, discount, seller).
- **`DomainAdapter<K>`** (`core/domain/adapter.ts`) is the seam: `priceLine`, `describeLine`, `validateSelection` (normalizes a selection so equal choices produce the same cart-line id), and `repositories`. The shared cart/order/query code calls only through this adapter and never switches on `kind` — each experience's `domain/rules.ts` supplies the actual logic. `AnyDomainAdapter` is a correlated union so each domain keeps its own selection/line types instead of a lossy generic.
- `core/repositories` declares interfaces only (`ProductRepository`, `OrderRepository`, `ReviewRepository`, ...); `src/infra/mock` has the only implementations (simulated latency, injectable failures via `failNext`) — swapping to REST later means a new `infra` module, not a UI change.
- **Cart**: one Zustand store per experience, persisted to `localStorage` under `shift:cart:<scope>`, versioned (unknown version → empty cart), revalidates every line against the domain adapter on load (drops lines for products no longer valid). Switching experiences never mixes or loses carts.

### Per-experience folder shape

Each of `features/{fashion,food,market}` follows (legacy shape, migrated one feature at a time): `manifest.ts` (eager copy), `tokens.css`, `index.ts` (the `ExperienceDefinition`, lazy-loaded from the registry), `brand/` (logo), `shell/` (nav/layout, visibly different per business — not just recolored), `pages/`, `components/`, `domain/` (adapter + business rules like food's hours/pricing or market's facets/compare), `data/catalog.ts` (mock data, ~20-30 items, original brands, Spanish copy, no lorem ipsum).

### Feature folder shape (target; `features/selector` is the reference)

```
features/<name>/
  index.ts          barrel: the feature's public API (what `app`/`engine` may import)
  tokens.css        brand tokens (experiences only)
  pages/            route-level screens          + index.ts
  components/       UI pieces                     + index.ts
  hooks/            custom hooks                  + index.ts
  model/            constants, types, static data + index.ts
  services/         data access / side effects    + index.ts   (only if the feature has any)
  store/            Zustand stores                + index.ts   (only if the feature has any)
  tests/            mirrors the folders above (tests/components, tests/hooks, …); not exported
```

Create `services/` and `store/` only when they have content. Inside a feature, sibling folders are imported through their barrel (`'../model'`, never `'../model/constants'`); ESLint enforces it for features listed in `structuredFeatures` in `eslint.config.js`. `app` reaches a feature only via `@/features/<id>`.

## Conventions

- Never use `any`; `@typescript-eslint/no-explicit-any` is an error.
- `import type` is enforced (`consistent-type-imports`).
- UI copy is in Spanish (`lang="es"`), matching the mock brands' voice.
- Motion is CSS first (respecting `prefers-reduced-motion`); icons are inline SVG, no Lucide. The `motion` package is allowed only for what CSS can't do well: orchestrated hero choreography, spring/gesture interactions and shared-layout transitions. Always import it through `LazyMotion` + `m` (strict) inside an experience's lazy pages so it never lands in the main bundle (check `npm run build`). Justification: homes redesign, see the local redesign plan in `docs/` (git-ignored).
- Images use the typed `Media` placeholder approach (gradient/color fallback, required `alt`, fixed dimensions to avoid CLS) — there are no real product photos.
- `README.md` is the milestone 8 deliverable; keep it prettier-clean.

## Practices (local checklist: `docs/practicas.md`, git-ignored; read it before writing or reviewing code)

Full list with sources in `docs/practicas.md` (Spanish). The rules that are easiest to break:

- Effects only sync with external systems and always clean up; derive values during render; keys come from data, never from `Math.random()`.
- Anything that moves on its own for more than 5 s needs a visible pause control (WCAG 2.2.2); hover/focus pause alone doesn't count. Respect `prefers-reduced-motion`.
- Above-the-fold images load `eager`; everything else `lazy`. Every image has `width`/`height`.
- No magic numbers (use `experiences.length`, not `3`); per-experience maps are `Record<ExperienceId, …>`.
- A value copied from a `tokens.css` needs a test that fails when it drifts (see `src/test/showcase-tokens.test.ts`).
- Hooks with timers are tested with fake timers. A behavior change ships with its test in the same PR.
