import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

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
  plugins: [react(), cspPlugin()],
});
