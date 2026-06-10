import "./ui.css";
import { useState } from "react";
import { SYMBOL_TONES } from "./data";
import { STATUS_ITEMS } from "./data";
import { FAQ_ITEMS } from "./data";
import type { Offer, StatusStage, Step, SymbolTone } from "./types";
import type { ClinicPackageName, NadomTrustBadge } from "@ivhome/shared";

// re-export so consumers don't need a second import
export type { ClinicPackageName, NadomTrustBadge };

/**
 * Nadom brand symbol — the IV / drip chamber (капельница-мешок): hang loop,
 * bag with liquid level, tube and a falling drop. Private medical-tech mood,
 * reads as an infusion line on a second look. Matches the @nadom_bot avatar.
 */
export function NadomSymbol({
  size = 52,
  tone = "default",
}: {
  size?: number;
  tone?: SymbolTone;
}) {
  const palette = SYMBOL_TONES[tone];
  const isWelcome = tone === "welcome";
  const stroke = isWelcome ? 3.2 : 3.4;

  return (
    <svg
      aria-hidden="true"
      className={`nadom-symbol nadom-symbol--${tone}`}
      height={size}
      viewBox="0 0 64 64"
      width={size}
    >
      {/* hang loop */}
      <circle cx="32" cy="8" r="4" fill="none" stroke={palette.stroke} strokeWidth={stroke} />
      {/* neck */}
      <path d="M32 12 V14" fill="none" stroke={palette.stroke} strokeWidth={stroke} strokeLinecap="round" />
      {/* bag */}
      <rect
        x="18"
        y="14"
        width="28"
        height="30"
        rx="9"
        fill={palette.fill}
        stroke={palette.stroke}
        strokeWidth={stroke}
      />
      {/* liquid level */}
      <path d="M19.5 32 Q32 27 44.5 32 L44.5 35.5 Q44.5 42.5 37.5 42.5 L26.5 42.5 Q19.5 42.5 19.5 35.5 Z" fill={palette.dot} />
      {/* tube */}
      <path d="M32 44 V50" fill="none" stroke={palette.stroke} strokeWidth={stroke} strokeLinecap="round" />
      {/* falling drop */}
      <path d="M32 50 C36 54.5 36 58.5 32 61 C28 58.5 28 54.5 32 50 Z" fill={palette.dot} />
    </svg>
  );
}

export function NodeIcon({ variant }: { variant: Step["iconLabel"] }) {
  const tone: SymbolTone =
    variant === "signal"
      ? "emergency"
      : variant === "offers"
        ? "offers"
        : variant === "welcome"
          ? "welcome"
          : "default";

  return (
    <div className={`node-icon ${tone !== "default" ? `node-icon--${tone}` : ""}`} aria-hidden="true">
      <NadomSymbol size={tone === "welcome" ? 68 : 52} tone={tone} />
    </div>
  );
}

