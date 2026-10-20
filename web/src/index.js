/**
 * Titik Masuk Aplikasi React (Entry Point)
 * Melakukan inisialisasi React 18 ReactDOM.createRoot
 */
import { html } from './utils/htm.js';
import { App } from './App.js';

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = window.ReactDOM.createRoot(rootEl);
  root.render(html`<${App} />`);
}
