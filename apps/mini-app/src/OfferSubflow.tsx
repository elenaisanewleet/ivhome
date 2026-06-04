import { useState } from "react";

import type { ChatMessage, Offer, OfferService, OfferView, OffersMode } from "./types";
import { Dots, OfferBadge, Pulse, SlaGrid, StatusTrack, SubflowHeader } from "./ui";

export type RequestDraft = {
  customRequest: string;
  customImportant: string;
  budget: string;
  comment: string;
};

type StatusDetails = {
  priceMin: number | null;
  priceMax: number | null;
  priceCurrency: string;
  etaMinutes: number | null;
};

type RequestContext = {
  title: string;
  price: string;
  district: string;
  time: string;
  budget: string;
  requestId: string | null;
};

function isCustomService(service: OfferService | null) {
  return service?.slug === "custom";
}

function catalogServices(offer: Offer) {
  return offer.services.filter((service) => service.slug !== "custom");
}

function customService(offer: Offer) {
  return offer.services.find((service) => service.slug === "custom") ?? null;
}

function displayServiceTitle(service: OfferService | null) {
  return service?.label ?? "Услуга не выбрана";
}

function displayServicePrice(service: OfferService | null) {
  return service?.priceRange ?? "по согласованию";
}

function buildRequestContext({
  district,
  draft,
  requestId,
  selectedService,
  time,
}: {
  district: string;
  draft: RequestDraft;
  requestId: string | null;
  selectedService: OfferService | null;
  time: string;
}): RequestContext {
  const title = isCustomService(selectedService)
    ? draft.customRequest.trim() || "Свой запрос"
    : selectedService?.shortLabel ?? selectedService?.label ?? "Услуга не выбрана";

  return {
    title,
    price: displayServicePrice(selectedService),
    district,
    time,
    budget: draft.budget.trim(),
    requestId,
  };
}

function RequestContextCard({ context }: { context: RequestContext }) {
  return (
    <div className="chat-context-card">
      <span>{context.requestId ? `Заявка #${context.requestId}` : "Контекст заявки"}</span>
      <strong>{context.title}</strong>
      <small>
        {context.district} · {context.time} · {context.price}
        {context.budget ? ` · бюджет ${context.budget}` : ""}
      </small>
    </div>
  );
}

function ServiceRows({
  services,
  selectedService,
  onSelect,
}: {
  services: OfferService[];
  selectedService: OfferService | null;
  onSelect: (service: OfferService) => void;
}) {
  return (
    <div className="service-list" aria-label="Услуги и ориентиры стоимости">
      {services.map((service) => (
        <button
          aria-pressed={selectedService?.slug === service.slug}
          className={`service-row service-row--${service.slug} ${
            selectedService?.slug === service.slug ? "service-row--selected" : ""
          }`}
          key={service.slug}
          onClick={() => onSelect(service)}
          type="button"
        >
          <span>
            <strong>{service.label}</strong>
            <small>{service.description}</small>
          </span>
          <em>{service.priceRange}</em>
        </button>
      ))}
    </div>
  );
}

function OfferDetails({
  offer,
  selectedService,
  onBack,
  onChat,
  onChoose,
  onCustom,
  onSelectService,
}: {
  offer: Offer;
  selectedService: OfferService | null;
  onBack: () => void;
  onChat: () => void;
  onChoose: () => void;
  onCustom: () => void;
  onSelectService: (service: OfferService) => void;
}) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Карточка организации"
        title={offer.name}
        body="Проверьте услуги, сроки и условия. Детали и стоимость подтверждает выбранная организация."
      />

      <OfferBadge offer={offer} />

      <div className="detail-meta-grid" aria-label="Проверка и рейтинг">
        <span className="detail-pill detail-pill--ok">{offer.status}</span>
        <span className="detail-pill detail-pill--dust">⋆ {offer.rating}</span>
        <span className="detail-pill detail-pill--zone">{offer.zone}</span>
      </div>

      <SlaGrid offer={offer} label="Ответ и прибытие после подтверждения" />

      <div className="conditions-panel">
        <p className="meta-label">Услуги и ориентиры</p>
        <ServiceRows services={catalogServices(offer)} selectedService={selectedService} onSelect={onSelectService} />
      </div>

      <CustomRequestTeaser onCustom={onCustom} />

      <div className="conditions-panel">
        <p className="meta-label">Условия выезда</p>
        <ul className="condition-list">
          {offer.conditions.map((condition) => (
            <li key={condition}>{condition}</li>
          ))}
        </ul>
      </div>

      <p className="privacy-note">Детали и стоимость подтверждает выбранная организация.</p>

      <div className="subflow-actions subflow-actions--grid">
        <button className="button button--primary" onClick={onChoose} type="button">
          Выбрать услугу
        </button>
        <button className="button button--secondary" onClick={onCustom} type="button">
          Свой запрос
        </button>
        <button className="button button--teal" onClick={onChat} type="button">
          Написать специалисту
        </button>
        <button className="button button--ghost" onClick={onBack} type="button">
          Назад к списку
        </button>
      </div>
    </section>
  );
}

