// DAOS App — main entry point

import { h, React } from './lib/dom.js';
import { WORKSPACES } from './data/workspaces.js';
import { DEFAULT_PAGES, parseRoute, routePath } from './lib/routes.js';

// -- Simple state management -----------------------------------------------
function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  const get = () => state;
  const set = (next) => {
    state = typeof next === 'function' ? next(state) : next;
    listeners.forEach(fn => fn(state));
  };
  const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  return { get, set, subscribe };
}

// Default first page per workspace
/*
  'executive': 'dashboard',
  'participants': 'explorer',
  'assets': 'explorer',
  'risk-compliance': 'dashboard',
  'deals': 'overview',
  'investments': 'overview',
  'products': 'overview',
  'digital-rep': 'overview',
  'investors': 'overview',
  'transactions': 'overview',
  'treasury': 'overview',
  'custody': 'overview',
  'settlement': 'overview',
  'data-intel': 'overview',
  'admin': 'overview',
};
*/

// -- Global app state ----------------------------------------------------
const initialRoute = parseRoute();
const initialWorkspace = initialRoute.workspace || WORKSPACES[0];
const appState = createStore({
  activeWorkspace: initialWorkspace,
  activePage: initialRoute.pageId || DEFAULT_PAGES[initialWorkspace.id] || 'overview',
  objectType: initialRoute.objectType || null,
  objectId: initialRoute.objectId || null,
  activeTab: initialRoute.tab || 'overview',
  routeNotFound: initialRoute.kind === 'not-found',
  showShowcase: false,
  sidebarCollapsed: false,
  globalSearchOpen: false,
  globalSearchQuery: '',
  notificationsOpen: false,
  userMenuOpen: false,
  workspaceSwitcherOpen: false,
  notifications: [
    { id: 1, type: 'alert', title: 'Settlement fail detected', time: '2 min ago', group: 'Alerts', read: false },
    { id: 2, type: 'approval', title: 'NAV approval pending', time: '15 min ago', group: 'Approvals', read: false },
    { id: 3, type: 'work', title: 'Reconciliation break assigned', time: '1 hour ago', group: 'Work Items', read: true },
    { id: 4, type: 'system', title: 'Platform update scheduled', time: '3 hours ago', group: 'System', read: true },
  ],
  unreadCount: 2,
  activeTab: 'overview',
  demoPage: 'shell',
  openTabs: [],
});

// Re-export store only
export { appState };

// -- Components -----------------------------------------------------------
import { GlobalShell } from './layouts/GlobalShell.js';
import { ComponentShowcase } from './pages/ComponentShowcase.js';
import { ParticipantManagement } from './pages/ParticipantManagement.js';
import { AssetOperations } from './pages/AssetOperations.js';
import { CommandCenter } from './pages/CommandCenter.js';
import { RiskCompliance } from './pages/RiskCompliance.js';
import { OperationalWorkspace } from './pages/OperationalWorkspace.js';
import { SearchResults } from './pages/SearchResults.js';
import { NotificationCenter } from './pages/NotificationCenter.js';

// -- Content Router -------------------------------------------------------
function renderContent(state, update) {
  const { activeWorkspace, activePage, showShowcase, routeNotFound, objectType, objectId, activeTab } = state;

  if (routeNotFound) return h(NotFound, { state, update });
  if (activePage === 'search') return h(SearchResults, { state, update });
  if (activePage === 'notifications') return h(NotificationCenter, { state, update });
  if (objectType && objectId) {
    return activeWorkspace.id === 'participants'
      ? h(ParticipantManagement, { page: 'participant-view', objectId, activeTab, update, onTabChange: (tab) => update({ activeTab: tab }) })
      : h(AssetOperations, { page: 'asset-view', objectId, activeTab, update, onTabChange: (tab) => update({ activeTab: tab }) });
  }

  if (showShowcase) {
    return h(ComponentShowcase, { state, update });
  }

  switch (activeWorkspace.id) {
    case 'participants':
      return h(ParticipantManagement, { page: activePage });
    case 'assets':
      return h(AssetOperations, { page: activePage });
    case 'executive':
      return h(CommandCenter, { page: activePage });
    case 'risk-compliance':
      return h(RiskCompliance, { page: activePage });
    case 'deals':
    case 'investments':
    case 'products':
    case 'digital-rep':
    case 'investors':
    case 'transactions':
    case 'treasury':
    case 'custody':
    case 'settlement':
    case 'data-intel':
    case 'admin':
      return h(OperationalWorkspace, { key: activeWorkspace.id, workspaceId: activeWorkspace.id, page: activePage });
    default:
      return h(ComingSoon, { name: activeWorkspace.name });
  }
}

