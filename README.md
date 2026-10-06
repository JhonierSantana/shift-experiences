# SHIFT

One React SPA that becomes three unrelated storefronts — **Maison Vela** (fashion),
**Brasa & Co.** (food delivery) and **Plaza** (marketplace) — on top of a single shared
technical core. Switching between them isn't a theme toggle: navigation, layout, page
composition, motion, and the shape of the data itself all change, driven by a typed
contract instead of scattered `if (experience === 'food')` checks.

Portfolio project. No backend — repositories are mocked with simulated latency and
injectable failures behind interfaces designed to be swapped for real HTTP calls without
touching a single component.

## Why this is harder than "three themes"

Skinning one layout with three palettes is a CSS exercise. What makes this project
interesting is that the three businesses genuinely don't share a UI or a data shape:

- Fashion sells **size × color variants** and cares about collections, care
  instructions, and "shop the look".
- Food sells **items with option groups and add-ons** (a burger isn't a SKU, it's a
  base plus choices) and cares about allergens, prep time, and pickup vs. delivery.
- Market sells **flat SKUs with facets, stock, and reviews** and cares about filtering,
  comparison, and deals.

Each business also needs a structurally different shell: Fashion's overlay menu, Food's
mobile tab bar and bottom sheets, Market's mega-menu and filter drawer aren't the same
component recolored — they're different components. The engineering problem is: how do
you let three products diverge that much while still sharing cart logic, routing
infrastructure, query caching, accessibility primitives, and a build pipeline — without
the shared core ever needing to know which business is currently active?

**Explicit non-goal:** a generic `<ProductCard experience={...}>` with a growing pile of
conditionals. If two implementations of something diverge enough that a shared component
would need branching, they become two separate implementations behind the same slot
instead of one component with flags. See "Known trade-offs" below for where this
deliberately produces duplication.

## Architecture

```
src/
  app/            bootstrap, router, providers, error boundaries
  core/           domain types, repository interfaces, cart logic — experience-agnostic
  design-system/  global tokens.css, contrast checker — experience-agnostic
  engine/         the Experience Engine (contract, registry, provider, slots, capabilities, transitions)
  infra/          mock repository implementations + TanStack Query wiring
  experiences/
    selector/     landing page ("Experience Selector")
    fashion/       Maison Vela
    food/          Brasa & Co.
    market/        Plaza
  test/           shared test setup/factories
```

### The import-boundary rule

`eslint.config.js` enforces a strict dependency direction with `no-restricted-imports`,
matched by regex against both alias and relative specifiers:

- `core` and `design-system` cannot import `engine`, `infra`, `experiences`, or `app`.
- `infra` can import `core` but not `engine`, `experiences`, or `app`.
- `engine` cannot import `experiences` or `app` — **except `src/engine/registry.ts`**,
  which is the single file in the codebase allowed to import experience packages.
- An experience cannot import another experience, and can only reach `core`/`infra`
  through their public entry points (`@/core/domain`, `@/core/repositories`,
  `@/core/cart`, `@/infra/mock`, `@/infra/query`) — never their internal files.
- `app` cannot deep-import `core`/`infra` internals either.

This isn't lint-rule box-ticking. It's what makes the multi-experience claim true rather
than aspirational: if `core` could import `experiences/fashion`, "experience-agnostic
core" would be a comment, not a fact, and nothing would stop domain logic from silently
depending on one business's assumptions. Routing every cross-layer reference through a
narrow public surface (`@/core/domain` instead of `@/core/domain/product.ts`) also means
an experience's internal refactors never ripple outward — the boundary is checked on
every commit, not just at review time.

One visible cost of the rule: since experiences can't share code with each other except
through `core`/`design-system`/`engine`, some UI ends up duplicated per experience
instead of extracted. That's a deliberate trade — see "Known trade-offs".

## The Experience Engine (`src/engine`)

The mechanism that lets the app "become" a different business.

### The contract

```ts
interface ExperienceDefinition {
  id: ExperienceId // 'fashion' | 'food' | 'market'
  brand: BrandIdentity // name, tagline, sector, Logo component
  theme: ThemeMeta // just <meta name="theme-color">
  fonts: FontSpec[] // stylesheet hrefs, loaded lazily when the experience mounts
  capabilities: ReadonlySet<CapabilityName> // 'sizeGuide' | 'compare' | 'wishlist' | ...
  shell: ComponentType<ShellProps> // nav/layout/footer, structurally its own
  slots: Partial<SlotMap> // engine-rendered components an experience can override
  routes: RouteObject[] // page tree, relative to /<id>, lazy per page
  motion: MotionPreset // view-transition choreography for entering this experience
  domain: AnyDomainAdapter // repositories + pricing/validation rules
}
```

