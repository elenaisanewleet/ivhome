import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MvpChatActorType, MvpChatMessage } from "@ivhome/shared";

import "./App.css";
import { OnboardingForm } from "./OnboardingForm";


type MvpServiceCategorySlug =
  | "alcohol_hangover"
  | "binge_or_near_binge"
  | "intoxication"
  | "urgent_visit"
  | "planned_visit"
  | "custom";

const MVP_SERVICE_CATALOG: Array<{ slug: MvpServiceCategorySlug; label: string; priceRange: string }> = [
  { slug: "alcohol_hangover", label: "Плохо после алкоголя", priceRange: "8 500–12 000 ₽" },
  { slug: "binge_or_near_binge", label: "Запойная или около-запойная ситуация", priceRange: "от 11 000 ₽" },
  { slug: "intoxication", label: "Интоксикация / отравление веществами", priceRange: "от 10 000 ₽" },
  { slug: "urgent_visit", label: "Срочный неэкстренный выезд специалиста", priceRange: "от 6 000 ₽" },
  { slug: "planned_visit", label: "Плановый выезд специалиста", priceRange: "от 5 500 ₽" },
  { slug: "custom", label: "Свой запрос", priceRange: "по согласованию" },
];

type MvpRequestStatus = "waiting" | "price-lock" | "dispatched" | "completed";
type MvpDbStatus = "WAITING" | "PRICE_LOCK" | "DISPATCHED" | "COMPLETED" | "DECLINED";

type MvpRequestRecord = {
  requestId: string;
  offerId: string;
  district: string;
  desiredTime: string;
  profile: string;
  status: MvpRequestStatus;
  createdAt: string;
  updatedAt: string;
};

type MvpDbRequestRecord = {
  id: string;
  offerId: string;
  clinicId: string | null;
  district: string;
  desiredTime: string;
  profile: string;
  status: MvpDbStatus;
  priceMin: number | null;
  priceMax: number | null;
  priceCurrency: string;
  etaMinutes: number | null;
  notes: string | null;
  serviceSlug: MvpServiceCategorySlug | null;
  serviceLabel: string | null;
  servicePrice: string | null;
  customRequest: string | null;
  customImportant: string | null;
  budget: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};

type MvpRequestListResponse = { requests: MvpRequestRecord[] };
type MvpDbRequestListResponse = { requests: MvpDbRequestRecord[] };
type MvpChatMessagesResponse = { messages: MvpChatMessage[] };

type MvpClinicRecord = {
  id: string;
  publicName: string;
  legalName: string;
  inn: string;
  status: "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  hasActiveAccessToken?: boolean;
  activeAccessTokenCount?: number;
  createdAt: string;
  updatedAt: string;
};

