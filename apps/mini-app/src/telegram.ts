// Lightweight, feature-detected Telegram Mini App integration.
// Every call is a no-op outside Telegram (local dev, plain web), so the app
// keeps working everywhere and never throws if the SDK is absent.

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type HapticNotice = "error" | "success" | "warning";

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  themeParams?: Record<string, string>;
  colorScheme?: "light" | "dark";
  HapticFeedback?: {
    impactOccurred: (style: HapticStyle) => void;
    notificationOccurred: (type: HapticNotice) => void;
    selectionChanged: () => void;
  };
};

function getWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") {
    return null;
  }

  const telegram = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram;
  return telegram?.WebApp ?? null;
}

/**
 * Expand to full height, signal readiness, and mirror Telegram theme tokens
 * onto CSS custom properties so the UI matches the user's light/dark theme.
 */
export function initTelegram(): void {
  const webApp = getWebApp();
  if (!webApp) {
    return;
  }

  try {
    webApp.ready();
    webApp.expand();

    const theme = webApp.themeParams ?? {};
    const root = document.documentElement;
    if (theme.bg_color) {
      root.style.setProperty("--tg-bg", theme.bg_color);
    }
    if (theme.text_color) {
      root.style.setProperty("--tg-text", theme.text_color);
    }
    if (webApp.colorScheme) {
      root.dataset.tgScheme = webApp.colorScheme;
    }
  } catch {
    // Never let optional chrome integration break the app.
  }
}

/** Subtle tactile feedback on a meaningful tap (selection, primary action). */
export function haptic(style: HapticStyle = "light"): void {
  try {
    getWebApp()?.HapticFeedback?.impactOccurred(style);
  } catch {
    // ignore
  }
}

/** Feedback for an outcome: success / warning / error. */
export function hapticNotice(type: HapticNotice): void {
  try {
    getWebApp()?.HapticFeedback?.notificationOccurred(type);
  } catch {
    // ignore
  }
}
