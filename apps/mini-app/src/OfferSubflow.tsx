import { useState } from "react";

import type { ChatMessage, Offer, OfferView, OffersMode } from "./types";
import { Dots, OfferBadge, Pulse, SlaGrid, StatusTrack, SubflowHeader } from "./ui";

function OfferDetails({
  offer,
  onBack,
  onChat,
  onConfirm,
}: {
  offer: Offer;
  onBack: () => void;
  onChat: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Карточка медслужбы"
        title={offer.name}
        body="Проверьте условия и при необходимости задайте вопрос специалисту выбранной медслужбы."
      />
      <OfferBadge offer={offer} />
      <SlaGrid offer={offer} />
      <div className="price-lock price-lock--estimate">
        <span>стоимость</span>
        <strong>{offer.price}</strong>
      </div>
      <div className="conditions-panel">
        <p className="meta-label">Условия выезда</p>
        <ul className="condition-list">
          {offer.conditions.map((condition) => (
            <li key={condition}>{condition}</li>
          ))}
        </ul>
      </div>
      <p className="privacy-note">Детали и возможность выезда подтверждает выбранная медслужба.</p>
      <div className="subflow-actions">
        <button className="button button--teal" onClick={onChat} type="button">
          Написать специалисту
        </button>
        <button className="button button--primary" onClick={onConfirm} type="button">
          Подтвердить заявку
        </button>
        <button className="button button--ghost" onClick={onBack} type="button">
          Назад к списку
        </button>
      </div>
    </section>
  );
}

function ChatView({
  messages,
  offer,
  onBack,
  onContinue,
  onSend,
}: {
  messages: ChatMessage[];
  offer: Offer;
  onBack: () => void;
  onContinue: () => void;
  onSend: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submitMessage() {
    const message = draft.trim();

    if (!message) {
      return;
    }

    onSend(message);
    setDraft("");
  }

  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Чат со специалистом"
        title={offer.name}
        body="Детали выезда и возможность помощи уточняет специалист выбранной медслужбы. Надом не даёт медицинских рекомендаций."
      />

      <p className="chat-privacy-banner">
        Чат приватный. Сообщения не попадают в Telegram-уведомления.
      </p>

      <div className="chat-window" aria-label={`Чат с ${offer.name}`}>
        <p className="chat-window__date">Сегодня</p>
        <div className="chat-bubble chat-bubble--service">
          Здравствуйте. Я специалист выбранной медслужбы. Можно уточнить условия выезда.
        </div>
        <div className="chat-bubble chat-bubble--user">Подскажите, когда сможете подтвердить время?</div>
        <div className="chat-bubble chat-bubble--service">
          Обычно отвечаем за {offer.responseTime}. Возможность выезда подтверждаем отдельно.
        </div>
        {messages.map((message) => (
          <div className="chat-bubble chat-bubble--user" key={message.id}>
            {message.text}
          </div>
        ))}
      </div>

      {/* Chat content must not be duplicated into Telegram notifications or stored without explicit backend/privacy design. */}
      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage();
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
        <button aria-label="Отправить вопрос" disabled={!draft.trim()} type="submit">
          ↑
        </button>
      </form>
      <div className="subflow-actions">
        <button className="button button--primary" onClick={onContinue} type="button">
          Подтвердить заявку
        </button>
        <button className="button button--ghost" onClick={onBack} type="button">
          Назад к карточке
        </button>
      </div>
    </section>
  );
}

function ConfirmationView({
  district,
  offer,
  requestError,
  submitPending,
  time,
  onBack,
  onChangeOffer,
  onSubmit,
}: {
  district: string;
  offer: Offer;
  requestError: string | null;
  submitPending: boolean;
  time: string;
  onBack: () => void;
  onChangeOffer: () => void;
  onSubmit: () => void;
}) {
  const summary = [
    ["Медслужба", offer.name],
    ["Район / геозона", district],
    ["Время", time],
    ["Стоимость", offer.price],
    ["Когда ответят", offer.responseTime],
    ["Когда приедут", offer.arrivalTime],
  ];

  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Подтверждение заявки"
        title="Проверьте выбранный вариант"
        body="После отправки медслужба подтвердит возможность выезда, время и итоговую стоимость."
      />
      <dl className="summary-list">
        {summary.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="privacy-note">
        Выбранная медслужба может запросить данные, необходимые для оказания услуги.
      </p>
      {requestError ? <p className="request-error">{requestError}</p> : null}
      <div className="subflow-actions">
        <button className="button button--primary" disabled={submitPending} onClick={onSubmit} type="button">
          {submitPending ? <Dots label="Отправляем" /> : "Отправить заявку"}
        </button>
        <button className="button button--secondary" onClick={onBack} type="button">
          Вернуться в чат
        </button>
        <button className="button button--ghost" onClick={onChangeOffer} type="button">
          Изменить вариант
        </button>
      </div>
    </section>
  );
}

