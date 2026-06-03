import { useEffect } from "react";

import { setupBackButton, setupMainButton } from "./telegram";

type TelegramButtonsConfig = {
  /** When false, both native buttons are hidden (e.g. HTML footer is in charge). */
  active: boolean;
  mainLabel: string;
  mainDisabled: boolean;
  mainSpinner: boolean;
  showBack: boolean;
  onMain: () => void;
  onBack: () => void;
};

/**
 * Drives Telegram's native MainButton / BackButton from React state.
 * No-op outside Telegram — the hook simply does nothing and the HTML footer
 * remains the control surface. Re-syncs whenever label / state changes.
 */
export function useTelegramButtons({
  active,
  mainLabel,
  mainDisabled,
  mainSpinner,
  showBack,
  onMain,
  onBack,
}: TelegramButtonsConfig): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    const cleanupMain = setupMainButton(mainLabel, onMain, {
      disabled: mainDisabled,
      showSpinner: mainSpinner,
    });
    const cleanupBack = showBack ? setupBackButton(onBack) : null;

    return () => {
      cleanupMain?.();
      cleanupBack?.();
    };
    // onMain / onBack are recreated each render; we intentionally re-bind them
    // alongside the state they close over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mainLabel, mainDisabled, mainSpinner, showBack]);
}
