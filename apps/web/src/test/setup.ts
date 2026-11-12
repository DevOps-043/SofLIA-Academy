import '@testing-library/jest-dom/vitest'


// API de Chromium ausente en JSDOM; las pruebas específicas pueden sustituirla.
if (typeof window !== 'undefined' && !window.matchMedia) Object.defineProperty(window, 'matchMedia', {
  configurable: true, writable: true,
  value: (media: string) => ({ matches: false, media, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true }),
});
