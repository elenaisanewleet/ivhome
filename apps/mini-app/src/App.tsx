import { useMemo, useState } from "react";

import "./App.css";
import "./App.mobile.css";
import "./App.chat.css";

type StepId = "welcome" | "consent" | "emergency" | "profile" | "location" | "time" | "offers";
type CardView = "offers" | "details" | "chat" | "confirmation" | "status" | "price-lock";

type Step = {
  id: StepId;
  eyebrow: string;
  title: string;
  body: string[];
  iconLabel: string;
};

type Offer = {
  id: string;
  name: string;
  status: string;
  zone: string;
  responseTime: string;
  arrivalTime: string;
  price: string;
  rating: string;
  condition: string;
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
    id: "north",
    name: "Медслужба Север",
    status: "Лицензия проверена",
    zone: "САО · СЗАО · рядом",
    responseTime: "обычно 5–10 минут",
    arrivalTime: "от 40 минут",
    price: "от 8 500 ₽",
    rating: "4.8",
    condition: "Выезд после подтверждения специалистом медслужбы.",
    note: "Детали и возможность выезда подтверждает медслужба.",
  },
  {
    id: "center",
    name: "Медслужба Центр",
    status: "Лицензия проверена",
    zone: "ЦАО · ЗАО · ЮЗАО",
    responseTime: "обычно 10–15 минут",
    arrivalTime: "от 55 минут",
    price: "от 9 200 ₽",
    rating: "4.7",
    condition: "Доступность ближайшего времени уточнит медслужба.",
    note: "Стоимость фиксируется после подтверждения медслужбой.",
  },
  {
    id: "night",
    name: "Медслужба Ночь",
    status: "Принимает заявки сейчас",
    zone: "Москва · по зонам выезда",
    responseTime: "обычно до 20 минут",
    arrivalTime: "от 70 минут",
    price: "от 10 500 ₽",
    rating: "4.6",
    condition: "Возможность позднего выезда уточнит медслужба.",
    note: "Подходит, если нужен поздний или ближайший выезд.",
  },
];

function getStep(index: number) {
  return STEPS[index] ?? STEPS[0]!;
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
    </>
  );
}

function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: (offer: Offer, view: CardView) => void }) {
  return (
    <article className="offer-card">
      <OfferSummary offer={offer} />
      <p className="offer-note">{offer.note}</p>

      <div className="offer-actions">
        <button className="button button--secondary" onClick={() => onOpen(offer, "details")} type="button">Смотреть детали</button>
        <button className="button button--teal" onClick={() => onOpen(offer, "chat")} type="button">Написать специалисту</button>
        <button className="button button--primary" onClick={() => onOpen(offer, "confirmation")} type="button">Подтвердить заявку</button>
      </div>
    </article>
  );
}

function FlowIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <>
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="screen-title">{title}</h1>
      <div className="screen-copy">{children}</div>
    </>
  );
}

function OfferDetails({ offer, onConfirm, onOpenChat }: { offer: Offer; onConfirm: () => void; onOpenChat: () => void }) {
  return (
    <>
      <FlowIntro eyebrow="Карточка медслужбы" title={offer.name}>
        <p>Проверьте условия. Перед подтверждением можно задать вопрос специалисту выбранной медслужбы.</p>
      </FlowIntro>
      <article className="offer-card offer-card--details">
        <OfferSummary offer={offer} />
        <dl className="detail-list">
          <div><dt>Условия</dt><dd>{offer.condition}</dd></div>
          <div><dt>Район выезда</dt><dd>{offer.zone}</dd></div>
        </dl>
        <p className="offer-note">Детали и возможность выезда подтверждает медслужба.</p>
        <div className="offer-actions">
          <button className="button button--teal" onClick={onOpenChat} type="button">Написать специалисту</button>
          <button className="button button--secondary" onClick={onConfirm} type="button">Подтвердить заявку</button>
        </div>
      </article>
    </>
  );
}

function SpecialistChat({ offer }: { offer: Offer }) {
  // Privacy boundary: real chat content must not be copied into Telegram notifications.
  return (
    <>
      <FlowIntro eyebrow={offer.name} title="Связь со специалистом">
        <p>Можно уточнить формат помощи, время, условия или личный вопрос. Этот шаг можно пропустить.</p>
        <p>Детали и возможность выезда подтверждает выбранная медслужба.</p>
      </FlowIntro>
      <section className="chat-card" aria-label="Чат со специалистом выбранной медслужбы">
        <p className="chat-card__date">Пример диалога</p>
        <div className="chat-bubble chat-bubble--user">
          <span>Можно уточнить, когда реально сможете приехать?</span>
        </div>
        <div className="chat-bubble chat-bubble--service">
          <strong>Специалист медслужбы</strong>
          <span>Да, проверим доступность по вашему району и подтвердим время.</span>
        </div>
        <div className="chat-bubble chat-bubble--user">
          <span>Хочу сначала понять условия и стоимость.</span>
        </div>
        <p className="chat-card__note">Макет чата: сообщения не отправляются.</p>
      </section>
      <label className="chat-input">
        <span>Сообщение специалисту</span>
        <input disabled placeholder="Напишите вопрос специалисту…" type="text" />
      </label>
    </>
  );
}

