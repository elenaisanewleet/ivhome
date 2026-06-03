import type { MvpDbStatus, MvpRequestStatus } from "@ivhome/shared";

import { OFFER_VIEWS, STEPS } from "./data";
import type { OfferView, PreviewId } from "./types";

export function getStep(index: number) {
  return STEPS[index] ?? STEPS[0]!;
}

export function readPreviewId(): PreviewId | null {
  if (typeof window === "undefined") {
    return null;
  }

  const preview = new URLSearchParams(window.location.search).get("preview");
  const availablePreviews: PreviewId[] = ["offers", "ready", "empty", "error", ...OFFER_VIEWS];

  return availablePreviews.includes(preview as PreviewId) ? (preview as PreviewId) : null;
}

export function isOfferView(preview: PreviewId | null): preview is OfferView {
  return OFFER_VIEWS.includes(preview as OfferView);
}

export function offerViewForStatus(status: MvpRequestStatus): OfferView {
  return status === "waiting" ? "status" : status;
}

export function offerViewForDbStatus(status: MvpDbStatus): OfferView {
  switch (status) {
    case "WAITING":
      return "status";
    case "PRICE_LOCK":
      return "price-lock";
    case "DISPATCHED":
      return "dispatched";
    case "COMPLETED":
      return "completed";
    case "DECLINED":
      return "support";
  }
}

export function isLikelyMobileRuntime() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
