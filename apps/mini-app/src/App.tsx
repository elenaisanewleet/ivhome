import { useMemo, useState } from "react";

import "./App.css";

type StepId =
  | "welcome"
  | "consent"
  | "emergency"
  | "profile"
  | "location"
  | "time"
  | "offers"
  | "detail"
  | "chat"
  | "confirm"
  | "status";

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
    eyebrow: "Шаг 1 из 10",
    title: "Сначала — согласие",
    body: [
      "Чтобы подобрать варианты, нам нужны район, желаемое время и профиль запроса.",
      "Эти данные передаются только выбранной медслужбе — для подтверждения заявки и условий выезда.",
    ],
    iconLabel: "privacy",
  },
  {
    id: "emergency",
    eyebrow: "Шаг 2 из 10",
    title: "Если состояние острое — 103 или 112",
    body: [
      "Если состояние кажется острым или быстро ухудшается, лучше сразу обратиться за экстренной помощью.",
      "Надом может показать варианты выезда, но детали и возможность помощи подтверждает выбранная медслужба.",
    ],
    iconLabel: "signal",
  },
  {
    id: "profile",
    eyebrow: "Шаг 3 из 10",
    title: "Что нужно подобрать?",
    body: ["Можно выбрать ближайший вариант. Детали уточнит медслужба."],
    iconLabel: "route",
  },
  {
    id: "location",
    eyebrow: "Шаг 4 из 10",
    title: "Где нужен выезд?",
    body: ["Достаточно района или округа.", "Точный адрес сейчас не нужен."],
    iconLabel: "location",
  },
  {
    id: "time",
    eyebrow: "Шаг 5 из 10",
    title: "Когда нужен выезд?",
    body: [
      "Медслужба отдельно подтвердит возможность и время прибытия.",
      "Пока выберите удобный ориентир.",
    ],
    iconLabel: "time",
  },
  {
    id: "offers",
    eyebrow: "Шаг 6 из 10",
    title: "Подходящие варианты",
    body: [
      "Нашли несколько медслужб под ваш район и время.",
      "Сравните ответ, прибытие и ориентировочную стоимость.",
    ],
    iconLabel: "offers",
  },
  {
    id: "detail",
    eyebrow: "Карточка медслужбы",
    title: "Детали варианта",
    body: ["Проверьте условия, SLA и стоимость перед подтверждением."],
    iconLabel: "offers",
  },
  {
    id: "chat",
    eyebrow: "Чат со специалистом",
    title: "Можно уточнить детали",
    body: ["Содержание чата не выводится в Telegram-уведомления."],
    iconLabel: "offers",
  },
  {
    id: "confirm",
    eyebrow: "Подтверждение заявки",
    title: "Почти готово",
    body: ["Передадим заявку только выбранной медслужбе."],
    iconLabel: "offers",
  },
  {
    id: "status",
    eyebrow: "Статус заявки",
    title: "Ожидаем подтверждение",
    body: ["Медслужба проверит возможность выезда и подтвердит условия."],
    iconLabel: "offers",
  },
];

const PROFILE_OPTIONS = [
  "Плохо после алкоголя",
  "Нужно сегодня",
  "Отравление / стало плохо",
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
    conditions: ["связь со специалистом до подтверждения", "стоимость фиксируется после ответа", "точный адрес уточняется выбранной медслужбой"],
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
    conditions: ["подходит для срочного неэкстренного выезда", "можно уточнить условия в чате", "детали услуги подтверждает медслужба"],
  },
  {
    name: "Медслужба Ночь",
    status: "Доступна 24/7",
    zone: "Москва · по зонам выезда",
    responseTime: "обычно до 20 минут",
    arrivalTime: "от 70 минут",
    price: "от 10 500 ₽",
    rating: "4.6",
    note: "Подходит, если нужен поздний или срочный выезд.",
    conditions: ["ночной выезд по зонам", "ответ медслужбы до подтверждения", "финальную стоимость подтверждает медслужба"],
  },
];

function getStep(index: number) {
  return STEPS[index] ?? STEPS[0]!;
}

function getStepIndex(stepId: StepId) {
  return Math.max(
    STEPS.findIndex((step) => step.id === stepId),
    0,
  );
}

function getActiveOffer(offer: Offer | null) {
  return offer ?? OFFERS[0]!;
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
        <span className={`progress-dot ${index <= currentIndex ? "progress-dot--active" : ""}`} key={step.id} />
      ))}
    </div>
  );
}

