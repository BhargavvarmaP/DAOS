// NotificationBell — badge count, dropdown with grouped notifications
// UX spec §1.2.1: Alerts, Approvals, Work Items, System

import { h, React } from '../lib/dom.js';

export function NotificationBell({ state, update }) {
  const { notificationsOpen, notifications, unreadCount } = state;

  const groups = ['Alerts', 'Approvals', 'Work Items', 'System'];
  const grouped = {};
  groups.forEach(g => { grouped[g] = notifications.filter(n => n.group === g); });

  return h('div', { className: 'relative' },
    h('button', {
      className: 'relative p-2 rounded hover:bg-surface-overlay focus-ring transition-colors',
      onClick: () => update({ notificationsOpen: !notificationsOpen, userMenuOpen: false }),
      'aria-label': `Notifications (${unreadCount} unread)`,
      'aria-haspopup': 'true',
      'aria-expanded': String(notificationsOpen),
    },
      h('svg', { className: 'w-5 h-5 text-slate-300', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
        h('path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }),
        h('path', { d: 'M13.73 21a2 2 0 0 1-3.46 0' })
      ),
      unreadCount > 0 && h('span', { className: 'absolute -top-0.5 -right-0.5 w-4 h-4 bg-status-danger rounded-full text-2xs font-bold flex items-center justify-center animate-slide-in' },
        unreadCount
      )
    ),

    notificationsOpen && h('div', { className: 'absolute top-full right-0 mt-1 w-80 bg-surface-raised border border-surface-border rounded-lg shadow-2xl z-50 animate-slide-in' },
      h('div', { className: 'flex items-center justify-between px-4 py-3 border-b border-surface-border' },
        h('span', { className: 'text-sm font-semibold' }, 'Notifications'),
        h('button', { className: 'text-xs text-daos-400 hover:text-daos-300 focus-ring' }, 'Mark all read')
      ),
      h('div', { className: 'max-h-96 overflow-y-auto scrollbar-thin' },
        ...groups.map(group => {
          const items = grouped[group] || [];
          if (!items.length) return null;
          return h('div', { key: group },
            h('div', { className: 'px-4 py-2 text-2xs font-semibold text-slate-500 uppercase bg-surface/50' }, group),
            ...items.map(n =>
              h('button', {
                key: n.id,
                className: `w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-surface-overlay transition-colors ${!n.read ? 'bg-daos-900/10' : ''}`,
              },
                h('div', { className: `w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : n.type === 'alert' ? 'bg-status-danger' : n.type === 'approval' ? 'bg-status-warning' : 'bg-status-info'}` }),
                h('div', { className: 'flex-1 min-w-0' },
                  h('div', { className: `text-sm truncate ${!n.read ? 'font-medium text-slate-200' : 'text-slate-400'}` }, n.title),
                  h('div', { className: 'text-2xs text-slate-500 mt-0.5' }, n.time)
                )
              )
            )
          );
        })
      ),
      h('div', { className: 'border-t border-surface-border px-4 py-2' },
        h('button', {
          className: 'w-full text-center text-xs text-daos-400 hover:text-daos-300 py-1 focus-ring',
          onClick: () => { update({ notificationsOpen: false }); window.history.pushState({}, '', '/notifications'); window.dispatchEvent(new PopStateEvent('popstate')); }
        }, 'View All Notifications →')
      )
    ),

    notificationsOpen && h('div', {
      className: 'fixed inset-0 z-40',
      onClick: () => update({ notificationsOpen: false }),
      'aria-hidden': 'true'
    })
  );
}
