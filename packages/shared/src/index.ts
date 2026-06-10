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
  { slug: "custom", label: "Описать ситуацию", price: "по описанию ситуации" },
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

export type MvpDbStatus = "SUBMITTED" | "WAITING" | "PRICE_LOCK" | "DISPATCHED" | "COMPLETED" | "DECLINED";
export type MvpChatActorType = "USER" | "CLINIC" | "ADMIN";
export type MvpOnboardingStatus = "DRAFT" | "SUBMITTED" | "APPROVED";

export type MvpDbRequest = {
  id: string;
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
  userFacingStatusText?: string;
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
  serviceSlug?: string;
  serviceLabel?: string;
  servicePrice?: string;
  customRequest?: string;
  customImportant?: string;
  budget?: string;
  comment?: string;
  anonymousSessionId?: string;
  telegramUserId?: string;
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

// ─── Nadom Design System v6 — shared domain types ───────────────────────────

/** Fixed first-screen service categories (ToV §8). Never add VIP/Премиум/Свой запрос. */
export type NadomServiceCategory =
  | "binge_withdrawal"
  | "alcohol_drip"
  | "narcologist_home"
  | "detox"
  | "describe_situation";

export const NADOM_SERVICE_CATEGORIES: ReadonlyArray<{
  slug: NadomServiceCategory;
  label: string;
  sub: string;
}> = [
  { slug: "binge_withdrawal",   label: "Вывод из запоя",            sub: "помощь при длительном употреблении алкоголя" },
  { slug: "alcohol_drip",       label: "Капельница после алкоголя", sub: "если плохо после алкоголя или тяжёлое похмелье" },
  { slug: "narcologist_home",   label: "Нарколог на дом",           sub: "консультация и выезд специалиста" },
  { slug: "detox",              label: "Детокс",                    sub: "восстановление после интоксикации" },
  { slug: "describe_situation", label: "Описать ситуацию",          sub: "если не знаете, что выбрать" },
] as const;

/** Allowed clinic package names (ToV §11). VIP / Премиум / Элитный are forbidden. */
export type ClinicPackageName =
  | "Лайт"
  | "Стандарт"
  | "Расширенный"
  | "Интенсив"
  | "Максимум"
  | "Комплексный"
  | "Детокс"
  | "Детокс+"
  | "Двойное очищение"
  | "Двойное очищение+"
  | "Тройное очищение";

/** SLA is always two separate values — never a merged single ETA. */
export type SlaMetrics = {
  responseMinutes: [min: number, max: number];
  arrivalMinutes:  [min: number, max: number];
};

/** Request lifecycle statuses (ToV §20). */
export type NadomRequestStatus =
  | "submitted"
  | "confirming"
  | "dispatched"
  | "en_route"
  | "arrived"
  | "completed";

export const NADOM_REQUEST_STATUS_LABELS: Record<NadomRequestStatus, { label: string; sub: string }> = {
  submitted:  { label: "Заявка отправлена",           sub: "Мы передали запрос выбранной клинике." },
  confirming: { label: "Клиника подтверждает детали", sub: "Специалист проверяет возможность выезда и уточняет условия." },
  dispatched: { label: "Бригада выезжает",            sub: "Выезд подтверждён. Ожидаемое время приезда указано ниже." },
  en_route:   { label: "Специалист в пути",           sub: "Бригада едет к вам." },
  arrived:    { label: "На месте",                    sub: "Специалист прибыл." },
  completed:  { label: "Завершено",                   sub: "Заявка закрыта. Можно оставить анонимную оценку." },
};

/** Trust badge values used on clinic cards and trust strips. */
export type NadomTrustBadge =
  | "license_verified"
  | "available_24_7"
  | "anonymous_start"
  | "no_docs_at_start"
  | "no_extra_data"
  | "address_after_confirm";

export const NADOM_TRUST_BADGE_LABELS: Record<NadomTrustBadge, string> = {
  license_verified:      "Лицензия подтверждена",
  available_24_7:        "24/7",
  anonymous_start:       "Анонимно на старте",
  no_docs_at_start:      "Без документов на старте",
  no_extra_data:         "Без лишних данных",
  address_after_confirm: "Точный адрес — после выбора клиники",
};