export function ProgressDots({ currentIndex, total }: { currentIndex: number; total: number }) {
  return (
    <div className="progress-dots" aria-label={`Экран ${currentIndex + 1} из ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          className={`progress-dot ${index <= currentIndex ? "progress-dot--active" : ""}`}
          key={index}
        />
      ))}
    </div>
  );
}

/** Calm pulsing dots — for pending button states (replaces "Отправляем…" text). */
export function Dots({ label }: { label?: string }) {
  return (
    <span className="nadom-dots-wrap">
      {label ? <span>{label}</span> : null}
      <span className="nadom-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}

/** Soft expanding ring — for "waiting" / "specialist en route" live status. */
export function Pulse() {
  return <span className="nadom-pulse" aria-hidden="true" />;
}

export function SubflowHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <header className="subflow-header">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id="screen-title">{title}</h2>
      <p>{body}</p>
    </header>
  );
}

export function SlaGrid({ offer, label }: { offer: Offer; label?: string }) {
  return (
    <div className="sla-grid" aria-label={label ?? "Когда ответят и приедут"}>
      <div className="sla-box">
        <span>ответят</span>
        <strong>{offer.responseTime}</strong>
      </div>
      <div className="sla-box sla-box--eta">
        <span>приедут</span>
        <strong>{offer.arrivalTime}</strong>
      </div>
    </div>
  );
}

export function OfferBadge({ offer }: { offer: Offer }) {
  return (
    <div className="selected-offer-badge">
      <div>
        <p className="status-label">
          <span className="status-dot" />
          {offer.status}
        </p>
        <strong>{offer.name}</strong>
      </div>
      <span>{offer.zone}</span>
    </div>
  );
}

export function StatusTrack({ stage }: { stage: StatusStage }) {
  const activeIndex = {
    waiting: 2,
    "price-lock": 4,
    dispatched: 5,
    completed: 6,
  } satisfies Record<StatusStage, number>;

  return (
    <ol className="status-track" aria-label="Статус заявки">
      {STATUS_ITEMS.map((item, index) => (
        <li
          className={`status-track__item ${index <= activeIndex[stage] ? "status-track__item--active" : ""}`}
          key={item}
        >
          <span className="status-track__node" />
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq">
      {FAQ_ITEMS.map((item, index) => (
        <div className={`faq-item ${openIndex === index ? "faq-item--open" : ""}`} key={index}>
          <button
            className="faq-item__q"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            type="button"
            aria-expanded={openIndex === index}
          >
            {item.q}
            <span className="faq-item__arrow" aria-hidden="true">›</span>
          </button>
          {openIndex === index ? (
            <p className="faq-item__a">{item.a}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Nadom UI Components v6
// All components use CSS custom properties from App.css / nadom-tokens.css.
// ─────────────────────────────────────────────────────────────────────────────

// ── Button ───────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "teal" | "secondary" | "ghost" | "error";

export function Button({
  variant = "primary",
  fullWidth = false,
  small = false,
  loading = false,
  disabled = false,
  icon,
  children,
  onClick,
  type = "button",
  className = "",
}: {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  small?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}) {
  const cls = [
    "nd-btn",
    `nd-btn--${variant}`,
    fullWidth && "nd-btn--full",
    small && "nd-btn--sm",
    loading && "nd-btn--loading",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={cls} disabled={disabled || loading} onClick={onClick} type={type}>
      {loading ? <span className="nd-btn__spinner" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

export function ButtonRow({ children }: { children: React.ReactNode }) {
  return <div className="nd-btn-row">{children}</div>;
}

// ── Pill ─────────────────────────────────────────────────────────────────────

export type PillVariant = "blue" | "teal" | "sage" | "amber" | "rose" | "error" | "neutral";

export function Pill({
  variant = "neutral",
  icon,
  children,
}: {
  variant?: PillVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className={`nd-pill nd-pill--${variant}`}>
      {icon}
      {children}
    </span>
  );
}

export function PillRow({ children }: { children: React.ReactNode }) {
  return <div className="nd-pills">{children}</div>;
}

// ── Rating badge ─────────────────────────────────────────────────────────────

export function RatingBadge({ score, reviewCount }: { score: string | number; reviewCount?: number }) {
  return (
    <span className="nd-rating">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4l2.3 4.7 5.2.8-3.8 3.7.9 5.2L12 16.7 7.4 19l.9-5.2L4.5 10l5.2-.8Z" />
      </svg>
      {score}
      {reviewCount != null && <small>· {reviewCount} отзывов</small>}
    </span>
  );
}

// ── SLA block ────────────────────────────────────────────────────────────────
// ALWAYS two separate values. Never merge into a single ETA.

export function SlaBlock({
  responseLabel = "Ответ медслужбы",
  responseValue,
  responseSub = "после заявки",
  arrivalLabel = "Прибытие",
  arrivalValue,
  arrivalSub = "после подтверждения",
}: {
  responseLabel?: string;
  responseValue: string;
  responseSub?: string;
  arrivalLabel?: string;
  arrivalValue: string;
  arrivalSub?: string;
}) {
  return (
    <div className="nd-sla" aria-label="Время ответа и прибытия">
      <div className="nd-sla__cell nd-sla__cell--response">
        <div className="nd-sla__label">{responseLabel}</div>
        <div className="nd-sla__value">{responseValue}</div>
        <div className="nd-sla__sub">{responseSub}</div>
      </div>
      <div className="nd-sla__cell nd-sla__cell--arrival">
        <div className="nd-sla__label">{arrivalLabel}</div>
        <div className="nd-sla__value">{arrivalValue}</div>
        <div className="nd-sla__sub">{arrivalSub}</div>
      </div>
    </div>
  );
}

// ── Trust strip ──────────────────────────────────────────────────────────────

const TRUST_LABELS: Record<NadomTrustBadge, string> = {
  license_verified:      "Лицензия подтверждена",
  available_24_7:        "24/7",
  anonymous_start:       "Анонимно на старте",
  no_docs_at_start:      "Без документов на старте",
  no_extra_data:         "Без лишних данных",
  address_after_confirm: "Точный адрес — после выбора клиники",
};

export function TrustStrip({ badges }: { badges: NadomTrustBadge[] }) {
  return (
    <div className="nd-trust">
      {badges.map((b) => (
        <span className="nd-trust__item" key={b}>
          {TRUST_LABELS[b]}
        </span>
      ))}
    </div>
  );
}

// ── Service choice row ───────────────────────────────────────────────────────

export function ServiceChoice({
  label,
  sub,
  selected = false,
  icon,
  onClick,
}: {
  label: string;
  sub?: string;
  selected?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className={`nd-choice${selected ? " nd-choice--selected" : ""}`}
      onClick={onClick}
      type="button"
      aria-pressed={selected}
    >
      <span className="nd-choice__dot" aria-hidden="true" />
      {icon && <span className="nd-choice__icon" aria-hidden="true">{icon}</span>}
      <span className="nd-choice__body">
        <span className="nd-choice__main">{label}</span>
        {sub && <span className="nd-choice__sub">{sub}</span>}
      </span>
    </button>
  );
}

// ── Chip ─────────────────────────────────────────────────────────────────────

export function Chip({
  selected = false,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`nd-chip${selected ? " nd-chip--selected" : ""}`}
      onClick={onClick}
      type="button"
      aria-pressed={selected}
    >
      {children}
    </button>
  );
}

export function ChipGroup({ children }: { children: React.ReactNode }) {
  return <div className="nd-chips">{children}</div>;
}

// ── Package chip ─────────────────────────────────────────────────────────────

export function PackageChip({
  name,
  selected = false,
  onClick,
}: {
  name: ClinicPackageName;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`nd-package-chip${selected ? " nd-package-chip--selected" : ""}`}
      onClick={onClick}
      type="button"
      aria-pressed={selected}
    >
      {name}
    </button>
  );
}

// ── Info block ───────────────────────────────────────────────────────────────

export function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="nd-iblk">
      <div className="nd-iblk__key">{label}</div>
      <div className="nd-iblk__text">{children}</div>
    </div>
  );
}

// ── Price block ──────────────────────────────────────────────────────────────

export function PriceBlock({
  estimate,
  locked = false,
  note,
}: {
  estimate: string;
  locked?: boolean;
  note?: string;
}) {
  return (
    <div className={`nd-price${locked ? " nd-price--locked" : ""}`}>
      <span className="nd-price__estimate">
        {locked ? "Стоимость зафиксирована" : "Ориентир по стоимости"}
      </span>
      <span className="nd-price__value">{estimate}</span>
      {locked && (
        <span className="nd-price__lock-badge">
          Цена подтверждена
        </span>
      )}
      {note && <span className="nd-price__note">{note}</span>}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="nd-empty" role="status">
      <span className="nd-empty__icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3">
          <circle cx="12" cy="12" r="8" />
        </svg>
      </span>
      <span className="nd-empty__title">{title}</span>
      {sub && <span className="nd-empty__sub">{sub}</span>}
      {action}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

export function ErrorState({
  title = "Не удалось загрузить",
  sub,
  onRetry,
}: {
  title?: string;
  sub?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="nd-error" role="alert">
      <span className="nd-error__icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3.5 L21 19 H3 Z" />
          <path d="M12 10 V14" />
          <circle cx="12" cy="16.5" r=".6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="nd-error__title">{title}</span>
      {sub && <span className="nd-error__sub">{sub}</span>}
      {onRetry && (
        <Button variant="secondary" small onClick={onRetry}>Повторить</Button>
      )}
    </div>
  );
}

// ── Loading dots (v6 variant) ─────────────────────────────────────────────────

export function LoadingDots({ label }: { label?: string }) {
  return (
    <span className="nadom-dots-wrap">
      {label && <span>{label}</span>}
      <span className="nd-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}

// ── Footnote ─────────────────────────────────────────────────────────────────

export function Footnote({ children }: { children: React.ReactNode }) {
  return <p className="nd-footnote">{children}</p>;
}
