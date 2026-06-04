type PreviewTheme = "dark" | "light";

function readPreviewTheme(): PreviewTheme | null {
  const value = new URLSearchParams(window.location.search).get("theme");

  return value === "dark" || value === "light" ? value : null;
}

export function applyBrowserPreviewTheme() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const theme = readPreviewTheme();

  if (theme) {
    document.documentElement.dataset.previewTheme = theme;
  } else {
    delete document.documentElement.dataset.previewTheme;
  }
}
