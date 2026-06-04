import { useEffect, useMemo, useState } from "react";

import "./App.css";
import "./App.mobile.css";
import "./App.chat.css";
import {
  getChatMessages as getChatMessagesApi,
  getRequestStatus,
  isApiConfigured,
  loadOffers,
  readSupportUrl,
  sendChatMessage as sendChatMessageApi,
  submitRequest,
} from "./api";
import {
  DISTRICT_OPTIONS,
  FALLBACK_OFFERS,
  OFFERS_STEP_INDEX,
  PROFILE_OPTIONS,
  PROFILE_STEP_INDEX,
  STEPS,
  TIME_OPTIONS,
  TIME_STEP_INDEX,
} from "./data";
import { OfferCard, OfferCardSkeleton } from "./OfferCard";
import { OfferSubflow, OffersState } from "./OfferSubflow";
import { haptic, hapticNotice, initTelegram, isInsideTelegram } from "./telegram";
import type { Offer, OfferView, OffersMode, PreviewId } from "./types";
import { FaqAccordion, NodeIcon, ProgressDots } from "./ui";
import { useTelegramButtons } from "./useTelegramButtons";
import {
  getStep,
  isLikelyMobileRuntime,
  isOfferView,
  offerViewForStatus,
  readPreviewId,
} from "./utils";

