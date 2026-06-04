import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./App.css";
import { OnboardingForm } from "./OnboardingForm";

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
  createdAt: string;
  updatedAt: string;
};

type MvpRequestListResponse = {
  requests: MvpRequestRecord[];
};

type MvpDbRequestListResponse = {
  requests: MvpDbRequestRecord[];
};

type MvpRequestStatusResponse = {
  requestId: string;
  status: MvpRequestStatus;
  updatedAt: string;
};

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
  "medservice-north": "Медслужба «Север»",
  "medservice-center": "Медслужба «Центр»",
  "medservice-night": "Медслужба «Ночь»",
};

function offerName(offerId: string) {
  return offerNames[offerId] ?? offerId;
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" role="img" aria-label="Надом">
      <circle cx="32" cy="8" r="4" fill="none" stroke="var(--accent-mid)" strokeWidth="3.4" />
      <path d="M32 12 V14" stroke="var(--accent-mid)" strokeWidth="3.4" strokeLinecap="round" />
      <rect x="18" y="14" width="28" height="30" rx="9" fill="rgba(126,184,212,0.12)" stroke="var(--accent-mid)" strokeWidth="3.4" />
      <path d="M19.5 32 Q32 27 44.5 32 L44.5 35.5 Q44.5 42.5 37.5 42.5 L26.5 42.5 Q19.5 42.5 19.5 35.5 Z" fill="var(--accent-mid)" />
      <path d="M32 44 V50" stroke="var(--accent-mid)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M32 50 C36 54.5 36 58.5 32 61 C28 58.5 28 54.5 32 50 Z" fill="var(--accent-mid)" />
    </svg>
  );
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/u, "");
const configuredAdminToken = import.meta.env.VITE_ADMIN_TOKEN ?? "";
const configuredClinicToken = import.meta.env.VITE_CLINIC_TOKEN ?? "";

// ─── Auth storage ─────────────────────────────────────────────────────────────

function readStoredToken(key: string): string {
  return sessionStorage.getItem(key) ?? "";
}

function writeStoredToken(key: string, value: string): void {
  sessionStorage.setItem(key, value);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function requestJson<T>(
  path: string,
  options?: RequestInit,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options?.headers as Record<string, string> | undefined),
      ...extraHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(`Nadom dashboard request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function loadRequests(adminToken: string) {
  const response = await requestJson<MvpRequestListResponse>("/mvp/dev/requests", undefined, {
    Authorization: `Bearer ${adminToken}`,
  });

  return response.requests;
}

async function loadDbRequests(adminToken: string) {
  const response = await requestJson<MvpDbRequestListResponse>("/mvp/admin/requests", undefined, {
    Authorization: `Bearer ${adminToken}`,
  });

  return response.requests;
}

async function updateRequestStatus(requestId: string, status: MvpRequestStatus, adminToken: string) {
  return requestJson<MvpRequestStatusResponse>(
    `/mvp/dev/requests/${encodeURIComponent(requestId)}/status`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    },
    { Authorization: `Bearer ${adminToken}` },
  );
}

async function updateDbRequestStatus(id: string, status: MvpDbStatus, adminToken: string) {
  return requestJson<MvpDbRequestRecord>(
    `/mvp/admin/requests/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    },
    { Authorization: `Bearer ${adminToken}` },
  );
}

async function loadClinicRequests(clinicId: string) {
  const response = await requestJson<MvpDbRequestListResponse>("/mvp/clinic/requests", undefined, {
    "X-Clinic-Id": clinicId,
  });

  return response.requests;
}

