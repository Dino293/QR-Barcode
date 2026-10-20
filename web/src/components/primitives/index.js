/**
 * React Native Primitives untuk Web
 * Memberikan gaya penulisan komponen deklaratif khas React Native (View, Text, Image, Pressable, ScrollView)
 * yang kompatibel penuh dengan Tailwind CSS pada browser / Live Server.
 */
import { html } from '../../utils/htm.js';

export const View = ({ className = '', style, children, ...props }) => {
  return html`
    <div className=${className} style=${style} ...${props}>
      ${children}
    </div>
  `;
};

export const Text = ({ className = '', style, children, ...props }) => {
  return html`
    <span className=${className} style=${style} ...${props}>
      ${children}
    </span>
  `;
};

export const Image = ({ src, alt = '', className = '', style, onError, onLoad, ...props }) => {
  return html`
    <img
      src=${src}
      alt=${alt}
      className=${className}
      style=${style}
      onError=${onError}
      onLoad=${onLoad}
      ...${props}
    />
  `;
};

export const Pressable = ({ onPress, onClick, className = '', style, children, title, disabled, ...props }) => {
  const handler = onPress || onClick;
  return html`
    <button
      type="button"
      onClick=${handler}
      className=${className}
      style=${style}
      title=${title}
      disabled=${disabled}
      ...${props}
    >
      ${children}
    </button>
  `;
};

export const TouchableOpacity = Pressable;

export const ScrollView = ({ className = '', style, children, ...props }) => {
  return html`
    <div className=${`overflow-auto ${className}`} style=${style} ...${props}>
      ${children}
    </div>
  `;
};