export function App() {
  const [preview] = useState<PreviewId | null>(() => readPreviewId());
  const startsOnOffers = preview !== null;
  const initialOfferView = isOfferView(preview) ? preview : null;
  const [stepIndex, setStepIndex] = useState(startsOnOffers ? OFFERS_STEP_INDEX : 0);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(startsOnOffers ? "САО" : null);
  const [manualDistrict, setManualDistrict] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(startsOnOffers ? "Сегодня" : null);
  const [emergencyNotice, setEmergencyNotice] = useState<string | null>(null);
  const [offersMode, setOffersMode] = useState<OffersMode>(
    preview === "empty" || preview === "error" ? preview : "ready",
  );
  const [offers, setOffers] = useState<Offer[]>(FALLBACK_OFFERS);
  const [offersLoading, setOffersLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(initialOfferView ? FALLBACK_OFFERS[0]! : null);
  const [offerView, setOfferView] = useState<OfferView | null>(initialOfferView);
  const [supportReturnView, setSupportReturnView] = useState<Exclude<OfferView, "support">>("completed");
  const [rating, setRating] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<import("./types").ChatMessage[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitPending, setSubmitPending] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [inTelegram] = useState(() => isInsideTelegram());

  const step = getStep(stepIndex);
  const isFirstStep = stepIndex === 0;
  const isProfileStep = step.id === "profile";
  const isLocationStep = step.id === "location";
  const isTimeStep = step.id === "time";
  const isOffersStep = step.id === "offers";
  const hasLocation = Boolean(selectedDistrict || manualDistrict.trim());
  const district = selectedDistrict || manualDistrict.trim() || "Район уточняется";
  const time = selectedTime || "Время уточняется";
  const showOfferSubflow = Boolean(isOffersStep && selectedOffer && offerView);
  const supportUrl = readSupportUrl();
  const usesApi = isApiConfigured();

  useEffect(() => {
    initTelegram();
  }, []);

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
    switch (step.id) {
      case "welcome":
        return "Начать";
      case "consent":
        return "Согласен, продолжить";
      case "emergency":
        return "Продолжить подбор";
      case "profile":
        return selectedProfile ? "Продолжить" : "Выберите вариант";
      case "location":
        return hasLocation ? "Продолжить" : "Укажите район";
      case "time":
        return selectedTime ? "Показать варианты" : "Выберите время";
      default:
        return "Изменить параметры";
    }
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

    haptic("light");
    setEmergencyNotice(null);
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    haptic("soft");
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

  async function sendChatMessage(message: string) {
    if (requestId && isApiConfigured()) {
      try {
        const sent = await sendChatMessageApi(requestId, message, "USER");

        setChatMessages((current) => [...current, { id: sent.id, text: sent.body, author: "user" }]);

        return;
      } catch {
        // fall through to local optimistic update
      }
    }

    setChatMessages((current) => [
      ...current,
      { id: `local-${Date.now()}-${current.length}`, text: message, author: "user" },
    ]);
  }

  async function submitSelectedRequest() {
    if (!selectedOffer || submitPending) {
      return;
    }

    setRequestError(null);
    setSubmitPending(true);

    try {
      const response = await submitRequest({
        offerId: selectedOffer.id,
        district,
        desiredTime: time,
        profile: selectedProfile ?? "Формат уточняется",
      });

      setRequestId(response.id);
      setStatusNotice(null);
      setOfferView(offerViewForStatus(response.status));
      hapticNotice("success");
    } catch {
      setRequestError("Не получилось отправить заявку. Попробуйте ещё раз.");
      hapticNotice("error");
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
      const response = await getRequestStatus(requestId);

      setOfferView(offerViewForStatus(response.status));
      setStatusNotice(
        response.status === "WAITING"
          ? "Медслужба ещё проверяет возможность выезда. Можно обновить статус позже."
          : null,
      );
    } catch {
      setStatusNotice("Не получилось обновить статус. Попробуйте ещё раз.");
    }
  }

  useEffect(() => {
    if (offerView !== "chat" || !requestId || !isApiConfigured()) {
      return;
    }

    getChatMessagesApi(requestId)
      .then((msgs) => {
        setChatMessages(
          msgs.map((m) => ({
            id: m.id,
            text: m.body,
            author: m.actorType === "USER" ? ("user" as const) : ("service" as const),
          })),
        );
      })
      .catch(() => {
        /* silent — chat still works locally */
      });
  }, [offerView, requestId]);

  async function handleEmergencyCall(phoneNumber: "103" | "112") {
    hapticNotice("warning");
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

  // Native Telegram MainButton / BackButton — only active inside the Mini App.
  // The HTML footer is hidden in Telegram and shown as the fallback elsewhere.
  const stepControlsVisible = !showOfferSubflow && (!isOffersStep || offersMode === "ready");
  useTelegramButtons({
    active: inTelegram && stepControlsVisible,
    mainLabel: primaryLabel,
    mainDisabled: !canContinue(),
    mainSpinner: submitPending,
    showBack: !isFirstStep,
    onMain: isOffersStep ? changeParameters : goNext,
    onBack: goBack,
  });

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
          <ProgressDots currentIndex={stepIndex} total={STEPS.length} />
          <span className="screen-header__brand">Надом</span>
        </header>

        <div
          key={showOfferSubflow ? "subflow" : step.id}
          className={`screen-card screen-card--enter ${showOfferSubflow ? "screen-card--subflow" : ""}`}
        >
          {showOfferSubflow && selectedOffer && offerView ? (
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

              {step.id === "welcome" ? (
                <>
                  <div className="welcome-tags">
                    <span>анонимно</span>
                    <span>быстро</span>
                    <span>удобно</span>
                  </div>
                  <ul className="trust-chips" aria-label="Что видно до заявки">
                    <li>Ответ медслужбы</li>
                    <li>Прибытие после подтверждения</li>
                    <li>Стоимость до выезда</li>
                  </ul>
                  <FaqAccordion />
                </>
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
                      onClick={() => {
                        haptic("soft");
                        setSelectedProfile(option);
                      }}
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
                          haptic("soft");
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
                      onClick={() => {
                        haptic("soft");
                        setSelectedTime(option);
                      }}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}

              {isOffersStep && offersMode === "ready" ? (
                <div className="offers-list" aria-label="Подходящие варианты" aria-busy={offersLoading}>
                  {offersLoading
                    ? [0, 1, 2].map((index) => <OfferCardSkeleton key={index} />)
                    : offers.map((offer) => (
                        <OfferCard key={offer.id} offer={offer} onOpen={(view) => openOfferView(offer, view)} />
                      ))}
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

        {stepControlsVisible && !inTelegram ? (
          <footer className="screen-footer">
            <button
              className="button button--primary"
              disabled={!canContinue()}
              onClick={isOffersStep ? changeParameters : goNext}
              type="button"
            >
              {primaryLabel}
            </button>
            {!isFirstStep ? (
              <button className="button button--ghost" onClick={goBack} type="button">
                Назад
              </button>
            ) : null}
          </footer>
        ) : null}
      </section>
    </main>
  );
}