Semantic design tokens (colors, fonts, radius, spacing, easing) are deliberately **not**
part of this contract — they live only as CSS custom properties in each experience's
`tokens.css`, scoped under `[data-experience]`. The engine's job is behavior and
composition, not paint.

### Registry and lazy loading

`src/engine/registry.ts` is the one module allowed to import experience packages. Each
entry has an eager `manifest` (name, tagline, sector copy — plus the side effect of
importing `tokens.css`, so the selector can preview real brand tokens for cards it hasn't
loaded the code for yet) and a lazy `load()` that dynamic-imports the full
`ExperienceDefinition`. That gives one JS chunk per experience: visiting `/food` never
downloads Fashion's or Market's code. `loadExperience()` caches per id and validates that
the loaded `definition.id` and `definition.domain.kind` actually match the id it was
asked to load, so a misregistered experience fails loudly instead of silently serving the
wrong domain logic.

Route discovery is lazy too (`engine/routes.tsx`): the static route tree only knows about
the selector and a catch-all. Visiting `/<id>` triggers React Router's
`patchRoutesOnNavigation` to load that experience and mount its routes once.

### Slots and capabilities

`Slot`/`useSlot` (`engine/slots.tsx`) let the engine render a component by default while
letting an experience override it — currently `NotFound` and `ProductCard`. Extending the
mechanism means adding a key to `SlotPropsMap` in `types.ts`, giving the engine a neutral
default, and having experiences opt in through `definition.slots`. This is how the core
route tree can render "a product card" without ever importing a UI component that knows
what fashion, food, or market products look like.

`Capability`/`useCapability` (`engine/capabilities.tsx`) gate UI by capability name
(`sizeGuide`, `compare`, `wishlist`, ...) instead of checking `experience.id === 'fashion'`
in a component. One source of truth for "does this experience have this feature," decoupled
from which experience it happens to be.

### The switch transition

`SwitchLink` / `useExperienceSwitch` (`engine/switch.tsx`) handle navigating _between_
experiences: prefetch the target on hover/focus, then run `document.startViewTransition`
using the **target** brand's `MotionPreset.switchIn` — its own duration, easing, and
keyframes (Fashion is slow and editorial, Market is fast and dense). Three fallback tiers,
checked in order:

1. No View Transitions API support → plain opacity fade.
2. `prefers-reduced-motion` → the same short opacity fade, ignoring the brand's
   choreography entirely (verified in `engine/transition.test.ts`).
3. Any runtime failure in the transition itself → a plain navigation, never a stuck UI.

## Design system

Three layers, in order of increasing specificity:

1. **Global tokens** (`design-system/tokens.css`, `:where(:root)`) — the full `--shift-*`
   set (surface, ink, accent, line, focus, fonts, radius, spacing, easing) at zero CSS
   specificity via `:where()`, so an experience's tokens always win regardless of
   stylesheet load order.
2. **Semantic tokens per experience** — each `experiences/<id>/tokens.css` redefines the
   same `--shift-*` variable names under `[data-experience='<id>']`. Fashion sets
   `--shift-radius-control: 0` and 600–900ms easing; Food sets warm colors and large
   radii; Market sets fast 150–250ms transitions and visible borders. Same variable
   names, completely different values — components never know which set is active.
3. **Tailwind v4 `@theme inline`** (`src/index.css`) maps those CSS variables onto
   Tailwind utility names (`bg-surface`, `text-ink`, `font-display`, `rounded-card`,
   `ease-brand`, ...), so components are written with ordinary Tailwind classes that
   resolve differently per `[data-experience]` at runtime with **zero JS branching and no
   rebuild** — switching experiences is a DOM attribute change, not a different bundle of
   styles.
4. **Primitives** consume the semantic layer exclusively — never a hardcoded color or
   hex value in component code (enforced informally, checked by
   `src/test/tokens-contrast.test.ts`, which parses every token sheet's hex values and
   asserts contrast ratios programmatically).

What keeps three brands from reading as "three color variables changed": each
experience's tokens.css also swaps radius (0 for Fashion vs. large for Food),
spacing scale, and timing function, and each shell is a structurally different
component (Fashion: overlay menu; Food: tab bar + bottom sheets; Market: mega-menu +
filter drawer). Color alone would produce a re-skin; radius + spacing + motion + layout
together produce a different-feeling product.

