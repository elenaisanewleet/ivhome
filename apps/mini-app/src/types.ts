import type { MvpChatActorType, MvpOffer } from "@ivhome/shared";

export type StepId = "welcome" | "consent" | "emergency" | "profile" | "location" | "time" | "offers";

export type OfferView =
  | "details"
  | "service"
  | "custom"
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

export type OfferServiceSlug =
  | "alcohol_hangover"
  | "binge_or_near_binge"
  | "intoxication"
  | "urgent_visit"
  | "planned_visit"
  | "custom";

export type OfferService = {
  slug: OfferServiceSlug;
  label: string;
  shortLabel: string;
  priceRange: string;
  description: string;
};

export type Offer = MvpOffer & {
  services: OfferService[];
};

export type ChatMessage = {
  id: string;
  actorType: MvpChatActorType;
  text: string;
  createdAt: string;
};

export type StatusStage = "waiting" | "price-lock" | "dispatched" | "completed";

export type SymbolTone = "default" | "emergency" | "offers" | "welcome";
