import { useMemo, useState } from "react";

import "./App.css";

type StepId = "welcome" | "consent" | "emergency" | "profile" | "location" | "time" | "offers";

type OfferView = "details" | "chat" | "confirmation" | "status" | "price-lock";

type Step = {
  id: StepId;
  eyebrow: string;
  title: string;
  body: string[];
  iconLabel: string;
};

type Offer = {
  name: string;
  status: string;
  zone: string;
  responseTime: string;
  arrivalTime: string;
  price: string;
  rating: string;
  note: string;
};

const STEPS: Step[] = [
  {
    id: "welcome",
    eyebrow: "Надом 🫧",
    title: "Подберём медслужбу с выездом на дом",
    body: [
      "Приватно, быстро и без лишних звонков.",
      "Вы выбираете вариант по времени, стоимости и условиям. Детали подтверждает выбранная медслужба.",
    ],
    iconLabel: "welcome",
  },
  {
    id: "consent",
    eyebrow: "Шаг 1 из 6",
    title: "Сначала — согласие",
    body: [
      "Чтобы подобрать варианты, нам нужны район, желаемое время и профиль запроса.",
      "Эти данные передаются только выбранной медслужбе — для подтверждения заявки и условий выезда.",
    ],
    iconLabel: "privacy",
  },
  {
    id: "emergency",
    eyebrow: "Шаг 2 из 6",
    title: "Если состояние острое — 103 или 112",
    body: [
      "Если состояние кажется острым или быстро ухудшается, лучше сразу обратиться за экстренной помощью.",
      "Надом может показать варианты выезда, но детали и возможность помощи подтверждает выбранная медслужба.",
    ],
    iconLabel: "signal",
  },
  {
    id: "profile",
    eyebrow: "Шаг 3 из 6",
    title: "Что нужно подобрать?",
    body: ["Можно выбрать ближайший вариант. Детали уточнит медслужба."],
    iconLabel: "route",
  },
  {
    id: "location",
    eyebrow: "Шаг 4 из 6",
    title: "Где нужен выезд?",
    body: [
      "Достаточно района или округа.",
      "Точный адрес сейчас не нужен.",
    ],
    iconLabel: "location",
  },
  {
    id: "time",
    eyebrow: "Шаг 5 из 6",
    title: "Когда нужен выезд?",
    body: [
      "Медслужба отдельно подтвердит возможность и время прибытия.",
      "Пока выберите удобный ориентир.",
    ],
    iconLabel: "time",
  },
  {
    id: "offers",
    eyebrow: "Шаг 6 из 6",
    title: "Подходящие варианты",
    body: [
      "Нашли несколько медслужб под ваш район и время.",
      "Сравните ответ, прибытие и ориентировочную стоимость.",
    ],
    iconLabel: "offers",
  },
];

const PROFILE_OPTIONS = [
  "После алкоголя / праздника",
  "Нужен выезд сегодня",
  "Интоксикация / самочувствие",
  "Плановый выезд",
  "Уточнить с медслужбой",
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

const TIME_OPTIONS = [
  "Как можно скорее",
  "Сегодня",
  "Завтра",
  "Выбрать время позже",
];

const OFFERS: Offer[] = [
  {
    name: "Медслужба Север",
    status: "Лицензия проверена",
    zone: "САО · СЗАО · рядом",
    responseTime: "обычно 5–10 минут",
    arrivalTime: "от 40 минут",
    price: "от 8 500 ₽",
    rating: "4.8",
    note: "Детали и возможность выезда подтверждает медслужба.",
  },
  {
    name: "Медслужба Центр",
    status: "Лицензия проверена",
    zone: "ЦАО · ЗАО · ЮЗАО",
    responseTime: "обычно 10–15 минут",
    arrivalTime: "от 55 минут",
    price: "от 9 200 ₽",
    rating: "4.7",
    note: "Стоимость фиксируется после подтверждения медслужбой.",
  },
  {
    name: "Медслужба Ночь",
    status: "Принимает заявки сейчас",
    zone: "Москва · по зонам выезда",
    responseTime: "обычно до 20 минут",
    arrivalTime: "от 70 минут",
    price: "от 10 500 ₽",
    rating: "4.6",
    note: "Подходит, если нужен поздний или ближайший выезд.",
  },
];

function getStep(index: number) {
  return STEPS[index] ?? STEPS[0]!;
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
    <div className={`node-icon ${isEmergency ? "node-icon--emergency" : ""} ${isOffers ? "node-icon--offers" : ""}`} aria-hidden="true">
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
    <div className="progress-dots" aria-label={`Шаг ${currentIndex + 1} из ${STEPS.length}`}>
      {STEPS.map((step, index) => (
        <span
          className={`progress-dot ${index <= currentIndex ? "progress-dot--active" : ""}`}
          key={step.id}
        />
      ))}
    </div>
  );
}

