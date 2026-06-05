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

export type MvpServiceCatalogItem = {
  slug: string;
  label: string;
  price: string;
};

export const MVP_SERVICE_CATALOG = [
  { slug: "alcohol_hangover", label: "После алкоголя", price: "от 8 500 ₽" },
  { slug: "binge_or_near_binge", label: "После длительного употребления", price: "от 10 500 ₽" },
  { slug: "intoxication", label: "Похоже на интоксикацию", price: "от 9 500 ₽" },
  { slug: "urgent_visit", label: "Нужен выезд сегодня", price: "от 9 900 ₽" },
  { slug: "planned_visit", label: "Плановый выезд", price: "от 7 500 ₽" },
  { slug: "custom", label: "Описать ситуацию", price: "по описанию запроса" },
] as const satisfies readonly MvpServiceCatalogItem[];

export type MvpServiceSlug = (typeof MVP_SERVICE_CATALOG)[number]["slug"];

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

export type MvpDbStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "MEDSERVICE_REVIEWING"
  | "MEDSERVICE_ANSWERED"
  | "PRICE_CONFIRMED"
  | "CONFIRMED"
  | "DISPATCHED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_ANSWER"
  | "WAITING"
  | "PRICE_LOCK"
  | "DECLINED";
export type MvpChatActorType = "USER" | "CLINIC" | "ADMIN";
export type MvpOnboardingStatus = "DRAFT" | "SUBMITTED" | "APPROVED";

export type MvpDbRequest = {
  id: string;
  telegramUserId: string | null;
  anonymousSessionId: string | null;
  offerId: string;
  clinicId: string | null;
  district: string;
  desiredTime: string;
  profile: string;
  serviceSlug: string;
  serviceLabel: string;
  servicePrice: string;
  customRequest: string | null;
  customImportant: string | null;
  budget: string | null;
  comment: string | null;
  status: MvpDbStatus;
  userFacingStatusText: string;
  priceMin: number | null;
  priceMax: number | null;
  confirmedPrice: number | null;
  priceCurrency: string;
  responseTimeEstimate: string | null;
  arrivalAfterConfirmationEstimate: string | null;
  etaMinutes: number | null;
  notes: string | null;
  internalNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MvpDbRequestCreateInput = {
  offerId: string;
  clinicId?: string;
  telegramUserId?: string;
  anonymousSessionId?: string;
  district: string;
  desiredTime: string;
  profile: string;
  serviceSlug?: string;
  serviceLabel?: string;
  servicePrice?: string;
  customRequest?: string;
  customImportant?: string;
  budget?: string;
  comment?: string;
};

export type MvpDbRequestStatusUpdateInput = {
  status: MvpDbStatus;
  priceMin?: number;
  priceMax?: number;
  confirmedPrice?: number;
  responseTimeEstimate?: string;
  arrivalAfterConfirmationEstimate?: string;
  etaMinutes?: number;
  notes?: string;
  internalNote?: string;
  clinicId?: string | null;
};

export type MvpDbRequestAssignmentInput = {
  clinicId: string | null;
};

export type MvpDbRequestPriceInput = {
  confirmedPrice?: number;
  priceMin?: number;
  priceMax?: number;
  responseTimeEstimate?: string;
  arrivalAfterConfirmationEstimate?: string;
  etaMinutes?: number;
  notes?: string;
  internalNote?: string;
};

export type MvpSupportMessageCreateInput = {
  body: string;
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

export type MvpChatMessagePublicCreateInput = {
  body: string;
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
  controlledMedicationPolicy?: string;
  // F. Privacy acknowledgment
  agreeNoUserDataSharing?: boolean;
  agreeNeutralNotificationsOnly?: boolean;
};

export type MvpOnboardingResponse = {
  id: string;
  clinicId: string;
  data?: MvpOnboardingData;
  status: MvpOnboardingStatus;
  submittedAt: string | null;
  updatedAt: string;
};