function CustomRequestTeaser({ onCustom }: { onCustom: () => void }) {
  return (
    <div className="custom-request-panel custom-request-panel--teaser">
      <div>
        <p className="meta-label">Свой запрос</p>
        <h3>Не нашли подходящий вариант?</h3>
        <p>Опишите, что нужно — выбранная медслужба посмотрит запрос и подтвердит формат, возможность выезда и стоимость.</p>
      </div>
      <div className="custom-request-panel__actions">
        <button className="button button--secondary" onClick={onCustom} type="button">
          Свой запрос
        </button>
        <button className="button button--teal" onClick={onCustom} type="button">
          Сначала написать специалисту
        </button>
      </div>
    </div>
  );
}

function RequestTextFields({
  draft,
  includeCustomFields,
  onChangeDraft,
}: {
  draft: RequestDraft;
  includeCustomFields: boolean;
  onChangeDraft: (patch: Partial<RequestDraft>) => void;
}) {
  return (
    <div className="request-fields-stack">
      {includeCustomFields ? (
        <>
          <label className="text-field">
            <span>Что нужно?</span>
            <input
              autoComplete="off"
              maxLength={500}
              onChange={(event) => onChangeDraft({ customRequest: event.target.value })}
              placeholder="Коротко и нейтрально"
              type="text"
              value={draft.customRequest}
            />
          </label>
          <label className="text-field">
            <span>
              Что важно знать? <small>необязательно</small>
            </span>
            <input
              autoComplete="off"
              maxLength={500}
              onChange={(event) => onChangeDraft({ customImportant: event.target.value })}
              placeholder="Например, удобный формат связи"
              type="text"
              value={draft.customImportant}
            />
          </label>
        </>
      ) : null}

      <label className="text-field">
        <span>Ориентир по бюджету, если есть</span>
        <input
          autoComplete="off"
          maxLength={120}
          onChange={(event) => onChangeDraft({ budget: event.target.value })}
          placeholder="например, до 12 000 ₽"
          type="text"
          value={draft.budget}
        />
      </label>

      <label className="text-field">
        <span>Комментарий для организации</span>
        <input
          autoComplete="off"
          maxLength={500}
          onChange={(event) => onChangeDraft({ comment: event.target.value })}
          placeholder="Без телефона, адреса и лишних данных"
          type="text"
          value={draft.comment}
        />
      </label>
    </div>
  );
}

