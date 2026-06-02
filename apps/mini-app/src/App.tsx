import { useEffect, useMemo, useState } from "react";

import type { MvpOffer, MvpRequestStatus } from "@ivhome/shared";

import "./App.css";
import "./App.mobile.css";
import "./App.chat.css";
import {
  createMvpRequest,
  isApiConfigured,
  loadMvpRequestStatus,
  loadOffers,
  readSupportUrl,
} from "./api";

type StepId = "welcome" | "consent" | "emergency" | "profile" | "location" | "time" | "offers";

type OfferView =
  | "details"
  | "chat"
  | "confirmation"
  | "status"
  | "price-lock"
  | "dispatched"
  | "completed"
  | "feedback"
  | "support";

type OffersMode = "ready" | "empty" | "error";

type PreviewId = "offers" | OffersMode | OfferView;

type Step = {
  id: StepId;
  eyebrow: string;
  title: string;
  body: string[];
  iconLabel: string;
};

type Offer = MvpOffer;

type ChatMessage = {
  id: string;
  text: string;
};

type StatusStage = "waiting" | "price-lock" | "dispatched" | "completed";

const STEPS: Step[] = [
  {
    id: "welcome",
    eyebrow: "Надом 🫧",
    title: "Подберём медслужбу с выездом на дом",
    body: [
      "Конфиденциальный подбор вариантов медицинского выезда на дом.",
      "Сравните время, условия и ориентировочную стоимость. Детали подтверждает выбранная медслужба.",
    ],
    iconLabel: "welcome",
  },
  {
    id: "consent",
    eyebrow: "Шаг 1 из 6",
    title: "Сначала — согласие",
    body: [
      "Для подбора нужны только район, удобное время и формат запроса.",
      "Продолжая, вы соглашаетесь на обработку этих данных для подбора вариантов. Точный адрес и телефон сейчас не нужны.",
    ],
    iconLabel: "privacy",
  },
  {
    id: "emergency",
    eyebrow: "Шаг 2 из 6",
    title: "Когда лучше позвонить 103 или 112",
    body: [
      "Если состояние кажется острым или быстро ухудшается — лучше обратиться за экстренной помощью: 103 или 112.",
      "Надом может показать доступные варианты выезда, но детали и возможность помощи подтверждает выбранная медслужба.",
    ],
    iconLabel: "signal",
  },
  {
    id: "profile",
    eyebrow: "Шаг 3 из 6",
    title: "Как помочь с подбором?",
    body: ["Выберите подходящий формат. Медицинские детали на этом этапе не нужны."],
    iconLabel: "route",
  },
  {
    id: "location",
    eyebrow: "Шаг 4 из 6",
    title: "Где нужен выезд?",
    body: ["Достаточно района или округа.", "Точный адрес сейчас не нужен."],
    iconLabel: "location",
  },
  {
    id: "time",
    eyebrow: "Шаг 5 из 6",
    title: "Когда нужен выезд?",
    body: [
      "Медслужба отдельно подтвердит возможность выезда и время прибытия.",
      "Пока выберите удобный ориентир.",
    ],
    iconLabel: "time",
  },
  {
    id: "offers",
    eyebrow: "Шаг 6 из 6",
    title: "Подходящие варианты",
    body: [
      "Нашли медслужбы под ваш район и время.",
      "Сравните ответ, прибытие после подтверждения и ориентировочную стоимость.",
    ],
    iconLabel: "offers",
  },
];

const PROFILE_OPTIONS = [
  "Найти ближайший вариант",
  "Сравнить условия выезда",
  "Сначала задать личный вопрос",
  "Планирую выезд заранее",
];

const DISTRICT_OPTIONS = [
  "ЦАО",
  "САО",
  "СВАО",
  "ВАО",
  "ЮВАО",
  "ЮАО",
  "ЮЗАО",
  "ЗАО",
  "СЗАО",
  "Новая Москва",
];

const TIME_OPTIONS = ["Как можно скорее", "Сегодня", "Завтра", "Выбрать время позже"];

