// DAOS App — main entry point

import { h, React } from './lib/dom.js';
import { WORKSPACES } from './data/workspaces.js';

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
const DEFAULT_PAGES = {
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

// -- Global app state ----------------------------------------------------
const appState = createStore({
  activeWorkspace: WORKSPACES[0],
  activePage: DEFAULT_PAGES[WORKSPACES[0].id] || 'overview',
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

// -- Content Router -------------------------------------------------------
function renderContent(state, update) {
  const { activeWorkspace, activePage, showShowcase } = state;

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

  // Listen for workspace switch events
  React.useEffect(() => {
    const handleSwitchWorkspace = (e) => {
      const ws = e.detail;
      const defaultPage = DEFAULT_PAGES[ws.id] || 'overview';
      appState.set((prev) => ({ ...prev, activeWorkspace: ws, activePage: defaultPage }));
    };
    const handleNavigate = (e) => {
      const pageId = e.detail;
      appState.set((prev) => ({ ...prev, activePage: pageId }));
    };
    window.addEventListener('switch-workspace', handleSwitchWorkspace);
    window.addEventListener('navigate', handleNavigate);
    return () => {
      window.removeEventListener('switch-workspace', handleSwitchWorkspace);
      window.removeEventListener('navigate', handleNavigate);
    };
  }, []);

  const update = (patch) => appState.set((prev) => ({ ...prev, ...patch }));

  // Route based on state: show ComponentShowcase when the workspace's id is our special sentinel
  // For now, we keep ComponentShowcase accessible — it no longer has its own workspace,
  // but we keep it available via the existing GlobalShell rendering.
  // The content prop handles actual workspace pages.

  const content = renderContent(s, update);

  return h('div', { className: 'min-h-screen bg-surface text-slate-100' },
    h(GlobalShell, { state: s, update, content })
  );
}