function WaitingView({
  offer,
  requestId,
  statusNotice,
  usesApi,
  onChangeOffer,
  onNext,
  onOpenChat,
  onSupport,
}: {
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
        eyebrow="Ждём подтверждение"
        title="Заявка передана медслужбе"
        body="Выбранная медслужба проверяет возможность выезда. Когда ответят и приедут — отслеживается отдельно."
      />
      <div className="live-status">
        <Pulse />
        <span>медслужба смотрит заявку</span>
      </div>
      <OfferBadge offer={offer} />
      <StatusTrack stage="waiting" />
      <SlaGrid offer={offer} label="Ожидаемые сроки" />
      {requestId ? <p className="request-reference">Номер заявки: {requestId}</p> : null}
      {statusNotice ? <p className="privacy-note">{statusNotice}</p> : null}
      <div className="subflow-actions">
        <button className="button button--primary" onClick={onNext} type="button">
          {usesApi ? "Обновить статус" : "Показать подтверждение медслужбы"}
        </button>
        <button className="button button--teal" onClick={onOpenChat} type="button">
          Открыть чат
        </button>
        <button className="button button--secondary" onClick={onSupport} type="button">
          Написать в поддержку
        </button>
        <button className="button button--ghost" onClick={onChangeOffer} type="button">
          Изменить медслужбу
        </button>
      </div>
    </section>
  );
}

function PriceLockView({ offer, onNext }: { offer: Offer; onNext: () => void }) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Стоимость подтверждена"
        title="Стоимость подтверждена медслужбой"
        body="Условия согласованы с выбранной медслужбой до выезда специалиста."
      />
      <StatusTrack stage="price-lock" />
      <SlaGrid offer={offer} label="Подтверждённые сроки" />
      <div className="price-lock">
        <span>итоговая стоимость</span>
        <strong>{offer.finalPrice}</strong>
      </div>
      <p className="privacy-note">Итоговую стоимость и время прибытия подтверждает выбранная медслужба.</p>
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
  onComplete,
  onSupport,
}: {
  offer: Offer;
  onComplete: () => void;
  onSupport: () => void;
}) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Специалист выехал"
        title="Ожидайте специалиста"
        body="Статус обновлён выбранной медслужбой. Ожидаемое время приезда указано отдельно."
      />
      <div className="live-status">
        <Pulse />
        <span>специалист в пути</span>
      </div>
      <StatusTrack stage="dispatched" />
      <div className="status-callout status-callout--teal">
        <span>приедут</span>
        <strong>{offer.arrivalTime}</strong>
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
        eyebrow="Завершено"
        title="Выезд завершён"
        body="Спасибо. Можно оценить взаимодействие с медслужбой или начать новый подбор."
      />
      <StatusTrack stage="completed" />
      <div className="subflow-actions">
        <button className="button button--primary" onClick={onFeedback} type="button">
          Оценить взаимодействие
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
        title="Поможем разобраться"
        body="Напишите в поддержку сервиса и укажите номер заявки, если он есть. Не отправляйте медицинские детали."
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
      <p>
        {isEmpty
          ? "Попробуйте изменить район или время выезда."
          : "Попробуйте загрузить список ещё раз. Параметры подбора сохранены."}
      </p>
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
  district,
  offer,
  rating,
  requestError,
  requestId,
  statusNotice,
  submitPending,
  supportReturnView,
  supportUrl,
  time,
  usesApi,
  view,
  onChangeView,
  onRate,
  onRestart,
  onSendChatMessage,
  onShowSupport,
  onSubmit,
  onUpdateStatus,
}: {
  chatMessages: ChatMessage[];
  district: string;
  offer: Offer;
  rating: number | null;
  requestError: string | null;
  requestId: string | null;
  statusNotice: string | null;
  submitPending: boolean;
  supportReturnView: Exclude<OfferView, "support">;
  supportUrl: string | null;
  time: string;
  usesApi: boolean;
  view: OfferView;
  onChangeView: (view: OfferView | null) => void;
  onRate: (rating: number) => void;
  onRestart: () => void;
  onSendChatMessage: (message: string) => void;
  onShowSupport: (returnView: Exclude<OfferView, "support">) => void;
  onSubmit: () => void;
  onUpdateStatus: () => void;
}) {
  if (view === "details") {
    return (
      <OfferDetails
        offer={offer}
        onBack={() => onChangeView(null)}
        onChat={() => onChangeView("chat")}
        onConfirm={() => onChangeView("confirmation")}
      />
    );
  }

  if (view === "chat") {
    return (
      <ChatView
        messages={chatMessages}
        offer={offer}
        onBack={() => onChangeView("details")}
        onContinue={() => onChangeView("confirmation")}
        onSend={onSendChatMessage}
      />
    );
  }

  if (view === "confirmation") {
    return (
      <ConfirmationView
        district={district}
        offer={offer}
        onBack={() => onChangeView("chat")}
        onChangeOffer={() => onChangeView(null)}
        onSubmit={onSubmit}
        requestError={requestError}
        submitPending={submitPending}
        time={time}
      />
    );
  }

  if (view === "status") {
    return (
      <WaitingView
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
    return <PriceLockView offer={offer} onNext={() => onChangeView("dispatched")} />;
  }

  if (view === "dispatched") {
    return (
      <DispatchedView
        offer={offer}
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
    return (
      <FeedbackView onRate={onRate} onRestart={onRestart} onSupport={() => onShowSupport("feedback")} rating={rating} />
    );
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
