export const PROJECT_NAME = "ivhome";

export type MvpServiceCategorySlug =
  | "alcohol_hangover"
  | "binge_or_near_binge"
  | "intoxication"
  | "urgent_visit"
  | "planned_visit"
  | "custom";

export type MvpOfferService = {
  slug: MvpServiceCategorySlug;
  label: string;
  shortLabel: string;
  priceRange: string;
  description: string;
};

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
  services: MvpOfferService[];
};


export const MVP_SERVICE_CATALOG = [
  {
    slug: "alcohol_hangover",
    label: "Плохо после алкоголя",
    shortLabel: "После алкоголя",
    priceRange: "8 500–12 000 ₽",
    description: "Нейтральный запрос на выезд. Детали и стоимость подтверждает выбранная медслужба.",
  },
  {
    slug: "binge_or_near_binge",
    label: "Запойная или около-запойная ситуация",
    shortLabel: "Запойная ситуация",
    priceRange: "от 11 000 ₽",
    description: "Седативные препараты — только по решению специалиста медслужбы и в рамках лицензии.",
  },
  {
    slug: "intoxication",
    label: "Интоксикация / отравление веществами",
    shortLabel: "Интоксикация",
    priceRange: "от 10 000 ₽",
    description: "Медслужба сама подтвердит возможность выезда и формат помощи.",
  },
  {
    slug: "urgent_visit",
    label: "Срочный неэкстренный выезд специалиста",
    shortLabel: "Срочный выезд",
    priceRange: "от 6 000 ₽",
    description: "Для ситуаций без признаков экстренной помощи 103/112.",
  },
  {
    slug: "planned_visit",
    label: "Плановый выезд специалиста",
    shortLabel: "Плановый выезд",
    priceRange: "от 5 500 ₽",
    description: "Плановый выезд в удобное время после подтверждения медслужбы.",
  },
  {
    slug: "custom",
    label: "Свой запрос",
    shortLabel: "Свой запрос",
    priceRange: "по согласованию",
    description: "Опишите нейтрально, что нужно уточнить у выбранной медслужбы.",
  },
] satisfies MvpOfferService[];

export type MvpOffersResponse = {
  offers: MvpOffer[];
};

export type MvpRequestCreateInput = {
  offerId: string;
  district: string;
  desiredTime: string;
  profile: string;
  serviceSlug?: MvpServiceCategorySlug;
  serviceLabel?: string;
  servicePrice?: string;
  customRequest?: string;
  customImportant?: string;
  budget?: string;
  comment?: string;
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
export type MvpOnboardingStatus = "DRAFT" | "SUBMITTED" | "APPROVED";

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

export type MvpDbRequestCreateInput = {
  offerId: string;
  clinicId?: string;
  district: string;
  desiredTime: string;
  profile: string;
  serviceSlug?: MvpServiceCategorySlug;
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
