/**
 * HTM (Hyperscript Tagged Markup)
 * Standalone compiler JSX-like template literals untuk React tanpa build step.
 * Memungkinkan gaya penulisan komponen React / React Native berjalan langsung di Live Server.
 */
import htm from './htm_core.js';

export const html = htm.bind(window.React.createElement);
export default html;
