import type { Offer, OfferView } from "./types";
import { SlaGrid } from "./ui";

export function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: (view: OfferView) => void }) {
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

      <div className="price-row">
        <span>стоимость</span>
        <strong>{offer.price}</strong>
      </div>

      <ul className="condition-list condition-list--compact">
        {offer.conditions.map((condition) => (
          <li key={condition}>{condition}</li>
        ))}
      </ul>

      <p className="offer-note">{offer.note}</p>

      <div className="offer-actions">
        <button className="button button--teal" onClick={() => onOpen("chat")} type="button">
          Написать специалисту
        </button>
        <button className="button button--primary" onClick={() => onOpen("confirmation")} type="button">
          Подтвердить заявку
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