function RequestFormView({
  district,
  draft,
  isCustom,
  offer,
  requestError,
  selectedService,
  submitPending,
  time,
  onBack,
  onChangeDraft,
  onSelectService,
  onSubmit,
}: {
  district: string;
  draft: RequestDraft;
  isCustom: boolean;
  offer: Offer;
  requestError: string | null;
  selectedService: OfferService | null;
  submitPending: boolean;
  time: string;
  onBack: () => void;
  onChangeDraft: (patch: Partial<RequestDraft>) => void;
  onSelectService: (service: OfferService) => void;
  onSubmit: () => void;
}) {
  const selectedTitle = isCustom ? "Свой запрос" : displayServiceTitle(selectedService);
  const selectedPrice = isCustom ? "по согласованию" : displayServicePrice(selectedService);
  const canSubmit = isCustom ? draft.customRequest.trim().length > 0 : Boolean(selectedService);

  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow={isCustom ? "Свой запрос" : "Выбор услуги"}
        title={isCustom ? "Не нашли подходящий вариант?" : "Выберите услугу до заявки"}
        body={isCustom ? "Опишите, что нужно — выбранная медслужба посмотрит запрос и подтвердит формат, возможность выезда и стоимость." : "Не указывайте телефон и точный адрес. Организация подтвердит детали и стоимость до выезда."}
      />

      <OfferBadge offer={offer} />

      {!isCustom ? (
        <ServiceRows services={catalogServices(offer)} selectedService={selectedService} onSelect={onSelectService} />
      ) : null}

      <div className="selected-service-card">
        <span>{isCustom ? "запрос" : "выбранная услуга"}</span>
        <strong>{selectedTitle}</strong>
        <em>{selectedPrice}</em>
      </div>

      <dl className="summary-list">
        <div>
          <dt>Организация</dt>
          <dd>{offer.name}</dd>
        </div>
        <div>
          <dt>Район / геозона</dt>
          <dd>{district}</dd>
        </div>
        <div>
          <dt>Время</dt>
          <dd>{time}</dd>
        </div>
      </dl>

      <RequestTextFields draft={draft} includeCustomFields={isCustom} onChangeDraft={onChangeDraft} />

      <p className="privacy-note">Точный адрес и телефон сейчас не нужны.</p>

      {requestError ? <p className="request-error">{requestError}</p> : null}

      <div className="subflow-actions">
        <button className="button button--primary" disabled={!canSubmit || submitPending} onClick={onSubmit} type="button">
          {submitPending ? <Dots label="Отправляем" /> : isCustom ? "Отправить запрос и открыть чат" : "Отправить заявку и открыть чат"}
        </button>
        {isCustom ? (
          <button className="button button--teal" disabled={!canSubmit || submitPending} onClick={onSubmit} type="button">
            Сначала написать специалисту
          </button>
        ) : null}
        <button className="button button--secondary" onClick={onBack} type="button">
          Вернуться к карточке
        </button>
      </div>
    </section>
  );
}

function ChatView({
  chatError,
  chatPending,
  context,
  messages,
  offer,
  requestId,
  onBack,
  onRefresh,
  onSend,
}: {
  chatError: string | null;
  chatPending: boolean;
  context: RequestContext;
  messages: ChatMessage[];
  offer: Offer;
  requestId: string | null;
  onBack: () => void;
  onRefresh: () => void;
  onSend: (message: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");

  async function submitMessage() {
    const message = draft.trim();

    if (!message) {
      return;
    }

    await onSend(message);
    setDraft("");
  }

  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Чат со специалистом организации"
        title={offer.name}
        body="Чат открыт по созданной заявке. Детали выезда уточняет специалист выбранной организации."
      />

      <RequestContextCard context={context} />

      <p className="chat-privacy-banner">
        Не отправляйте лишние персональные данные. Медицинские детали уточняет выбранная организация.
      </p>

      <div className="chat-window" aria-label={`Чат с ${offer.name}`}>
        <p className="chat-window__date">Сегодня</p>
        {requestId && messages.length === 0 ? (
          <div className="chat-bubble chat-bubble--service">
            Заявка создана. Можно задать короткий вопрос по выезду выбранной организации.
          </div>
        ) : null}
        {messages.map((message) => (
          <div
            className={`chat-bubble ${message.actorType === "USER" ? "chat-bubble--user" : "chat-bubble--service"}`}
            key={message.id}
          >
            {message.text}
          </div>
        ))}
      </div>

      {chatError ? <p className="request-error">{chatError}</p> : null}

      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault();
          void submitMessage();
        }}
      >
        <span className="sr-only">Сообщение специалисту</span>
        <input
          autoComplete="off"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Напишите вопрос специалисту…"
          type="text"
          value={draft}
        />
        <button aria-label="Отправить вопрос" disabled={!requestId || !draft.trim() || chatPending} type="submit">
          ↑
        </button>
      </form>

      <div className="subflow-actions">
        <button className="button button--secondary" disabled={!requestId || chatPending} onClick={onRefresh} type="button">
          {chatPending ? "Обновляем…" : "Обновить чат"}
        </button>
        <button className="button button--ghost" onClick={onBack} type="button">
          Назад к статусу
        </button>
      </div>
    </section>
  );
}

