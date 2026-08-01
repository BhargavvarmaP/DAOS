// Minimal DOM helper for DAOS
// React is loaded globally via CDN script tags in index.html

export const React = window.React;

// h(type, props, children...) — shorthand for React.createElement
export function h(type, props, ...children) {
  if (props == null) props = {};
  const flat = children.flat(Infinity).filter(c => c != null && c !== false && c !== true);
  return React.createElement(type, props, ...flat);
}
