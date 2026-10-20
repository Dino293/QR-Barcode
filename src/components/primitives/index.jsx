import React from 'react';

/**
 * React Native Primitives untuk Web
 * Memberikan gaya penulisan deklaratif khas React Native (View, Text, Image, Pressable, ScrollView)
 * dengan dukungan styling Tailwind CSS penuh.
 */

export const View = ({ className = '', style, children, ...props }) => {
  return (
    <div className={className} style={style} {...props}>
      {children}
    </div>
  );
};

export const Text = ({ className = '', style, children, ...props }) => {
  return (
    <span className={className} style={style} {...props}>
      {children}
    </span>
  );
};

export const Image = ({ src, alt = '', className = '', style, onError, onLoad, ...props }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={onError}
      onLoad={onLoad}
      {...props}
    />
  );
};

export const Pressable = ({ onPress, onClick, className = '', style, children, title, disabled, ...props }) => {
  const handler = onPress || onClick;
  return (
    <button
      type="button"
      onClick={handler}
      className={className}
      style={style}
      title={title}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export const TouchableOpacity = Pressable;

export const ScrollView = ({ className = '', style, children, ...props }) => {
  return (
    <div className={`overflow-auto ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};
