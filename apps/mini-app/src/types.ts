import type { MvpOffer } from "@ivhome/shared";

export type StepId = "welcome" | "consent" | "emergency" | "profile" | "location" | "time" | "offers";

export type OfferView =
  | "details"
  | "chat"
  | "confirmation"
  | "status"
  | "price-lock"
  | "dispatched"
  | "completed"
  | "feedback"
  | "support";

export type OffersMode = "ready" | "empty" | "error";

export type PreviewId = "offers" | OffersMode | OfferView;

export type Step = {
  id: StepId;
  eyebrow: string;
  title: string;
  body: string[];
  iconLabel: string;
};

export type Offer = MvpOffer;

export type ChatMessage = {
  id: string;
  text: string;
};

export type StatusStage = "waiting" | "price-lock" | "dispatched" | "completed";

export type SymbolTone = "default" | "emergency" | "offers" | "welcome";
