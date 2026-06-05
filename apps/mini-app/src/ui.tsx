import { useState } from "react";
import { SYMBOL_TONES } from "./data";
import { STATUS_ITEMS } from "./data";
import { FAQ_ITEMS } from "./data";
import type { Offer, StatusStage, Step, SymbolTone } from "./types";

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
        <span>Ответ медслужбы</span>
        <strong>{offer.responseTime}</strong>
      </div>
      <div className="sla-box sla-box--eta">
        <span>Прибытие после подтверждения</span>
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
