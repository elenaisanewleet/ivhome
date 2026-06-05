import type { Offer, OfferView } from "./types";
import { SlaGrid } from "./ui";

export function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: (view: OfferView) => void }) {
  const previewServices = offer.services.filter((service) => service.slug !== "custom").slice(0, 3);

  return (
    <article className="offer-card">
      <button className="offer-card__header" onClick={() => onOpen("details")} type="button">
        <div>
          <p className="status-label">
            <span className="status-dot" />
            {offer.status}
          </p>
          <h2>{offer.name}</h2>
        </div>
        <span className="rating-pill">⋆ {offer.rating}</span>
      </button>

      <p className="offer-zone">{offer.zone}</p>
      <SlaGrid offer={offer} />

      <div className="service-preview" aria-label="Услуги и ориентиры стоимости">
        {previewServices.map((service) => (
          <div className="service-preview__row" key={service.slug}>
            <span>{service.shortLabel}</span>
            <strong>{service.priceRange}</strong>
          </div>
        ))}
      </div>

      <ul className="condition-list condition-list--compact">
        {offer.conditions.slice(0, 2).map((condition) => (
          <li key={condition}>{condition}</li>
        ))}
      </ul>

      <p className="offer-note">{offer.note}</p>

      <div className="offer-actions">
        <button className="button button--primary" onClick={() => onOpen("service")} type="button">
          Подробнее
        </button>
        <button className="button button--teal" onClick={() => onOpen("service")} type="button">
          Написать в чат
        </button>
      </div>
    </article>
  );
}

/** Lightweight shimmer placeholders shown while the offer list loads. */
export function OfferCardSkeleton() {
  return (
    <article className="offer-card offer-card--skeleton" aria-hidden="true">
      <div className="offer-card__header">
        <div>
          <span className="skeleton skeleton--line skeleton--sm" />
          <span className="skeleton skeleton--line skeleton--lg" />
        </div>
        <span className="skeleton skeleton--pill" />
      </div>
      <span className="skeleton skeleton--line skeleton--md" />
      <div className="sla-grid">
        <span className="skeleton skeleton--box" />
        <span className="skeleton skeleton--box" />
      </div>
      <span className="skeleton skeleton--line skeleton--md" />
    </article>
  );
}
