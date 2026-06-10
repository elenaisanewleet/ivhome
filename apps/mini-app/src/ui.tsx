import "./ui.css";
import { useState } from "react";
import { SYMBOL_TONES } from "./data";
import { STATUS_ITEMS } from "./data";
import { FAQ_ITEMS } from "./data";
import type { Offer, StatusStage, Step, SymbolTone } from "./types";
import type { NadomRequestStatus, SlaMetrics } from "@ivhome/shared";
import { NADOM_REQUEST_STATUS_LABELS } from "@ivhome/shared";

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

// ─── Nadom Design System v8 components ──────────────────────────────────────

/** Two-cell SLA block — ALWAYS shows responseMinutes and arrivalMinutes separately. */
export function SlaBlock({ sla }: { sla: SlaMetrics }) {
  const fmtRange = ([min, max]: [number, number]) =>
    min === max ? `${min} мин` : `${min}–${max} мин`;

  return (
    <div className="sla-block" aria-label="Время ответа и прибытия">
      <div className="sla-cell sla-cell--response">
        <div className="sla-key">Ответ медслужбы</div>
        <div className="sla-value">{fmtRange(sla.responseMinutes)}</div>
        <div className="sla-sub">после заявки</div>
      </div>
      <div className="sla-cell sla-cell--arrival">
        <div className="sla-key">Прибытие</div>
        <div className="sla-value">{fmtRange(sla.arrivalMinutes)}</div>
        <div className="sla-sub">после подтверждения</div>
      </div>
    </div>
  );
}

/** Rating badge — amber, Unbounded font. */
export function RatingBadge({ value }: { value: number | string }) {
  return (
    <span className="rating-badge">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d="M8 1.5l1.85 3.75 4.15.6-3 2.92.71 4.13L8 10.77l-3.71 1.95.71-4.13L2 5.85l4.15-.6z" fill="currentColor" />
      </svg>
      {value}
    </span>
  );
}

/** Status track using NadomRequestStatus — matches design v8 step states. */
export function StatusTrackV8({ status }: { status: NadomRequestStatus }) {
  const order: NadomRequestStatus[] = [
    "submitted",
    "confirming",
    "dispatched",
    "en_route",
    "arrived",
    "completed",
  ];
  const activeIdx = order.indexOf(status);

  return (
    <div className="status-track-v8" aria-label="Статус заявки">
      {order.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        const off = i > activeIdx;
        const isLast = i === order.length - 1;
        const info = NADOM_REQUEST_STATUS_LABELS[s];

        return (
          <div className="status-track-v8__item" key={s}>
            <div className="status-track-v8__left">
              <div
                className={`status-track-v8__dot ${done ? "status-track-v8__dot--done" : ""} ${active ? "status-track-v8__dot--active" : ""}`}
                aria-hidden="true"
              />
              {!isLast && (
                <div className={`status-track-v8__line ${done ? "status-track-v8__line--done" : ""}`} aria-hidden="true" />
              )}
            </div>
            <div className="status-track-v8__text">
              <div className={`status-track-v8__name ${off ? "status-track-v8__name--off" : ""}`}>{info.label}</div>
              {active ? <div className="status-track-v8__sub">{info.sub}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Loading dots — three bouncing dots for pending states. */
export function LoadingDots() {
  return (
    <span className="loading-dots" aria-label="Загружается">
      <span />
      <span />
      <span />
    </span>
  );
}

/** Live badge — teal pulsing dot for en-route / live status. */
export function LiveBadge({ label = "Специалист в пути" }: { label?: string }) {
  return (
    <span className="live-badge">
      <span className="live-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}

/** Privacy / info banner strip. */
export function Banner({
  variant = "priv",
  children,
}: {
  variant?: "priv" | "info" | "sage" | "err";
  children: React.ReactNode;
}) {
  return (
    <div className={`banner banner-${variant}`} role="note">
      {children}
    </div>
  );
}

/** Empty state block. */
export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
        </svg>
      </div>
      <div className="empty-state__title">{title}</div>
      {sub ? <div className="empty-state__sub">{sub}</div> : null}
      {action}
    </div>
  );
}

/** Error state block. */
export function ErrorState({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="error-state">
      <div className="error-state__icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 9v4M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div className="error-state__title">{title}</div>
      {sub ? <div className="error-state__sub">{sub}</div> : null}
      {action}
    </div>
  );
}

/** Price block with confirm footnote. */
export function PriceBlock({
  label = "Ориентир по стоимости",
  value,
  sub,
  locked = false,
}: {
  label?: string;
  value: string;
  sub?: string;
  locked?: boolean;
}) {
  return (
    <div className={`price-block ${locked ? "live" : ""}`}>
      <div className="price-block__key">{label}</div>
      <div className="price-block__value">{value}</div>
      {sub ? <div className="price-block__sub">{sub}</div> : null}
      {!locked ? (
        <p className="price-confirm-note">
          Финальная стоимость подтверждается клиникой до выезда
        </p>
      ) : null}
    </div>
  );
}