function RequestConfirmation({ chatUsed, offer }: { chatUsed: boolean; offer: Offer }) {
  return (
    <>
      <FlowIntro eyebrow="Подтверждение заявки" title="Проверьте заявку">
        <p>После отправки выбранная медслужба подтвердит возможность выезда, итоговую стоимость и ожидаемое время прибытия.</p>
      </FlowIntro>
      <section className="request-card">
        <p className="request-card__service">{offer.name}</p>
        <dl className="request-list">
          <div><dt>Район</dt><dd>{offer.zone}</dd></div>
          <div><dt>Время</dt><dd>Как можно скорее</dd></div>
          <div><dt>Стоимость</dt><dd>{offer.price}</dd></div>
          <div><dt>Связь</dt><dd>{chatUsed ? "Чат со специалистом" : "Чат пропущен"}</dd></div>
        </dl>
        <p className="privacy-note">Точный адрес и контактные данные можно уточнить позже, если они понадобятся выбранной медслужбе.</p>
      </section>
    </>
  );
}

function RequestStatus({ offer }: { offer: Offer }) {
  return (
    <>
      <FlowIntro eyebrow="Статус заявки" title="Заявка передана медслужбе">
        <p>{offer.name} проверяет возможность выезда. Ожидайте подтверждение в приложении.</p>
      </FlowIntro>
      <section className="status-card">
        <div className="status-track">
          <div className="status-track__item status-track__item--done"><span>1</span><div><strong>Заявка передана</strong><small>Данные отправлены выбранной медслужбе</small></div></div>
          <div className="status-track__item status-track__item--current"><span>2</span><div><strong>Ожидаем ответ</strong><small>{offer.responseTime}</small></div></div>
          <div className="status-track__item"><span>3</span><div><strong>Подтверждение выезда</strong><small>Стоимость и прибытие появятся отдельно</small></div></div>
        </div>
        <p className="privacy-note">Пока медслужба подтверждает заявку, можно вернуться в чат.</p>
      </section>
    </>
  );
}

function PriceLockPreview({ offer }: { offer: Offer }) {
  return (
    <>
      <FlowIntro eyebrow="Фиксация стоимости" title="Стоимость подтверждена">
        <p>Так будет выглядеть статус после подтверждения выбранной медслужбой.</p>
      </FlowIntro>
      <section className="price-lock-card">
        <p className="status-label"><span className="status-dot" />Выезд подтверждён</p>
        <p className="price-lock-card__service">{offer.name}</p>
        <div className="price-lock-card__amount"><span>Итоговая стоимость</span><strong>{offer.price.replace("от ", "")}</strong></div>
        <p className="lock-note">Стоимость зафиксирована выбранной медслужбой.</p>
        <div className="sla-grid sla-grid--flush" aria-label="Подтверждённое время ответа и прибытия">
          <div className="sla-box"><span>Ответ</span><strong>подтверждено</strong></div>
          <div className="sla-box sla-box--eta"><span>Прибытие</span><strong>около 19:40</strong></div>
        </div>
      </section>
    </>
  );
}

