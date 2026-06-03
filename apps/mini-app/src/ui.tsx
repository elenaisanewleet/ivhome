import { useState } from "react";
import { SYMBOL_TONES } from "./data";
import { STATUS_ITEMS } from "./data";
import { FAQ_ITEMS } from "./data";
import type { Offer, StatusStage, Step, SymbolTone } from "./types";

export function NadomSymbol({
  size = 52,
  tone = "default",
}: {
  size?: number;
  tone?: SymbolTone;
}) {
  const palette = SYMBOL_TONES[tone];
  const isWelcome = tone === "welcome";
  const height = isWelcome ? Math.round(size * 1.24) : size;
  const dropPath = isWelcome
    ? "M34 8C34 8 10 32 10 48C10 65 20.5 76 34 76C47.5 76 58 65 58 48C58 32 34 8 34 8Z"
    : "M26 8C26 8 14 20 14 28C14 35 19.5 40 26 40C32.5 40 38 35 38 28C38 20 26 8 26 8Z";
  const dotCy = isWelcome ? 50 : 28;
  const dotR = isWelcome ? 10 : 4;
  const arcPath = isWelcome
    ? "M4 82 Q16 74 34 78 Q52 82 64 82"
    : "M10 46 Q18 38 26 40 Q34 42 42 46";
  const viewBox = isWelcome ? "0 0 68 84" : "0 0 52 52";

  return (
    <svg
      aria-hidden="true"
      className={`nadom-symbol nadom-symbol--${tone}`}
      height={height}
      viewBox={viewBox}
      width={size}
    >
      <path
        d={dropPath}
        fill={palette.fill}
        stroke={palette.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={isWelcome ? 2.5 : 2}
      />
      <circle cx={isWelcome ? 34 : 26} cy={dotCy} fill={palette.dot} r={dotR} />
      <path
        d={arcPath}
        fill="none"
        stroke={palette.arc}
        strokeDasharray="3 3"
        strokeLinecap="round"
        strokeWidth={isWelcome ? 2 : 1.5}
      />
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
