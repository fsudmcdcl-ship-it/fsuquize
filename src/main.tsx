import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './index.css';

// Prevent non-critical background network or installation errors from crashing the UI
if (typeof window !== 'undefined') {
  // Gracefully filter out auxiliary Realtime Database permission warnings
  // since Firestore is the authoritative database for student persistence and authentication
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const text = args.map(a => (typeof a === 'string' ? a : (a instanceof Error ? a.message : ''))).join(' ');
    if (text.includes('@firebase/database') && text.includes('permission_denied')) {
      // Suppress auxiliary RTDB permission warnings so client console stays clean
      return;
    }
    originalWarn.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      msg.includes('installations') ||
      msg.includes('Firebase: Error (auth/') ||
      msg.includes('Failed to get document because the client is offline') ||
      msg.includes('permission_denied') ||
      msg.includes('PERMISSION_DENIED')
    ) {
      // Suppress known non-fatal background SDK notifications
      event.preventDefault();
      console.debug('Suppressed non-fatal background notice:', msg);
    }
  });
}

// Register service worker for push and background notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.debug('ServiceWorker registration notice:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