type MvpClinicAccessToken = {
  id: string;
  clinicId: string;
  label: string;
  role: "OPERATOR" | "ADMIN";
  status: "ACTIVE" | "REVOKED";
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

type MvpClinicAuthContext = {
  clinicId: string;
  publicName: string;
  role: "OPERATOR" | "ADMIN";
  token: string;
};

type MvpRequestStatusResponse = {
  requestId: string;
  status: MvpRequestStatus;
  updatedAt: string;
};

type DashboardError = Error & { status?: number };

const statusLabels: Record<MvpRequestStatus, string> = {
  waiting: "Ожидаем",
  "price-lock": "Стоимость подтверждена",
  dispatched: "Специалист выехал",
  completed: "Завершено",
};

const dbStatusLabels: Record<MvpDbStatus, string> = {
  WAITING: "Ожидаем",
  PRICE_LOCK: "Стоимость подтверждена",
  DISPATCHED: "Специалист выехал",
  COMPLETED: "Завершено",
  DECLINED: "Отклонено",
};

const statusOrder: MvpRequestStatus[] = ["waiting", "price-lock", "dispatched", "completed"];
const dbStatusOrder: MvpDbStatus[] = ["WAITING", "PRICE_LOCK", "DISPATCHED", "COMPLETED", "DECLINED"];

const offerNames: Record<string, string> = {
  "medservice-north": "Медорганизация «Север»",
  "medservice-center": "Медорганизация «Центр»",
  "medservice-night": "Медорганизация «Ночь»",
};

function offerName(offerId: string) {
  return offerNames[offerId] ?? offerId;
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" role="img" aria-label="Надом">
      <circle cx="18" cy="18" r="5" fill="none" stroke="var(--accent-mid)" strokeWidth="3.2" />
      <circle cx="46" cy="18" r="5" fill="none" stroke="var(--accent-mid)" strokeWidth="3.2" />
      <circle cx="32" cy="46" r="5" fill="none" stroke="var(--accent-mid)" strokeWidth="3.2" />
      <path d="M22.2 20.9 29 39.7M41.8 20.9 35 39.7M24 18h16" stroke="var(--accent-mid)" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/u, "");
const configuredAdminToken = import.meta.env.VITE_ADMIN_TOKEN ?? "";
const configuredClinicToken = import.meta.env.VITE_CLINIC_TOKEN ?? "";

function readStoredToken(key: string): string {
  return sessionStorage.getItem(key) ?? "";
}

function writeStoredToken(key: string, value: string): void {
  if (value) {
    sessionStorage.setItem(key, value);
  } else {
    sessionStorage.removeItem(key);
  }
}

async function requestJson<T>(path: string, options?: RequestInit, extraHeaders?: Record<string, string>): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options?.headers as Record<string, string> | undefined),
      ...extraHeaders,
    },
  });

  if (!response.ok) {
    const error: DashboardError = new Error(`Nadom dashboard request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as T;
}

async function loadRequests(adminToken: string) {
  const response = await requestJson<MvpRequestListResponse>("/mvp/dev/requests", undefined, { Authorization: `Bearer ${adminToken}` });
  return response.requests;
}

async function loadDbRequests(adminToken: string) {
  const response = await requestJson<MvpDbRequestListResponse>("/mvp/admin/requests", undefined, { Authorization: `Bearer ${adminToken}` });
  return response.requests;
}

async function updateRequestStatus(requestId: string, status: MvpRequestStatus, adminToken: string) {
  return requestJson<MvpRequestStatusResponse>(
    `/mvp/dev/requests/${encodeURIComponent(requestId)}/status`,
    { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) },
    { Authorization: `Bearer ${adminToken}` },
  );
}

type DbStatusPatch = {
  status: MvpDbStatus;
  priceMin?: number;
  priceMax?: number;
  etaMinutes?: number;
  notes?: string;
};

async function updateDbRequestStatus(id: string, patch: DbStatusPatch, adminToken: string) {
  return requestJson<MvpDbRequestRecord>(
    `/mvp/admin/requests/${encodeURIComponent(id)}/status`,
    { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) },
    { Authorization: `Bearer ${adminToken}` },
  );
}

async function loadClinics(adminToken: string) {
  const response = await requestJson<{ clinics: MvpClinicRecord[] }>("/mvp/admin/clinics", undefined, { Authorization: `Bearer ${adminToken}` });
  return response.clinics;
}

async function createClinic(adminToken: string, input: { id: string; publicName: string; legalName: string; inn: string; status: MvpClinicRecord["status"] }) {
  return requestJson<MvpClinicRecord>(
    "/mvp/admin/clinics",
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) },
    { Authorization: `Bearer ${adminToken}` },
  );
}

async function updateClinic(adminToken: string, clinicId: string, input: Partial<Pick<MvpClinicRecord, "publicName" | "legalName" | "inn" | "status">>) {
  return requestJson<MvpClinicRecord>(
    `/mvp/admin/clinics/${encodeURIComponent(clinicId)}`,
    { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) },
    { Authorization: `Bearer ${adminToken}` },
  );
}

async function createClinicAccessToken(clinicId: string, adminToken: string, label: string) {
  return requestJson<{ accessToken: MvpClinicAccessToken; rawToken: string }>(
    `/mvp/admin/clinics/${encodeURIComponent(clinicId)}/access-tokens`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label: label.trim() || "Пилотный доступ" }) },
    { Authorization: `Bearer ${adminToken}` },
  );
}

async function loadClinicAccessTokens(clinicId: string, adminToken: string) {
  const response = await requestJson<{ accessTokens: MvpClinicAccessToken[] }>(
    `/mvp/admin/clinics/${encodeURIComponent(clinicId)}/access-tokens`,
    undefined,
    { Authorization: `Bearer ${adminToken}` },
  );
  return response.accessTokens;
}

async function revokeClinicAccessToken(clinicId: string, tokenId: string, adminToken: string) {
  return requestJson<MvpClinicAccessToken>(
    `/mvp/admin/clinics/${encodeURIComponent(clinicId)}/access-tokens/${encodeURIComponent(tokenId)}/revoke`,
    { method: "POST" },
    { Authorization: `Bearer ${adminToken}` },
  );
}

async function authenticateClinicAccess(clinicId: string, token: string) {
  const response = await requestJson<{ clinicId: string; publicName: string; role: "OPERATOR" | "ADMIN" }>(
    "/mvp/clinic/auth",
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clinicId: clinicId.trim() || undefined, token }) },
  );
  return { ...response, token } satisfies MvpClinicAuthContext;
}

async function loadClinicRequests(auth: MvpClinicAuthContext) {
  const response = await requestJson<MvpDbRequestListResponse & { clinic?: { id: string; publicName: string } }>("/mvp/clinic/requests", undefined, {
    Authorization: `Bearer ${auth.token}`,
  });
  return response.requests;
}

async function updateClinicRequestStatus(id: string, patch: DbStatusPatch, auth: MvpClinicAuthContext) {
  return requestJson<MvpDbRequestRecord>(
    `/mvp/clinic/requests/${encodeURIComponent(id)}/status`,
    { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) },
    { Authorization: `Bearer ${auth.token}` },
  );
}

async function loadAdminChat(id: string, adminToken: string) {
  const response = await requestJson<MvpChatMessagesResponse>(`/mvp/admin/requests/${encodeURIComponent(id)}/chat`, undefined, { Authorization: `Bearer ${adminToken}` });
  return response.messages;
}

async function sendAdminChatMessage(id: string, body: string, adminToken: string) {
  return requestJson<MvpChatMessage>(
    `/mvp/admin/requests/${encodeURIComponent(id)}/chat`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) },
    { Authorization: `Bearer ${adminToken}` },
  );
}

async function loadClinicChat(id: string, auth: MvpClinicAuthContext) {
  const response = await requestJson<MvpChatMessagesResponse>(`/mvp/clinic/requests/${encodeURIComponent(id)}/chat`, undefined, { Authorization: `Bearer ${auth.token}` });
  return response.messages;
}

async function sendClinicChatMessage(id: string, body: string, auth: MvpClinicAuthContext) {
  return requestJson<MvpChatMessage>(
    `/mvp/clinic/requests/${encodeURIComponent(id)}/chat`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) },
    { Authorization: `Bearer ${auth.token}` },
  );
}

interface AuthGateProps {
  storageKey: string;
  label: string;
  onAuth: (token: string) => void;
}

function AuthGate({ storageKey, label, onAuth }: AuthGateProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const preset = storageKey === "nadom_admin_token" ? configuredAdminToken : configuredClinicToken;
    if (preset) {
      writeStoredToken(storageKey, preset);
      onAuth(preset);
    }
  }, [storageKey, onAuth]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = input.trim();

    if (!value) {
      setError(true);
      inputRef.current?.focus();
      return;
    }

    writeStoredToken(storageKey, value);
    onAuth(value);
  }

  return (
    <div className="auth-gate">
      <BrandMark />
      <h2>{label}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          <span>Токен доступа</span>
          <input autoComplete="current-password" onChange={(e) => { setInput(e.target.value); setError(false); }} placeholder="Введите токен" ref={inputRef} type="password" value={input} />
        </label>
        {error ? <p className="auth-error">Укажите токен доступа</p> : null}
        <button type="submit">Войти</button>
      </form>
    </div>
  );
}

function routeTitle(pathname: string) {
  if (pathname.startsWith("/clinic")) return "Кабинет медслужбы";
  if (pathname.startsWith("/admin")) return "Надом Admin";
  return "Надом Dashboard";
}

function routeDescription(pathname: string) {
  if (pathname.startsWith("/clinic")) return "Экран для уполномоченных сотрудников выбранной медслужбы.";
  if (pathname.startsWith("/admin")) return "Внутренний экран для заявок, медслужб и ссылок доступа.";
  return "Выберите маршрут /admin или /clinic.";
}

function formatDate(value: string | null) {
  if (!value) return "нет";
  try {
    return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function chatActorLabel(actorType: MvpChatActorType) {
  switch (actorType) {
    case "USER": return "Пользователь";
    case "CLINIC": return "Выбранная медслужба";
    case "ADMIN": return "Admin";
  }
}

function RequestChat({ messages, isLoading, error, draft, actorType, onDraftChange, onRefresh, onSend }: {
  messages: MvpChatMessage[];
  isLoading: boolean;
  error: string | null;
  draft: string;
  actorType: "ADMIN" | "CLINIC";
  onDraftChange: (value: string) => void;
  onRefresh: () => void;
  onSend: () => void;
}) {
  return (
    <div className="request-chat">
      <div className="request-chat__head">
        <div>
          <p className="meta-label">Чат заявки</p>
          <p>Не отправляйте лишние персональные данные. Медицинские детали уточняет выбранная медслужба.</p>
        </div>
        <button disabled={isLoading} onClick={onRefresh} type="button">{isLoading ? "Загружаем…" : "Обновить чат"}</button>
      </div>
      {error ? <p className="dashboard-message">{error}</p> : null}
      <div className="request-chat__messages" aria-live="polite">
        {messages.length === 0 ? <p className="request-chat__empty">Сообщений пока нет.</p> : messages.map((message) => (
          <div className={`request-chat__bubble request-chat__bubble--${message.actorType.toLowerCase()}`} key={message.id}>
            <span>{chatActorLabel(message.actorType)} · {formatDate(message.createdAt)}</span>
            <p>{message.body}</p>
          </div>
        ))}
      </div>
      <form className="request-chat__form" onSubmit={(event) => { event.preventDefault(); onSend(); }}>
        <input autoComplete="off" onChange={(event) => onDraftChange(event.target.value)} placeholder={actorType === "ADMIN" ? "Ответ admin…" : "Ответ выбранной медслужбы…"} type="text" value={draft} />
        <button disabled={!draft.trim() || isLoading} type="submit">Отправить</button>
      </form>
    </div>
  );
}


function requestContextFields(req: MvpDbRequestRecord) {
  const fallback = MVP_SERVICE_CATALOG.find((service) => service.slug === req.serviceSlug);
  return {
    service: req.serviceLabel ?? fallback?.label ?? "Услуга не выбрана",
    price: req.servicePrice ?? fallback?.priceRange ?? "по согласованию",
  };
}

function RequestContext({ req }: { req: MvpDbRequestRecord }) {
  const context = requestContextFields(req);
  return (
    <div className="request-context-panel">
      <p className="meta-label">Контекст заявки</p>
      <dl className="request-fields">
        <div><dt>Услуга</dt><dd>{context.service}</dd></div>
        <div><dt>Ориентир</dt><dd>{context.price}</dd></div>
        {req.customRequest ? <div><dt>Свой запрос</dt><dd>{req.customRequest}</dd></div> : null}
        {req.customImportant ? <div><dt>Что важно</dt><dd>{req.customImportant}</dd></div> : null}
        {req.budget ? <div className="request-context-panel__budget"><dt>Бюджет</dt><dd>{req.budget}</dd></div> : null}
        {req.comment ? <div className="request-context-panel__comment"><dt>Комментарий</dt><dd>{req.comment}</dd></div> : null}
      </dl>
    </div>
  );
}

function RequestQuotePanel({ request, isUpdating, onSave }: { request: MvpDbRequestRecord; isUpdating: boolean; onSave: (patch: DbStatusPatch) => void }) {
  const [status, setStatus] = useState<MvpDbStatus>(request.status);
  const [priceMin, setPriceMin] = useState(request.priceMin?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(request.priceMax?.toString() ?? "");
  const [etaMinutes, setEtaMinutes] = useState(request.etaMinutes?.toString() ?? "");
  const [notes, setNotes] = useState(request.notes ?? "");

  useEffect(() => {
    setStatus(request.status);
    setPriceMin(request.priceMin?.toString() ?? "");
    setPriceMax(request.priceMax?.toString() ?? "");
    setEtaMinutes(request.etaMinutes?.toString() ?? "");
    setNotes(request.notes ?? "");
  }, [request]);

  function optionalNumber(value: string) {
    const trimmed = value.trim();
    return trimmed ? Number(trimmed) : undefined;
  }

  return (
    <form className="quote-panel" onSubmit={(event) => { event.preventDefault(); onSave({ status, priceMin: optionalNumber(priceMin), priceMax: optionalNumber(priceMax), etaMinutes: optionalNumber(etaMinutes), notes: notes.trim() || undefined }); }}>
      <label><span>Статус</span><select onChange={(event) => setStatus(event.target.value as MvpDbStatus)} value={status}>{dbStatusOrder.map((item) => <option key={item} value={item}>{dbStatusLabels[item]}</option>)}</select></label>
      <label><span>Цена от</span><input inputMode="numeric" min={0} onChange={(event) => setPriceMin(event.target.value)} type="number" value={priceMin} /></label>
      <label><span>Цена до</span><input inputMode="numeric" min={0} onChange={(event) => setPriceMax(event.target.value)} type="number" value={priceMax} /></label>
      <label><span>Прибытие, мин</span><input inputMode="numeric" min={0} onChange={(event) => setEtaMinutes(event.target.value)} type="number" value={etaMinutes} /></label>
      <label className="quote-panel__notes"><span>Операционная заметка</span><input onChange={(event) => setNotes(event.target.value)} placeholder="Без персональных и медицинских деталей" type="text" value={notes} /></label>
      <button disabled={isUpdating} type="submit">{isUpdating ? "Сохраняем…" : "Сохранить статус и условия"}</button>
    </form>
  );
}

const emptyClinicForm = { id: "", publicName: "", legalName: "", inn: "", status: "ACTIVE" as MvpClinicRecord["status"] };

function AdminView() {
  const storageKey = "nadom_admin_token";
  const [token, setToken] = useState(() => readStoredToken(storageKey));
  const [requests, setRequests] = useState<MvpRequestRecord[]>([]);
  const [dbRequests, setDbRequests] = useState<MvpDbRequestRecord[]>([]);
  const [clinics, setClinics] = useState<MvpClinicRecord[]>([]);
  const [clinicTokens, setClinicTokens] = useState<Record<string, MvpClinicAccessToken[]>>({});
  const [tokenLabel, setTokenLabel] = useState("Пилотный доступ");
  const [oneTimeLink, setOneTimeLink] = useState<{ clinicId: string; link: string } | null>(null);
  const [clinicForm, setClinicForm] = useState(emptyClinicForm);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<"idle" | "success" | "error">("idle");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, MvpChatMessage[]>>({});
  const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const isConfigured = Boolean(apiBaseUrl);

  function handleAuth(newToken: string) {
    setToken(newToken);
  }

  const refreshRequests = useCallback(async (authToken: string, successMessage?: string) => {
    if (!isConfigured) return;
    setIsLoading(true);
    setMessage(null);
    setLastAction("idle");

    try {
      const [legacy, db, clinicList] = await Promise.allSettled([loadRequests(authToken), loadDbRequests(authToken), loadClinics(authToken)]);
      if (legacy.status === "fulfilled") setRequests(legacy.value);
      if (db.status === "fulfilled") setDbRequests(db.value);
      else setMessage("Postgres-заявки недоступны. Проверьте миграции и API.");
      if (clinicList.status === "fulfilled") setClinics(clinicList.value);
      if (successMessage) {
        setMessage(successMessage);
        setLastAction("success");
      }
    } catch {
      setMessage("Не удалось загрузить данные. Проверьте VITE_API_BASE_URL и токен доступа.");
      setLastAction("error");
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    if (token) void refreshRequests(token);
  }, [token, refreshRequests]);

  async function changeStatus(request: MvpRequestRecord, status: MvpRequestStatus) {
    setUpdatingId(request.requestId);
    setMessage(null);
    try {
      const response = await updateRequestStatus(request.requestId, status, token);
      setRequests((current) => current.map((item) => item.requestId === request.requestId ? { ...item, status: response.status, updatedAt: response.updatedAt } : item));
    } catch {
      setMessage("Не удалось обновить статус dev-заявки.");
      setLastAction("error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function changeDbStatus(req: MvpDbRequestRecord, status: MvpDbStatus) {
    setUpdatingId(req.id);
    setMessage(null);
    try {
      const updated = await updateDbRequestStatus(req.id, { status }, token);
      setDbRequests((current) => current.map((item) => item.id === req.id ? updated : item));
    } catch {
      setMessage("Не удалось обновить статус Postgres-заявки.");
      setLastAction("error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveDbQuote(req: MvpDbRequestRecord, patch: DbStatusPatch) {
    setUpdatingId(req.id);
    setMessage(null);
    try {
      const updated = await updateDbRequestStatus(req.id, patch, token);
      setDbRequests((current) => current.map((item) => item.id === req.id ? updated : item));
    } catch {
      setMessage("Не удалось сохранить статус и условия Postgres-заявки.");
      setLastAction("error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function refreshChat(requestId: string) {
    setChatLoadingId(requestId);
    setChatError(null);
    try {
      const loaded = await loadAdminChat(requestId, token);
      setChatMessages((current) => ({ ...current, [requestId]: loaded }));
    } catch {
      setChatError("Не удалось загрузить чат заявки.");
    } finally {
      setChatLoadingId(null);
    }
  }

  async function toggleChat(requestId: string) {
    const nextId = openChatId === requestId ? null : requestId;
    setOpenChatId(nextId);
    if (nextId && !chatMessages[nextId]) await refreshChat(nextId);
  }

  useEffect(() => {
    if (!openChatId || !token) return;
    const intervalId = window.setInterval(() => { void refreshChat(openChatId); }, 5_000);
    return () => window.clearInterval(intervalId);
  }, [openChatId, token]);

  async function saveClinicForm(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setLastAction("idle");
    setIsLoading(true);

    try {
      const exists = clinics.some((clinic) => clinic.id === clinicForm.id);
      await (exists ? updateClinic(token, clinicForm.id, { publicName: clinicForm.publicName, legalName: clinicForm.legalName, inn: clinicForm.inn, status: clinicForm.status }) : createClinic(token, clinicForm));
      setClinicForm(emptyClinicForm);
      setOneTimeLink(null);
      await refreshRequests(token, exists ? "Карточка медслужбы обновлена и перезагружена из Postgres." : "Медслужба создана и перезагружена из Postgres.");
    } catch {
      setMessage("Не удалось сохранить карточку медслужбы. Проверьте ID, ИНН и статус.");
      setLastAction("error");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshClinicTokens(clinicId: string) {
    try {
      const loaded = await loadClinicAccessTokens(clinicId, token);
      setClinicTokens((current) => ({ ...current, [clinicId]: loaded }));
    } catch {
      setMessage("Не удалось загрузить токены доступа медслужбы.");
      setLastAction("error");
    }
  }

  async function generateClinicLink(clinicId: string) {
    setMessage(null);
    setLastAction("idle");
    setOneTimeLink(null);
    try {
      const created = await createClinicAccessToken(clinicId, token, tokenLabel);
      const link = `${window.location.origin}/clinic?clinic=${encodeURIComponent(clinicId)}&token=${encodeURIComponent(created.rawToken)}`;
      setOneTimeLink({ clinicId, link });
      await navigator.clipboard?.writeText(link);
      await refreshClinicTokens(clinicId);
      await refreshRequests(token, "Ссылка доступа создана. Сырой токен показан только сейчас — скопируйте ссылку перед уходом со страницы.");
    } catch {
      setMessage("Не удалось создать ссылку доступа для медслужбы.");
      setLastAction("error");
    }
  }

  async function copyOneTimeLink() {
    if (!oneTimeLink) return;
    try {
      await navigator.clipboard.writeText(oneTimeLink.link);
      setMessage("Ссылка доступа скопирована.");
      setLastAction("success");
    } catch {
      setMessage("Не удалось скопировать автоматически. Скопируйте ссылку вручную.");
      setLastAction("error");
    }
  }

  async function revokeAccess(clinicId: string, tokenId: string) {
    try {
      await revokeClinicAccessToken(clinicId, tokenId, token);
      await refreshClinicTokens(clinicId);
      await refreshRequests(token, "Токен доступа отозван. После logout/reopen ссылка больше не должна открывать кабинет.");
    } catch {
      setMessage("Не удалось отозвать токен доступа.");
      setLastAction("error");
    }
  }

  async function sendChat(requestId: string) {
    const body = (chatDrafts[requestId] ?? "").trim();
    if (!body) return;
    setChatLoadingId(requestId);
    setChatError(null);
    try {
      const saved = await sendAdminChatMessage(requestId, body, token);
      setChatMessages((current) => ({ ...current, [requestId]: [...(current[requestId] ?? []), saved] }));
      setChatDrafts((current) => ({ ...current, [requestId]: "" }));
      await refreshChat(requestId);
    } catch {
      setChatError("Не удалось отправить сообщение.");
    } finally {
      setChatLoadingId(null);
    }
  }

  if (!token) return <AuthGate storageKey={storageKey} label="Вход в Надом Admin" onAuth={handleAuth} />;

  return (
    <section className="dashboard-card">
      <div className="dashboard-toolbar">
        <div>
          <p className="meta-label">Операционная панель</p>
          <h2>DB-заявки и медслужбы</h2>
          <p>Все данные ниже перезагружаются из API/Postgres. После refresh созданные медслужбы должны оставаться в списке.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button disabled={isLoading} onClick={() => void refreshRequests(token)} type="button">{isLoading ? "Обновляем…" : "Обновить"}</button>
          <button onClick={() => { writeStoredToken(storageKey, ""); setToken(""); setRequests([]); setDbRequests([]); setClinics([]); }} type="button">Выйти</button>
        </div>
      </div>

      {message ? <p className={`dashboard-message dashboard-message--${lastAction}`}>{message}</p> : null}

      <section className="clinic-access-panel">
        <div className="dashboard-toolbar">
          <div>
            <p className="meta-label">Медслужбы</p>
            <h2>Кабинет медслужбы и ссылки доступа</h2>
            <p>Создайте медслужбу, затем сгенерируйте ссылку доступа. Сырой токен показывается только один раз и не хранится в списке.</p>
          </div>
          <label className="inline-field">
            <span>Метка нового токена доступа</span>
            <input onChange={(event) => setTokenLabel(event.target.value)} type="text" value={tokenLabel} />
          </label>
        </div>

        <form className="clinic-form" onSubmit={(event) => void saveClinicForm(event)}>
          <input onChange={(event) => setClinicForm((current) => ({ ...current, id: event.target.value }))} placeholder="pilot-east" type="text" value={clinicForm.id} />
          <input onChange={(event) => setClinicForm((current) => ({ ...current, publicName: event.target.value }))} placeholder="Медслужба «Восток»" type="text" value={clinicForm.publicName} />
          <input onChange={(event) => setClinicForm((current) => ({ ...current, legalName: event.target.value }))} placeholder="ООО «Медслужба Восток»" type="text" value={clinicForm.legalName} />
          <input onChange={(event) => setClinicForm((current) => ({ ...current, inn: event.target.value }))} placeholder="ИНН" type="text" value={clinicForm.inn} />
          <select onChange={(event) => setClinicForm((current) => ({ ...current, status: event.target.value as MvpClinicRecord["status"] }))} value={clinicForm.status}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DRAFT">DRAFT</option>
          </select>
          <button disabled={isLoading} type="submit">{clinics.some((clinic) => clinic.id === clinicForm.id) ? "Обновить медслужбу" : "Создать медслужбу"}</button>
        </form>

        {oneTimeLink ? (
          <div className="invite-link-box">
            <p className="meta-label">Ссылка доступа · {oneTimeLink.clinicId}</p>
            <p>Скопируйте сейчас. Сырой токен не будет доступен после обновления страницы.</p>
            <code>{oneTimeLink.link}</code>
            <button onClick={() => void copyOneTimeLink()} type="button">Скопировать ссылку доступа</button>
          </div>
        ) : null}

        {clinics.length === 0 && !isLoading ? <div className="dashboard-empty-list"><p className="meta-label">Пусто</p><h3>Медслужб пока нет</h3><p>Создайте первую медслужбу через форму выше.</p></div> : null}

        <div className="request-list">
          {clinics.map((clinic) => (
            <article className="request-card clinic-card" key={clinic.id}>
              <div className="request-card__head">
                <div>
                  <span className="request-id">{clinic.id}</span>
                  <h3>{clinic.publicName}</h3>
                  <p>{clinic.legalName} · ИНН {clinic.inn}</p>
                </div>
                <strong className={`status-pill status-pill--${clinic.status.toLowerCase()}`}>{clinic.status}</strong>
              </div>
              <dl className="request-fields">
                <div><dt>ID</dt><dd>{clinic.id}</dd></div>
                <div><dt>Публично</dt><dd>{clinic.publicName}</dd></div>
                <div><dt>Статус</dt><dd>{clinic.status}</dd></div>
                <div><dt>Токен доступа</dt><dd>{clinic.hasActiveAccessToken ? `есть · ${clinic.activeAccessTokenCount ?? 1}` : "нет"}</dd></div>
                <div><dt>Обновлено</dt><dd>{formatDate(clinic.updatedAt)}</dd></div>
              </dl>
              <div className="status-actions">
                <button onClick={() => setClinicForm({ id: clinic.id, publicName: clinic.publicName, legalName: clinic.legalName, inn: clinic.inn, status: clinic.status })} type="button">Редактировать</button>
                <button disabled={clinic.status !== "ACTIVE"} onClick={() => void generateClinicLink(clinic.id)} type="button">Создать ссылку доступа</button>
                <button onClick={() => void refreshClinicTokens(clinic.id)} type="button">Показать токены</button>
                <a className="action-link" href={`/admin/onboarding/${encodeURIComponent(clinic.id)}`}>Анкета</a>
                <a className="action-link" href={`/clinic?clinic=${encodeURIComponent(clinic.id)}`}>Открыть кабинет</a>
              </div>
              {(clinicTokens[clinic.id] ?? []).length > 0 ? (
                <dl className="request-fields token-fields">
                  {(clinicTokens[clinic.id] ?? []).map((accessToken) => (
                    <div key={accessToken.id}>
                      <dt>{accessToken.label}</dt>
                      <dd>
                        {accessToken.status} · {accessToken.role} · last used: {formatDate(accessToken.lastUsedAt)}
                        {accessToken.status === "ACTIVE" ? <button onClick={() => void revokeAccess(clinic.id, accessToken.id)} type="button">Отозвать</button> : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {dbRequests.length === 0 && !isLoading ? <div className="dashboard-empty-list"><p className="meta-label">Пусто</p><h3>Postgres-заявок пока нет</h3><p>Создайте заявку в Mini App, затем обновите список.</p></div> : null}

      <div className="request-list">
        {dbRequests.map((req) => (
          <article className="request-card" key={req.id}>
            <div className="request-card__head"><div><span className="request-id">{req.id}</span><h3>{offerName(req.offerId)}</h3></div><strong className={`status-pill status-pill--${req.status.toLowerCase()}`}>{dbStatusLabels[req.status]}</strong></div>
            <dl className="request-fields">
              <div><dt>Район</dt><dd>{req.district}</dd></div><div><dt>Время</dt><dd>{req.desiredTime}</dd></div><div><dt>Формат</dt><dd>{req.profile}</dd></div>
              {req.priceMin !== null ? <div><dt>Стоимость</dt><dd>{req.priceMin} – {req.priceMax} {req.priceCurrency}</dd></div> : null}
              {req.etaMinutes !== null ? <div><dt>Прибытие</dt><dd>{req.etaMinutes} мин</dd></div> : null}
              <div><dt>Обновлено</dt><dd>{formatDate(req.updatedAt)}</dd></div>
            </dl>
            <RequestContext req={req} /><RequestQuotePanel isUpdating={updatingId === req.id} onSave={(patch) => void saveDbQuote(req, patch)} request={req} />
            <div className="status-actions" aria-label="Изменить статус заявки">
              {dbStatusOrder.map((status) => <button disabled={updatingId === req.id || req.status === status} key={status} onClick={() => void changeDbStatus(req, status)} type="button">{dbStatusLabels[status]}</button>)}
              <button onClick={() => void toggleChat(req.id)} type="button">{openChatId === req.id ? "Скрыть чат" : "Открыть чат"}</button>
              <a className="action-link" href={`/admin/onboarding/${encodeURIComponent(req.clinicId ?? req.offerId)}`}>Анкета</a>
            </div>
            {openChatId === req.id ? <RequestChat actorType="ADMIN" draft={chatDrafts[req.id] ?? ""} error={chatError} isLoading={chatLoadingId === req.id} messages={chatMessages[req.id] ?? []} onDraftChange={(value) => setChatDrafts((current) => ({ ...current, [req.id]: value }))} onRefresh={() => void refreshChat(req.id)} onSend={() => void sendChat(req.id)} /> : null}
          </article>
        ))}
      </div>

      {requests.length > 0 ? <><div className="dashboard-toolbar" style={{ marginTop: "24px" }}><div><p className="meta-label">Dev-заявки (в памяти)</p><h2>In-memory заявки</h2><p>Сбрасываются при перезапуске API. Для совместимости с предыдущей версией.</p></div></div><div className="request-list">{requests.map((request) => <article className="request-card" key={request.requestId}><div className="request-card__head"><div><span className="request-id">{request.requestId}</span><h3>{offerName(request.offerId)}</h3></div><strong className={`status-pill status-pill--${request.status}`}>{statusLabels[request.status]}</strong></div><dl className="request-fields"><div><dt>Район</dt><dd>{request.district}</dd></div><div><dt>Время</dt><dd>{request.desiredTime}</dd></div><div><dt>Формат</dt><dd>{request.profile}</dd></div><div><dt>Обновлено</dt><dd>{formatDate(request.updatedAt)}</dd></div></dl><div className="status-actions" aria-label="Изменить статус заявки">{statusOrder.map((status) => <button disabled={updatingId === request.requestId || request.status === status} key={status} onClick={() => void changeStatus(request, status)} type="button">{statusLabels[status]}</button>)}</div></article>)}</div></> : null}
    </section>
  );
}

function AdminOnboardingView({ clinicId }: { clinicId: string }) {
  const storageKey = "nadom_admin_token";
  const [token, setToken] = useState(() => readStoredToken(storageKey));

  if (!token) return <AuthGate storageKey={storageKey} label="Вход в Надом Admin" onAuth={setToken} />;

  return (
    <section className="dashboard-card">
      <div className="dashboard-toolbar"><div><p className="meta-label">Анкета</p><h2>{offerName(clinicId)}</h2><p>Черновик и отправка сохраняются через Postgres API.</p></div><div style={{ display: "flex", gap: "8px" }}><a className="action-link" href="/admin">К заявкам</a><button onClick={() => { writeStoredToken(storageKey, ""); setToken(""); }} type="button">Выйти</button></div></div>
      <OnboardingForm adminToken={token} apiBaseUrl={apiBaseUrl} clinicId={clinicId} />
    </section>
  );
}

function readStoredClinicAuth(): MvpClinicAuthContext | null {
  const raw = sessionStorage.getItem("nadom_clinic_auth");
  if (!raw) return null;
  try { return JSON.parse(raw) as MvpClinicAuthContext; } catch { return null; }
}

function writeStoredClinicAuth(value: MvpClinicAuthContext | null): void {
  if (value) sessionStorage.setItem("nadom_clinic_auth", JSON.stringify(value));
  else {
    sessionStorage.removeItem("nadom_clinic_auth");
    sessionStorage.removeItem("nadom_clinic_token");
  }
}

function ClinicLogin({ onAuth }: { onAuth: (auth: MvpClinicAuthContext) => void }) {
  const params = new URLSearchParams(window.location.search);
  const [clinicId, setClinicId] = useState(params.get("clinic") ?? "");
  const [token, setToken] = useState(params.get("token") ?? configuredClinicToken);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(nextClinicId = clinicId, nextToken = token) {
    const cleanToken = nextToken.trim();
    if (!cleanToken) { setError("Укажите токен доступа медслужбы."); return; }
    setIsLoading(true);
    setError(null);
    try {
      const auth = await authenticateClinicAccess(nextClinicId.trim(), cleanToken);
      writeStoredClinicAuth(auth);
      window.history.replaceState({}, document.title, window.location.pathname);
      onAuth(auth);
    } catch {
      setError("Доступ не подтверждён. Проверьте ссылку доступа или токен доступа.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const urlToken = params.get("token");
    if (urlToken) void submit(params.get("clinic") ?? "", urlToken);
  }, []);

  return (
    <div className="auth-gate">
      <BrandMark />
      <h2>Кабинет медслужбы — вход</h2>
      <p>Откройте ссылку доступа от Надом или введите ID медслужбы и токен доступа вручную.</p>
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <label><span>ID медслужбы</span><input autoComplete="off" onChange={(event) => setClinicId(event.target.value)} placeholder="medservice-north" type="text" value={clinicId} /></label>
        <label><span>Токен доступа</span><input autoComplete="current-password" onChange={(event) => setToken(event.target.value)} placeholder="nadom_msvc_…" type="password" value={token} /></label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button disabled={isLoading} type="submit">{isLoading ? "Проверяем…" : "Войти"}</button>
      </form>
    </div>
  );
}

function ClinicView() {
  const [auth, setAuth] = useState<MvpClinicAuthContext | null>(() => readStoredClinicAuth());
  const [requests, setRequests] = useState<MvpDbRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, MvpChatMessage[]>>({});
  const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const isConfigured = Boolean(apiBaseUrl);

  async function refreshRequests(currentAuth: MvpClinicAuthContext) {
    if (!isConfigured) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const loaded = await loadClinicRequests(currentAuth);
      setRequests(loaded);
    } catch (error) {
      if ((error as DashboardError).status === 401) {
        writeStoredClinicAuth(null);
        setAuth(null);
        setRequests([]);
        setMessage("Доступ медслужбы больше не активен. Войдите по новой ссылке доступа.");
      } else {
        setMessage("Не удалось загрузить заявки. Проверьте доступ медслужбы и настройки API.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { if (auth) void refreshRequests(auth); }, [auth, isConfigured]);

  async function changeStatus(req: MvpDbRequestRecord, status: MvpDbStatus) {
    if (!auth) return;
    setUpdatingId(req.id);
    setMessage(null);
    try {
      const updated = await updateClinicRequestStatus(req.id, { status }, auth);
      setRequests((current) => current.map((item) => item.id === req.id ? updated : item));
    } catch {
      setMessage("Не удалось обновить статус заявки.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveQuote(req: MvpDbRequestRecord, patch: DbStatusPatch) {
    if (!auth) return;
    setUpdatingId(req.id);
    setMessage(null);
    try {
      const updated = await updateClinicRequestStatus(req.id, patch, auth);
      setRequests((current) => current.map((item) => item.id === req.id ? updated : item));
    } catch {
      setMessage("Не удалось сохранить статус и условия заявки.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function refreshChat(requestId: string) {
    if (!auth) return;
    setChatLoadingId(requestId);
    setChatError(null);
    try {
      const loaded = await loadClinicChat(requestId, auth);
      setChatMessages((current) => ({ ...current, [requestId]: loaded }));
    } catch {
      setChatError("Не удалось загрузить чат заявки.");
    } finally {
      setChatLoadingId(null);
    }
  }

  async function toggleChat(requestId: string) {
    const nextId = openChatId === requestId ? null : requestId;
    setOpenChatId(nextId);
    if (nextId && !chatMessages[nextId]) await refreshChat(nextId);
  }

  useEffect(() => {
    if (!openChatId || !auth) return;
    const intervalId = window.setInterval(() => { void refreshChat(openChatId); }, 5_000);
    return () => window.clearInterval(intervalId);
  }, [auth, openChatId]);

  async function sendChat(requestId: string) {
    if (!auth) return;
    const body = (chatDrafts[requestId] ?? "").trim();
    if (!body) return;
    setChatLoadingId(requestId);
    setChatError(null);
    try {
      const saved = await sendClinicChatMessage(requestId, body, auth);
      setChatMessages((current) => ({ ...current, [requestId]: [...(current[requestId] ?? []), saved] }));
      setChatDrafts((current) => ({ ...current, [requestId]: "" }));
      await refreshChat(requestId);
    } catch {
      setChatError("Не удалось отправить сообщение.");
    } finally {
      setChatLoadingId(null);
    }
  }

  if (!auth) return <ClinicLogin onAuth={setAuth} />;

  return (
    <section className="dashboard-card">
      <div className="dashboard-toolbar"><div><p className="meta-label">Медслужба: {auth.publicName}</p><h2>Заявки вашей медслужбы</h2><p>Доступ хранится в sessionStorage. После выхода ссылка с отозванным токеном доступа должна перестать открываться.</p></div><div style={{ display: "flex", gap: "8px" }}><button disabled={isLoading} onClick={() => void refreshRequests(auth)} type="button">{isLoading ? "Обновляем…" : "Обновить"}</button><button onClick={() => { writeStoredClinicAuth(null); setAuth(null); setRequests([]); setChatMessages({}); setOpenChatId(null); }} type="button">Выйти</button></div></div>
      {message ? <p className="dashboard-message">{message}</p> : null}
      {requests.length === 0 && !isLoading ? <div className="dashboard-empty-list"><p className="meta-label">Пусто</p><h3>Заявок для этой медслужбы пока нет</h3><p>Создайте заявку в Mini App с выбором этой медслужбы.</p></div> : null}
      <div className="request-list">{requests.map((req) => <article className="request-card" key={req.id}><div className="request-card__head"><div><span className="request-id">{req.id}</span><h3>{offerName(req.offerId)}</h3></div><strong className={`status-pill status-pill--${req.status.toLowerCase()}`}>{dbStatusLabels[req.status]}</strong></div><dl className="request-fields"><div><dt>Район</dt><dd>{req.district}</dd></div><div><dt>Время</dt><dd>{req.desiredTime}</dd></div><div><dt>Формат</dt><dd>{req.profile}</dd></div>{req.priceMin !== null ? <div><dt>Стоимость</dt><dd>{req.priceMin} – {req.priceMax} {req.priceCurrency}</dd></div> : null}{req.etaMinutes !== null ? <div><dt>Прибытие</dt><dd>{req.etaMinutes} мин</dd></div> : null}<div><dt>Создана</dt><dd>{formatDate(req.createdAt)}</dd></div></dl><RequestContext req={req} /><RequestQuotePanel isUpdating={updatingId === req.id} onSave={(patch) => void saveQuote(req, patch)} request={req} /><div className="status-actions" aria-label="Изменить статус заявки">{dbStatusOrder.map((status) => <button disabled={updatingId === req.id || req.status === status} key={status} onClick={() => void changeStatus(req, status)} type="button">{dbStatusLabels[status]}</button>)}<button onClick={() => void toggleChat(req.id)} type="button">{openChatId === req.id ? "Скрыть чат" : "Открыть чат"}</button></div>{openChatId === req.id ? <RequestChat actorType="CLINIC" draft={chatDrafts[req.id] ?? ""} error={chatError} isLoading={chatLoadingId === req.id} messages={chatMessages[req.id] ?? []} onDraftChange={(value) => setChatDrafts((current) => ({ ...current, [req.id]: value }))} onRefresh={() => void refreshChat(req.id)} onSend={() => void sendChat(req.id)} /> : null}</article>)}</div>
    </section>
  );
}

export function App() {
  const pathname = window.location.pathname;
  const isConfigured = Boolean(apiBaseUrl);
  const title = useMemo(() => routeTitle(pathname), [pathname]);
  const description = useMemo(() => routeDescription(pathname), [pathname]);
  const isAdmin = pathname.startsWith("/admin");
  const isClinic = pathname.startsWith("/clinic");
  const onboardingMatch = /^\/admin\/onboarding\/([^/]+)$/u.exec(pathname);

  return (
    <main className="dashboard-shell">
      <section className="dashboard-frame" aria-labelledby="dashboard-title">
        <header className="dashboard-header"><BrandMark /><p className="dashboard-kicker">Надом · операционная панель</p><h1 id="dashboard-title">{title}</h1><p>{description}</p><nav aria-label="Маршруты dashboard"><a href="/admin">/admin</a><a href="/clinic">/clinic</a></nav></header>
        {!isConfigured ? <section className="dashboard-card dashboard-card--empty"><p className="meta-label">Настройка</p><h2>API не подключён</h2><p>Укажите VITE_API_BASE_URL, чтобы подключить API.</p></section> : isAdmin ? (onboardingMatch ? <AdminOnboardingView clinicId={decodeURIComponent(onboardingMatch[1] ?? "")} /> : <AdminView />) : isClinic ? <ClinicView /> : <section className="dashboard-card dashboard-card--empty"><p className="meta-label">Маршрут</p><h2>Выберите маршрут</h2><p>Перейдите на <a href="/admin">/admin</a> или <a href="/clinic">/clinic</a>.</p></section>}
      </section>
    </main>
  );
}
