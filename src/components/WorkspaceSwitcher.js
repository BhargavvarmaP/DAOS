// WorkspaceSwitcher — dropdown listing all 15 workspaces
// UX spec §1.2.1: searchable, recent/frequent at top, Ctrl+K shortcut

import { h, React } from '../lib/dom.js';
import { WORKSPACES } from '../data/workspaces.js';

export function WorkspaceSwitcher({ state, update }) {
  const { activeWorkspace, workspaceSwitcherOpen } = state;
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (workspaceSwitcherOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
    }
  }, [workspaceSwitcherOpen]);

  const filtered = query
    ? WORKSPACES.filter(w =>
        w.name.toLowerCase().includes(query.toLowerCase()) ||
        w.id.toLowerCase().includes(query.toLowerCase()))
    : WORKSPACES;

  const recentIds = ['assets', 'settlement', 'custody', 'risk-compliance'];
  const sorted = query ? filtered : [
    ...WORKSPACES.filter(w => recentIds.includes(w.id)),
    ...WORKSPACES.filter(w => !recentIds.includes(w.id) && w.id !== activeWorkspace.id),
  ];

  return h('div', { className: 'relative' },
    h('button', {
      className: 'flex items-center gap-2 px-3 py-1.5 rounded bg-surface hover:bg-surface-overlay text-sm font-medium focus-ring transition-colors',
      onClick: () => update({ workspaceSwitcherOpen: !workspaceSwitcherOpen }),
      'aria-haspopup': 'listbox',
      'aria-expanded': String(workspaceSwitcherOpen),
      'aria-label': `Workspace: ${activeWorkspace.name}. Press Ctrl+K to switch.`
    },
      h('span', { className: 'text-base' }, activeWorkspace.icon),
      h('span', { className: 'hidden md:inline truncate max-w-[160px]' }, activeWorkspace.name),
      h('svg', { className: 'w-3.5 h-3.5 text-slate-400', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
        h('path', { d: 'M6 9l6 6 6-6' })
      )
    ),

    workspaceSwitcherOpen && h('div', { className: 'absolute top-full left-0 mt-1 w-80 bg-surface-raised border border-surface-border rounded-lg shadow-2xl z-50 animate-slide-in' },
      // Search
      h('div', { className: 'p-2 border-b border-surface-border' },
        h('input', {
          ref: inputRef,
          type: 'text',
          placeholder: 'Search workspaces...',
          value: query,
          onInput: (e) => setQuery(e.target.value),
          className: 'w-full px-3 py-1.5 bg-surface border border-surface-border rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-daos-500',
          'aria-label': 'Search workspaces'
        })
      ),
      // List
      h('div', { className: 'max-h-80 overflow-y-auto scrollbar-thin', role: 'listbox' },
        ...sorted.map((ws, i) => {
          const isActive = ws.id === activeWorkspace.id;
          const isRecent = recentIds.includes(ws.id);
          return h('button', {
            key: ws.id,
            className: `w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface-overlay transition-colors focus-ring ${isActive ? 'bg-daos-900/30 text-daos-300' : 'text-slate-300'} ${i === 0 && !query ? 'rounded-t-lg' : ''}`,
            onClick: () => { update({ activeWorkspace: ws, workspaceSwitcherOpen: false }); window.dispatchEvent(new CustomEvent('switch-workspace', { detail: ws })); },
            role: 'option',
            'aria-selected': String(isActive),
          },
            h('span', { className: 'text-lg' }, ws.icon),
            h('div', { className: 'flex-1 text-left' },
              h('div', { className: `font-medium ${isActive ? 'text-daos-300' : ''}` }, ws.name),
              h('div', { className: 'text-2xs text-slate-500' }, ws.description)
            ),
            isRecent && !query && h('span', { className: 'text-2xs text-slate-500 px-1.5 py-0.5 bg-surface rounded' }, 'Recent'),
            isActive && h('svg', { className: 'w-4 h-4 text-daos-400', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2.5 },
              h('path', { d: 'M5 13l4 4L19 7' })
            )
          );
        })
      )
    ),

    // Backdrop
    workspaceSwitcherOpen && h('div', {
      className: 'fixed inset-0 z-40',
      onClick: () => update({ workspaceSwitcherOpen: false }),
      'aria-hidden': 'true'
    })
  );
}
