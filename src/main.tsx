import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import AuthWrapper from './components/AuthWrapper';

function installIOSZoomSnapBack() {
  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return;

  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return;

  const relaxed = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
  const locked = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover';
  viewport.setAttribute('content', relaxed);

  let resetQueued = false;
  let resetTimer: number | null = null;

  const getScrollY = () =>
    window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

  const restoreScrollY = (y: number) => {
    window.scrollTo({top: y, left: 0, behavior: 'instant' as ScrollBehavior});
  };

  const resetZoom = () => {
    const scale = window.visualViewport?.scale ?? 1;
    if (scale <= 1.01 || resetQueued) return;
    resetQueued = true;
    const savedY = getScrollY();

    if (resetTimer !== null) {
      window.clearTimeout(resetTimer);
    }

    resetTimer = window.setTimeout(() => {
      viewport.setAttribute('content', locked);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreScrollY(savedY);
          viewport.setAttribute('content', relaxed);
          requestAnimationFrame(() => {
            restoreScrollY(savedY);
          });
          resetQueued = false;
          resetTimer = null;
        });
      });
    }, 70);
  };

  document.addEventListener('gestureend', resetZoom as EventListener, {passive: true});
  document.addEventListener('touchend', () => {
    requestAnimationFrame(resetZoom);
  }, {passive: true});
}

installIOSZoomSnapBack();

import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthWrapper>
        <App />
      </AuthWrapper>
    </ThemeProvider>
  </StrictMode>
);
