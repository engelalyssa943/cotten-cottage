import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Served from a GitHub Pages project site by default (https://<user>.github.io/<repo>/).
// Override with VITE_BASE at build time if your repo name differs.
const base = process.env.VITE_BASE ?? '/cotten-cottage/';

// The strict Content-Security-Policy is injected into the PRODUCTION html only.
// Applying it in dev would break Vite's HMR (inline scripts + ws), so we scope it
// to `apply: 'build'`. `connect-src 'self'` is the directive that actually enforces
// the "zero runtime fetches to anywhere but the cached origin" non-negotiable.
function cspPlugin(): Plugin {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self' blob:",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');
  return {
    name: 'cotten-csp',
    apply: 'build',
    transformIndexHtml(html) {
      // Inject right after <head> so the policy governs the document as early as
      // possible, before any script/link tags.
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      );
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    react(),
    cspPlugin(),
    VitePWA({
      // Updates never apply mid-session; the waiting worker activates on the next
      // cold start. We register the SW ourselves in src/pwa/registerSW.ts.
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['apple-touch-icon.png', 'favicon.png'],
      manifest: {
        name: 'Cotten Cottage',
        short_name: 'Cottage',
        description: 'A cozy little house of gentle things to make and play with.',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#FBF7F0',
        theme_color: '#FBF7F0',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg}'],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
});
