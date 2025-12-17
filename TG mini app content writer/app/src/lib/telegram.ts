declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand?: () => void;
        colorScheme?: "light" | "dark";
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy") => void;
        };
      };
    };
  }
}

export function initTelegram() {
  if (typeof window === "undefined") return;
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;
  webApp.ready();
  webApp.expand?.();

  if (webApp.colorScheme === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
}

export function hapticLight() {
  const haptics = window.Telegram?.WebApp?.HapticFeedback;
  haptics?.impactOccurred("light");
}