const FALLBACK_OFFERS: Offer[] = [
  {
    id: "medservice-north",
    name: "Медслужба Север",
    status: "Лицензия проверена",
    zone: "САО · СЗАО · рядом",
    responseTime: "5–10 минут",
    arrivalTime: "от 40 минут",
    price: "от 8 500 ₽",
    finalPrice: "9 200 ₽",
    rating: "4.8",
    conditions: ["Выезд после подтверждения", "Условия можно уточнить в чате"],
    note: "Детали и возможность выезда подтверждает медслужба.",
  },
  {
    id: "medservice-center",
    name: "Медслужба Центр",
    status: "Лицензия проверена",
    zone: "ЦАО · ЗАО · ЮЗАО",
    responseTime: "10–15 минут",
    arrivalTime: "от 55 минут",
    price: "от 9 200 ₽",
    finalPrice: "10 400 ₽",
    rating: "4.7",
    conditions: ["Работает по зонам выезда", "Стоимость подтверждается до выезда"],
    note: "Детали и возможность выезда подтверждает медслужба.",
  },
  {
    id: "medservice-night",
    name: "Медслужба Ночь",
    status: "Проверена · принимает заявки",
    zone: "Москва · по зонам выезда",
    responseTime: "до 20 минут",
    arrivalTime: "от 70 минут",
    price: "от 10 500 ₽",
    finalPrice: "11 300 ₽",
    rating: "4.6",
    conditions: ["Доступна в позднее время", "Время зависит от зоны выезда"],
    note: "Детали и возможность выезда подтверждает медслужба.",
  },
];

const STATUS_ITEMS = [
  "Заявка создана",
  "Передали медслужбе",
  "Ожидаем подтверждение",
  "Медслужба подтвердила",
  "Стоимость подтверждена",
  "Специалист выехал",
  "Завершено",
];

const OFFER_VIEWS: OfferView[] = [
  "details",
  "chat",
  "confirmation",
  "status",
  "price-lock",
  "dispatched",
  "completed",
  "feedback",
  "support",
];

const OFFERS_STEP_INDEX = STEPS.findIndex((step) => step.id === "offers");
const PROFILE_STEP_INDEX = STEPS.findIndex((step) => step.id === "profile");
const TIME_STEP_INDEX = STEPS.findIndex((step) => step.id === "time");

function getStep(index: number) {
  return STEPS[index] ?? STEPS[0]!;
}

function readPreviewId(): PreviewId | null {
  if (typeof window === "undefined") {
    return null;
  }

  const preview = new URLSearchParams(window.location.search).get("preview");
  const availablePreviews: PreviewId[] = ["offers", "ready", "empty", "error", ...OFFER_VIEWS];

  return availablePreviews.includes(preview as PreviewId) ? (preview as PreviewId) : null;
}

function isOfferView(preview: PreviewId | null): preview is OfferView {
  return OFFER_VIEWS.includes(preview as OfferView);
}

function offerViewForStatus(status: MvpRequestStatus): OfferView {
  return status === "waiting" ? "status" : status;
}

function isLikelyMobileRuntime() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function NodeIcon({ variant }: { variant: Step["iconLabel"] }) {
  const isEmergency = variant === "signal";
  const isOffers = variant === "offers";

  return (
    <div
      className={`node-icon ${isEmergency ? "node-icon--emergency" : ""} ${isOffers ? "node-icon--offers" : ""}`}
      aria-hidden="true"
    >
      <span className="node-icon__dot node-icon__dot--main" />
      <span className="node-icon__line node-icon__line--first" />
      <span className="node-icon__dot node-icon__dot--second" />
      <span className="node-icon__line node-icon__line--second" />
      <span className="node-icon__dot node-icon__dot--third" />
    </div>
  );
}

function ProgressDots({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="progress-dots" aria-label={`Экран ${currentIndex + 1} из ${STEPS.length}`}>
      {STEPS.map((step, index) => (
        <span
          className={`progress-dot ${index <= currentIndex ? "progress-dot--active" : ""}`}
          key={step.id}
        />
      ))}
    </div>
  );
}

function SlaGrid({ offer }: { offer: Offer }) {
  return (
    <div className="sla-grid" aria-label="Время ответа и прибытия">
      <div className="sla-box">
        <span>Ответ</span>
        <strong>{offer.responseTime}</strong>
      </div>
      <div className="sla-box sla-box--eta">
        <span>Прибытие после подтверждения</span>
        <strong>{offer.arrivalTime}</strong>
      </div>
    </div>
  );
}

