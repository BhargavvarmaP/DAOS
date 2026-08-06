// GlobalShell — main application chrome
// Implements the DAOS global navigation shell per UX spec §1.2

import { h, React } from '../lib/dom.js';
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher.js';
import { GlobalSearch } from '../components/GlobalSearch.js';
import { NotificationBell } from '../components/NotificationBell.js';
import { UserMenu } from '../components/UserMenu.js';
import { LeftSidebar } from '../components/LeftSidebar.js';
import { routePath } from '../lib/routes.js';

const PAGE_LABELS = {
  'explorer': 'Explorer',
  'participant-view': 'Participant 360',
  'asset-view': 'Asset 360',
  'onboarding': 'Onboarding',
  'positions': 'Positions',
  'dashboard': 'Dashboard',
  'cases': 'Cases',
  'overview': 'Overview',
  'showcase': 'Component Library',
};

export function GlobalShell({ state, update, content }) {
  const { activeWorkspace, sidebarCollapsed, activePage } = state;

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        update({ workspaceSwitcherOpen: true });
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        update({ globalSearchOpen: true });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        update({ sidebarCollapsed: !sidebarCollapsed });
      }
      if (e.key === 'Escape') {
        update({ globalSearchOpen: false, workspaceSwitcherOpen: false, notificationsOpen: false, userMenuOpen: false });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarCollapsed]);

  const pageLabel = PAGE_LABELS[activePage] || activePage || 'Overview';
  const crumbs = state.objectType && state.objectId
    ? [{ label: activeWorkspace.name, path: routePath({ workspaceId: activeWorkspace.id, pageId: PAGE_LABELS[activeWorkspace.id] ? activePage : 'overview' }) }, { label: pageLabel, path: routePath({ workspaceId: activeWorkspace.id, objectType: state.objectType, objectId: state.objectId }) }, { label: state.objectId }]
    : [{ label: activeWorkspace.name, path: routePath({ workspaceId: activeWorkspace.id, pageId: activePage }) }, { label: pageLabel }];
  const go = (path) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };

  return h('div', { className: 'flex flex-col h-screen' },
    // ── Global Navigation Bar ──
    h('nav', { className: 'flex items-center h-12 bg-surface-raised border-b border-surface-border px-3 gap-2 shrink-0', role: 'navigation', 'aria-label': 'Global navigation' },
      // DAOS Logo
      h('button', {
        className: 'flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-overlay focus-ring font-bold text-daos-400 text-sm',
        onClick: () => { update({ showShowcase: !state.showShowcase }); },
        'aria-label': state.showShowcase ? 'Back to workspace' : 'DAOS home'
      },
        h('span', { className: 'text-lg' }, '◆'),
        h('span', { className: 'hidden sm:inline tracking-tight' }, 'DAOS')
      ),
      // Workspace Switcher
      h(WorkspaceSwitcher, { state, update }),
      // Spacer
      h('div', { className: 'flex-1' }),
      // Global Search
      h(GlobalSearch, { state, update }),
      // Notifications
      h(NotificationBell, { state, update }),
      // User Menu
      h(UserMenu, { state, update }),
    ),

    // ── Main Content Area ──
    h('div', { className: 'flex flex-1 overflow-hidden' },
      // Left Sidebar
      h(LeftSidebar, { workspace: activeWorkspace, activePage, sidebarCollapsed, update }),
      // Content
      h('main', {
        className: 'flex-1 overflow-auto bg-surface scrollbar-thin',
        role: 'main'
      },
        // Breadcrumb
        h('div', { className: 'flex items-center gap-1 px-4 py-2 text-xs text-slate-400 border-b border-surface-border', 'aria-label': 'Breadcrumb' },
          ...crumbs.flatMap((crumb, index) => [index > 0 ? h('span', { key: `sep-${index}`, className: 'text-slate-600', 'aria-hidden': 'true' }, '›') : null, crumb.path ? h('button', { key: `crumb-${index}`, className: 'hover:text-slate-200 focus-ring', onClick: () => go(crumb.path) }, crumb.label) : h('span', { key: `crumb-${index}`, className: 'text-slate-300' }, crumb.label)]),
        ),
        state.openTabs?.length ? h('div', { className: 'flex items-center gap-1 px-3 pt-2 border-b border-surface-border overflow-x-auto', role: 'tablist', 'aria-label': 'Open contexts' }, state.openTabs.map((tab) => h('button', { key: tab.path, role: 'tab', 'aria-selected': String(tab.path === window.location.pathname), className: `px-3 py-1.5 text-xs rounded-t border border-b-0 whitespace-nowrap ${tab.path === window.location.pathname ? 'bg-surface-raised text-daos-300 border-daos-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`, onClick: () => go(tab.path) }, tab.label))) : null,

        // Page content
        content || h('div', { className: 'flex items-center justify-center h-full text-slate-500' }, 'Select a page from the sidebar.')
      )
    ),

    // ── Keyboard Shortcuts Help ──
    state.showShortcuts && h(ShortcutsModal, { update })
  );
}

function ShortcutsModal({ update }) {
  const shortcuts = [
    ['Ctrl+K', 'Workspace switcher'],
    ['/', 'Global search'],
    ['Ctrl+B', 'Toggle sidebar'],
    ['Ctrl+Shift+N', 'Notifications'],
    ['Esc', 'Close panel/modal'],
    ['?', 'Toggle this help'],
  ];

  return h('div', {
    className: 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in',
    onClick: () => update({ showShortcuts: false }),
    role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Keyboard shortcuts'
  },
    h('div', {
      className: 'bg-surface-raised border border-surface-border rounded-lg p-6 w-96 shadow-2xl',
      onClick: (e) => e.stopPropagation()
    },
      h('h2', { className: 'text-lg font-semibold mb-4' }, 'Keyboard Shortcuts'),
      h('div', { className: 'space-y-2' },
        ...shortcuts.map(([key, desc]) =>
          h('div', { className: 'flex justify-between text-sm', key },
            h('kbd', { className: 'px-2 py-0.5 bg-surface border border-surface-border rounded text-xs font-mono text-daos-300' }, key),
            h('span', { className: 'text-slate-400' }, desc)
          )
        )
      ),
      h('button', {
        className: 'mt-4 w-full py-2 bg-daos-600 hover:bg-daos-700 rounded text-sm font-medium focus-ring',
        onClick: () => update({ showShortcuts: false })
      }, 'Close')
    )
  );
}
