// DAOS main entry — bootstraps React app

const React = window.React;
const ReactDOM = window.ReactDOM;

// Provide React globally for all modules
window.React = React;

const { h } = await import('./lib/dom.js');
const { App } = await import('./App.js');

const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);
root.render(h(App));