function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: (view: OfferView) => void }) {
  return (
    <article className="offer-card">
      <div className="offer-card__header">
        <div>
          <p className="status-label"><span className="status-dot" />{offer.status}</p>
          <h2>{offer.name}</h2>
        </div>
        <span className="rating-pill">⋆ {offer.rating}</span>
      </div>

      <p className="offer-zone">{offer.zone}</p>

      <div className="sla-grid" aria-label="Время ответа и прибытия">
        <div className="sla-box">
          <span>Ответ</span>
          <strong>{offer.responseTime}</strong>
        </div>
        <div className="sla-box sla-box--eta">
          <span>Прибытие</span>
          <strong>{offer.arrivalTime}</strong>
        </div>
      </div>

      <div className="price-row">
        <span>Ориентировочная стоимость</span>
        <strong>{offer.price}</strong>
      </div>

      <p className="offer-note">{offer.note}</p>

      <div className="offer-actions">
        <button className="button button--secondary" onClick={() => onOpen("details")} type="button">Смотреть детали</button>
        <button className="button button--teal" onClick={() => onOpen("chat")} type="button">Написать специалисту</button>
        <button className="button button--primary" onClick={() => onOpen("confirmation")} type="button">Подтвердить заявку</button>
      </div>
    </article>
  );
}

function OfferSubflow({ offer, view, onBack, onNext }: { offer: Offer; view: OfferView; onBack: () => void; onNext: () => void }) {
  const content = {
    details: {
      eyebrow: "Детали предложения",
      title: offer.name,
      body: "Детали и возможность выезда подтверждает выбранная медслужба.",
      action: "Написать специалисту",
    },
    chat: {
      eyebrow: "Чат с медслужбой",
      title: "Уточните детали",
      body: "Специалист выбранной медслужбы ответит в чате и подтвердит условия выезда.",
      action: "Перейти к подтверждению",
    },
    confirmation: {
      eyebrow: "Подтверждение заявки",
      title: "Проверьте выбранный вариант",
      body: "После отправки заявки медслужба подтвердит возможность выезда и итоговую стоимость.",
      action: "Отправить заявку",
    },
    status: {
      eyebrow: "Статус заявки",
      title: "Заявка передана медслужбе",
      body: "Ожидаем подтверждение выбранной медслужбы. Ответ и ожидаемое прибытие уточняются отдельно.",
      action: "Показать стоимость",
    },
    "price-lock": {
      eyebrow: "Стоимость подтверждена",
      title: "Стоимость зафиксирована медслужбой",
      body: "Итоговая стоимость подтверждена выбранной медслужбой.",
      action: "Вернуться к предложениям",
    },
  } satisfies Record<OfferView, { eyebrow: string; title: string; body: string; action: string }>;
  const current = content[view];

  return (
    <section className="offer-subflow" aria-label={current.eyebrow}>
      <p className="eyebrow">{current.eyebrow}</p>
      <h2>{current.title}</h2>
      <p>{current.body}</p>
      {view === "details" ? (
        <div className="subflow-summary">
          <span>{offer.zone}</span>
          <strong>{offer.price}</strong>
        </div>
      ) : null}
      {view === "chat" ? <div className="chat-placeholder">Чат со специалистом выбранной медслужбы</div> : null}
      <div className="subflow-actions">
        <button className="button button--primary" onClick={onNext} type="button">{current.action}</button>
        <button className="button button--ghost" onClick={onBack} type="button">Назад</button>
      </div>
    </section>
  );
}