function OfferSummary({ offer }: { offer: Offer }) {
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
          <span>Ответ медслужбы</span>
          <strong>{offer.responseTime}</strong>
        </div>
        <div className="sla-box sla-box--eta">
          <span>ETA после подтверждения</span>
          <strong>{offer.arrivalTime}</strong>
        </div>
      </div>

      <div className="price-row">
        <span>Ориентировочная стоимость</span>
        <strong>{offer.price}</strong>
      </div>

      <p className="offer-note">{offer.note}</p>
    </article>
  );
}

function OfferCard({
  offer,
  onChat,
  onConfirm,
  onOpen,
}: {
  offer: Offer;
  onChat: (offer: Offer) => void;
  onConfirm: (offer: Offer) => void;
  onOpen: (offer: Offer) => void;
}) {
  return (
    <article className="offer-card">
      <button className="offer-card__header offer-card__header--button" onClick={() => onOpen(offer)} type="button">
        <div>
          <p className="status-label"><span className="status-dot" />{offer.status}</p>
          <h2>{offer.name}</h2>
        </div>
        <span className="rating-pill">⋆ {offer.rating}</span>
      </button>

      <p className="offer-zone">{offer.zone}</p>

      <div className="sla-grid" aria-label="Время ответа и прибытия">
        <div className="sla-box">
          <span>Ответ медслужбы</span>
          <strong>{offer.responseTime}</strong>
        </div>
        <div className="sla-box sla-box--eta">
          <span>ETA после подтверждения</span>
          <strong>{offer.arrivalTime}</strong>
        </div>
      </div>

      <div className="price-row">
        <span>Ориентировочная стоимость</span>
        <strong>{offer.price}</strong>
      </div>

      <p className="offer-note">{offer.note}</p>

      <div className="offer-actions">
        <button className="button button--secondary" onClick={() => onOpen(offer)} type="button">Смотреть детали</button>
        <button className="button button--teal" onClick={() => onChat(offer)} type="button">Написать специалисту</button>
        <button className="button button--primary" onClick={() => onConfirm(offer)} type="button">Подтвердить заявку</button>
      </div>
    </article>
  );
}

function DetailScreen({ offer }: { offer: Offer }) {
  return (
    <div className="offers-list" aria-label="Карточка медслужбы">
      <OfferSummary offer={offer} />
      <div className="privacy-note">
        {offer.conditions.map((condition) => (
          <p key={condition}>• {condition}</p>
        ))}
      </div>
      <p className="privacy-note">Надом не оказывает медицинские услуги. Детали, формат помощи и финальную стоимость подтверждает выбранная медслужба.</p>
    </div>
  );
}

function ChatScreen({ offer }: { offer: Offer }) {
  return (
    <div className="offers-list" aria-label="Чат со специалистом">
      <OfferSummary offer={offer} />
      <div className="privacy-note">
        <p><strong>Специалист медслужбы</strong></p>
        <p>Здравствуйте. Можем уточнить формат выезда, время и условия до подтверждения заявки.</p>
      </div>
      <div className="privacy-note">
        <p><strong>Вы</strong></p>
        <p>Хочу уточнить условия и ориентир по времени.</p>
      </div>
      <div className="choice-list" aria-label="Быстрые вопросы">
        <button className="choice-chip" type="button">Уточнить время прибытия</button>
        <button className="choice-chip" type="button">Уточнить стоимость</button>
        <button className="choice-chip" type="button">Спросить про условия выезда</button>
      </div>
      <p className="privacy-note">Содержание чата не дублируется в Telegram-уведомления.</p>
    </div>
  );
}

function ConfirmScreen({ offer, district, profile, time }: { offer: Offer; district: string; profile: string; time: string }) {
  return (
    <div className="offers-list" aria-label="Подтверждение заявки">
      <OfferSummary offer={offer} />
      <div className="privacy-note">
        <p>Профиль: {profile}</p>
        <p>Район: {district}</p>
        <p>Время: {time}</p>
      </div>
      <p className="privacy-note">После подтверждения заявку увидит только выбранная медслужба. Точный адрес и телефон можно уточнить позже.</p>
    </div>
  );
}

function StatusScreen({ offer }: { offer: Offer }) {
  return (
    <div className="offers-list" aria-label="Статус заявки">
      <OfferSummary offer={offer} />
      <div className="privacy-note">
        <p>• Заявка создана</p>
        <p>• Передали выбранной медслужбе</p>
        <p>• Ожидаем подтверждение</p>
      </div>
      <div className="price-row">
        <span>Price lock</span>
        <strong>после подтверждения</strong>
      </div>
      <p className="privacy-note">Когда медслужба подтвердит стоимость, она будет зафиксирована в заявке.</p>
    </div>
  );
}

