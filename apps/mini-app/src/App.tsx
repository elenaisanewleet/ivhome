import { useEffect, useMemo, useState } from "react";

import "./App.css";
import "./App.mobile.css";
import "./App.chat.css";
import {
  fetchRequestHistory,
  getChatMessages,
  getRequestStatus,
  isApiConfigured,
  loadOffers,
  readSupportUrl,
  sendChatMessage as postChatMessage,
  sendSupportMessage,
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
import type { ChatMessage, Offer, OfferService, OfferView, OffersMode, PreviewId } from "./types";
import type { MvpDbRequest } from "@ivhome/shared";
import { FaqAccordion, NodeIcon, ProgressDots } from "./ui";
import { useTelegramButtons } from "./useTelegramButtons";
import {
  getStep,
  isLikelyMobileRuntime,
  isOfferView,
  offerViewForDbStatus,
  readPreviewId,
} from "./utils";

function toChatMessage(message: { id: string; actorType: ChatMessage["actorType"]; body: string; createdAt: string }): ChatMessage {
  return {
    id: message.id,
    actorType: message.actorType,
    text: message.body,
    createdAt: message.createdAt,
  };
}


function readAnonymousSessionId() {
  const key = "nadom_anonymous_session_id";
  const existing = window.localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const next = `anon-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
  window.localStorage.setItem(key, next);

  return next;
}

function mergeChatMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return [...byId.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
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
  const [emergencyNotice, setEmergencyNotice] = useState<string | null>(null);
  const [offersMode, setOffersMode] = useState<OffersMode>(
    preview === "empty" || preview === "error" ? preview : "ready",
  );
  const [offers, setOffers] = useState<Offer[]>(FALLBACK_OFFERS);
  const [offersLoading, setOffersLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(initialOfferView ? FALLBACK_OFFERS[0]! : null);
  const [offerView, setOfferView] = useState<OfferView | null>(initialOfferView);
  const [selectedService, setSelectedService] = useState<OfferService | null>(() =>
    initialOfferView ? FALLBACK_OFFERS[0]?.services.find((service) => service.slug !== "custom") ?? null : null,
  );
  const [requestDraft, setRequestDraft] = useState({ customRequest: "", customImportant: "", budget: "", comment: "" });
  const [supportReturnView, setSupportReturnView] = useState<Exclude<OfferView, "support">>("completed");
  const [rating, setRating] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatPending, setChatPending] = useState(false);
  const [anonymousSessionId] = useState(() => readAnonymousSessionId());
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestHistory, setRequestHistory] = useState<MvpDbRequest[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitPending, setSubmitPending] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [statusDetails, setStatusDetails] = useState<{
    priceMin: number | null;
    priceMax: number | null;
    priceCurrency: string;
    etaMinutes: number | null;
    confirmedPrice?: number | null;
    responseTimeEstimate?: string | null;
    arrivalAfterConfirmationEstimate?: string | null;
  } | null>(null);
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

  async function refreshChat({ quiet = false }: { quiet?: boolean } = {}) {
    if (!requestId) {
      return;
    }

    if (!quiet) {
      setChatPending(true);
    }
    if (!quiet) {
      setChatError(null);
    }

    try {
      const messages = await getChatMessages(requestId);

      setChatMessages((current) => mergeChatMessages(current, messages.map(toChatMessage)));
      if (!quiet) {
        setChatError(null);
      }
    } catch {
      if (!quiet) {
        setChatError("Не получилось загрузить чат. Попробуйте обновить позже.");
      }
    } finally {
      if (!quiet) {
        setChatPending(false);
      }
    }
  }

  async function refreshRequestStatus({ quiet = false }: { quiet?: boolean } = {}) {
    if (!requestId) {
      return;
    }

    try {
      const response = await getRequestStatus(requestId);

      setStatusDetails({
        priceMin: response.priceMin,
        priceMax: response.priceMax,
        priceCurrency: response.priceCurrency,
        etaMinutes: response.etaMinutes,
        confirmedPrice: response.confirmedPrice,
        responseTimeEstimate: response.responseTimeEstimate,
        arrivalAfterConfirmationEstimate: response.arrivalAfterConfirmationEstimate,
      });
      setOfferView(offerViewForDbStatus(response.status));
      setStatusNotice(
        ["SUBMITTED", "MEDSERVICE_REVIEWING", "WAITING"].includes(response.status)
          ? "Выбранная медслужба ещё проверяет возможность выезда. Можно обновить статус позже."
          : ["DECLINED", "NO_ANSWER", "CANCELLED"].includes(response.status)
            ? "Выбранная медслужба не подтвердила выезд. Напишите в поддержку или выберите другой вариант."
          : response.userFacingStatusText ?? null,
      );
    } catch {
      if (!quiet) {
        setStatusNotice("Не получилось обновить статус. Попробуйте ещё раз.");
      }
    }
  }

  useEffect(() => {
    if (!requestId || offerView !== "chat") {
      return;
    }

    let isCurrent = true;

    setChatPending(true);
    setChatError(null);

    void getChatMessages(requestId)
      .then((messages) => {
        if (isCurrent) {
          setChatMessages((current) => mergeChatMessages(current, messages.map(toChatMessage)));
        }
      })
      .catch(() => {
        if (isCurrent) {
          setChatError("Не получилось загрузить чат. Попробуйте обновить позже.");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setChatPending(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [offerView, requestId]);

  useEffect(() => {
    if (!requestId || offerView !== "chat") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshChat({ quiet: true });
    }, 4_000);

    return () => window.clearInterval(intervalId);
  }, [offerView, requestId]);

  useEffect(() => {
    if (!requestId || !offerView || !["status", "price-lock", "dispatched", "completed"].includes(offerView)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshRequestStatus({ quiet: true });
    }, 7_000);

    return () => window.clearInterval(intervalId);
  }, [offerView, requestId]);

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
  }, [hasLocation, requestDraft.customRequest, selectedProfile, selectedTime, step.id]);

  function canContinue() {
    if (isProfileStep) {
      return selectedProfile === "Описать ситуацию" ? Boolean(requestDraft.customRequest.trim()) : Boolean(selectedProfile);
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
    setChatError(null);
    setChatPending(false);
    setRequestId(null);
    setRequestError(null);
    setStatusNotice(null);
    setStatusDetails(null);
    setSelectedService(null);
    setRequestDraft({ customRequest: "", customImportant: "", budget: "", comment: "" });
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
    setChatError(null);
    setChatPending(false);
    setRequestId(null);
    setRequestError(null);
    setStatusNotice(null);
    setStatusDetails(null);
    setSelectedService(null);
    setRequestDraft({ customRequest: "", customImportant: "", budget: "", comment: "" });
    setStepIndex(PROFILE_STEP_INDEX);
  }

  function openOfferView(offer: Offer, view: OfferView) {
    if (selectedOffer?.id !== offer.id) {
      setChatMessages([]);
      setChatError(null);
      setChatPending(false);
      setRequestId(null);
      setRequestError(null);
      setStatusNotice(null);
      setStatusDetails(null);
      setSelectedService(null);
      setRequestDraft({ customRequest: "", customImportant: "", budget: "", comment: "" });
    }

    setSelectedOffer(offer);
    setSelectedService((current) => current ?? (selectedProfile === "Описать ситуацию" ? offer.services.find((service) => service.slug === "custom") : offer.services.find((service) => service.slug !== "custom")) ?? null);
    setOfferView(view);
  }

  function changeOfferView(view: OfferView | null) {
    setOfferView(view);

    if (!view) {
      setSelectedOffer(null);
      setChatMessages([]);
      setChatError(null);
      setChatPending(false);
      setRequestId(null);
      setRequestError(null);
      setStatusNotice(null);
      setStatusDetails(null);
      setSelectedService(null);
      setRequestDraft({ customRequest: "", customImportant: "", budget: "", comment: "" });
    }
  }

  function showSupport(returnView: Exclude<OfferView, "support">) {
    setSupportReturnView(returnView);
    setOfferView("support");
  }

  async function sendChatMessage(message: string) {
    if (!requestId) {
      setChatError("Чат станет доступен после отправки заявки.");
      return;
    }

    setChatPending(true);
    setChatError(null);

    try {
      const saved = await postChatMessage(requestId, message);

      setChatMessages((current) => mergeChatMessages(current, [toChatMessage(saved)]));
      void refreshChat({ quiet: true });
    } catch {
      setChatError("Не получилось отправить сообщение. Попробуйте ещё раз.");
    } finally {
      setChatPending(false);
    }
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
        clinicId: selectedOffer.id,
        anonymousSessionId,
        district,
        desiredTime: time,
        profile: selectedProfile ?? "Формат уточняется",
        serviceSlug: selectedService?.slug,
        serviceLabel: selectedService?.label,
        servicePrice: selectedService?.priceRange,
        customRequest: selectedService?.slug === "custom" ? requestDraft.customRequest : undefined,
        customImportant: requestDraft.customImportant || undefined,
        budget: requestDraft.budget || undefined,
        comment: requestDraft.comment || undefined,
      });

      setRequestId(response.id);
      setStatusDetails({
        priceMin: response.priceMin,
        priceMax: response.priceMax,
        priceCurrency: response.priceCurrency,
        etaMinutes: response.etaMinutes,
        confirmedPrice: response.confirmedPrice,
        responseTimeEstimate: response.responseTimeEstimate,
        arrivalAfterConfirmationEstimate: response.arrivalAfterConfirmationEstimate,
      });
      setStatusNotice(null);
      setOfferView("chat");
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

    await refreshRequestStatus();
  }


  async function showHistory() {
    setRequestError(null);
    try {
      setRequestHistory(await fetchRequestHistory(anonymousSessionId));
      setSelectedOffer((current) => current ?? FALLBACK_OFFERS[0] ?? null);
      setStepIndex(OFFERS_STEP_INDEX);
      setOfferView("history");
    } catch {
      setRequestError("Не получилось загрузить историю. Попробуйте позже.");
    }
  }

  async function contactSupport() {
    if (requestId) {
      try {
        await sendSupportMessage(requestId, "Пользователь запросил поддержку из Mini App.");
      } catch {
        // Support link fallback remains visible; do not block the user on API errors.
      }
    }
    showSupport(offerView && offerView !== "support" && offerView !== "history" ? offerView : "status");
  }

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
              chatError={chatError}
              chatMessages={chatMessages}
              chatPending={chatPending}
              district={district}
              draft={requestDraft}
              offer={selectedOffer}
              onChangeDraft={(patch) => setRequestDraft((current) => ({ ...current, ...patch }))}
              onChangeView={changeOfferView}
              onRate={setRating}
              onRestart={restartSelection}
              onSelectService={setSelectedService}
              onSendChatMessage={sendChatMessage}
              onRefreshChat={() => void refreshChat()}
              onShowSupport={(view) => { setSupportReturnView(view); void contactSupport(); }}
              history={requestHistory}
              onSubmit={() => void submitSelectedRequest()}
              onUpdateStatus={() => void updateSelectedRequestStatus()}
              rating={rating}
              requestError={requestError}
              requestId={requestId}
              selectedService={selectedService}
              statusNotice={statusNotice}
              statusDetails={statusDetails}
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
                    <span>без лишних данных</span>
                    <span>быстро</span>
                    <span>удобно</span>
                  </div>
                  <ul className="trust-chips" aria-label="Что видно до заявки">
                    <li>Ответ медслужбы</li>
                    <li>Прибытие после подтверждения</li>
                    <li>Стоимость до выезда</li>
                  </ul>
                  <button className="button button--secondary" onClick={() => void showHistory()} type="button">История заявок</button>
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
                <>
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
                  {selectedProfile === "Описать ситуацию" ? (
                    <label className="text-field">
                      <span>Опишите ситуацию коротко</span>
                      <textarea
                        maxLength={500}
                        onChange={(event) => setRequestDraft((current) => ({ ...current, customRequest: event.target.value }))}
                        placeholder="Без телефона, точного адреса и лишних персональных данных"
                        value={requestDraft.customRequest}
                      />
                    </label>
                  ) : null}
                </>
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
