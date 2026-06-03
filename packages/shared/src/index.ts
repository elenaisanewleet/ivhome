export const PROJECT_NAME = "ivhome";

export type MvpOffer = {
  id: string;
  name: string;
  status: string;
  zone: string;
  responseTime: string;
  arrivalTime: string;
  price: string;
  finalPrice: string;
  rating: string;
  conditions: string[];
  note: string;
};

export type MvpOffersResponse = {
  offers: MvpOffer[];
};

export type MvpRequestCreateInput = {
  offerId: string;
  district: string;
  desiredTime: string;
  profile: string;
};

export type MvpRequestStatus = "waiting" | "price-lock" | "dispatched" | "completed";

export type MvpRequestStatusResponse = {
  requestId: string;
  status: MvpRequestStatus;
  updatedAt: string;
};

export type MvpRequestRecord = MvpRequestCreateInput & {
  requestId: string;
  status: MvpRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type MvpRequestListResponse = {
  requests: MvpRequestRecord[];
};

export type MvpRequestStatusUpdateInput = {
  status: MvpRequestStatus;
};

export type MvpRequestCreateResponse = MvpRequestStatusResponse;

// ─── Persistent MVP types (Postgres-backed) ─────────────────────────────────

export type MvpDbStatus = "WAITING" | "PRICE_LOCK" | "DISPATCHED" | "COMPLETED" | "DECLINED";
export type MvpChatActorType = "USER" | "CLINIC" | "ADMIN";

export type MvpDbRequest = {
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

export type MvpDbRequestCreateInput = {
  offerId: string;
  clinicId?: string;
  district: string;
  desiredTime: string;
  profile: string;
};

export type MvpDbRequestStatusUpdateInput = {
  status: MvpDbStatus;
  priceMin?: number;
  priceMax?: number;
  etaMinutes?: number;
  notes?: string;
};

export type MvpChatMessage = {
  id: string;
  actorType: MvpChatActorType;
  body: string;
  createdAt: string;
};

export type MvpChatMessagesResponse = {
  messages: MvpChatMessage[];
};

export type MvpChatMessageCreateInput = {
  body: string;
  actorType: MvpChatActorType;
};

// Onboarding form data shape
export type MvpOnboardingData = {
  // A. Organization identity
  publicName?: string;
  legalName?: string;
  innPlaceholder?: string;
  operatingAreas?: string;
  // B. License info
  licenseNumber?: string;
  issuingAuthority?: string;
  issueDate?: string;
  registryUrl?: string;
  // C. Service capabilities
  operatingHours?: string;
  responseTimeMinutes?: number;
  arrivalTimeMinutes?: number;
  priceRangeMin?: number;
  priceRangeMax?: number;
  cancellationTerms?: string;
  // D. Case categories (accepted capability flags)
  acceptsHomeVisits?: boolean;
  acceptsNurseVisits?: boolean;
  acceptsIvReview?: boolean;
  otherCapabilities?: string;
  // E. Safety/escalation
  redFlagCriteria?: string;
  escalationPolicy?: string;
  // F. Privacy acknowledgment
  agreeNoUserDataSharing?: boolean;
  agreeNeutralNotificationsOnly?: boolean;
};