function WaitingView({
  context,
  offer,
  requestId,
  statusNotice,
  usesApi,
  onChangeOffer,
  onNext,
  onOpenChat,
  onSupport,
}: {
  context: RequestContext;
  offer: Offer;
  requestId: string | null;
  statusNotice: string | null;
  usesApi: boolean;
  onChangeOffer: () => void;
  onNext: () => void;
  onOpenChat: () => void;
  onSupport: () => void;
}) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Статус заявки"
        title="Заявка передана выбранной организации"
        body="Выбранная организация проверяет возможность выезда. Ответ и прибытие отслеживаются отдельно."
      />
      <div className="live-status">
        <Pulse />
        <span>организация смотрит заявку</span>
      </div>
      <OfferBadge offer={offer} />
      <RequestContextCard context={context} />
      <StatusTrack stage="waiting" />
      <SlaGrid offer={offer} label="Ожидаемые сроки" />
      {requestId ? <p className="request-reference">Номер заявки: {requestId}</p> : null}
      {statusNotice ? <p className="privacy-note">{statusNotice}</p> : null}
      <div className="subflow-actions">
        <button className="button button--primary" onClick={onNext} type="button">
          {usesApi ? "Обновить статус" : "Показать подтверждение организации"}
        </button>
        <button className="button button--teal" onClick={onOpenChat} type="button">
          Открыть чат
        </button>
        <button className="button button--secondary" onClick={onSupport} type="button">
          Написать в поддержку
        </button>
        <button className="button button--ghost" onClick={onChangeOffer} type="button">
          Изменить вариант
        </button>
      </div>
    </section>
  );
}

function formatConfirmedPrice(details: StatusDetails | null, fallback: string) {
  if (!details?.priceMin) {
    return fallback;
  }

  const currency = details.priceCurrency === "RUB" ? "₽" : details.priceCurrency;

  if (details.priceMax && details.priceMax !== details.priceMin) {
    return `${details.priceMin} – ${details.priceMax} ${currency}`;
  }

  return `${details.priceMin} ${currency}`;
}

function formatEta(details: StatusDetails | null, fallback: string) {
  return details?.etaMinutes ? `~${details.etaMinutes} мин` : fallback;
}

function PriceLockView({
  offer,
  statusDetails,
  onNext,
}: {
  offer: Offer;
  statusDetails: StatusDetails | null;
  onNext: () => void;
}) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Стоимость подтверждена"
        title="Стоимость подтверждена организацией"
        body="Цена до выезда зафиксирована выбранной организацией."
      />
      <StatusTrack stage="price-lock" />
      <SlaGrid offer={offer} label="Подтверждённые сроки" />
      <div className="price-lock">
        <span>Цена до выезда</span>
        <strong>{formatConfirmedPrice(statusDetails, offer.finalPrice)}</strong>
      </div>
      <p className="privacy-note">
        Стоимость подтверждена организацией.
        {statusDetails?.etaMinutes ? ` Ожидаемое прибытие после подтверждения: ${formatEta(statusDetails, offer.arrivalTime)}.` : ""}
      </p>
      <div className="subflow-actions">
        <button className="button button--primary" onClick={onNext} type="button">
          Продолжить
        </button>
      </div>
    </section>
  );
}

function DispatchedView({
  offer,
  statusDetails,
  onComplete,
  onSupport,
}: {
  offer: Offer;
  statusDetails: StatusDetails | null;
  onComplete: () => void;
  onSupport: () => void;
}) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Специалист выехал"
        title="Ожидайте специалиста"
        body="Статус обновлён выбранной организацией. Ожидаемое время приезда указано отдельно."
      />
      <div className="live-status">
        <Pulse />
        <span>специалист выбранной организации в пути</span>
      </div>
      <StatusTrack stage="dispatched" />
      <div className="status-callout status-callout--teal">
        <span>прибытие после подтверждения</span>
        <strong>{formatEta(statusDetails, offer.arrivalTime)}</strong>
      </div>
      <div className="subflow-actions">
        <button className="button button--primary" onClick={onComplete} type="button">
          Показать завершение
        </button>
        <button className="button button--ghost" onClick={onSupport} type="button">
          Нужна поддержка
        </button>
      </div>
    </section>
  );
}

function CompletedView({
  onFeedback,
  onRestart,
  onSupport,
}: {
  onFeedback: () => void;
  onRestart: () => void;
  onSupport: () => void;
}) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Готово"
        title="Заявка завершена"
        body="Если нужно — можно начать новый подбор или написать в поддержку сервиса."
      />
      <StatusTrack stage="completed" />
      <div className="subflow-actions">
        <button className="button button--primary" onClick={onFeedback} type="button">
          Оставить оценку
        </button>
        <button className="button button--secondary" onClick={onSupport} type="button">
          Нужна поддержка
        </button>
        <button className="button button--ghost" onClick={onRestart} type="button">
          Подобрать снова
        </button>
      </div>
    </section>
  );
}