export function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [manualDistrict, setManualDistrict] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [cardView, setCardView] = useState<CardView>("offers");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [hasOpenedSpecialistChat, setHasOpenedSpecialistChat] = useState(false);
  const step = getStep(stepIndex);
  const isFirstStep = stepIndex === 0;
  const isProfileStep = step.id === "profile";
  const isLocationStep = step.id === "location";
  const isTimeStep = step.id === "time";
  const isOffersStep = step.id === "offers";
  const hasLocation = Boolean(selectedDistrict || manualDistrict.trim());

  const primaryLabel = useMemo(() => {
    if (step.id === "welcome") return "Начать";
    if (step.id === "consent") return "Согласен, продолжить";
    if (step.id === "emergency") return "Продолжить подбор";
    if (step.id === "profile") return selectedProfile ? "Продолжить" : "Выберите вариант";
    if (step.id === "location") return hasLocation ? "Продолжить" : "Укажите район";
    if (step.id === "time") return selectedTime ? "Показать варианты" : "Выберите время";
    return "Изменить параметры";
  }, [hasLocation, selectedProfile, selectedTime, step.id]);

  function canContinue() {
    if (isProfileStep) return Boolean(selectedProfile);
    if (isLocationStep) return hasLocation;
    if (isTimeStep) return Boolean(selectedTime);
    return true;
  }

  function goNext() {
    if (!canContinue()) return;
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function restartFlow() {
    setCardView("offers");
    setSelectedOffer(null);
    setHasOpenedSpecialistChat(false);
    setStepIndex(3);
  }

  function openOffer(offer: Offer, view: CardView) {
    setSelectedOffer(offer);
    setHasOpenedSpecialistChat(view === "chat");
    setCardView(view);
  }

  function openSpecialistChat() {
    setHasOpenedSpecialistChat(true);
    setCardView("chat");
  }

  function goBackInCardFlow() {
    if (cardView === "details") {
      setSelectedOffer(null);
      setHasOpenedSpecialistChat(false);
      setCardView("offers");
      return;
    }

    if (cardView === "confirmation") {
      setCardView(hasOpenedSpecialistChat ? "chat" : "details");
      return;
    }

    if (cardView === "status") {
      setCardView("confirmation");
      return;
    }

    const previousView: Partial<Record<CardView, CardView>> = {
      chat: "details",
      "price-lock": "status",
    };

    setCardView(previousView[cardView] ?? "offers");
  }

  function advanceCardFlow() {
    if (cardView === "details") {
      openSpecialistChat();
      return;
    }

    const nextView: Partial<Record<CardView, CardView>> = {
      chat: "confirmation",
      confirmation: "status",
      status: "price-lock",
    };

    setCardView(nextView[cardView] ?? cardView);
  }

  function cardFlowPrimaryLabel() {
    const labels: Record<Exclude<CardView, "offers">, string> = {
      details: "Написать специалисту",
      chat: "Перейти к подтверждению",
      confirmation: "Отправить заявку",
      status: "Показать фиксацию стоимости",
      "price-lock": "Вернуться к вариантам",
    };

    return cardView === "offers" ? "Изменить параметры" : labels[cardView];
  }

  function handleEmergencyCall(phoneNumber: "103" | "112") {
    window.location.href = `tel:${phoneNumber}`;
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
          {!isOffersStep || cardView === "offers" ? (
            <>
              <NodeIcon variant={step.iconLabel} />
              <p className="eyebrow">{step.eyebrow}</p>
              <h1 id="screen-title">{step.title}</h1>
              <div className="screen-copy">
                {step.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </>
          ) : null}

          {step.id === "emergency" ? (
            <div className="emergency-actions" aria-label="Экстренная помощь">
              <button className="emergency-link" onClick={() => handleEmergencyCall("103")} type="button">Позвонить 103</button>
              <button className="emergency-link" onClick={() => handleEmergencyCall("112")} type="button">Позвонить 112</button>
            </div>
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

          {isOffersStep && cardView === "offers" ? (
            <div className="offers-list" aria-label="Подходящие варианты">
              {OFFERS.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onOpen={openOffer} />
              ))}
            </div>
          ) : null}

          {isOffersStep && selectedOffer && cardView === "details" ? (
            <OfferDetails
              offer={selectedOffer}
              onConfirm={() => setCardView("confirmation")}
              onOpenChat={openSpecialistChat}
            />
          ) : null}
          {isOffersStep && selectedOffer && cardView === "chat" ? <SpecialistChat offer={selectedOffer} /> : null}
          {isOffersStep && selectedOffer && cardView === "confirmation" ? <RequestConfirmation chatUsed={hasOpenedSpecialistChat} offer={selectedOffer} /> : null}
          {isOffersStep && selectedOffer && cardView === "status" ? <RequestStatus offer={selectedOffer} /> : null}
          {isOffersStep && selectedOffer && cardView === "price-lock" ? <PriceLockPreview offer={selectedOffer} /> : null}
        </div>

        <footer className="screen-footer">
          {isOffersStep ? (
            cardView === "chat" ? (
              <>
                <button className="button button--teal" onClick={() => setCardView("confirmation")} type="button">Продолжить к подтверждению</button>
                <button className="button button--secondary" onClick={() => setCardView("confirmation")} type="button">Пропустить чат</button>
                <button className="button button--ghost" onClick={() => setCardView("details")} type="button">Назад к карточке</button>
              </>
            ) : (
              <>
                <button
                  className="button button--primary"
                  onClick={cardView === "offers" ? restartFlow : cardView === "price-lock" ? () => { setCardView("offers"); setSelectedOffer(null); setHasOpenedSpecialistChat(false); } : advanceCardFlow}
                  type="button"
                >
                  {cardFlowPrimaryLabel()}
                </button>
                <button className="button button--ghost" onClick={cardView === "offers" ? goBack : goBackInCardFlow} type="button">Назад</button>
              </>
            )
          ) : (
            <>
              <button className="button button--primary" disabled={!canContinue()} onClick={goNext} type="button">{primaryLabel}</button>
              {isFirstStep ? (
                <button className="button button--ghost" type="button">Как это работает</button>
              ) : (
                <button className="button button--ghost" onClick={goBack} type="button">Назад</button>
              )}
            </>
          )}
        </footer>
      </section>
    </main>
  );
}
