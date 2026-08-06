import { h, React } from '../lib/dom.js';
import { parseSearchQuery, searchIndex } from '../lib/search.js';

export function SearchResults() {
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = React.useState(params.get('q') || '');
  const results = searchIndex(query);
  const parsed = parseSearchQuery(query);
  const navigate = (path) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); };
  const submit = (event) => { event.preventDefault(); window.history.pushState({}, '', `/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`); };
  return h('section', { className: 'p-6 max-w-5xl mx-auto', 'aria-labelledby': 'search-title' },
    h('p', { className: 'text-xs text-daos-400 uppercase tracking-wider font-semibold' }, 'Demo search index'),
    h('h1', { id: 'search-title', className: 'text-2xl font-semibold text-slate-100 mt-1 mb-6' }, 'Search results'),
    h('form', { onSubmit: submit, className: 'mb-4' },
      h('label', { className: 'sr-only', htmlFor: 'search-results-input' }, 'Search query'),
      h('div', { className: 'flex gap-2' },
        h('input', { id: 'search-results-input', value: query, onInput: (e) => setQuery(e.target.value), placeholder: 'isin:US0378331005, participant:"Goldman Sachs", status:Active', className: 'flex-1 px-3 py-2 bg-surface-raised border border-surface-border rounded text-sm text-slate-200 focus:outline-none focus:border-daos-500' }),
        h('button', { className: 'px-4 py-2 rounded bg-daos-600 hover:bg-daos-700 text-sm font-medium' }, 'Search'))),
    query && h('div', { className: 'text-xs text-slate-500 mb-5' }, 'Parsed filters: ', Object.keys(parsed.filters).length ? Object.entries(parsed.filters).map(([key, value]) => h('code', { key, className: 'ml-1 text-daos-300' }, `${key}:${value}`)) : 'free text'),
    results.length ? h('ul', { className: 'space-y-2', 'aria-label': 'Search result list' }, results.map((item) => h('li', { key: item.id },
      h('button', { className: 'w-full text-left p-4 rounded border border-surface-border bg-surface-raised hover:border-daos-500 focus-ring flex items-center gap-4', onClick: () => navigate(item.path) },
        h('span', { className: 'w-2 h-2 rounded-full bg-status-success shrink-0', 'aria-hidden': 'true' }),
        h('span', { className: 'flex-1' }, h('strong', { className: 'block text-slate-200 font-medium' }, item.name), h('span', { className: 'text-xs text-slate-500 font-mono' }, `${item.id} · ${item.jurisdiction}`)),
        h('span', { className: 'text-xs text-daos-400' }, item.label), h('span', { className: 'text-xs text-slate-400' }, item.status), h('span', { className: 'text-slate-500', 'aria-hidden': 'true' }, '→'))))) :
      h('div', { className: 'p-10 text-center border border-dashed border-surface-border rounded text-slate-500' }, query ? 'No results found in the demo index.' : 'Enter a query to search the demo index.'));
}
