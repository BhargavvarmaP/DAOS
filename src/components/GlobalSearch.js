// GlobalSearch — omnibar per UX spec §1.2.2
// / shortcut, searches by object ID, type filters

import { h, React } from '../lib/dom.js';
import { searchIndex } from '../lib/search.js';

const MOCK_RESULTS = {
  asset: [
    { id: 'US0378331005', name: 'Apple Inc.', type: 'Asset', status: 'Active', jurisdiction: 'US' },
    { id: 'US5949181045', name: 'Microsoft Corp.', type: 'Asset', status: 'Active', jurisdiction: 'US' },
    { id: 'US02079K3059', name: 'Alphabet Inc.', type: 'Asset', status: 'Active', jurisdiction: 'US' },
  ],
  participant: [
    { id: '5493000IBP32UQZ0KL24', name: 'Goldman Sachs & Co.', type: 'Participant', status: 'Active', jurisdiction: 'US' },
    { id: '549300HKKLO5N7NQFT87', name: 'JP Morgan Securities', type: 'Participant', status: 'Active', jurisdiction: 'US' },
  ],
  transaction: [
    { id: 'TRD-20260728-000123', name: 'Buy 10,000 AAPL @ 198.50', type: 'Trade', status: 'Settled', jurisdiction: 'US' },
  ],
  settlement: [
    { id: 'STL-20260728-000456', name: 'DVP Settlement Batch 47', type: 'Settlement', status: 'Pending', jurisdiction: 'EU' },
  ],
};

