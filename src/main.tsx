import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { registerServiceWorker } from './registerSW.ts';

// Ignore benign Vite HMR WebSocket and third-party browser extension errors (e.g. MetaMask)
if (typeof window !== 'undefined') {
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reasonStr = String(event.reason?.message || event.reason || '');
      const stackStr = String(event.reason?.stack || '');
      const combined = `${reasonStr} ${stackStr}`;
      if (
        combined.includes('WebSocket') ||
        combined.includes('websocket') ||
        combined.includes('MetaMask') ||
        combined.includes('chrome-extension://') ||
        combined.includes('moz-extension://')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );
}

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

