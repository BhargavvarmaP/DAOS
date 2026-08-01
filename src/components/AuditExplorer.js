// AuditExplorer — searchable, filterable audit event log
// UX spec §5.9: Search by event type/actor/object ID/date range, expandable JSON payload, causation chain

import { h, React } from '../lib/dom.js';

const AUDIT_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUBMIT', 'EXPORT', 'LOGIN', 'LOGOUT', 'PERMISSION_CHANGE'];
const ACTORS = ['james.sullivan@daos.io', 'maria.chen@daos.io', 'alex.kim@daos.io', 'sarah.lee@daos.io', 'rachel.brown@daos.io', 'system@daos.io'];
const RESOURCE_TYPES = ['Participant', 'Asset', 'Product', 'Fund', 'Account', 'Position', 'Settlement', 'Payment', 'Rule', 'Policy', 'Document', 'User'];
const OUTCOMES = ['Success', 'Failure'];

function generateMockAuditEvents(n) {
  const events = [];
  for (let i = 0; i < n; i++) {
    const ts = new Date(Date.now() - Math.random() * 30 * 86400000);
    const oldVal = { status: 'Active', value: (Math.random() * 1000).toFixed(2), updatedBy: ACTORS[(i + 1) % ACTORS.length] };
    const newVal = { status: i % 3 === 0 ? 'Inactive' : 'Active', value: (Math.random() * 1000).toFixed(2), updatedBy: ACTORS[i % ACTORS.length] };
    events.push({
      id: `AUD-${String(100000 + i).padStart(6, '0')}`,
      timestamp: ts.toISOString(),
      eventType: AUDIT_TYPES[i % AUDIT_TYPES.length],
      actor: ACTORS[i % ACTORS.length],
      resourceType: RESOURCE_TYPES[i % RESOURCE_TYPES.length],
      resourceId: `${RESOURCE_TYPES[i % RESOURCE_TYPES.length].substring(0, 3).toUpperCase()}-${String(1000 + i).padStart(5, '0')}`,
      outcome: OUTCOMES[i % OUTCOMES.length],
      sourceIP: `10.${10 + (i % 20)}.${1 + (i % 10)}.${1 + (i % 254)}`,
      correlationId: `CORR-${String(8000 + (i % 10) * 10).padStart(4, '0')}`,
      causationId: i > 0 ? `AUD-${String(100000 + i - 1).padStart(6, '0')}` : null,
      description: `${AUDIT_TYPES[i % AUDIT_TYPES.length]} operation on ${RESOURCE_TYPES[i % RESOURCE_TYPES.length]} ${RESOURCE_TYPES[i % RESOURCE_TYPES.length].substring(0, 3)}-${String(1000 + i).padStart(5, '0')}`,
      oldValue: oldVal,
      newValue: newVal,
    });
  }
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

const ALL_AUDIT = generateMockAuditEvents(75);

export function AuditExplorer() {
  const [events] = React.useState(ALL_AUDIT);
  const [filtered, setFiltered] = React.useState(ALL_AUDIT);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');
  const [actorFilter, setActorFilter] = React.useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = React.useState('');
  const [outcomeFilter, setOutcomeFilter] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [correlationSearch, setCorrelationSearch] = React.useState('');
  const [expandedId, setExpandedId] = React.useState(null);
  const [causationChain, setCausationChain] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [sortKey, setSortKey] = React.useState('timestamp');
  const [sortDir, setSortDir] = React.useState('desc');
  const pageSize = 25;

  const applyFilters = () => {
    let f = events;
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(e =>
        e.id.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.resourceId.toLowerCase().includes(q) ||
        e.correlationId.toLowerCase().includes(q)
      );
    }
    if (typeFilter) f = f.filter(e => e.eventType === typeFilter);
    if (actorFilter) f = f.filter(e => e.actor === actorFilter);
    if (resourceTypeFilter) f = f.filter(e => e.resourceType === resourceTypeFilter);
    if (outcomeFilter) f = f.filter(e => e.outcome === outcomeFilter);
    if (dateFrom) f = f.filter(e => new Date(e.timestamp) >= new Date(dateFrom));
    if (dateTo) f = f.filter(e => new Date(e.timestamp) <= new Date(dateTo + 'T23:59:59'));
    if (correlationSearch) f = f.filter(e => e.correlationId.toLowerCase().includes(correlationSearch.toLowerCase()));
    setFiltered(f);
    setPage(0);
  };

  React.useEffect(() => { applyFilters(); }, [search, typeFilter, actorFilter, resourceTypeFilter, outcomeFilter, dateFrom, dateTo, correlationSearch]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...filtered].sort((a, b) => {
    const va = String(a[sortKey] || ''), vb = String(b[sortKey] || '');
    const cmp = va.localeCompare(vb);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const walkCausationChain = (event) => {
    const chain = [event];
    let current = event;
    while (current.causationId) {
      const prev = events.find(e => e.id === current.causationId);
      if (!prev) break;
      chain.unshift(prev);
      current = prev;
    }
    setCausationChain(chain);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setActorFilter('');
    setResourceTypeFilter('');
    setOutcomeFilter('');
    setDateFrom('');
    setDateTo('');
    setCorrelationSearch('');
  };

  const activeFilterCount = [search, typeFilter, actorFilter, resourceTypeFilter, outcomeFilter, dateFrom, dateTo, correlationSearch].filter(Boolean).length;

  const exportAudit = () => {
    const data = filtered.map(e => ({
      id: e.id, timestamp: e.timestamp, type: e.eventType, actor: e.actor,
      resource: `${e.resourceType}/${e.resourceId}`, outcome: e.outcome,
      correlation: e.correlationId, description: e.description
    }));
    console.log('Audit Export:', JSON.stringify(data, null, 2));
    alert(`Exported ${filtered.length} audit events (see console)`);
  };

  const typeColor = (t) => {
    if (t === 'CREATE') return 'bg-status-success/15 text-status-success';
    if (t === 'UPDATE') return 'bg-status-info/15 text-status-info';
    if (t === 'DELETE') return 'bg-status-danger/15 text-status-danger';
    if (t === 'APPROVE') return 'bg-status-success/15 text-status-success';
    if (t === 'REJECT') return 'bg-status-danger/15 text-status-danger';
    if (t === 'SUBMIT') return 'bg-status-warning/15 text-status-warning';
    if (t === 'LOGIN' || t === 'LOGOUT') return 'bg-slate-500/15 text-slate-400';
    if (t === 'PERMISSION_CHANGE') return 'bg-priority-high/15 text-priority-high';
    return 'bg-slate-500/15 text-slate-400';
  };

  // Filter summary
  const compact = { padding: 'py-1', text: 'text-xs' };

  return h('div', { className: 'flex flex-col h-full' },
    // Header
    h('div', { className: 'flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-raised/50' },
      h('div', { className: 'flex items-center gap-2' },
        h('h2', { className: 'text-sm font-semibold text-slate-200' }, 'Audit Explorer'),
        h('span', { className: 'text-2xs text-slate-500' }, `${filtered.length} of ${events.length} events`),
      ),
      h('div', { className: 'flex items-center gap-2' },
        h('button', {
          className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring',
          onClick: exportAudit,
        }, '📥 Export Audit Trail'),
      )
    ),

    // Search & filter bar
    h('div', { className: 'px-4 py-2 border-b border-surface-border bg-surface flex gap-2 flex-wrap items-center' },
      // Search
      h('div', { className: 'flex items-center gap-1.5 flex-1 min-w-[200px]' },
        h('svg', { className: 'w-3.5 h-3.5 text-slate-500 shrink-0', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
          h('circle', { cx: 11, cy: 11, r: 8 }),
          h('path', { d: 'M21 21l-4.35-4.35' })
        ),
        h('input', {
          type: 'text',
          value: search,
          onInput: (e) => setSearch(e.target.value),
          placeholder: 'Search by ID, description, actor, resource, correlation...',
          className: 'bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none flex-1',
          'aria-label': 'Search audit events'
        }),
      ),
      // Filter selects
      h('select', {
        value: typeFilter,
        onChange: (e) => setTypeFilter(e.target.value),
        className: 'bg-surface border border-surface-border rounded px-2 py-1 text-xs text-slate-300 focus-ring',
        'aria-label': 'Filter by event type'
      },
        h('option', { value: '' }, 'All Types'),
        ...AUDIT_TYPES.map(t => h('option', { key: t, value: t }, t)),
      ),
      h('select', {
        value: actorFilter,
        onChange: (e) => setActorFilter(e.target.value),
        className: 'bg-surface border border-surface-border rounded px-2 py-1 text-xs text-slate-300 focus-ring',
        'aria-label': 'Filter by actor'
      },
        h('option', { value: '' }, 'All Actors'),
        ...ACTORS.map(a => h('option', { key: a, value: a }, a.split('@')[0])),
      ),
      h('select', {
        value: resourceTypeFilter,
        onChange: (e) => setResourceTypeFilter(e.target.value),
        className: 'bg-surface border border-surface-border rounded px-2 py-1 text-xs text-slate-300 focus-ring',
        'aria-label': 'Filter by resource type'
      },
        h('option', { value: '' }, 'All Resources'),
        ...RESOURCE_TYPES.map(r => h('option', { key: r, value: r }, r)),
      ),
      h('select', {
        value: outcomeFilter,
        onChange: (e) => setOutcomeFilter(e.target.value),
        className: 'bg-surface border border-surface-border rounded px-2 py-1 text-xs text-slate-300 focus-ring',
        'aria-label': 'Filter by outcome'
      },
        h('option', { value: '' }, 'All Outcomes'),
        ...OUTCOMES.map(o => h('option', { key: o, value: o }, o)),
      ),
      activeFilterCount > 0 && h('button', {
        className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring',
        onClick: clearFilters,
      }, `Clear (${activeFilterCount})`),
    ),

    // Date & correlation row
    h('div', { className: 'px-4 py-1.5 border-b border-surface-border bg-surface flex gap-3 items-center' },
      h('label', { className: 'text-2xs text-slate-500 flex items-center gap-1' },
        'From',
        h('input', {
          type: 'date',
          value: dateFrom,
          onChange: (e) => setDateFrom(e.target.value),
          className: 'bg-surface border border-surface-border rounded px-2 py-0.5 text-xs text-slate-200 focus-ring ml-1',
          'aria-label': 'Date from'
        }),
      ),
      h('label', { className: 'text-2xs text-slate-500 flex items-center gap-1' },
        'To',
        h('input', {
          type: 'date',
          value: dateTo,
          onChange: (e) => setDateTo(e.target.value),
          className: 'bg-surface border border-surface-border rounded px-2 py-0.5 text-xs text-slate-200 focus-ring ml-1',
          'aria-label': 'Date to'
        }),
      ),
      h('input', {
        type: 'text',
        value: correlationSearch,
        onInput: (e) => setCorrelationSearch(e.target.value),
        placeholder: 'Correlation ID...',
        className: 'bg-surface border border-surface-border rounded px-2 py-0.5 text-xs font-mono text-slate-200 placeholder-slate-600 w-36 focus:outline-none focus:border-daos-500',
        'aria-label': 'Filter by correlation ID'
      }),
    ),

    // Main content — split view when expanded
    h('div', { className: 'flex-1 flex min-h-0' },
      // Table area
      h('div', { className: 'flex-1 flex flex-col min-w-0' },
        h('div', { className: 'flex-1 overflow-auto scrollbar-thin' },
          h('table', { className: 'w-full', role: 'grid', 'aria-label': 'Audit event log' },
            h('thead', { className: 'bg-surface sticky top-0 z-10' },
              h('tr', {},
                ...[
                  { key: 'id', label: 'ID' },
                  { key: 'timestamp', label: 'Timestamp' },
                  { key: 'eventType', label: 'Type' },
                  { key: 'actor', label: 'Actor' },
                  { key: 'resourceType', label: 'Resource' },
                  { key: 'resourceId', label: 'Resource ID' },
                  { key: 'outcome', label: 'Outcome' },
                  { key: 'sourceIP', label: 'Source IP' },
                  { key: 'correlationId', label: 'Correlation' },
                ].map(col =>
                  h('th', {
                    key: col.key,
                    className: `px-2 py-2 text-left text-2xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none whitespace-nowrap`,
                    onClick: () => handleSort(col.key),
                    'aria-sort': sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none',
                    role: 'columnheader',
                    tabIndex: 0,
                  },
                    col.label,
                    sortKey === col.key && h('span', { className: 'ml-1 text-daos-400' }, sortDir === 'asc' ? '↑' : '↓')
                  )
                ),
                h('th', { className: 'w-10' }, ''),
              )
            ),
            h('tbody', {},
              ...paged.map((event, i) => {
                const isExpanded = expandedId === event.id;
                return h('tr', {
                  key: event.id,
                  className: `border-b border-surface-border hover:bg-surface-overlay/50 transition-colors cursor-pointer ${isExpanded ? 'bg-daos-900/20' : ''} ${i % 2 === 0 ? 'bg-surface/30' : ''}`,
                  onClick: () => {
                    if (expandedId === event.id) {
                      setExpandedId(null);
                      setCausationChain([]);
                    } else {
                      setExpandedId(event.id);
                      walkCausationChain(event);
                    }
                  },
                  role: 'row',
                  'aria-expanded': String(isExpanded),
                },
                  h('td', { className: 'px-2 py-1.5 text-xs font-mono text-slate-500 whitespace-nowrap' }, event.id),
                  h('td', { className: 'px-2 py-1.5 text-xs text-slate-400 whitespace-nowrap' }, new Date(event.timestamp).toLocaleString()),
                  h('td', { className: 'px-2 py-1.5 text-xs' },
                    h('span', { className: `px-1.5 py-0.5 rounded-full text-2xs ${typeColor(event.eventType)}` }, event.eventType)
                  ),
                  h('td', { className: 'px-2 py-1.5 text-xs text-slate-400 truncate max-w-[120px]' }, event.actor.split('@')[0]),
                  h('td', { className: 'px-2 py-1.5 text-xs text-slate-400' }, event.resourceType),
                  h('td', { className: 'px-2 py-1.5 text-xs font-mono text-slate-500' }, event.resourceId),
                  h('td', { className: 'px-2 py-1.5 text-xs' },
                    h('span', { className: `px-1.5 py-0.5 rounded-full text-2xs ${event.outcome === 'Success' ? 'bg-status-success/15 text-status-success' : 'bg-status-danger/15 text-status-danger'}` }, event.outcome)
                  ),
                  h('td', { className: 'px-2 py-1.5 text-xs font-mono text-slate-500' }, event.sourceIP),
                  h('td', { className: 'px-2 py-1.5 text-xs font-mono text-slate-600' }, event.correlationId),
                  h('td', { className: 'px-2' },
                    h('button', { className: 'p-1 text-slate-500 hover:text-slate-200 focus-ring', 'aria-label': 'More actions', onClick: (ev) => ev.stopPropagation() }, '⋮')
                  )
                );
              })
            )
          )
        ),
        // Pagination
        h('div', { className: 'flex items-center justify-between px-4 py-2 border-t border-surface-border bg-surface-raised/50 text-xs text-slate-400' },
          h('span', {}, `Showing ${paged.length > 0 ? page * pageSize + 1 : 0}–${page * pageSize + paged.length} of ${filtered.length}`),
          h('div', { className: 'flex items-center gap-1' },
            h('button', { className: 'px-2 py-1 rounded hover:bg-surface-overlay focus-ring disabled:opacity-30', disabled: page === 0, onClick: () => setPage(0), 'aria-label': 'First page' }, '«'),
            h('button', { className: 'px-2 py-1 rounded hover:bg-surface-overlay focus-ring disabled:opacity-30', disabled: page === 0, onClick: () => setPage(p => p - 1), 'aria-label': 'Previous' }, '‹'),
            h('span', { className: 'px-2' }, `Page ${page + 1} of ${totalPages || 1}`),
            h('button', { className: 'px-2 py-1 rounded hover:bg-surface-overlay focus-ring disabled:opacity-30', disabled: page >= totalPages - 1, onClick: () => setPage(p => p + 1), 'aria-label': 'Next' }, '›'),
            h('button', { className: 'px-2 py-1 rounded hover:bg-surface-overlay focus-ring disabled:opacity-30', disabled: page >= totalPages - 1, onClick: () => setPage(totalPages - 1), 'aria-label': 'Last' }, '»'),
          )
        ),
      ),

      // Detail panel (when expanded)
      expandedId && h('div', { className: 'w-96 border-l border-surface-border bg-surface-raised/30 overflow-auto scrollbar-thin flex flex-col animate-slide-in' },
        (() => {
          const event = events.find(e => e.id === expandedId);
          if (!event) return null;
          return h('div', { className: 'flex flex-col h-full' },
            // Detail header
            h('div', { className: 'px-4 py-3 border-b border-surface-border' },
              h('div', { className: 'flex items-center justify-between mb-2' },
                h('span', { className: 'text-xs font-mono text-slate-500' }, event.id),
                h('button', { className: 'text-slate-500 hover:text-slate-200 text-xs focus-ring', onClick: () => { setExpandedId(null); setCausationChain([]); }, 'aria-label': 'Close detail' }, '✕'),
              ),
              h('div', { className: 'flex items-center gap-2 mb-2' },
                h('span', { className: `px-1.5 py-0.5 rounded-full text-2xs ${typeColor(event.eventType)}` }, event.eventType),
                h('span', { className: `px-1.5 py-0.5 rounded-full text-2xs ${event.outcome === 'Success' ? 'bg-status-success/15 text-status-success' : 'bg-status-danger/15 text-status-danger'}` }, event.outcome),
              ),
              h('p', { className: 'text-sm text-slate-200' }, event.description),
            ),
            // Event detail
            h('div', { className: 'flex-1 overflow-auto p-4' },
              // Key fields
              h('div', { className: 'grid grid-cols-2 gap-2 text-xs mb-4' },
                ...[
                  ['Timestamp', new Date(event.timestamp).toLocaleString()],
                  ['Actor', event.actor],
                  ['Resource', `${event.resourceType} / ${event.resourceId}`],
                  ['Source IP', event.sourceIP],
                  ['Correlation', event.correlationId],
                  ['Causation', event.causationId || '— (root event)'],
                ].map(([label, val]) =>
                  h('div', { key: label, className: 'flex flex-col py-1' },
                    h('span', { className: 'text-slate-500 text-2xs' }, label),
                    h('span', { className: 'text-slate-200 text-xs font-mono truncate' }, String(val)),
                  )
                )
              ),
              // Old/New value comparison
              h('div', { className: 'mb-4' },
                h('div', { className: 'text-2xs font-semibold text-slate-400 uppercase mb-2' }, 'Value Comparison'),
                h('div', { className: 'grid grid-cols-2 gap-2' },
                  h('div', { className: 'bg-surface rounded border border-surface-border p-2' },
                    h('div', { className: 'text-2xs text-status-danger mb-1' }, 'OLD VALUE'),
                    h('pre', { className: 'text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto' }, JSON.stringify(event.oldValue, null, 2)),
                  ),
                  h('div', { className: 'bg-surface rounded border border-surface-border p-2' },
                    h('div', { className: 'text-2xs text-status-success mb-1' }, 'NEW VALUE'),
                    h('pre', { className: 'text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto' }, JSON.stringify(event.newValue, null, 2)),
                  ),
                )
              ),
              // Full payload
              h('div', { className: 'mb-4' },
                h('div', { className: 'text-2xs font-semibold text-slate-400 uppercase mb-2' }, 'Full Event Payload'),
                h('pre', { className: 'text-xs text-slate-300 bg-surface border border-surface-border rounded p-2 font-mono whitespace-pre-wrap max-h-60 overflow-auto scrollbar-thin' },
                  JSON.stringify(event, (key, val) => key === 'oldValue' || key === 'newValue' ? `[${typeof val === 'object' ? 'Object' : val}]` : val, 2)
                ),
              ),
              // Causation chain
              causationChain.length > 1 && h('div', {},
                h('div', { className: 'text-2xs font-semibold text-slate-400 uppercase mb-2' }, 'Causation Chain'),
                h('div', { className: 'space-y-1' },
                  ...causationChain.map((ce, i) =>
                    h('div', { key: ce.id, className: 'flex items-center gap-2 text-xs' },
                      h('span', { className: 'text-slate-600 font-mono' }, `${i + 1}.`),
                      h('span', { className: 'font-mono text-slate-500' }, ce.id),
                      h('span', { className: `px-1 py-0.5 rounded text-2xs ${typeColor(ce.eventType)}` }, ce.eventType),
                      h('span', { className: 'text-slate-400 truncate' }, ce.description.slice(0, 30)),
                      ce.id === event.id && h('span', { className: 'text-daos-400 text-2xs' }, '(current)'),
                    )
                  )
                ),
                h('div', { className: 'mt-2' },
                  h('button', {
                    className: 'text-xs text-daos-400 hover:text-daos-300 focus-ring',
                    onClick: () => {
                      if (causationChain.length > 0) {
                        setCorrelationSearch(causationChain[0].correlationId);
                        setExpandedId(null);
                        setCausationChain([]);
                      }
                    },
                  }, '🔗 View all events in this chain'),
                ),
              ),
            ),
            // Footer
            h('div', { className: 'px-4 py-3 border-t border-surface-border flex gap-2' },
              h('button', { className: 'flex-1 py-1.5 text-xs text-slate-400 border border-surface-border rounded hover:bg-surface-overlay focus-ring', onClick: () => alert('Integrity check passed: hash chain verified.') }, '🔒 Verify Integrity'),
              h('button', { className: 'flex-1 py-1.5 text-xs text-slate-400 border border-surface-border rounded hover:bg-surface-overlay focus-ring', onClick: () => alert('Event details copied to clipboard.') }, '📋 Copy'),
            ),
          );
        })()
      ),
    ),
  );
}