function FeedbackView({
  rating,
  onRate,
  onRestart,
  onSupport,
}: {
  rating: number | null;
  onRate: (rating: number) => void;
  onRestart: () => void;
  onSupport: () => void;
}) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Обратная связь"
        title="Как прошло взаимодействие?"
        body="Оценка поможет улучшить подбор вариантов. Можно оставить только оценку."
      />
      <div className="rating-grid" aria-label="Оценка от 1 до 5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            aria-pressed={rating === value}
            className={`rating-button ${rating === value ? "rating-button--selected" : ""}`}
            key={value}
            onClick={() => onRate(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>
      <p className="privacy-note">
        Не добавляйте медицинские детали в обратную связь. Для личного вопроса используйте поддержку.
      </p>
      <div className="subflow-actions">
        <button className="button button--secondary" onClick={onSupport} type="button">
          Нужна поддержка
        </button>
        <button className="button button--primary" onClick={onRestart} type="button">
          Подобрать снова
        </button>
      </div>
    </section>
  );
}

function SupportView({
  onBack,
  onRestart,
  requestId,
  supportUrl,
}: {
  onBack: () => void;
  onRestart: () => void;
  requestId: string | null;
  supportUrl: string | null;
}) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Поддержка"
        title="Поможем с работой сервиса"
        body="Медицинские вопросы решает специалист выбранной организации. Не отправляйте медицинские детали в поддержку."
      />
      <div className="support-panel">
        <p className="meta-label">Чат поддержки</p>
        <strong>Ответим спокойно и по делу</strong>
        <span>{requestId ? `Номер заявки: ${requestId}` : "Номер заявки появится после отправки."}</span>
        <span>{supportUrl ? "Откройте защищённый канал поддержки." : "Канал поддержки пока не подключён."}</span>
      </div>
      <div className="subflow-actions">
        {supportUrl ? (
          <a className="button button--primary" href={supportUrl} rel="noreferrer" target="_blank">
            Открыть чат поддержки
          </a>
        ) : (
          <button className="button button--primary" disabled type="button">
            Чат поддержки подключается
          </button>
        )}
        <button className="button button--secondary" onClick={onBack} type="button">
          Вернуться к заявке
        </button>
        <button className="button button--ghost" onClick={onRestart} type="button">
          Начать подбор снова
        </button>
      </div>
    </section>
  );
}

