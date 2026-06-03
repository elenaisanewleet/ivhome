// Lightweight, feature-detected Telegram Mini App integration.
// Every call is a no-op outside Telegram (local dev, plain web), so the app
// keeps working everywhere and never throws if the SDK is absent.

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type HapticNotice = "error" | "success" | "warning";

type TgButton = {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => TgButton;
  onClick: (fn: () => void) => TgButton;
  offClick: (fn: () => void) => TgButton;
  show: () => TgButton;
  hide: () => TgButton;
  enable: () => TgButton;
  disable: () => TgButton;
  showProgress: (leaveActive?: boolean) => TgButton;
  hideProgress: () => TgButton;
};

type TgBackButton = {
  isVisible: boolean;
  onClick: (fn: () => void) => TgBackButton;
  offClick: (fn: () => void) => TgBackButton;
  show: () => TgBackButton;
  hide: () => TgBackButton;
};

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  themeParams?: Record<string, string>;
  colorScheme?: "light" | "dark";
  MainButton?: TgButton;
  BackButton?: TgBackButton;
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

/** Returns true when running inside Telegram Mini App. */
export function isInsideTelegram(): boolean {
  return getWebApp() !== null;
}

/**
 * Configure and show the native Telegram MainButton.
 * Pass `showSpinner: true` while an async action is pending.
 * Returns a cleanup function that hides the button and removes the listener.
 */
export function setupMainButton(
  label: string,
  onClick: () => void,
  options: { disabled?: boolean; showSpinner?: boolean } = {},
): (() => void) | null {
  const btn = getWebApp()?.MainButton;
  if (!btn) {
    return null;
  }

  try {
    btn.setText(label);

    if (options.showSpinner) {
      btn.showProgress(false);
    } else {
      btn.hideProgress();
    }

    if (options.disabled) {
      btn.disable();
    } else {
      btn.enable();
    }

    btn.onClick(onClick);
    btn.show();
  } catch {
    // ignore
  }

  return () => {
    try {
      btn.offClick(onClick);
      btn.hide();
    } catch {
      // ignore
    }
  };
}

/**
 * Show the native Telegram BackButton and attach a listener.
 * Returns a cleanup function that hides the button and removes the listener.
 */
export function setupBackButton(onClick: () => void): (() => void) | null {
  const btn = getWebApp()?.BackButton;
  if (!btn) {
    return null;
  }

  try {
    btn.onClick(onClick);
    btn.show();
  } catch {
    // ignore
  }

  return () => {
    try {
      btn.offClick(onClick);
      btn.hide();
    } catch {
      // ignore
    }
  };
}