export function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [manualDistrict, setManualDistrict] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [emergencyNotice, setEmergencyNotice] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerView, setOfferView] = useState<OfferView | null>(null);
  const step = getStep(stepIndex);
  const isFirstStep = stepIndex === 0;
  const isProfileStep = step.id === "profile";
  const isLocationStep = step.id === "location";
  const isTimeStep = step.id === "time";
  const isOffersStep = step.id === "offers";
  const hasLocation = Boolean(selectedDistrict || manualDistrict.trim());

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

  function restartFlow() {
    setStepIndex(3);
  }

  function openOfferView(offer: Offer, view: OfferView) {
    setSelectedOffer(offer);
    setOfferView(view);
  }

  function goBackFromOfferView() {
    if (offerView === "chat") {
      setOfferView("details");
      return;
    }

    if (offerView === "confirmation") {
      setOfferView("chat");
      return;
    }

    if (offerView === "status") {
      setOfferView("confirmation");
      return;
    }

    if (offerView === "price-lock") {
      setOfferView("status");
      return;
    }

    setSelectedOffer(null);
    setOfferView(null);
  }

  function goNextFromOfferView() {
    if (offerView === "details") {
      setOfferView("chat");
      return;
    }

    if (offerView === "chat") {
      setOfferView("confirmation");
      return;
    }

    if (offerView === "confirmation") {
      setOfferView("status");
      return;
    }

    if (offerView === "status") {
      setOfferView("price-lock");
      return;
    }

    setSelectedOffer(null);
    setOfferView(null);
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
      <section className={`phone-frame ${isOffersStep ? "phone-frame--offers" : ""}`} aria-labelledby="screen-title">
        <div className="phone-notch" />
        <header className="screen-header">
          <ProgressDots currentIndex={stepIndex} />
          <span className="screen-header__brand">Надом</span>
        </header>

        <div className="screen-card">
          <NodeIcon variant={step.iconLabel} />

          <p className="eyebrow">{step.eyebrow}</p>
          <h1 id="screen-title">{step.title}</h1>

          <div className="screen-copy">
            {step.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {step.id === "emergency" ? (
            <>
              <div className="emergency-actions" aria-label="Экстренная помощь">
                <button className="emergency-link" onClick={() => void handleEmergencyCall("103")} type="button">Позвонить 103</button>
                <button className="emergency-link" onClick={() => void handleEmergencyCall("112")} type="button">Позвонить 112</button>
              </div>
              {emergencyNotice ? <p className="emergency-copy-note">{emergencyNotice}</p> : null}
            </>
          ) : null}

          {isProfileStep ? (
            <div className="choice-list" aria-label="Профиль помощи">
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
              <div className="choice-list">
                {DISTRICT_OPTIONS.map((district) => (
                  <button
                    className={`choice-chip ${selectedDistrict === district ? "choice-chip--selected" : ""}`}
                    key={district}
                    onClick={() => {
                      setSelectedDistrict(district);
                      setManualDistrict("");
                    }}
                    type="button"
                  >
                    {district}
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

          {isOffersStep && selectedOffer && offerView ? (
            <OfferSubflow offer={selectedOffer} onBack={goBackFromOfferView} onNext={goNextFromOfferView} view={offerView} />
          ) : null}

          {isOffersStep && !offerView ? (
            <div className="offers-list" aria-label="Подходящие варианты">
              {OFFERS.map((offer) => (
                <OfferCard key={offer.name} offer={offer} onOpen={(view) => openOfferView(offer, view)} />
              ))}
            </div>
          ) : null}
        </div>

        {!offerView ? <footer className="screen-footer">
          <button
            className="button button--primary"
            disabled={!canContinue()}
            onClick={isOffersStep ? restartFlow : goNext}
            type="button"
          >
            {primaryLabel}
          </button>
          {isFirstStep ? (
            <button className="button button--ghost" type="button">Как это работает</button>
          ) : (
            <button className="button button--ghost" onClick={goBack} type="button">Назад</button>
          )}
        </footer> : null}
      </section>
    </main>
  );
}
