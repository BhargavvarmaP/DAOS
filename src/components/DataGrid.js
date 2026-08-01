// DataGrid — sortable, filterable, paginated, multi-select, bulk actions
// UX spec §5.1 — the most-used component in DAOS

import { h, React } from '../lib/dom.js';

// Mock data
function generateMockAssets(n) {
  const assets = [];
  const names = ['Apple Inc.', 'Microsoft Corp.', 'Alphabet Inc.', 'Amazon.com', 'Tesla Inc.', 'Meta Platforms', 'NVIDIA Corp.', 'JPMorgan Chase', 'Visa Inc.', 'Procter & Gamble', 'Johnson & Johnson', 'Exxon Mobil', 'Chevron Corp.', 'Coca-Cola', 'PepsiCo'];
  const classes = ['Equity', 'Equity', 'Equity', 'Equity', 'Equity', 'Equity', 'Equity', 'Equity', 'Equity', 'Equity', 'Equity', 'Equity', 'Equity', 'Equity', 'Equity'];
  const statuses = ['Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Inactive', 'Suspended', 'Active', 'Active', 'Active', 'Active'];
  const jurisdictions = ['US', 'US', 'US', 'US', 'US', 'US', 'US', 'US', 'US', 'US', 'US', 'US', 'US', 'US', 'US'];
  for (let i = 0; i < n; i++) {
    const idx = i % names.length;
    assets.push({
      id: `US${String(Math.random()).slice(2, 12)}`,
      name: `${names[idx]}${i >= names.length ? ` (Series ${Math.floor(i / names.length)})` : ''}`,
      class: classes[idx],
      status: statuses[idx],
      jurisdiction: jurisdictions[idx],
      price: (Math.random() * 500 + 20).toFixed(2),
      change: (Math.random() * 20 - 10).toFixed(2),
      marketCap: `$${(Math.random() * 3000 + 100).toFixed(1)}B`,
      lastUpdated: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().split('T')[0],
    });
  }
  return assets;
}

const ALL_DATA = generateMockAssets(156);

