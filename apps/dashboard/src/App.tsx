import { useEffect, useMemo, useState } from "react";

import "./App.css";

type MvpRequestStatus = "waiting" | "price-lock" | "dispatched" | "completed";

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

type MvpRequestListResponse = {
  requests: MvpRequestRecord[];
};

type MvpRequestStatusResponse = {
  requestId: string;
  status: MvpRequestStatus;
  updatedAt: string;
};

const statusLabels = {
  waiting: "Ожидаем",
  "price-lock": "Стоимость подтверждена",
  dispatched: "Специалист выехал",
  completed: "Завершено",
} satisfies Record<MvpRequestStatus, string>;

const statusOrder: MvpRequestStatus[] = ["waiting", "price-lock", "dispatched", "completed"];

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/u, "");

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, options);

  if (!response.ok) {
    throw new Error(`Nadom dashboard request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function loadRequests() {
  const response = await requestJson<MvpRequestListResponse>("/mvp/dev/requests");

  return response.requests;
}

async function updateRequestStatus(requestId: string, status: MvpRequestStatus) {
  return requestJson<MvpRequestStatusResponse>(`/mvp/dev/requests/${encodeURIComponent(requestId)}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

function routeTitle(pathname: string) {
  if (pathname === "/clinic") {
    return "Кабинет медслужбы";
  }

  if (pathname === "/admin") {
    return "Надом Admin";
  }

  return "Надом Preview Dashboard";
}

function routeDescription(pathname: string) {
  if (pathname === "/clinic") {
    return "Preview-кабинет для уполномоченных сотрудников медслужбы.";
  }

  if (pathname === "/admin") {
    return "Внутренний preview-экран для ручной проверки статусов заявок.";
  }

  return "Выберите маршрут /admin или /clinic. В preview оба маршрута показывают один список заявок.";
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

export function App() {
  const [requests, setRequests] = useState<MvpRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const pathname = window.location.pathname;
  const isConfigured = Boolean(apiBaseUrl);
  const title = useMemo(() => routeTitle(pathname), [pathname]);
  const description = useMemo(() => routeDescription(pathname), [pathname]);

  async function refreshRequests() {
    if (!isConfigured) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      setRequests(await loadRequests());
    } catch {
      setMessage("Не удалось загрузить preview-заявки. Проверьте VITE_API_BASE_URL и ENABLE_MVP_DEV_API=true на API.");
    } finally {
      setIsLoading(false);
    }
  }

  async function changeStatus(request: MvpRequestRecord, status: MvpRequestStatus) {
    setUpdatingRequestId(request.requestId);
    setMessage(null);

    try {
      const response = await updateRequestStatus(request.requestId, status);

      setRequests((current) =>
        current.map((item) =>
          item.requestId === request.requestId
            ? {
                ...item,
                status: response.status,
                updatedAt: response.updatedAt,
              }
            : item,
        ),
      );
    } catch {
      setMessage("Не удалось обновить статус preview-заявки.");
    } finally {
      setUpdatingRequestId(null);
    }
  }

  useEffect(() => {
    void refreshRequests();
  }, [isConfigured]);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <p className="dashboard-kicker">Надом · controlled preview</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <nav aria-label="Маршруты dashboard">
          <a href="/admin">/admin</a>
          <a href="/clinic">/clinic</a>
        </nav>
      </header>

      {!isConfigured ? (
        <section className="dashboard-card dashboard-card--empty">
          <h2>Preview API не подключён</h2>
          <p>Укажите VITE_API_BASE_URL, чтобы подключить preview API.</p>
        </section>
      ) : (
        <section className="dashboard-card">
          <div className="dashboard-toolbar">
            <div>
              <h2>Preview-заявки</h2>
              <p>Только минимальные поля: район, время, формат запроса и статус. Без телефона, адреса, меддеталей и чата.</p>
            </div>
            <button disabled={isLoading} onClick={() => void refreshRequests()} type="button">
              {isLoading ? "Обновляем…" : "Обновить"}
            </button>
          </div>

          {message ? <p className="dashboard-message">{message}</p> : null}

          {requests.length === 0 && !isLoading ? (
            <div className="dashboard-empty-list">
              <h3>Заявок пока нет</h3>
              <p>Создайте заявку в Mini App, затем обновите список.</p>
            </div>
          ) : null}

          <div className="request-list">
            {requests.map((request) => (
              <article className="request-card" key={request.requestId}>
                <div className="request-card__head">
                  <div>
                    <span className="request-id">{request.requestId}</span>
                    <h3>{request.offerId}</h3>
                  </div>
                  <strong className={`status-pill status-pill--${request.status}`}>{statusLabels[request.status]}</strong>
                </div>

                <dl className="request-fields">
                  <div>
                    <dt>Район</dt>
                    <dd>{request.district}</dd>
                  </div>
                  <div>
                    <dt>Время</dt>
                    <dd>{request.desiredTime}</dd>
                  </div>
                  <div>
                    <dt>Формат</dt>
                    <dd>{request.profile}</dd>
                  </div>
                  <div>
                    <dt>Обновлено</dt>
                    <dd>{formatDate(request.updatedAt)}</dd>
                  </div>
                </dl>

                <div className="status-actions" aria-label="Изменить статус заявки">
                  {statusOrder.map((status) => (
                    <button
                      disabled={updatingRequestId === request.requestId || request.status === status}
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
        </section>
      )}
    </main>
  );
}
