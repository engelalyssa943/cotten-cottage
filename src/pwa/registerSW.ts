import { registerSW } from 'virtual:pwa-register';

/**
 * Service worker registration. Updates download in the background but NEVER apply
 * mid-session — a hot reload that wipes an in-progress cake is a betrayal. With
 * registerType:'prompt' the new worker waits and takes control on the next cold
 * start (once all tabs are closed), silently. We show no toast; the children
 * should never learn updates exist. So both callbacks intentionally do nothing.
 */
export function initPWA(): void {
  if (import.meta.env.DEV) return;
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // Silent on purpose. The waiting worker activates on the next cold start.
    },
    onOfflineReady() {
      // Silent on purpose. The app is fully cached and ready offline.
    },
  });
}
