import { MVP_SERVICE_CATALOG } from "@ivhome/shared";
import type { Offer, OfferView, Step, SymbolTone } from "./types";

export const STEPS: Step[] = [
  {
    id: "welcome",
    eyebrow: "без лишних данных · быстро · удобно",
    title: "Кто приедет, когда и за сколько",
    body: [
      "Подбор медслужбы с выездом на дом в Москве — без лишних звонков.",
      "Сравните, кто ответит и приедет, и сколько это стоит. Детали подтверждает выбранная медслужба.",
    ],
    iconLabel: "welcome",
  },
  {
    id: "consent",
    eyebrow: "шаг 1 из 6",
    title: "Пара слов о сервисе",
    body: [
      "Надом — это подбор медслужбы. Сами медицинские услуги оказывает выбранная медслужба.",
      "Для подбора нужны район, удобное время и формат запроса. Точный адрес и телефон сейчас не нужны.",
    ],
    iconLabel: "privacy",
  },
  {
    id: "emergency",
    eyebrow: "шаг 2 из 6",
    title: "Если состояние острое",
    body: [
      "Надом не оценивает тяжесть состояния. При острых симптомах звоните 103 или 112 — это быстрее, чем выезд на дом.",
      "Если всё спокойно — продолжайте подбор. Возможность помощи подтверждает выбранная медслужба.",
    ],
    iconLabel: "signal",
  },
  {
    id: "profile",
    eyebrow: "шаг 3 из 6",
    title: "Чем помочь?",
    body: ["Выберите подходящий формат. Медицинские детали сейчас не нужны."],
    iconLabel: "route",
  },
  {
    id: "location",
    eyebrow: "шаг 4 из 6",
    title: "Где нужен выезд?",
    body: ["Достаточно района или округа.", "Точный адрес сейчас не нужен."],
    iconLabel: "location",
  },
  {
    id: "time",
    eyebrow: "шаг 5 из 6",
    title: "Когда нужен выезд?",
    body: [
      "Выберите удобный ориентир.",
      "Время прибытия отдельно подтвердит выбранная медслужба.",
    ],
    iconLabel: "time",
  },
  {
    id: "offers",
    eyebrow: "шаг 6 из 6",
    title: "Подходящие варианты",
    body: [
      "Нашли варианты под ваш район и время.",
      "Сравните, когда ответят и приедут, и ориентировочную стоимость.",
    ],
    iconLabel: "offers",
  },
];

export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Это скорая помощь?",
    a: "Нет. Надом подбирает медицинскую организацию для планового выезда на дом. При острых симптомах звоните 103 или 112 — это быстрее.",
  },
  {
    q: "Кто приедет?",
    a: "Специалист выбранной вами медслужбы. Показываем варианты с проверенной лицензией.",
  },
  {
    q: "Сколько это стоит?",
    a: "Ориентир по стоимости видно ещё до заявки. Итоговую сумму подтверждает выбранная медслужба перед выездом.",
  },
  {
    q: "Какие данные нужны?",
    a: "Для подбора хватает района и времени — без точного адреса и звонков. Данные для выезда выбранная медслужба запросит только после того, как вы подтвердите заявку.",
  },
  {
    q: "Как быстро приедут?",
    a: "У каждой медслужбы видно, когда ответят и когда приедут. Точное время прибытия подтверждает выбранная медслужба.",
  },
];

export const PROFILE_OPTIONS = [
  "Найти ближайший вариант",
  "Сравнить условия выезда",
  "Сначала задать вопрос специалисту",
  "Планирую выезд заранее",
];

export const DISTRICT_OPTIONS = [
  "ЦАО",
  "САО",
  "СВАО",
  "ВАО",
  "ЮВАО",
  "ЮАО",
  "ЮЗАО",
  "ЗАО",
  "СЗАО",
  "Новая Москва",
];

export const TIME_OPTIONS = ["Как можно скорее", "Сегодня", "Завтра", "Выбрать время позже"];

export const FALLBACK_OFFERS: Offer[] = [
  {
    id: "medservice-north",
    name: "Медслужба «Север»",
    status: "лицензия проверена",
    zone: "САО · СЗАО · рядом",
    responseTime: "~10 мин",
    arrivalTime: "~40 мин",
    price: "от 8 500 ₽",
    finalPrice: "9 200 ₽",
    rating: "4.8",
    conditions: ["выезд после подтверждения", "условия можно уточнить в чате"],
    note: "Детали и стоимость подтверждает выбранная медслужба.",
    services: MVP_SERVICE_CATALOG,
  },
  {
    id: "medservice-center",
    name: "Медслужба «Центр»",
    status: "лицензия проверена",
    zone: "ЦАО · ЗАО · ЮЗАО",
    responseTime: "~15 мин",
    arrivalTime: "~55 мин",
    price: "от 9 200 ₽",
    finalPrice: "10 400 ₽",
    rating: "4.7",
    conditions: ["работает по зонам выезда", "стоимость подтвердят до выезда"],
    note: "Детали и стоимость подтверждает выбранная медслужба.",
    services: MVP_SERVICE_CATALOG,
  },
  {
    id: "medservice-night",
    name: "Медслужба «Ночь»",
    status: "проверена · принимает заявки",
    zone: "Москва · по зонам выезда",
    responseTime: "~20 мин",
    arrivalTime: "~70 мин",
    price: "от 10 500 ₽",
    finalPrice: "11 300 ₽",
    rating: "4.6",
    conditions: ["доступна в позднее время", "время зависит от зоны выезда"],
    note: "Детали и стоимость подтверждает выбранная медслужба.",
    services: MVP_SERVICE_CATALOG,
  },
];

export const STATUS_ITEMS = [
  "Заявка создана",
  "Передали выбранной медслужбе",
  "Ждём подтверждение",
  "Организация подтвердила",
  "Стоимость подтверждена",
  "Специалист выехал",
  "Завершено",
];

export const OFFER_VIEWS: OfferView[] = [
  "details",
  "service",
  "custom",
  "chat",
  "confirmation",
  "status",
  "price-lock",
  "dispatched",
  "completed",
  "feedback",
  "support",
];

export const OFFERS_STEP_INDEX = STEPS.findIndex((step) => step.id === "offers");
export const PROFILE_STEP_INDEX = STEPS.findIndex((step) => step.id === "profile");
export const TIME_STEP_INDEX = STEPS.findIndex((step) => step.id === "time");

export const SYMBOL_TONES: Record<
  SymbolTone,
  { stroke: string; fill: string; dot: string; arc: string }
> = {
  default: {
    stroke: "#4A7FA5",
    fill: "rgba(74,127,165,0.08)",
    dot: "#4A7FA5",
    arc: "#7EB8D4",
  },
  emergency: {
    stroke: "#8A3030",
    fill: "rgba(138,48,48,0.06)",
    dot: "#8A3030",
    arc: "rgba(138,48,48,0.35)",
  },
  offers: {
    stroke: "#3A8A82",
    fill: "rgba(58,138,130,0.06)",
    dot: "#3A8A82",
    arc: "rgba(58,138,130,0.35)",
  },
  welcome: {
    stroke: "#4A7FA5",
    fill: "rgba(74,127,165,0.08)",
    dot: "#4A7FA5",
    arc: "rgba(126,184,212,0.35)",
  },
};