async function updateClinicRequestStatus(id: string, status: MvpDbStatus, clinicId: string) {
  return requestJson<MvpDbRequestRecord>(
    `/mvp/clinic/requests/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    },
    { "X-Clinic-Id": clinicId },
  );
}

// ─── Auth gate component ─────────────────────────────────────────────────────

interface AuthGateProps {
  storageKey: string;
  label: string;
  onAuth: (token: string) => void;
}

function AuthGate({ storageKey, label, onAuth }: AuthGateProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // If VITE token is pre-configured, auto-authenticate
  useEffect(() => {
    const preset =
      storageKey === "nadom_admin_token" ? configuredAdminToken : configuredClinicToken;

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
          <input
            autoComplete="current-password"
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Введите токен"
            ref={inputRef}
            type="password"
            value={input}
          />
        </label>
        {error ? <p className="auth-error">Укажите токен доступа</p> : null}
        <button type="submit">Войти</button>
      </form>
    </div>
  );
}

// ─── Route helpers ────────────────────────────────────────────────────────────

function routeTitle(pathname: string) {
  if (pathname.startsWith("/clinic")) {
    return "Кабинет медслужбы";
  }

  if (pathname.startsWith("/admin")) {
    return "Надом Admin";
  }

  return "Надом Preview Dashboard";
}

function routeDescription(pathname: string) {
  if (pathname.startsWith("/clinic")) {
    return "Экран для уполномоченных сотрудников медслужбы.";
  }

  if (pathname.startsWith("/admin")) {
    return "Внутренний экран для управления заявками.";
  }

  return "Выберите маршрут /admin или /clinic.";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

// ─── Admin view ───────────────────────────────────────────────────────────────

function AdminView() {
  const storageKey = "nadom_admin_token";
  const [token, setToken] = useState(() => readStoredToken(storageKey));
  const [requests, setRequests] = useState<MvpRequestRecord[]>([]);
  const [dbRequests, setDbRequests] = useState<MvpDbRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const isConfigured = Boolean(apiBaseUrl);

  function handleAuth(newToken: string) {
    setToken(newToken);
  }

  async function refreshRequests(authToken: string) {
    if (!isConfigured) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const [legacy, db] = await Promise.allSettled([
        loadRequests(authToken),
        loadDbRequests(authToken),
      ]);

      if (legacy.status === "fulfilled") {
        setRequests(legacy.value);
      }

      if (db.status === "fulfilled") {
        setDbRequests(db.value);
      } else {
        // DB might not be migrated yet — show a note but don't fail hard
        setMessage("Postgres-заявки недоступны (проверьте миграции). Показаны preview-заявки из памяти.");
      }
    } catch {
      setMessage("Не удалось загрузить заявки. Проверьте VITE_API_BASE_URL и токен.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      void refreshRequests(token);
    }
  }, [token, isConfigured]);

  async function changeStatus(request: MvpRequestRecord, status: MvpRequestStatus) {
    setUpdatingId(request.requestId);
    setMessage(null);

    try {
      const response = await updateRequestStatus(request.requestId, status, token);

      setRequests((current) =>
        current.map((item) =>
          item.requestId === request.requestId
            ? { ...item, status: response.status, updatedAt: response.updatedAt }
            : item,
        ),
      );
    } catch {
      setMessage("Не удалось обновить статус preview-заявки.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function changeDbStatus(req: MvpDbRequestRecord, status: MvpDbStatus) {
    setUpdatingId(req.id);
    setMessage(null);

    try {
      const updated = await updateDbRequestStatus(req.id, status, token);

      setDbRequests((current) =>
        current.map((item) => (item.id === req.id ? updated : item)),
      );
    } catch {
      setMessage("Не удалось обновить статус Postgres-заявки.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!token) {
    return <AuthGate storageKey={storageKey} label="Вход в Надом Admin" onAuth={handleAuth} />;
  }

  return (
    <section className="dashboard-card">
      <div className="dashboard-toolbar">
        <div>
          <p className="meta-label">Заявки (Postgres)</p>
          <h2>DB-заявки</h2>
          <p>Заявки, сохранённые в Postgres. Статус обновляется здесь и остаётся после перезапуска.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button disabled={isLoading} onClick={() => void refreshRequests(token)} type="button">
            {isLoading ? "Обновляем…" : "Обновить"}
          </button>
          <button
            onClick={() => {
              writeStoredToken(storageKey, "");
              setToken("");
              setRequests([]);
              setDbRequests([]);
            }}
            type="button"
          >
            Выйти
          </button>
        </div>
      </div>

      {message ? <p className="dashboard-message">{message}</p> : null}

      {dbRequests.length === 0 && !isLoading ? (
        <div className="dashboard-empty-list">
          <p className="meta-label">Пусто</p>
          <h3>Postgres-заявок пока нет</h3>
          <p>Создайте заявку в Mini App, затем обновите список.</p>
        </div>
      ) : null}

      <div className="request-list">
        {dbRequests.map((req) => (
          <article className="request-card" key={req.id}>
            <div className="request-card__head">
              <div>
                <span className="request-id">{req.id}</span>
                <h3>{offerName(req.offerId)}</h3>
              </div>
              <strong className={`status-pill status-pill--${req.status.toLowerCase()}`}>
                {dbStatusLabels[req.status]}
              </strong>
            </div>

            <dl className="request-fields">
              <div><dt>Район</dt><dd>{req.district}</dd></div>
              <div><dt>Время</dt><dd>{req.desiredTime}</dd></div>
              <div><dt>Формат</dt><dd>{req.profile}</dd></div>
              {req.priceMin !== null ? (
                <div><dt>Стоимость</dt><dd>{req.priceMin} – {req.priceMax} {req.priceCurrency}</dd></div>
              ) : null}
              {req.etaMinutes !== null ? (
                <div><dt>ETA</dt><dd>{req.etaMinutes} мин</dd></div>
              ) : null}
              <div><dt>Обновлено</dt><dd>{formatDate(req.updatedAt)}</dd></div>
            </dl>

            <div className="status-actions" aria-label="Изменить статус заявки">
              {dbStatusOrder.map((status) => (
                <button
                  disabled={updatingId === req.id || req.status === status}
                  key={status}
                  onClick={() => void changeDbStatus(req, status)}
                  type="button"
                >
                  {dbStatusLabels[status]}
                </button>
              ))}
              {req.clinicId ? (
                <a
                  className="button button--ghost"
                  href={`/admin/onboarding/${encodeURIComponent(req.clinicId)}`}
                  style={{ fontSize: "0.8rem" }}
                >
                  Анкета медслужбы
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {requests.length > 0 ? (
        <>
          <div className="dashboard-toolbar" style={{ marginTop: "24px" }}>
            <div>
              <p className="meta-label">Preview-заявки (в памяти)</p>
              <h2>In-memory заявки</h2>
              <p>Сбрасываются при перезапуске API. Для совместимости с предыдущей версией.</p>
            </div>
          </div>

          <div className="request-list">
            {requests.map((request) => (
              <article className="request-card" key={request.requestId}>
                <div className="request-card__head">
                  <div>
                    <span className="request-id">{request.requestId}</span>
                    <h3>{offerName(request.offerId)}</h3>
                  </div>
                  <strong className={`status-pill status-pill--${request.status}`}>{statusLabels[request.status]}</strong>
                </div>

                <dl className="request-fields">
                  <div><dt>Район</dt><dd>{request.district}</dd></div>
                  <div><dt>Время</dt><dd>{request.desiredTime}</dd></div>
                  <div><dt>Формат</dt><dd>{request.profile}</dd></div>
                  <div><dt>Обновлено</dt><dd>{formatDate(request.updatedAt)}</dd></div>
                </dl>

                <div className="status-actions" aria-label="Изменить статус заявки">
                  {statusOrder.map((status) => (
                    <button
                      disabled={updatingId === request.requestId || request.status === status}
                      key={status}
                      onClick={() => void changeStatus(request, status)}
                      type="button"
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

// ─── Clinic view ──────────────────────────────────────────────────────────────

function ClinicView() {
  const storageKey = "nadom_clinic_token";
  const [clinicId, setClinicId] = useState(() => readStoredToken(storageKey));
  const [requests, setRequests] = useState<MvpDbRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const isConfigured = Boolean(apiBaseUrl);

  function handleAuth(token: string) {
    setClinicId(token);
  }

  async function changeClinicStatus(req: MvpDbRequestRecord, status: MvpDbStatus) {
    setUpdatingId(req.id);
    setMessage(null);

    try {
      const updated = await updateClinicRequestStatus(req.id, status, clinicId);

      setRequests((current) => current.map((item) => (item.id === req.id ? updated : item)));
    } catch {
      setMessage("Не удалось обновить статус. Проверьте подключение.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function refreshRequests(id: string) {
    if (!isConfigured) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const loaded = await loadClinicRequests(id);

      setRequests(loaded);
    } catch {
      setMessage("Не удалось загрузить заявки. Проверьте ID медслужбы и настройки API.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (clinicId) {
      void refreshRequests(clinicId);
    }
  }, [clinicId, isConfigured]);

  if (!clinicId) {
    return (
      <AuthGate
        storageKey={storageKey}
        label="Кабинет медслужбы — вход"
        onAuth={handleAuth}
      />
    );
  }

  return (
    <section className="dashboard-card">
      <div className="dashboard-toolbar">
        <div>
          <p className="meta-label">Медслужба: {clinicId}</p>
          <h2>Заявки вашей медслужбы</h2>
          <p>Заявки, направленные выбранной медслужбе. Без телефона, адреса и личных данных пациента.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button disabled={isLoading} onClick={() => void refreshRequests(clinicId)} type="button">
            {isLoading ? "Обновляем…" : "Обновить"}
          </button>
          <button
            onClick={() => {
              writeStoredToken(storageKey, "");
              setClinicId("");
              setRequests([]);
            }}
            type="button"
          >
            Выйти
          </button>
        </div>
      </div>

      {message ? <p className="dashboard-message">{message}</p> : null}

      {requests.length === 0 && !isLoading ? (
        <div className="dashboard-empty-list">
          <p className="meta-label">Пусто</p>
          <h3>Заявок для этой медслужбы пока нет</h3>
          <p>Создайте заявку в Mini App с выбором этой медслужбы.</p>
        </div>
      ) : null}

      <div className="request-list">
        {requests.map((req) => (
          <article className="request-card" key={req.id}>
            <div className="request-card__head">
              <div>
                <span className="request-id">{req.id}</span>
                <h3>{offerName(req.offerId)}</h3>
              </div>
              <strong className={`status-pill status-pill--${req.status.toLowerCase()}`}>
                {dbStatusLabels[req.status]}
              </strong>
            </div>

            <dl className="request-fields">
              <div><dt>Район</dt><dd>{req.district}</dd></div>
              <div><dt>Время</dt><dd>{req.desiredTime}</dd></div>
              <div><dt>Формат</dt><dd>{req.profile}</dd></div>
              <div><dt>Создана</dt><dd>{formatDate(req.createdAt)}</dd></div>
            </dl>

            <div className="status-actions" aria-label="Изменить статус заявки">
              {dbStatusOrder.map((status) => (
                <button
                  disabled={updatingId === req.id || req.status === status}
                  key={status}
                  onClick={() => void changeClinicStatus(req, status)}
                  type="button"
                >
                  {dbStatusLabels[status]}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── Onboarding view ──────────────────────────────────────────────────────────

function OnboardingView({ clinicId }: { clinicId: string }) {
  const [adminToken, setAdminToken] = useState(() => readStoredToken("nadom_admin_token"));
  const storageKey = "nadom_admin_token";

  const handleAuth = useCallback((token: string) => {
    setAdminToken(token);
  }, []);

  if (!adminToken) {
    return <AuthGate storageKey={storageKey} label="Вход в Надом Admin" onAuth={handleAuth} />;
  }

  return (
    <section className="dashboard-card">
      <a href="/admin" className="back-link">← Назад к заявкам</a>
      <OnboardingForm adminToken={adminToken} apiBaseUrl={apiBaseUrl} clinicId={clinicId} />
    </section>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export function App() {
  const pathname = window.location.pathname;
  const isConfigured = Boolean(apiBaseUrl);
  const title = useMemo(() => routeTitle(pathname), [pathname]);
  const description = useMemo(() => routeDescription(pathname), [pathname]);

  const isAdmin = pathname.startsWith("/admin");
  const isClinic = pathname.startsWith("/clinic");
  const onboardingMatch = pathname.match(/^\/admin\/onboarding\/([^/]+)$/u);
  const onboardingClinicId = onboardingMatch?.[1] ? decodeURIComponent(onboardingMatch[1]) : null;

  return (
    <main className="dashboard-shell">
      <section className="dashboard-frame" aria-labelledby="dashboard-title">
        <header className="dashboard-header">
          <BrandMark />
          <p className="dashboard-kicker">Надом · операционная панель</p>
          <h1 id="dashboard-title">{title}</h1>
          <p>{description}</p>
          <nav aria-label="Маршруты dashboard">
            <a href="/admin">/admin</a>
            <a href="/clinic">/clinic</a>
          </nav>
        </header>

        {!isConfigured ? (
          <section className="dashboard-card dashboard-card--empty">
            <p className="meta-label">Настройка</p>
            <h2>API не подключён</h2>
            <p>Укажите VITE_API_BASE_URL, чтобы подключить API.</p>
          </section>
        ) : onboardingClinicId ? (
          <OnboardingView clinicId={onboardingClinicId} />
        ) : isAdmin ? (
          <AdminView />
        ) : isClinic ? (
          <ClinicView />
        ) : (
          <section className="dashboard-card dashboard-card--empty">
            <p className="meta-label">Маршрут</p>
            <h2>Выберите маршрут</h2>
            <p>Перейдите на <a href="/admin">/admin</a> или <a href="/clinic">/clinic</a>.</p>
          </section>
        )}
      </section>
    </main>
  );
}
