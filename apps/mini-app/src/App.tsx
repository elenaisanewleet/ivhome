import { useMemo, useState } from "react";

import "./App.css";

type StepId = "welcome" | "consent" | "emergency" | "profile" | "location" | "time";

type Step = {
  id: StepId;
  eyebrow: string;
  title: string;
  body: string[];
  iconLabel: string;
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

const TIME_OPTIONS = [
  "Как можно скорее",
  "Сегодня",
  "Завтра",
  "Выбрать время позже",
];

function getStep(index: number) {
  return STEPS[index] ?? STEPS[0];
}

function NodeIcon({ variant }: { variant: Step["iconLabel"] }) {
  const isEmergency = variant === "signal";

  return (
    <div className={`node-icon ${isEmergency ? "node-icon--emergency" : ""}`} aria-hidden="true">
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

export function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [manualDistrict, setManualDistrict] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const step = getStep(stepIndex);
  const isFirstStep = stepIndex === 0;
  const isProfileStep = step.id === "profile";
  const isLocationStep = step.id === "location";
  const isTimeStep = step.id === "time";
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

    return selectedTime ? "Показать варианты" : "Выберите время";
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

    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  return (
    <main className="app-shell">
      <section className="phone-frame" aria-labelledby="screen-title">
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
            <div className="emergency-actions" aria-label="Экстренная помощь">
              <a className="emergency-link" href="tel:103">Позвонить 103</a>
              <a className="emergency-link" href="tel:112">Позвонить 112</a>
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