function NotFound({ state, update }) {
  return h('div', { className: 'flex items-center justify-center h-full p-8' },
    h('div', { className: 'max-w-lg text-center' },
      h('div', { className: 'text-5xl mb-4' }, '🧭'),
      h('h2', { className: 'text-xl font-semibold text-slate-200 mb-2' }, 'Page not found'),
      h('p', { className: 'text-sm text-slate-400 mb-5' }, 'This workspace or page does not exist. Choose a workspace to continue.'),
      h('button', { className: 'px-4 py-2 bg-daos-600 hover:bg-daos-700 rounded text-sm font-medium focus-ring', onClick: () => update({ routeNotFound: false, activeWorkspace: WORKSPACES[0], activePage: DEFAULT_PAGES.executive }) }, 'Go to Command Center')
    )
  );
}

function ComingSoon({ name }) {
  return h('div', { className: 'flex items-center justify-center h-full' },
    h('div', { className: 'text-center p-8' },
      h('div', { className: 'text-5xl mb-4' }, '🚧'),
      h('h2', { className: 'text-xl font-semibold text-slate-200 mb-2' }, name),
      h('p', { className: 'text-sm text-slate-500' }, 'This workspace is coming soon.'),
    )
  );
}

// -- Main App -------------------------------------------------------------
export function App() {
  const [s, setS] = React.useState(appState.get());

  React.useEffect(() => {
    return appState.subscribe(setS);
  }, []);

  // Keep legacy custom events working while making every navigation deep-linkable.
  React.useEffect(() => {
    const applyRoute = (route) => {
      if (route.kind === 'not-found') { appState.set((prev) => ({ ...prev, routeNotFound: true })); return; }
      appState.set((prev) => {
        const next = { ...prev, routeNotFound: false, activeWorkspace: route.workspace || prev.activeWorkspace, activePage: route.pageId, objectType: route.objectType || null, objectId: route.objectId || null, activeTab: route.tab || 'overview' };
        if (!['search', 'notifications'].includes(route.kind)) {
          const path = window.location.pathname;
          const label = route.objectId || (route.pageId || 'Overview');
          next.openTabs = [...prev.openTabs.filter((tab) => tab.path !== path), { path, label: `${route.workspace?.name || prev.activeWorkspace.name} · ${label}` }].slice(-8);
        }
        return next;
      });
    };
    const handleSwitchWorkspace = (e) => {
      const ws = e.detail;
      const path = routePath({ workspaceId: ws.id, pageId: DEFAULT_PAGES[ws.id] || 'overview' });
      if (window.location.pathname !== path) window.history.pushState({}, '', path);
      applyRoute(parseRoute(path));
    };
    const handleNavigate = (e) => {
      const pageId = e.detail;
      const current = appState.get();
      const path = routePath({ workspaceId: current.activeWorkspace.id, pageId });
      window.history.pushState({}, '', path);
      applyRoute(parseRoute(path));
    };
    const handlePopState = () => applyRoute(parseRoute());
    window.addEventListener('switch-workspace', handleSwitchWorkspace);
    window.addEventListener('navigate', handleNavigate);
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('switch-workspace', handleSwitchWorkspace); window.removeEventListener('navigate', handleNavigate); window.removeEventListener('popstate', handlePopState); };
  }, []);

  const update = (patch) => {
    const next = typeof patch === 'function' ? patch(appState.get()) : patch;
    const current = appState.get();
    if (next.activeWorkspace && next.activeWorkspace.id !== current.activeWorkspace.id) {
      const path = routePath({ workspaceId: next.activeWorkspace.id, pageId: DEFAULT_PAGES[next.activeWorkspace.id] });
      window.history.pushState({}, '', path);
      appState.set({ ...current, ...next, activePage: DEFAULT_PAGES[next.activeWorkspace.id], objectType: null, objectId: null, activeTab: 'overview', routeNotFound: false });
    } else if (next.activeTab && next.activeTab !== current.activeTab && current.objectType && current.objectId) {
      const path = routePath({ workspaceId: current.activeWorkspace.id, objectType: current.objectType, objectId: current.objectId, tab: next.activeTab });
      window.history.pushState({}, '', path);
      appState.set({ ...current, ...next });
    } else appState.set((prev) => ({ ...prev, ...next }));
  };

  // Route based on state: show ComponentShowcase when the workspace's id is our special sentinel
  // For now, we keep ComponentShowcase accessible — it no longer has its own workspace,
  // but we keep it available via the existing GlobalShell rendering.
  // The content prop handles actual workspace pages.

  const content = renderContent(s, update);

  return h('div', { className: 'min-h-screen bg-surface text-slate-100' },
    h(GlobalShell, { state: s, update, content })
  );
}