export function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [manualDistrict, setManualDistrict] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [emergencyNotice, setEmergencyNotice] = useState<string | null>(null);
  const step = getStep(stepIndex);
  const activeOffer = getActiveOffer(selectedOffer);
  const isFirstStep = stepIndex === 0;
  const isProfileStep = step.id === "profile";
  const isLocationStep = step.id === "location";
  const isTimeStep = step.id === "time";
  const isOffersStep = step.id === "offers";
  const isDetailStep = step.id === "detail";
  const isChatStep = step.id === "chat";
  const isConfirmStep = step.id === "confirm";
  const isStatusStep = step.id === "status";
  const selectedDistrictLabel = selectedDistrict || manualDistrict.trim() || "район не указан";
  const selectedProfileLabel = selectedProfile || "профиль не выбран";
  const selectedTimeLabel = selectedTime || "время не выбрано";
  const hasLocation = Boolean(selectedDistrict || manualDistrict.trim());

  const primaryLabel = useMemo(() => {
    if (step.id === "welcome") return "Начать";
    if (step.id === "consent") return "Согласен, продолжить";
    if (step.id === "emergency") return "Продолжить подбор";
    if (step.id === "profile") return selectedProfile ? "Продолжить" : "Выберите вариант";
    if (step.id === "location") return hasLocation ? "Продолжить" : "Укажите район";
    if (step.id === "time") return selectedTime ? "Показать варианты" : "Выберите время";
    if (step.id === "offers") return "Изменить параметры";
    if (step.id === "detail") return "Подтвердить заявку";
    if (step.id === "chat") return "Пропустить и подтвердить";
    if (step.id === "confirm") return "Отправить заявку";
    return "Новый подбор";
  }, [hasLocation, selectedProfile, selectedTime, step.id]);

  function canContinue() {
    if (isProfileStep) return Boolean(selectedProfile);
    if (isLocationStep) return hasLocation;
    if (isTimeStep) return Boolean(selectedTime);
    return true;
  }

  function goNext() {
    if (!canContinue()) return;

    setEmergencyNotice(null);

    if (isOffersStep) {
      restartFlow();
      return;
    }

    if (isDetailStep || isChatStep) {
      setStepIndex(getStepIndex("confirm"));
      return;
    }

    if (isConfirmStep) {
      setStepIndex(getStepIndex("status"));
      return;
    }

    if (isStatusStep) {
      restartFlow();
      return;
    }

    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setEmergencyNotice(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function restartFlow() {
    setSelectedOffer(null);
    setStepIndex(3);
  }

  function openOffer(offer: Offer, target: "detail" | "chat" | "confirm") {
    setSelectedOffer(offer);
    setStepIndex(getStepIndex(target));
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
              {emergencyNotice ? <p className="privacy-note">{emergencyNotice}</p> : null}
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

          {isOffersStep ? (
            <div className="offers-list" aria-label="Подходящие варианты">
              {OFFERS.map((offer) => (
                <OfferCard
                  key={offer.name}
                  offer={offer}
                  onChat={(nextOffer) => openOffer(nextOffer, "chat")}
                  onConfirm={(nextOffer) => openOffer(nextOffer, "confirm")}
                  onOpen={(nextOffer) => openOffer(nextOffer, "detail")}
                />
              ))}
            </div>
          ) : null}

          {isDetailStep ? <DetailScreen offer={activeOffer} /> : null}
          {isChatStep ? <ChatScreen offer={activeOffer} /> : null}
          {isConfirmStep ? (
            <ConfirmScreen
              district={selectedDistrictLabel}
              offer={activeOffer}
              profile={selectedProfileLabel}
              time={selectedTimeLabel}
            />
          ) : null}
          {isStatusStep ? <StatusScreen offer={activeOffer} /> : null}
        </div>

        <footer className="screen-footer">
          <button className="button button--primary" disabled={!canContinue()} onClick={goNext} type="button">
            {primaryLabel}
          </button>
          {isFirstStep ? (
            <button className="button button--ghost" type="button">Как это работает</button>
          ) : (
            <button className="button button--ghost" onClick={goBack} type="button">Назад</button>
          )}
        </footer>
      </section>
    </main>
  );
}