function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: (view: OfferView) => void }) {
  return (
    <article className="offer-card">
      <div className="offer-card__header">
        <div>
          <p className="status-label">
            <span className="status-dot" />
            {offer.status}
          </p>
          <h2>{offer.name}</h2>
        </div>
        <span className="rating-pill">⋆ {offer.rating}</span>
      </div>

      <p className="offer-zone">{offer.zone}</p>
      <SlaGrid offer={offer} />

      <div className="price-row">
        <span>Ориентировочная стоимость</span>
        <strong>{offer.price}</strong>
      </div>

      <ul className="condition-list condition-list--compact">
        {offer.conditions.map((condition) => (
          <li key={condition}>{condition}</li>
        ))}
      </ul>

      <p className="offer-note">{offer.note}</p>

      <div className="offer-actions">
        <button className="button button--secondary" onClick={() => onOpen("details")} type="button">
          Смотреть детали
        </button>
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

function SubflowHeader({
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

function OfferBadge({ offer }: { offer: Offer }) {
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

function StatusTrack({ stage }: { stage: StatusStage }) {
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
        <span>Ориентировочная стоимость</span>
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
        body="Можно уточнить формат помощи, время, условия или личный вопрос."
      />

      <div className="chat-window" aria-label={`Чат с ${offer.name}`}>
        <p className="chat-window__date">Сегодня · локальный макет</p>
        <div className="chat-bubble chat-bubble--service">
          Здравствуйте. Я специалист выбранной медслужбы. Можно уточнить условия выезда.
        </div>
        <div className="chat-bubble chat-bubble--user">Подскажите, когда сможете подтвердить время?</div>
        <div className="chat-bubble chat-bubble--service">
          Обычно отвечаем в течение {offer.responseTime}. Возможность выезда подтвердим отдельно.
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
        <button aria-label="Добавить вопрос в локальный макет" disabled={!draft.trim()} type="submit">
          ↑
        </button>
      </form>
      <p className="privacy-note">
        Сообщение сохраняется только в этом локальном макете и не отправляется в Telegram-уведомления.
      </p>

      <div className="subflow-actions">
        <button className="button button--primary" onClick={onContinue} type="button">
          Продолжить к подтверждению
        </button>
        <button className="button button--secondary" onClick={onContinue} type="button">
          Пропустить чат
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
    ["Ориентировочная стоимость", offer.price],
    ["Ответ", offer.responseTime],
    ["Прибытие после подтверждения", offer.arrivalTime],
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
          {submitPending ? "Отправляем…" : "Отправить заявку"}
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
  onNext,
  onSupport,
}: {
  offer: Offer;
  requestId: string | null;
  statusNotice: string | null;
  usesApi: boolean;
  onNext: () => void;
  onSupport: () => void;
}) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Ожидаем подтверждение 🧊"
        title="Заявка передана медслужбе"
        body="Выбранная медслужба проверяет возможность выезда. Ответ и ожидаемое прибытие отслеживаются отдельно."
      />
      <OfferBadge offer={offer} />
      <StatusTrack stage="waiting" />
      <div className="status-callout">
        <span>Ожидаемый ответ</span>
        <strong>{offer.responseTime}</strong>
      </div>
      {requestId ? <p className="request-reference">Номер заявки: {requestId}</p> : null}
      {statusNotice ? <p className="privacy-note">{statusNotice}</p> : null}
      <div className="subflow-actions">
        <button className="button button--primary" onClick={onNext} type="button">
          {usesApi ? "Обновить статус" : "Показать демо-подтверждение"}
        </button>
        <button className="button button--ghost" onClick={onSupport} type="button">
          Нужна поддержка
        </button>
      </div>
    </section>
  );
}

function PriceLockView({
  offer,
  onNext,
}: {
  offer: Offer;
  onNext: () => void;
}) {
  return (
    <section className="offer-subflow">
      <SubflowHeader
        eyebrow="Стоимость подтверждена"
        title="Стоимость подтверждена медслужбой"
        body="Условия согласованы с выбранной медслужбой до выезда специалиста."
      />
      <StatusTrack stage="price-lock" />
      <div className="price-lock">
        <span>Итоговая стоимость</span>
        <strong>{offer.finalPrice}</strong>
      </div>
      <p className="privacy-note">Итоговую стоимость подтверждает выбранная медслужба.</p>
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
        eyebrow="Специалист выехал 🪽"
        title="Ожидайте специалиста"
        body="Статус обновлён выбранной медслужбой. Ожидаемое прибытие указано отдельно."
      />
      <StatusTrack stage="dispatched" />
      <div className="status-callout status-callout--teal">
        <span>Ожидаемое прибытие</span>
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
        eyebrow="Завершено 🩵"
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
        eyebrow="Поддержка 🩵"
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

function OfferSubflow({
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
        onNext={onUpdateStatus}
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

function OffersState({
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
      <p className="eyebrow">{isEmpty ? "Варианты" : "Обновление списка"}</p>
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

export function App() {
  const [preview] = useState<PreviewId | null>(() => readPreviewId());
  const startsOnOffers = preview !== null;
  const initialOfferView = isOfferView(preview) ? preview : null;
  const [stepIndex, setStepIndex] = useState(startsOnOffers ? OFFERS_STEP_INDEX : 0);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(startsOnOffers ? "САО" : null);
  const [manualDistrict, setManualDistrict] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(startsOnOffers ? "Сегодня" : null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState<string | null>(null);
  const [offersMode, setOffersMode] = useState<OffersMode>(preview === "empty" || preview === "error" ? preview : "ready");
  const [offers, setOffers] = useState<Offer[]>(FALLBACK_OFFERS);
  const [offersLoading, setOffersLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(initialOfferView ? FALLBACK_OFFERS[0]! : null);
  const [offerView, setOfferView] = useState<OfferView | null>(initialOfferView);
  const [supportReturnView, setSupportReturnView] = useState<Exclude<OfferView, "support">>("completed");
  const [rating, setRating] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitPending, setSubmitPending] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const step = getStep(stepIndex);
  const isFirstStep = stepIndex === 0;
  const isProfileStep = step.id === "profile";
  const isLocationStep = step.id === "location";
  const isTimeStep = step.id === "time";
  const isOffersStep = step.id === "offers";
  const hasLocation = Boolean(selectedDistrict || manualDistrict.trim());
  const district = selectedDistrict || manualDistrict.trim() || "Район уточняется";
  const time = selectedTime || "Время уточняется";
  const showOfferSubflow = isOffersStep && selectedOffer && offerView;
  const supportUrl = readSupportUrl();
  const usesApi = isApiConfigured();

  useEffect(() => {
    if (!isOffersStep || offersMode !== "ready" || preview !== null) {
      return;
    }

    let isCurrent = true;

    setOffersLoading(true);

    void loadOffers(FALLBACK_OFFERS)
      .then((loadedOffers) => {
        if (!isCurrent) {
          return;
        }

        setOffers(loadedOffers);
        setOffersMode(loadedOffers.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (isCurrent) {
          setOffersMode("error");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setOffersLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isOffersStep, offersMode, preview]);

  const primaryLabel = useMemo(() => {
    if (step.id === "welcome") {
      return "Начать";
    }

    if (step.id === "consent") {
      return "Согласен, продолжить";
    }

    if (step.id === "emergency") {
      return "Продолжить подбор";
    }

    if (step.id === "profile") {
      return selectedProfile ? "Продолжить" : "Выберите вариант";
    }

    if (step.id === "location") {
      return hasLocation ? "Продолжить" : "Укажите район";
    }

    if (step.id === "time") {
      return selectedTime ? "Показать варианты" : "Выберите время";
    }

    return "Изменить параметры";
  }, [hasLocation, selectedProfile, selectedTime, step.id]);

  function canContinue() {
    if (isProfileStep) {
      return Boolean(selectedProfile);
    }

    if (isLocationStep) {
      return hasLocation;
    }

    if (isTimeStep) {
      return Boolean(selectedTime);
    }

    return true;
  }

  function goNext() {
    if (!canContinue()) {
      return;
    }

    setEmergencyNotice(null);
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setEmergencyNotice(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function changeParameters() {
    setSelectedOffer(null);
    setOfferView(null);
    setOffersMode("ready");
    setChatMessages([]);
    setRequestId(null);
    setRequestError(null);
    setStatusNotice(null);
    setStepIndex(TIME_STEP_INDEX);
  }

  function restartSelection() {
    setSelectedProfile(null);
    setSelectedDistrict(null);
    setManualDistrict("");
    setSelectedTime(null);
    setSelectedOffer(null);
    setOfferView(null);
    setOffersMode("ready");
    setRating(null);
    setChatMessages([]);
    setRequestId(null);
    setRequestError(null);
    setStatusNotice(null);
    setStepIndex(PROFILE_STEP_INDEX);
  }

  function openOfferView(offer: Offer, view: OfferView) {
    if (selectedOffer?.id !== offer.id) {
      setChatMessages([]);
      setRequestId(null);
      setRequestError(null);
      setStatusNotice(null);
    }

    setSelectedOffer(offer);
    setOfferView(view);
  }

  function changeOfferView(view: OfferView | null) {
    setOfferView(view);

    if (!view) {
      setSelectedOffer(null);
      setChatMessages([]);
      setRequestId(null);
      setRequestError(null);
      setStatusNotice(null);
    }
  }

  function showSupport(returnView: Exclude<OfferView, "support">) {
    setSupportReturnView(returnView);
    setOfferView("support");
  }

  function sendChatMessage(message: string) {
    setChatMessages((current) => [
      ...current,
      {
        id: `local-chat-${Date.now()}-${current.length}`,
        text: message,
      },
    ]);
  }

  async function submitSelectedRequest() {
    if (!selectedOffer || submitPending) {
      return;
    }

    setRequestError(null);
    setSubmitPending(true);

    try {
      const response = await createMvpRequest({
        offerId: selectedOffer.id,
        district,
        desiredTime: time,
        profile: selectedProfile ?? "Формат уточняется",
      });

      setRequestId(response.requestId);
      setStatusNotice(null);
      setOfferView(offerViewForStatus(response.status));
    } catch {
      setRequestError("Не получилось отправить заявку. Попробуйте ещё раз.");
    } finally {
      setSubmitPending(false);
    }
  }

  async function updateSelectedRequestStatus() {
    if (!requestId) {
      setOfferView("price-lock");
      return;
    }

    try {
      const response = await loadMvpRequestStatus(requestId);

      setOfferView(offerViewForStatus(response.status));
      setStatusNotice(
        response.status === "waiting"
          ? "Медслужба ещё проверяет возможность выезда. Можно обновить статус позже."
          : null,
      );
    } catch {
      setStatusNotice("Не получилось обновить статус. Попробуйте ещё раз.");
    }
  }

  async function handleEmergencyCall(phoneNumber: "103" | "112") {
    if (isLikelyMobileRuntime()) {
      window.location.href = `tel:${phoneNumber}`;
      return;
    }

    try {
      await navigator.clipboard?.writeText(phoneNumber);
      setEmergencyNotice(`Номер ${phoneNumber} скопирован. Наберите его с телефона.`);
    } catch {
      setEmergencyNotice(`Наберите ${phoneNumber} с телефона.`);
    }
  }

  return (
    <main className="app-shell">
      <section
        className={`phone-frame ${isOffersStep ? "phone-frame--offers" : ""}`}
        aria-labelledby="screen-title"
        data-offers-mode={offersMode}
        data-screen={offerView ?? step.id}
      >
        <div className="phone-notch" />
        <header className="screen-header">
          <ProgressDots currentIndex={stepIndex} />
          <span className="screen-header__brand">Надом</span>
        </header>

        <div className={`screen-card ${showOfferSubflow ? "screen-card--subflow" : ""}`}>
          {showOfferSubflow ? (
            <OfferSubflow
              chatMessages={chatMessages}
              district={district}
              offer={selectedOffer}
              onChangeView={changeOfferView}
              onRate={setRating}
              onRestart={restartSelection}
              onSendChatMessage={sendChatMessage}
              onShowSupport={showSupport}
              onSubmit={() => void submitSelectedRequest()}
              onUpdateStatus={() => void updateSelectedRequestStatus()}
              rating={rating}
              requestError={requestError}
              requestId={requestId}
              statusNotice={statusNotice}
              submitPending={submitPending}
              supportReturnView={supportReturnView}
              supportUrl={supportUrl}
              time={time}
              usesApi={usesApi && Boolean(requestId)}
              view={offerView}
            />
          ) : (
            <>
              <NodeIcon variant={step.iconLabel} />
              <p className="eyebrow">{step.eyebrow}</p>
              <h1 id="screen-title">{step.title}</h1>

              {!isOffersStep || offersMode === "ready" ? (
                <div className="screen-copy">
                  {step.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              {step.id === "welcome" && showHowItWorks ? (
                <p className="privacy-note">
                  Вы выбираете район и удобное время, сравниваете варианты и отправляете заявку выбранной медслужбе.
                  Детали, возможность выезда и итоговую стоимость подтверждает медслужба.
                </p>
              ) : null}

              {step.id === "emergency" ? (
                <>
                  <div className="emergency-actions" aria-label="Экстренная помощь">
                    <button className="emergency-link" onClick={() => void handleEmergencyCall("103")} type="button">
                      Позвонить 103
                    </button>
                    <button className="emergency-link" onClick={() => void handleEmergencyCall("112")} type="button">
                      Позвонить 112
                    </button>
                  </div>
                  {emergencyNotice ? <p className="emergency-copy-note">{emergencyNotice}</p> : null}
                </>
              ) : null}

              {isProfileStep ? (
                <div className="choice-list" aria-label="Формат подбора">
                  {PROFILE_OPTIONS.map((option) => (
                    <button
                      className={`choice-chip ${selectedProfile === option ? "choice-chip--selected" : ""}`}
                      key={option}
                      onClick={() => setSelectedProfile(option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}

              {isLocationStep ? (
                <div className="location-panel" aria-label="Район или округ">
                  <div className="choice-list choice-list--districts">
                    {DISTRICT_OPTIONS.map((districtOption) => (
                      <button
                        className={`choice-chip ${selectedDistrict === districtOption ? "choice-chip--selected" : ""}`}
                        key={districtOption}
                        onClick={() => {
                          setSelectedDistrict(districtOption);
                          setManualDistrict("");
                        }}
                        type="button"
                      >
                        {districtOption}
                      </button>
                    ))}
                  </div>

                  <label className="text-field">
                    <span>Или введите район вручную</span>
                    <input
                      autoComplete="off"
                      inputMode="text"
                      onChange={(event) => {
                        setManualDistrict(event.target.value);
                        setSelectedDistrict(null);
                      }}
                      placeholder="например, Арбат или Хамовники"
                      type="text"
                      value={manualDistrict}
                    />
                  </label>

                  <p className="privacy-note">Точный адрес и телефон сейчас не нужны.</p>
                </div>
              ) : null}

              {isTimeStep ? (
                <div className="choice-list" aria-label="Желаемое время выезда">
                  {TIME_OPTIONS.map((option) => (
                    <button
                      className={`choice-chip ${selectedTime === option ? "choice-chip--selected" : ""}`}
                      key={option}
                      onClick={() => setSelectedTime(option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}

              {isOffersStep && offersMode === "ready" ? (
                <div className="offers-list" aria-label="Подходящие варианты">
                  {offersLoading ? <p className="privacy-note">Обновляем варианты…</p> : null}
                  {!offersLoading
                    ? offers.map((offer) => (
                        <OfferCard key={offer.id} offer={offer} onOpen={(view) => openOfferView(offer, view)} />
                      ))
                    : null}
                </div>
              ) : null}

              {isOffersStep && offersMode !== "ready" ? (
                <OffersState
                  mode={offersMode}
                  onChangeParameters={changeParameters}
                  onRetry={() => setOffersMode("ready")}
                />
              ) : null}
            </>
          )}
        </div>

        {!showOfferSubflow && (!isOffersStep || offersMode === "ready") ? (
          <footer className="screen-footer">
            <button
              className="button button--primary"
              disabled={!canContinue()}
              onClick={isOffersStep ? changeParameters : goNext}
              type="button"
            >
              {primaryLabel}
            </button>
            {isFirstStep ? (
              <button className="button button--ghost" onClick={() => setShowHowItWorks((current) => !current)} type="button">
                {showHowItWorks ? "Скрыть описание" : "Как это работает"}
              </button>
            ) : (
              <button className="button button--ghost" onClick={goBack} type="button">
                Назад
              </button>
            )}
          </footer>
        ) : null}
      </section>
    </main>
  );
}
