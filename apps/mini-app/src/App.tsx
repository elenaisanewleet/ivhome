import { useMemo, useState } from "react";

import "./App.css";

type StepId = "welcome" | "consent" | "emergency" | "profile" | "location" | "time" | "offers" | "details" | "chat" | "confirm" | "status";

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
  conditions: string[];
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
    body: ["Достаточно района или округа.", "Точный адрес сейчас не нужен."],
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
  {
    id: "details",
    eyebrow: "Выбранный вариант",
    title: "Условия выезда",
    body: ["Проверьте условия и задайте вопросы специалисту выбранной медслужбы."],
    iconLabel: "offers",
  },
  {
    id: "chat",
    eyebrow: "Чат с медслужбой",
    title: "Уточните детали",
    body: ["Перед подтверждением заявки специалист выбранной медслужбы ответит на вопросы."],
    iconLabel: "offers",
  },
  {
    id: "confirm",
    eyebrow: "Подтверждение заявки",
    title: "Всё верно?",
    body: ["После отправки медслужба подтвердит возможность выезда и итоговую стоимость."],
    iconLabel: "offers",
  },
  {
    id: "status",
    eyebrow: "Статус заявки",
    title: "Медслужба подтвердила выезд",
    body: ["Следите за этапами заявки. Ответ и ожидаемое прибытие показаны отдельно."],
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

const DISTRICT_OPTIONS = ["ЦАО", "САО", "СВАО", "ВАО", "ЮВАО", "ЮАО", "ЮЗАО", "ЗАО", "СЗАО", "Новая Москва"];

const TIME_OPTIONS = ["Как можно скорее", "Сегодня", "Завтра", "Выбрать время позже"];

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
    conditions: ["Выезд по выбранной зоне", "Итоговая стоимость — после подтверждения", "Детали уточняются в чате"],
  },
  {
    name: "Медслужба Центр",
    status: "Лицензия проверена",
    zone: "ЦАО · ЗАО · ЮЗАО",
    responseTime: "обычно 10–15 минут",
    arrivalTime: "от 55 минут",
    price: "от 9 200 ₽",
    rating: "4.7",
    note: "Детали и возможность выезда подтверждает медслужба.",
    conditions: ["Выезд по выбранной зоне", "Итоговая стоимость — после подтверждения", "Детали уточняются в чате"],
  },
  {
    name: "Медслужба Ночь",
    status: "Принимает заявки сейчас",
    zone: "Москва · по зонам выезда",
    responseTime: "обычно до 20 минут",
    arrivalTime: "от 70 минут",
    price: "от 10 500 ₽",
    rating: "4.6",
    note: "Детали и возможность выезда подтверждает медслужба.",
    conditions: ["Поздний или ближайший выезд", "Итоговая стоимость — после подтверждения", "Детали уточняются в чате"],
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
    <div className="progress-dots" aria-label={`Экран ${currentIndex + 1} из ${STEPS.length}`}>
      {STEPS.map((step, index) => (
        <span className={`progress-dot ${index <= currentIndex ? "progress-dot--active" : ""}`} key={step.id} />
      ))}
    </div>
  );
}

function OfferSummary({ offer }: { offer: Offer }) {
  return (
    <>
      <div className="offer-card__header">
        <div>
          <p className="status-label"><span className="status-dot" />{offer.status}</p>
          <h2>{offer.name}</h2>
        </div>
        <span className="rating-pill">⋆ {offer.rating}</span>
      </div>
      <p className="offer-zone">{offer.zone}</p>
      <div className="sla-grid" aria-label="Время ответа и прибытия">
        <div className="sla-box"><span>Ответ</span><strong>{offer.responseTime}</strong></div>
        <div className="sla-box sla-box--eta"><span>Прибытие</span><strong>{offer.arrivalTime}</strong></div>
      </div>
      <div className="price-row"><span>Ориентировочная стоимость</span><strong>{offer.price}</strong></div>
      <p className="offer-note">{offer.note}</p>
    </>
  );
}