export function OffersState({
  mode,
  onChangeParameters,
  onRetry,
}: {
  mode: Exclude<OffersMode, "ready">;
  onChangeParameters: () => void;
  onRetry: () => void;
}) {
  const isEmpty = mode === "empty";

  return (
    <section className={`list-state list-state--${mode}`}>
      <span className="list-state__symbol" aria-hidden="true">
        {isEmpty ? "⋆" : "↻"}
      </span>
      <p className="eyebrow">{isEmpty ? "варианты" : "обновление списка"}</p>
      <h2>{isEmpty ? "Пока нет подходящих вариантов" : "Не получилось загрузить варианты"}</h2>
      <p>{isEmpty ? "Попробуйте изменить район или время выезда." : "Попробуйте загрузить список ещё раз. Параметры подбора сохранены."}</p>
      <div className="subflow-actions">
        {isEmpty ? (
          <button className="button button--primary" onClick={onChangeParameters} type="button">
            Изменить параметры
          </button>
        ) : (
          <button className="button button--primary" onClick={onRetry} type="button">
            Попробовать снова
          </button>
        )}
        {!isEmpty ? (
          <button className="button button--ghost" onClick={onChangeParameters} type="button">
            Изменить параметры
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function OfferSubflow({
  chatMessages,
  chatError,
  chatPending,
  district,
  draft,
  offer,
  rating,
  requestError,
  requestId,
  selectedService,
  statusNotice,
  statusDetails,
  submitPending,
  supportReturnView,
  supportUrl,
  time,
  usesApi,
  view,
  onChangeDraft,
  onChangeView,
  onRate,
  onRestart,
  onSelectService,
  onSendChatMessage,
  onRefreshChat,
  onShowSupport,
  onSubmit,
  onUpdateStatus,
}: {
  chatMessages: ChatMessage[];
  chatError: string | null;
  chatPending: boolean;
  district: string;
  draft: RequestDraft;
  offer: Offer;
  rating: number | null;
  requestError: string | null;
  requestId: string | null;
  selectedService: OfferService | null;
  statusNotice: string | null;
  statusDetails: StatusDetails | null;
  submitPending: boolean;
  supportReturnView: Exclude<OfferView, "support">;
  supportUrl: string | null;
  time: string;
  usesApi: boolean;
  view: OfferView;
  onChangeDraft: (patch: Partial<RequestDraft>) => void;
  onChangeView: (view: OfferView | null) => void;
  onRate: (rating: number) => void;
  onRestart: () => void;
  onSelectService: (service: OfferService | null) => void;
  onSendChatMessage: (message: string) => Promise<void>;
  onRefreshChat: () => void;
  onShowSupport: (returnView: Exclude<OfferView, "support">) => void;
  onSubmit: () => void;
  onUpdateStatus: () => void;
}) {
  const context = buildRequestContext({ district, draft, requestId, selectedService, time });

  if (view === "details") {
    return (
      <OfferDetails
        offer={offer}
        selectedService={selectedService}
        onBack={() => onChangeView(null)}
        onChat={() => onChangeView(requestId ? "chat" : "service")}
        onChoose={() => onChangeView("service")}
        onCustom={() => {
          onSelectService(customService(offer));
          onChangeView("custom");
        }}
        onSelectService={onSelectService}
      />
    );
  }

  if (view === "service") {
    return (
      <RequestFormView
        district={district}
        draft={draft}
        isCustom={false}
        offer={offer}
        onBack={() => onChangeView("details")}
        onChangeDraft={onChangeDraft}
        onSelectService={onSelectService}
        onSubmit={onSubmit}
        requestError={requestError}
        selectedService={isCustomService(selectedService) ? null : selectedService}
        submitPending={submitPending}
        time={time}
      />
    );
  }

  if (view === "custom") {
    return (
      <RequestFormView
        district={district}
        draft={draft}
        isCustom
        offer={offer}
        onBack={() => onChangeView("details")}
        onChangeDraft={onChangeDraft}
        onSelectService={onSelectService}
        onSubmit={onSubmit}
        requestError={requestError}
        selectedService={selectedService}
        submitPending={submitPending}
        time={time}
      />
    );
  }

  if (view === "confirmation") {
    return (
      <RequestFormView
        district={district}
        draft={draft}
        isCustom={isCustomService(selectedService)}
        offer={offer}
        onBack={() => onChangeView("details")}
        onChangeDraft={onChangeDraft}
        onSelectService={onSelectService}
        onSubmit={onSubmit}
        requestError={requestError}
        selectedService={selectedService}
        submitPending={submitPending}
        time={time}
      />
    );
  }

  if (view === "chat") {
    return (
      <ChatView
        chatError={chatError}
        chatPending={chatPending}
        context={context}
        messages={chatMessages}
        offer={offer}
        requestId={requestId}
        onBack={() => onChangeView("status")}
        onRefresh={onRefreshChat}
        onSend={onSendChatMessage}
      />
    );
  }

  if (view === "status") {
    return (
      <WaitingView
        context={context}
        offer={offer}
        onChangeOffer={() => onChangeView(null)}
        onNext={onUpdateStatus}
        onOpenChat={() => onChangeView("chat")}
        onSupport={() => onShowSupport("status")}
        requestId={requestId}
        statusNotice={statusNotice}
        usesApi={usesApi}
      />
    );
  }

  if (view === "price-lock") {
    return <PriceLockView offer={offer} statusDetails={statusDetails} onNext={() => onChangeView("dispatched")} />;
  }

  if (view === "dispatched") {
    return (
      <DispatchedView
        offer={offer}
        statusDetails={statusDetails}
        onComplete={() => onChangeView("completed")}
        onSupport={() => onShowSupport("dispatched")}
      />
    );
  }

  if (view === "completed") {
    return (
      <CompletedView
        onFeedback={() => onChangeView("feedback")}
        onRestart={onRestart}
        onSupport={() => onShowSupport("completed")}
      />
    );
  }

  if (view === "feedback") {
    return <FeedbackView onRate={onRate} onRestart={onRestart} onSupport={() => onShowSupport("feedback")} rating={rating} />;
  }

  return (
    <SupportView
      onBack={() => onChangeView(supportReturnView)}
      onRestart={onRestart}
      requestId={requestId}
      supportUrl={supportUrl}
    />
  );
}