export function DataGrid({ compact, data: externalData, columns: externalColumns, onRowClick, idKey }) {
  const [internalData] = React.useState(ALL_DATA);
  const data = externalData || internalData;
  const actualIdKey = idKey || 'id';
  const [sortKey, setSortKey] = React.useState('name');
  const [sortDir, setSortDir] = React.useState('asc');
  const [filters, setFilters] = React.useState({});
  const [selected, setSelected] = React.useState(new Set());
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(25);
  const [density, setDensity] = React.useState('comfortable');
  const [globalFilter, setGlobalFilter] = React.useState('');

  const defaultColumns = [
    { key: 'name', label: 'Name', sortable: true, filterable: true },
    { key: 'id', label: 'ISIN', sortable: true },
    { key: 'class', label: 'Class', sortable: true, filterable: true },
    { key: 'status', label: 'Status', sortable: true, filterable: true },
    { key: 'jurisdiction', label: 'Jur', sortable: true, width: '60px' },
    { key: 'price', label: 'Price (USD)', sortable: true },
    { key: 'change', label: 'Change %', sortable: true },
    { key: 'marketCap', label: 'Market Cap', sortable: true },
    { key: 'lastUpdated', label: 'Updated', sortable: true },
  ];
  const columns = externalColumns || defaultColumns;

  // Apply filters & sorting
  let filtered = data.filter(row => {
    if (globalFilter && !Object.values(row).some(v => String(v).toLowerCase().includes(globalFilter.toLowerCase()))) return false;
    for (const [k, v] of Object.entries(filters)) {
      if (v && String(row[k]).toLowerCase() !== String(v).toLowerCase()) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSelect = (rowId) => {
    const next = new Set(selected);
    if (next.has(rowId)) next.delete(rowId); else next.add(rowId);
    setSelected(next);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      const next = new Set(selected);
      paged.forEach(r => next.add(r[actualIdKey]));
      setSelected(next);
    }
  };

  const allSelected = paged.length > 0 && paged.every(r => selected.has(r[actualIdKey]));

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const densityClasses = {
    compact: 'py-1 text-xs',
    comfortable: 'py-2 text-sm',
    spacious: 'py-3 text-sm',
  };

  const rowClass = densityClasses[density];

  const statusColor = (s) => {
    if (s === 'Active') return 'bg-status-success/15 text-status-success';
    if (s === 'Suspended') return 'bg-status-warning/15 text-status-warning';
    return 'bg-slate-500/15 text-slate-400';
  };

  return h('div', { className: 'flex flex-col h-full' },
    // Toolbar
    h('div', { className: 'flex items-center gap-3 px-4 py-2 border-b border-surface-border bg-surface-raised/50' },
      // Global filter
      h('div', { className: 'flex-1 flex items-center gap-2' },
        h('svg', { className: 'w-4 h-4 text-slate-500 shrink-0', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
          h('circle', { cx: 11, cy: 11, r: 8 }),
          h('path', { d: 'M21 21l-4.35-4.35' })
        ),
        h('input', {
          type: 'text',
          placeholder: 'Filter assets...',
          value: globalFilter,
          onInput: (e) => { setGlobalFilter(e.target.value); setPage(0); },
          className: 'bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none w-48',
          'aria-label': 'Filter assets'
        }),
      ),
      // Page size
      h('select', {
        value: pageSize,
        onChange: (e) => { setPageSize(Number(e.target.value)); setPage(0); },
        className: 'bg-surface border border-surface-border rounded px-2 py-1 text-xs text-slate-300 focus-ring',
        'aria-label': 'Page size'
      },
        ...[25, 50, 100].map(n => h('option', { key: n, value: n }, `${n} / page`))
      ),
      // Density
      h('div', { className: 'flex border border-surface-border rounded overflow-hidden' },
        ...['compact', 'comfortable', 'spacious'].map(d =>
          h('button', {
            key: d,
            className: `px-2 py-1 text-2xs ${density === d ? 'bg-daos-700 text-daos-200' : 'bg-surface text-slate-400 hover:text-slate-200'} focus-ring`,
            onClick: () => setDensity(d),
            title: d
          }, d[0].toUpperCase())
        )
      ),
      // Export
      h('button', {
        className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded hover:bg-surface-overlay focus-ring',
        'aria-label': 'Export'
      }, 'Export'),
    ),

    // Active filters
    Object.keys(filters).length > 0 && h('div', { className: 'flex items-center gap-2 px-4 py-1.5 bg-surface text-xs' },
      ...Object.entries(filters).map(([k, v]) =>
        h('span', { key: k, className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-daos-900/30 text-daos-300 border border-daos-500/30 rounded-full' },
          `${k}: ${v}`,
          h('button', {
            className: 'hover:text-daos-100',
            onClick: () => { const next = { ...filters }; delete next[k]; setFilters(next); },
            'aria-label': `Remove ${k} filter`
          }, '×')
        )
      )
    ),

    // Bulk action toolbar
    selected.size > 0 && h('div', { className: 'flex items-center gap-2 px-4 py-1.5 bg-daos-900/20 border-b border-daos-500/30 text-sm animate-slide-in' },
      h('span', { className: 'text-daos-300 font-medium' }, `${selected.size} selected`),
      h('button', { className: 'px-3 py-1 text-xs bg-daos-600 hover:bg-daos-700 rounded focus-ring' }, 'Export Selected'),
      h('button', { className: 'px-3 py-1 text-xs bg-surface border border-surface-border rounded hover:bg-surface-overlay focus-ring' }, 'Change Status'),
      h('button', { className: 'px-3 py-1 text-xs text-status-danger border border-status-danger/30 rounded hover:bg-status-danger/10 focus-ring' }, 'Delete'),
    ),

    // Table
    h('div', { className: 'flex-1 overflow-auto scrollbar-thin' },
      h('table', {
        className: 'w-full',
        role: 'grid',
        'aria-label': 'Data grid',
        'aria-rowcount': filtered.length,
      },
        h('thead', { className: 'bg-surface sticky top-0 z-10' },
          h('tr', {},
            h('th', { className: 'w-10 px-2' },
              h('input', {
                type: 'checkbox',
                checked: allSelected,
                onChange: toggleAll,
                className: 'rounded',
                'aria-label': 'Select all'
              })
            ),
            ...columns.map(col =>
              h('th', {
                key: col.key,
                className: `px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap select-none ${col.sortable ? 'cursor-pointer hover:text-slate-300' : ''}`,
                style: col.width ? { width: col.width } : {},
                onClick: () => col.sortable && handleSort(col.key),
                'aria-sort': sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none',
                role: 'columnheader',
                tabIndex: 0,
              },
                col.label,
                sortKey === col.key && h('span', { className: 'ml-1 text-daos-400' }, sortDir === 'asc' ? '↑' : '↓')
              )
            ),
            h('th', { className: 'w-10' }, '')
          )
        ),
        h('tbody', {},
          ...paged.map((row, i) =>
            h('tr', {
              key: row[actualIdKey],
              className: `border-b border-surface-border hover:bg-surface-overlay/50 transition-colors ${selected.has(row[actualIdKey]) ? 'bg-daos-900/20' : ''} ${i % 2 === 0 ? 'bg-surface/30' : ''} ${onRowClick ? 'cursor-pointer' : ''}`,
              role: 'row',
              onClick: onRowClick ? () => onRowClick(row) : undefined,
            },
              h('td', { className: 'px-2' },
                h('input', {
                  type: 'checkbox',
                  checked: selected.has(row[actualIdKey]),
                  onChange: (e) => { e.stopPropagation(); toggleSelect(row[actualIdKey]); },
                  className: 'rounded',
                  'aria-label': `Select ${row[columns[0]?.key] || row[actualIdKey]}`
                })
              ),
              ...columns.map(col =>
                h('td', {
                  key: col.key,
                  className: `px-3 ${rowClass} ${col.className || ''} ${col.key === columns[0]?.key ? 'font-medium text-slate-200' : 'text-slate-400'} ${col.mono ? 'font-mono text-xs' : ''}`,
                  style: col.width ? { width: col.width } : {},
                },
                  col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')
                )
              ),
              h('td', { className: 'px-2' },
                h('button', {
                  className: 'p-1 text-slate-500 hover:text-slate-200 rounded focus-ring',
                  'aria-label': `Actions for ${row[columns[0]?.key] || row[actualIdKey]}`,
                  title: 'Row actions'
                }, '⋮')
              )
            )
          )
        )
      )
    ),

    // Pagination
    h('div', { className: 'flex items-center justify-between px-4 py-2 border-t border-surface-border bg-surface-raised/50 text-xs text-slate-400' },
      h('span', {}, `Showing ${paged.length > 0 ? page * pageSize + 1 : 0}–${page * pageSize + paged.length} of ${filtered.length} results`),
      h('div', { className: 'flex items-center gap-1' },
        h('button', {
          className: 'px-2 py-1 rounded hover:bg-surface-overlay focus-ring disabled:opacity-30',
          disabled: page === 0,
          onClick: () => setPage(0),
          'aria-label': 'First page'
        }, '«'),
        h('button', {
          className: 'px-2 py-1 rounded hover:bg-surface-overlay focus-ring disabled:opacity-30',
          disabled: page === 0,
          onClick: () => setPage(p => p - 1),
          'aria-label': 'Previous page'
        }, '‹'),
        h('span', { className: 'px-2 text-slate-300' }, `Page ${page + 1} of ${totalPages || 1}`),
        h('button', {
          className: 'px-2 py-1 rounded hover:bg-surface-overlay focus-ring disabled:opacity-30',
          disabled: page >= totalPages - 1,
          onClick: () => setPage(p => p + 1),
          'aria-label': 'Next page'
        }, '›'),
        h('button', {
          className: 'px-2 py-1 rounded hover:bg-surface-overlay focus-ring disabled:opacity-30',
          disabled: page >= totalPages - 1,
          onClick: () => setPage(totalPages - 1),
          'aria-label': 'Last page'
        }, '»'),
      )
    )
  );
}
