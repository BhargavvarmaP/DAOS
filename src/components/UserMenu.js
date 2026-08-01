// UserMenu — avatar + name dropdown
// UX spec §1.2.1: Profile, Preferences, Switch Tenant, API Keys, Help, Sign Out

import { h, React } from '../lib/dom.js';

export function UserMenu({ state, update }) {
  const { userMenuOpen } = state;

  const items = [
    { icon: '👤', label: 'Profile', action: 'profile' },
    { icon: '⚙️', label: 'Preferences', action: 'preferences' },
    { icon: '🏢', label: 'Switch Tenant', action: 'switch-tenant' },
    { icon: '🔑', label: 'API Keys', action: 'api-keys' },
    { icon: '❓', label: 'Help & Documentation', action: 'help' },
    { type: 'divider' },
    { icon: '🚪', label: 'Sign Out', action: 'sign-out', danger: true },
  ];

  return h('div', { className: 'relative' },
    h('button', {
      className: 'flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-overlay focus-ring transition-colors',
      onClick: () => update({ userMenuOpen: !userMenuOpen, notificationsOpen: false }),
      'aria-haspopup': 'menu',
      'aria-expanded': String(userMenuOpen),
      'aria-label': 'User menu'
    },
      // Avatar
      h('div', { className: 'w-7 h-7 rounded-full bg-daos-700 flex items-center justify-center text-xs font-bold text-daos-200' },
        'JS'
      ),
      h('span', { className: 'hidden md:inline text-sm text-slate-300' }, 'James Sullivan'),
      h('svg', { className: 'w-3 h-3 text-slate-400', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
        h('path', { d: 'M6 9l6 6 6-6' })
      )
    ),

    userMenuOpen && h('div', { className: 'absolute top-full right-0 mt-1 w-56 bg-surface-raised border border-surface-border rounded-lg shadow-2xl z-50 animate-slide-in', role: 'menu' },
      // User info header
      h('div', { className: 'px-4 py-3 border-b border-surface-border' },
        h('div', { className: 'text-sm font-medium text-slate-200' }, 'James Sullivan'),
        h('div', { className: 'text-xs text-slate-500 mt-0.5' }, 'james.sullivan@daos.io'),
        h('div', { className: 'text-2xs text-slate-600 mt-0.5' }, 'Tenant: DAOS Global · Admin')
      ),
      h('div', { className: 'py-1' },
        ...items.map((item, i) => {
          if (item.type === 'divider') return h('div', { key: `d${i}`, className: 'border-t border-surface-border my-1' });
          return h('button', {
            key: item.action,
            className: `w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-surface-overlay focus-ring transition-colors ${item.danger ? 'text-status-danger hover:bg-status-danger/10' : 'text-slate-300'}`,
            onClick: () => { if (item.action === 'sign-out') update({ userMenuOpen: false }); },
            role: 'menuitem'
          },
            h('span', { className: 'text-base' }, item.icon),
            item.label
          );
        })
      )
    ),

    userMenuOpen && h('div', {
      className: 'fixed inset-0 z-40',
      onClick: () => update({ userMenuOpen: false }),
      'aria-hidden': 'true'
    })
  );
}
