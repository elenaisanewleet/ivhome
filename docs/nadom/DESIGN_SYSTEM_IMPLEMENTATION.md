# Надом Design System v8 — Implementation Notes

## Design archive used
**Nadom Design System 8** (`Nadom_Design_System_8.zip`)  
Flagship reference file: `nadom-design-package-v6.2.html` / `nadom-app.html` / `nadom-dashboard.html`

## Token file
`packages/shared/src/nadom-tokens.css` — canonical CSS custom properties source of truth.
Defines all `:root` light (cream) tokens and `[data-theme="dark"]` / `body.dark` warm graphite shell tokens.

## Shared types (packages/shared/src/index.ts)
Added / verified:
- `NadomServiceCategory` — 5 fixed slugs (no VIP/Свой запрос)
- `NADOM_SERVICE_CATEGORIES` — array with label + sub for each category
- `ClinicPackageName` — allowed names, no VIP/Премиум/Элитный
- `SlaMetrics` — always two separate `[min, max]` tuples
- `NadomRequestStatus` — 6-step lifecycle
- `NADOM_REQUEST_STATUS_LABELS` — label + sub for each status
- `NadomTrustBadge` + `NADOM_TRUST_BADGE_LABELS`

## Shared component library
`apps/mini-app/src/ui.tsx` + `apps/mini-app/src/ui.css`

### Components added/updated (v8)
- `NadomSymbol` — IV bag SVG symbol (existing, kept)
- `NodeIcon`, `ProgressDots`, `Dots`, `Pulse` — existing, kept
- `SlaGrid` / `SubflowHeader` / `StatusTrack` / `OfferBadge` — existing, kept
- `FaqAccordion` — existing, kept
- **NEW v8:**
  - `SlaBlock` — two-cell SLA (response + arrival, always separate)
  - `RatingBadge` — amber, Unbounded font, star icon
  - `StatusTrackV8` — 6-step NadomRequestStatus track with done/active/off states
  - `LoadingDots` — three bouncing dots
  - `LiveBadge` — teal pulsing dot for en-route
  - `Banner` — info/priv/sage/err banners
  - `EmptyState` / `ErrorState` — illustrated empty/error states
  - `PriceBlock` — "от X ₽" with confirm footnote

CSS classes added in `ui.css`:
- `.btn`, `.btn-primary`, `.btn-teal`, `.btn-sage`, `.btn-ghost`, `.btn-soft`, `.btn-danger-soft`
- `.btn-row`, `.pills`, `.pill`, `.pill-*` variants
- `.chips`, `.chip`, `.package-chip`
- `.rating-badge`
- `.sla-block`, `.sla-cell`, `.sla-cell--response`, `.sla-cell--arrival`
- `.trust-strip`, `.trust-badge`
- `.service-grid`, `.service-choice`
- `.info-block`, `.price-block`, `.banner`
- `.empty-state`, `.error-state`, `.loading-dots`
- `.footnote`, `.status-track-v8`, `.chat-messages`, `.chat-bubble`
- `.clinic-card`, `.clinic-card-expanded`, `.screen-header-v8`
- `.live-badge`

## Brand assets
- `docs/nadom/references/design/symbol-iv-bag.svg` — updated from archive
- `apps/mini-app/public/symbol-iv-bag.svg` — for use as app icon/splash
- `apps/dashboard/public/symbol-iv-bag.svg`

## Screens updated
App.tsx was not fully rewritten (large existing flow preserved).
CSS tokens and component library updated so all existing screens now render with v8 palette.

The following screens exist via App.tsx / OfferSubflow.tsx logic:
- Welcome / Consent / Emergency / Profile (service selection) / Location / Time / Offers list
- Offer detail / Chat / Confirm / Status / Completed / Empty / Error

Full per-screen React component rewrites using the v8 ScreenHeader + SlaBlock + StatusTrackV8
are deferred to a follow-up PR to avoid breaking the functional MVP flow.

## Dashboard updated
`apps/dashboard/src/App.css` — dark shell updated to v8 warm graphite (`#0D0E0A` / `#15160F`).
Light mode remaps to v8 cream palette (`#F4F0E7`, `#FFFEFA`).
Font stack updated to Onest (removes Inter fallback first-priority).

## Telegram bot copy
`apps/telegram-bot/src/index.ts`:
- `/start` message updated: "Надом помогает анонимно подобрать клинику или медслужбу с выездом на дом — без лишних данных на старте."
- Open-app button: "подобрать клинику"
- `status_updated` notification: "Статус заявки обновлён. Откройте Надом, чтобы посмотреть детали."
- `chat_message` notification: "Новое сообщение по заявке. Откройте Надом, чтобы ответить."

## Deferred work
1. Full per-screen React rewrites with v8 components (SplashScreen, WelcomeScreen, etc.)
2. ChatScreen using `<ChatBubble>` components
3. ClinicCard / ClinicCardExpanded as dedicated React components wired to offer data
4. StatusScreen using `<StatusTrackV8>`
5. Dashboard cards / sidebar redesign with warm graphite CSS variables
6. Offline Unbounded/Onest font files (currently CDN only)