## Domain layer (`src/core/domain`, `src/core/repositories`)

- Shared value types: `Money` (safe-integer minor units; mixing currencies throws
  rather than silently producing a wrong total), `Media`, `User`, `Cart`/`CartLine`/
  `Order`, `Address`.
- Products are a **discriminated union on `kind`**: `FashionProduct` (size × color
  variants, collection, fit/care, `lookIds`), `FoodItem` (ingredients, allergens,
  nutrition, option groups/add-ons, prep time), `MarketProduct` (specs, rating, reviews,
  stock, discount, seller). No shared "generic product" shape papering over what's
  actually different between them.
- **`DomainAdapter<K>`** (`core/domain/adapter.ts`) is the seam: `priceLine`,
  `describeLine`, and `validateSelection` (normalizes a selection so equivalent choices —
  e.g. add-ons picked in a different order — produce the same cart-line id), plus
  `repositories`. The shared cart/order/query code calls only through this adapter and
  never switches on `kind`; each experience's `domain/rules.ts` supplies the real logic.
  `AnyDomainAdapter` is written as a correlated union
  (`{ [K in DomainKind]: DomainAdapter<K> }[DomainKind]`), not a generic
  `DomainAdapter<DomainKind>`, so each domain keeps its own selection/line types instead
  of a lossy union of all three.
- `core/repositories` declares interfaces only (`ProductRepository`, `OrderRepository`,
  `ReviewRepository`, ...). `src/infra/mock` holds the only implementations — simulated
  latency and injectable failures via `failNext` — behind TanStack Query. Swapping to a
  real API later is a new `infra` module; nothing in `core` or any experience's UI
  changes.
- **Cart isolation**: one Zustand store per experience, persisted to `localStorage`
  under `shift:cart:<scope>`, versioned (an unrecognized version resets to empty rather
  than crashing on stale shape), and revalidated line-by-line against the domain adapter
  on load (a line for a product that no longer validates is dropped). Switching
  experiences never mixes or silently drops the other cart — delivery and shipping are
  different enough that merging them would be actively wrong, not just messy.

## Tech stack

| Choice                                                | Why                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **React 19 + Vite 8**                                 | SPA with no SEO/SSR requirement — a framework's server layer would add build and deployment complexity without buying anything back.                                                                                                                                                       |
| **React Router 8 (library mode, not framework mode)** | `patchRoutesOnNavigation` gives lazy route discovery per experience without committing to file-based routing or a server. Reversible: framework mode is an opt-in migration later if SSR ever becomes a real requirement.                                                                  |
| **Tailwind CSS v4, CSS-first `@theme`**               | `@theme inline` maps CSS custom properties straight into utility names, which is what makes the token-layering re-skin mechanism work without a JS theme object or a rebuild per brand.                                                                                                    |
| **TanStack Query 5**                                  | Cache/loading/error state on top of the mock repositories, so swapping to a real API is a repository change, not a data-fetching rewrite.                                                                                                                                                  |
| **Zustand 5**                                         | Only real cross-component client state is the cart (per experience) and small UI state. No Redux — there isn't enough shared state to justify it.                                                                                                                                          |
| **React Hook Form + Zod**                             | Checkout forms only; schema-driven validation with typed output.                                                                                                                                                                                                                           |
| **No Motion (Framer Motion)**                         | All motion is CSS transitions/animations and the native View Transitions API. Every animation need so far (hover states, list transitions, the experience switch) is expressible in CSS while automatically respecting `prefers-reduced-motion` for free; the dependency wasn't justified. |
| **No Lucide / icon library**                          | Icons are inline SVG components per experience. Each brand's icon language is deliberately different (Fashion: thin editorial line icons; Market: dense functional glyphs), so a shared icon set would just be overridden per experience anyway.                                           |
| **No Next.js**                                        | No SSR/SEO need for a portfolio SPA behind a client-only demo; adopting it would add a server runtime and routing model this project doesn't use.                                                                                                                                          |

TypeScript runs in strict mode with `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, and `noUnusedLocals`/`noUnusedParameters` all on;
`@typescript-eslint/no-explicit-any` is an error and `import type` is enforced
(`consistent-type-imports`).

## Running it

```bash
npm install

npm run dev            # Vite dev server
npm run build           # tsc --noEmit && vite build
npm run preview         # preview the production build