export function GlobalSearch({ state, update }) {
  const { globalSearchOpen, globalSearchQuery } = state;
  const [query, setQuery] = React.useState(globalSearchQuery || '');
  const [results, setResults] = React.useState(null);
  const [selectedIdx, setSelectedIdx] = React.useState(-1);
  const inputRef = React.useRef(null);
  const debounceRef = React.useRef(null);

  React.useEffect(() => {
    if (globalSearchOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults(null);
      setSelectedIdx(-1);
    }
  }, [globalSearchOpen]);

  const doSearch = (q) => {
    if (!q.trim()) { setResults(null); return; }
    const allResults = {};
    for (const item of searchIndex(q).slice(0, 10)) {
      const group = item.type;
      if (!allResults[group]) allResults[group] = [];
      allResults[group].push(item);
    }
    setResults(Object.keys(allResults).length ? allResults : null);
  };

  const onInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), 150);
  };

  const allFlat = results ? Object.entries(results).flatMap(([group, items]) => items.map(i => ({ ...i, group }))) : [];

  if (!globalSearchOpen) {
    return h('button', {
      className: 'flex items-center gap-2 px-3 py-1.5 rounded bg-surface border border-surface-border hover:border-slate-500 text-sm text-slate-400 min-w-[200px] max-w-[400px] focus-ring transition-colors',
      onClick: () => update({ globalSearchOpen: true }),
      'aria-label': 'Search (press /)',
      title: 'Global Search (/)'
    },
      h('svg', { className: 'w-4 h-4 shrink-0', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
        h('circle', { cx: 11, cy: 11, r: 8 }),
        h('path', { d: 'M21 21l-4.35-4.35' })
      ),
      h('span', { className: 'hidden lg:inline truncate' }, 'Search by ISIN, LEI, participant...'),
      h('kbd', { className: 'ml-auto hidden sm:inline px-1.5 py-0.5 text-2xs bg-surface border border-surface-border rounded font-mono text-slate-500' }, '/')
    );
  }

  return h('div', { className: 'fixed inset-0 z-50 flex justify-center pt-[15vh] animate-fade-in' },
    // Backdrop
    h('div', { className: 'absolute inset-0 bg-black/50', onClick: () => update({ globalSearchOpen: false }) }),
    // Search modal
    h('div', { className: 'relative w-full max-w-2xl mx-4 bg-surface-raised border border-surface-border rounded-xl shadow-2xl overflow-hidden' },
      h('div', { className: 'flex items-center gap-3 px-4 py-3 border-b border-surface-border' },
        h('svg', { className: 'w-5 h-5 text-slate-400 shrink-0', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
          h('circle', { cx: 11, cy: 11, r: 8 }),
          h('path', { d: 'M21 21l-4.35-4.35' })
        ),
        h('input', {
          ref: inputRef,
          type: 'text',
          placeholder: 'Search objects... participant:"Goldman Sachs", isin:US0378331005, status:failed',
          value: query,
          onInput: onInput,
          onKeyDown: (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allFlat.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, -1)); }
            if (e.key === 'Enter' && selectedIdx >= 0) { const item = allFlat[selectedIdx]; if (item?.path) { window.history.pushState({}, '', item.path); window.dispatchEvent(new PopStateEvent('popstate')); } update({ globalSearchOpen: false }); }
            if (e.key === 'Escape') { update({ globalSearchOpen: false }); }
          },
          className: 'flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm focus:outline-none',
          'aria-label': 'Global search query'
        }),
        h('kbd', { className: 'px-1.5 py-0.5 text-2xs bg-surface border border-surface-border rounded font-mono text-slate-500' }, 'esc')
      ),
      // Results
      results && h('div', { className: 'max-h-96 overflow-y-auto scrollbar-thin p-2' },
        ...Object.entries(results).map(([group, items]) =>
          h('div', { key: group },
            h('div', { className: 'px-3 py-1.5 text-2xs font-semibold text-slate-500 uppercase tracking-wider' }, group),
            ...items.map((item, i) => {
              const globalIdx = allFlat.indexOf(item);
              const isSelected = globalIdx === selectedIdx;
              return h('button', {
                key: item.id,
                className: `w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-left hover:bg-surface-overlay transition-colors ${isSelected ? 'bg-surface-overlay ring-1 ring-daos-500' : ''}`,
                onClick: () => { if (item.path) { window.history.pushState({}, '', item.path); window.dispatchEvent(new PopStateEvent('popstate')); } update({ globalSearchOpen: false }); },
              },
                StatusBadge(item.status),
                h('div', { className: 'flex-1 min-w-0' },
                  h('div', { className: 'text-slate-200 truncate' }, item.name),
                  h('div', { className: 'text-2xs text-slate-500 font-mono' }, `${item.id} · ${item.jurisdiction}`)
                ),
                h('span', { className: 'text-2xs text-slate-500 bg-surface px-1.5 py-0.5 rounded' }, item.type)
              );
            }),
            h('div', { className: 'px-3 py-1 text-2xs text-daos-400 hover:text-daos-300 cursor-pointer' }, `Show all results for ${group} →`)
          )
        )
      ),
      !results && query && h('div', { className: 'p-8 text-center text-sm text-slate-500' }, 'No results found.'),
      !query && h('div', { className: 'p-4 text-xs text-slate-500 space-y-1' },
        h('div', { className: 'font-medium text-slate-400 mb-2' }, 'Search Syntax:'),
        h('div', {}, h('code', { className: 'text-daos-300' }, 'isin:US0378331005'), ' — direct ISIN lookup'),
        h('div', {}, h('code', { className: 'text-daos-300' }, 'participant:"Goldman Sachs"'), ' — scoped search'),
        h('div', {}, h('code', { className: 'text-daos-300' }, 'asset:AAPL'), ' — search by name or ticker'),
        h('div', {}, h('code', { className: 'text-daos-300' }, 'status:failed'), ' — filter by status'),
      )
    )
  );
}

function StatusBadge(status) {
  const colors = {
    Active: 'bg-status-success/20 text-status-success',
    Pending: 'bg-status-warning/20 text-status-warning',
    Settled: 'bg-status-success/20 text-status-success',
    Failed: 'bg-status-danger/20 text-status-danger',
  };
  return h('span', { className: `inline-block w-2 h-2 rounded-full shrink-0 ${colors[status] || 'bg-slate-500'}` });
}
