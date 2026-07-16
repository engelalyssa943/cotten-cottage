import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initInstallCapture } from './pwa/install';
import { initPWA } from './pwa/registerSW';

// Capture the Android install prompt early (before any UI), and register the
// service worker (production only). Neither surfaces anything to the children.
initInstallCapture();
initPWA();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
