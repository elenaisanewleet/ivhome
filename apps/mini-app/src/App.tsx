import { useMemo, useState } from "react";

import "./App.css";

type StepId = "welcome" | "consent" | "emergency" | "profile";

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
    eyebrow: "Шаг 1 из 4",
    title: "Сначала — согласие",
    body: [
      "Чтобы подобрать варианты, нам нужны район, желаемое время и профиль запроса.",
      "Эти данные передаются только выбранной медслужбе — для подтверждения заявки и условий выезда.",
    ],
    iconLabel: "privacy",
  },
  {
    id: "emergency",
    eyebrow: "Шаг 2 из 4",
    title: "Если состояние острое — 103 или 112",
    body: [
      "Если состояние кажется острым или быстро ухудшается, лучше сразу обратиться за экстренной помощью.",
      "Надом может показать варианты выезда, но детали и возможность помощи подтверждает выбранная медслужба.",
    ],
    iconLabel: "signal",
  },
  {
    id: "profile",
    eyebrow: "Шаг 3 из 4",
    title: "Что нужно подобрать?",
    body: [
      "Можно выбрать ближайший вариант. Детали уточнит медслужба.",
    ],
    iconLabel: "route",
  },
];

const PROFILE_OPTIONS = [
  "Плохо после алкоголя",
  "Нужно сегодня",
  "Отравление / стало плохо",
  "Плановый выезд",
  "Уточнить с медслужбой",
];

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
  const step = STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isProfileStep = step.id === "profile";

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

    return selectedProfile ? "Продолжить" : "Выберите вариант";
  }, [selectedProfile, step.id]);

  function goNext() {
    if (isProfileStep && !selectedProfile) {
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
        </div>

        <footer className="screen-footer">
          <button className="button button--primary" disabled={isProfileStep && !selectedProfile} onClick={goNext} type="button">
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