npm run typecheck       # tsc --noEmit
npm run lint            # eslint .
npm run format           # prettier --write .
npm run format:check     # prettier --check .
npm test                 # vitest run (unit/integration — 220 assertions across 33 files)
npm run test:watch       # vitest, watch mode
npm run test:e2e         # playwright test (4 specs: selector + one flow per experience)
```

Current production build: an initial chunk of **~110.77 KB gzipped** for the selector,
with each experience (`fashion`/`food`/`market` chunks) and each of their pages split
into its own lazily-loaded chunk, loaded only once that experience is visited.

## Adding a fourth experience

Concretely, from the shape the other three already follow:

1. **Scaffold `src/experiences/<id>/`** with the same folder shape as fashion/food/market:
   `manifest.ts` (eager copy: name, tagline, sector), `tokens.css`, `index.ts` (the
   `ExperienceDefinition`), `brand/` (Logo component), `shell/` (nav/layout — make it
   structurally different from the other three, not a recolor), `pages/`, `components/`,
   `domain/` (adapter + business rules), `data/catalog.ts` (mock data, ~20–30 items,
   original brand, no lorem ipsum).

2. **Extend the domain model.** Add `<Id>Product` to the `kind` discriminated union in
   `core/domain/product.ts`, add `<id>` to `DomainKind`, and write a `DomainAdapter<'<id>'>`
   in the new experience's `domain/rules.ts` — `priceLine`, `describeLine`,
   `validateSelection`, and `repositories`. Add a mock repository implementation in
   `src/infra/mock` behind the same repository interfaces.

3. **Write `tokens.css`** under `[data-experience='<id>']`, redefining the full
   `--shift-*` semantic set (surface, ink, accent, line, line-strong, focus, fonts,
   radius, spacing, easing/duration). Run the contrast checker
   (`src/test/tokens-contrast.test.ts` pattern) against the new sheet before wiring up
   any UI — cheaper to fix a token than a component that consumes it.

4. **Decide which slots and capabilities apply.** Does the new business need its own
   `ProductCard`? Add it to `definition.slots`. Does it need capabilities not yet
   modeled (neither `sizeGuide` nor `customization` nor `facetedFilters` fit)? Add a new
   name to `CapabilityName` in `engine/types.ts` first — capabilities are added when a
   real feature needs gating, not speculatively.

5. **Write the `MotionPreset`** — `switchIn` (and optionally `exit`) keyframes and
   timing that reflect the new brand's personality, the same way Fashion is slow/editorial
   and Market is fast/dense.

6. **Register it.** Add the entry to `entries` in `engine/registry.ts` (the only file
   allowed to import the new experience package): eager `manifest` import + lazy `load()`
   dynamic import of `index.ts`. Add `'<id>'` to `ExperienceId` in `engine/types.ts` and
   to `experienceIds` in `eslint.config.js` so the import-boundary rule covers it from
   day one.

7. **Before reusing UI from an existing experience** (`MediaImage`, `Modal`,
   `useMediaQuery` — see below), check whether the fourth experience's needs actually
   match one of the existing three closely enough to lift the shared piece into
   `design-system` or `core`, rather than copying it a third time. This is the point at
   which the YAGNI trade-off described below is meant to get revisited.

## Known trade-offs / honest limitations

- **`MediaImage`, `Modal`, and `useMediaQuery` are duplicated** across Fashion and
  Market (and Food has its own `Sheet` component doing similar work). The import
  boundary rule means experiences can't import each other, so sharing them would require
  lifting them into `design-system` — deliberately not done yet, per the project's
  anti-over-engineering rule: don't abstract until duplication actually hurts. It's the
  first thing to extract if a fourth experience needs the same primitives (see step 7
  above).
- **Fashion and Market each have their own wishlist store** instead of a shared one, for
  the same reason — no third consumer yet to justify the abstraction.
- **No real backend.** Every repository is a mock with simulated latency and injectable
  failures. Orders are not persisted anywhere durable — a page reload after checkout
  does not preserve a completed order's state.
- **No screen-reader smoke testing with an actual assistive technology** (NVDA/VoiceOver)
  was run; the accessibility audit (`docs/wcag-audit.md`) is source-level review plus
  programmatic contrast verification (220 assertions across 33 test files, including 50
  contrast-pair checks across all 5 token sheets), not a live AT pass.
- **Mock catalogs are intentionally small** (~20–30 items per experience) — enough to
  exercise filtering, pagination-adjacent UI, and empty/loading/error states without
  hand-authoring a large content set for a portfolio project.
- **View Transitions API support is partial** across browsers; the app falls back to a
  plain opacity fade where it's unavailable, and to the same fade under
  `prefers-reduced-motion` regardless of support — the brand-specific choreography is a
  progressive enhancement, not a requirement for the app to work correctly.
