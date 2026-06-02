import type {
  MvpOffer,
  MvpOffersResponse,
  MvpRequestCreateInput,
  MvpRequestCreateResponse,
  MvpRequestStatusResponse,
} from "@ivhome/shared";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/u, "");

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, options);

  if (!response.ok) {
    throw new Error(`Nadom API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function isApiConfigured() {
  return Boolean(apiBaseUrl);
}

export function readSupportUrl() {
  const value = import.meta.env.VITE_SUPPORT_URL;

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function loadOffers(fallbackOffers: MvpOffer[]) {
  if (!isApiConfigured()) {
    return fallbackOffers;
  }

  const response = await requestJson<MvpOffersResponse>("/mvp/dev/offers");

  return response.offers;
}

export async function createMvpRequest(input: MvpRequestCreateInput) {
  if (!isApiConfigured()) {
    return {
      requestId: `local-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      status: "waiting",
      updatedAt: new Date().toISOString(),
    } satisfies MvpRequestCreateResponse;
  }

  return requestJson<MvpRequestCreateResponse>("/mvp/dev/requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function loadMvpRequestStatus(requestId: string) {
  if (!isApiConfigured()) {
    return {
      requestId,
      status: "price-lock",
      updatedAt: new Date().toISOString(),
    } satisfies MvpRequestStatusResponse;
  }

  return requestJson<MvpRequestStatusResponse>(`/mvp/dev/requests/${encodeURIComponent(requestId)}/status`);
}