function OfferCard({ offer, onSelect }: { offer: Offer; onSelect: (offer: Offer) => void }) {
  return (
    <article className="offer-card">
      <OfferSummary offer={offer} />
      <div className="offer-actions">
        <button className="button button--teal" onClick={() => onSelect(offer)} type="button">Подробнее и написать</button>
      </div>
    </article>
  );
}

export function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [manualDistrict, setManualDistrict] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [messageSent, setMessageSent] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState<string | null>(null);
  const step = getStep(stepIndex);
  const isFirstStep = stepIndex === 0;
  const isProfileStep = step.id === "profile";
  const isLocationStep = step.id === "location";
  const isTimeStep = step.id === "time";
  const isOffersStep = step.id === "offers";
  const isDetailsStep = step.id === "details";
  const isChatStep = step.id === "chat";
  const isConfirmStep = step.id === "confirm";
  const isStatusStep = step.id === "status";
  const hasLocation = Boolean(selectedDistrict || manualDistrict.trim());
  const locationLabel = selectedDistrict || manualDistrict.trim();

  const primaryLabel = useMemo(() => {
    if (step.id === "welcome") return "Начать";
    if (step.id === "consent") return "Согласен, продолжить";
    if (step.id === "emergency") return "Продолжить подбор";
    if (step.id === "profile") return selectedProfile ? "Продолжить" : "Выберите вариант";
    if (step.id === "location") return hasLocation ? "Продолжить" : "Укажите район";
    if (step.id === "time") return selectedTime ? "Показать варианты" : "Выберите время";
    if (step.id === "details") return "Перейти в чат";
    if (step.id === "chat") return messageSent ? "Перейти к подтверждению" : "Напишите специалисту";
    if (step.id === "confirm") return "Отправить заявку";
    return "Подобрать новый вариант";
  }, [hasLocation, messageSent, selectedProfile, selectedTime, step.id]);

  function canContinue() {
    if (isProfileStep) return Boolean(selectedProfile);
    if (isLocationStep) return hasLocation;
    if (isTimeStep) return Boolean(selectedTime);
    if (isChatStep) return messageSent;
    return true;
  }

  function goNext() {
    if (!canContinue()) return;
    setEmergencyNotice(null);
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setEmergencyNotice(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function selectOffer(offer: Offer) {
    setSelectedOffer(offer);
    setMessageSent(false);
    setStepIndex(STEPS.findIndex(({ id }) => id === "details"));
  }

  function restartFlow() {
    setSelectedOffer(null);
    setMessageSent(false);
    setStepIndex(STEPS.findIndex(({ id }) => id === "profile"));
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
          <div className="screen-copy">{step.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>

          {step.id === "emergency" ? (
            <>
              <div className="emergency-actions" aria-label="Экстренная помощь">
                <button className="emergency-link" onClick={() => void handleEmergencyCall("103")} type="button">Позвонить 103</button>
                <button className="emergency-link" onClick={() => void handleEmergencyCall("112")} type="button">Позвонить 112</button>
              </div>
              {emergencyNotice ? <p className="emergency-copy-note">{emergencyNotice}</p> : null}
            </>
          ) : null}

          {isProfileStep ? <div className="choice-list" aria-label="Профиль помощи">{PROFILE_OPTIONS.map((option) => <button className={`choice-chip ${selectedProfile === option ? "choice-chip--selected" : ""}`} key={option} onClick={() => setSelectedProfile(option)} type="button">{option}</button>)}</div> : null}

          {isLocationStep ? (
            <div className="location-panel" aria-label="Район или округ">
              <div className="choice-list">{DISTRICT_OPTIONS.map((district) => <button className={`choice-chip ${selectedDistrict === district ? "choice-chip--selected" : ""}`} key={district} onClick={() => { setSelectedDistrict(district); setManualDistrict(""); }} type="button">{district}</button>)}</div>
              <label className="text-field"><span>Или введите район вручную</span><input autoComplete="off" inputMode="text" onChange={(event) => { setManualDistrict(event.target.value); setSelectedDistrict(null); }} placeholder="например, Арбат или Хамовники" type="text" value={manualDistrict} /></label>
              <p className="privacy-note">Точный адрес и телефон сейчас не нужны.</p>
            </div>
          ) : null}

          {isTimeStep ? <div className="choice-list" aria-label="Желаемое время выезда">{TIME_OPTIONS.map((option) => <button className={`choice-chip ${selectedTime === option ? "choice-chip--selected" : ""}`} key={option} onClick={() => setSelectedTime(option)} type="button">{option}</button>)}</div> : null}

          {isOffersStep ? <div className="offers-list" aria-label="Подходящие варианты">{OFFERS.map((offer) => <OfferCard key={offer.name} offer={offer} onSelect={selectOffer} />)}</div> : null}

          {isDetailsStep && selectedOffer ? (
            <article className="offer-card offer-card--details">
              <OfferSummary offer={selectedOffer} />
              <ul className="conditions-list">{selectedOffer.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul>
            </article>
          ) : null}

          {isChatStep && selectedOffer ? (
            <section className="chat-panel" aria-label={`Чат с ${selectedOffer.name}`}>
              <div className="chat-panel__header"><strong>{selectedOffer.name}</strong><span>специалист медслужбы</span></div>
              <div className="chat-thread">
                <p className="chat-bubble chat-bubble--incoming">Здравствуйте. Уточните, пожалуйста, подходит ли вам выбранное время. После этого подтвердим детали выезда.</p>
                {messageSent ? <p className="chat-bubble chat-bubble--outgoing">Да, выбранное время подходит. Подтвердите, пожалуйста, детали выезда.</p> : null}
              </div>
              <p className="privacy-note">Не отправляйте в чат точный адрес, телефон или медицинские данные на этом этапе.</p>
              {!messageSent ? <button className="button button--secondary" onClick={() => setMessageSent(true)} type="button">Отправить готовый ответ</button> : <p className="chat-sent-note">Ответ отправлен · специалист увидит сообщение</p>}
            </section>
          ) : null}

          {isConfirmStep && selectedOffer ? (
            <section className="summary-card" aria-label="Подтверждение заявки">
              <p className="summary-card__label">Выбранная медслужба</p><strong>{selectedOffer.name}</strong>
              <dl><div><dt>Район</dt><dd>{locationLabel}</dd></div><div><dt>Время</dt><dd>{selectedTime}</dd></div><div><dt>Стоимость</dt><dd>{selectedOffer.price} · ориентировочно</dd></div></dl>
              <p className="privacy-note">Медслужба подтвердит возможность выезда, итоговую стоимость и дальнейшие шаги.</p>
            </section>
          ) : null}

          {isStatusStep && selectedOffer ? (
            <section className="status-card" aria-label="Статус заявки">
              <div className="price-lock"><span>Стоимость подтверждена</span><strong>{selectedOffer.price.replace("от ", "")}</strong><small>зафиксирована выбранной медслужбой</small></div>
              <div className="sla-grid sla-grid--status"><div className="sla-box"><span>Ответ</span><strong>подтверждено</strong></div><div className="sla-box sla-box--eta"><span>Прибытие</span><strong>{selectedOffer.arrivalTime}</strong></div></div>
              <ol className="status-track"><li className="status-track__item status-track__item--done"><strong>Заявка отправлена</strong><span>Данные переданы выбранной медслужбе</span></li><li className="status-track__item status-track__item--done"><strong>Стоимость зафиксирована</strong><span>Медслужба подтвердила условия</span></li><li className="status-track__item status-track__item--active"><strong>Специалист в пути</strong><span>Ожидаемое прибытие показано выше</span></li></ol>
            </section>
          ) : null}
        </div>

        <footer className="screen-footer">
          {!isOffersStep ? <button className="button button--primary" disabled={!canContinue()} onClick={isStatusStep ? restartFlow : goNext} type="button">{primaryLabel}</button> : null}
          {isFirstStep ? <button className="button button--ghost" type="button">Как это работает</button> : !isStatusStep ? <button className="button button--ghost" onClick={goBack} type="button">Назад</button> : null}
        </footer>
      </section>
    </main>
  );
}
