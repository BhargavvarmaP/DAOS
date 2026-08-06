import { h } from '../lib/dom.js';

export function NotificationCenter({ state, update }) {
  const markAll = () => update({ notifications: state.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 });
  const markRead = (id) => update({ notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n), unreadCount: state.notifications.filter((n) => n.id !== id && !n.read).length });
  const navigate = (n) => { markRead(n.id); const path = n.type === 'alert' ? '/workspace/settlement/fails' : n.type === 'approval' ? '/workspace/deals/approvals' : '/workspace/executive/dashboard'; window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };
  return h('section', { className: 'p-6 max-w-4xl mx-auto', 'aria-labelledby': 'notifications-title' },
    h('div', { className: 'flex justify-between items-start mb-6' }, h('div', {}, h('p', { className: 'text-xs text-daos-400 uppercase tracking-wider font-semibold' }, 'Demo state'), h('h1', { id: 'notifications-title', className: 'text-2xl font-semibold mt-1' }, 'Notification Center')), h('button', { className: 'text-sm text-daos-400 hover:text-daos-300 focus-ring', onClick: markAll }, 'Mark all as read')),
    h('div', { className: 'space-y-2' }, state.notifications.map((n) => h('article', { key: n.id, className: `p-4 rounded border border-surface-border bg-surface-raised flex gap-3 ${!n.read ? 'border-l-2 border-l-daos-500' : ''}` }, h('span', { className: `w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? 'bg-slate-600' : n.type === 'alert' ? 'bg-status-danger' : 'bg-status-warning'}`, 'aria-label': n.read ? 'Read' : 'Unread' }), h('div', { className: 'flex-1' }, h('button', { className: 'text-left font-medium text-slate-200 hover:text-daos-300 focus-ring', onClick: () => navigate(n) }, n.title), h('p', { className: 'text-xs text-slate-500 mt-1' }, `${n.group} · ${n.time}`)), !n.read && h('button', { className: 'text-xs text-slate-500 hover:text-slate-300 focus-ring', onClick: () => markRead(n.id) }, 'Mark read'))))
  );
}
