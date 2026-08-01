// Object360Page — standardized tab layout per UX spec §5.2
// Signature UX pattern: Overview, Timeline, Relationships, Documents, Audit, Compliance, Risk

import { h, React } from '../lib/dom.js';

const OBJECT_DATA = {
  name: 'Apple Inc.',
  id: 'US0378331005',
  type: 'Asset',
  status: 'Active',
  jurisdiction: 'US',
  lastUpdated: '2026-07-29 14:32 UTC',
  updatedBy: 'Maria Chen',
  attributes: {
    Identifiers: [
      ['ISIN', 'US0378331005'],
      ['CUSIP', '037833100'],
      ['SEDOL', '2046251'],
      ['FIGI', 'BBG000B9XRY4'],
      ['Ticker', 'AAPL'],
    ],
    Classification: [
      ['Asset Class', 'Equity'],
      ['Sub-Class', 'Common Stock'],
      ['Sector', 'Technology'],
      ['Industry', 'Consumer Electronics'],
      ['Currency', 'USD'],
    ],
    'Key Dates': [
      ['Issue Date', '1980-12-12'],
      ['Maturity', 'Perpetual'],
      ['Listed On', 'NASDAQ'],
    ],
  },
  kpis: [
    { label: 'Market Cap', value: '$3.42T', change: '+12.4%' },
    { label: 'Price', value: '$198.50', change: '+2.3%' },
    { label: 'Volume (24h)', value: '48.2M', change: '-5.1%' },
    { label: 'Positions Held', value: '1,247', change: '' },
  ],
  recentActivity: [
    { action: 'Position updated', detail: 'Custody Account ACC-001: +10,000 shares', time: '14 min ago', user: 'Alex Kim' },
    { action: 'Corporate action processed', detail: 'Q3 Dividend $0.25/share declared', time: '2 hours ago', user: 'System' },
    { action: 'Settlement confirmed', detail: 'DVP Settlement Batch 47 — STL-000456', time: '4 hours ago', user: 'Maria Chen' },
    { action: 'Price updated', detail: 'Market data feed: NASDAQ closing price', time: '6 hours ago', user: 'System' },
  ],
};

export function Object360Page({ objectData, activeTab: requestedTab = 'overview', onTabChange }) {
  const data = objectData || OBJECT_DATA;
  const [activeTab, setActiveTab] = React.useState(requestedTab);
  React.useEffect(() => setActiveTab(requestedTab), [requestedTab]);

  const tabs = ['Overview', 'Timeline', 'Relationships', 'Documents', 'Audit', 'Compliance', 'Risk'];
  const tabSlugs = tabs.map(tab => tab.toLowerCase());
  const object360Id = 'object360';
  const activePanelId = `${object360Id}-panel-${activeTab}`;

  const handleTabKeyDown = (event, currentTab) => {
    const currentIndex = tabSlugs.indexOf(currentTab);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabSlugs.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabSlugs.length) % tabSlugs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabSlugs.length - 1;
    if (nextIndex !== currentIndex) {
      event.preventDefault();
      const nextTab = tabSlugs[nextIndex];
      setActiveTab(nextTab);
      onTabChange?.(nextTab);
      document.getElementById(`${object360Id}-tab-${nextTab}`)?.focus();
    }
  };

  return h('div', { className: 'flex flex-col h-full' },
    // Header bar
    h('div', { className: 'border-b border-surface-border bg-surface-raised/50' },
      // Top row
      h('div', { className: 'flex items-center gap-4 px-4 py-3' },
        h('button', {
          className: 'p-1 rounded hover:bg-surface-overlay text-slate-400 hover:text-slate-200 focus-ring',
          'aria-label': 'Go back'
        },
          h('svg', { className: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 },
            h('path', { d: 'M15 18l-6-6 6-6' })
          )
        ),
        h('div', { className: 'flex items-center gap-3 flex-1 min-w-0' },
          // Icon
          h('div', { className: 'w-10 h-10 rounded-lg bg-daos-700 flex items-center justify-center text-xl shrink-0' }, '💎'),
          h('div', { className: 'min-w-0' },
            h('div', { className: 'flex items-center gap-2' },
              h('h1', { className: 'text-lg font-semibold text-slate-100 truncate' }, data.name),
              StatusBadge(data.status),
            ),
            h('div', { className: 'flex items-center gap-2 text-xs text-slate-500 mt-0.5' },
              h('span', { className: 'font-mono' }, data.id),
              h('span', {}, '·'),
              h('span', {}, data.type),
              h('span', {}, '·'),
              h('span', {}, data.jurisdiction),
              h('span', {}, '·'),
              h('span', {}, `Updated ${data.lastUpdated} by ${data.updatedBy}`),
            )
          )
        ),
        // Actions
        h('button', {
          className: 'px-3 py-1.5 text-sm bg-daos-600 hover:bg-daos-700 rounded font-medium focus-ring',
        }, 'Actions ▾'),
      ),
      // Tabs
      h('div', { className: 'flex border-t border-surface-border', role: 'tablist', 'aria-label': 'Object details' },
        ...tabs.map(tab => {
          const slug = tab.toLowerCase();
          const tabId = `${object360Id}-tab-${slug}`;
          const panelId = `${object360Id}-panel-${slug}`;
          return h('button', {
            key: slug,
            id: tabId,
            className: `px-4 py-2 text-sm font-medium border-b-2 transition-colors focus-ring ${activeTab === slug ? 'border-daos-500 text-daos-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`,
            onClick: () => { setActiveTab(slug); onTabChange?.(slug); },
            onKeyDown: (event) => handleTabKeyDown(event, slug),
            role: 'tab',
            type: 'button',
            tabIndex: activeTab === slug ? 0 : -1,
            'aria-selected': activeTab === slug,
            'aria-controls': panelId,
          }, tab);
        })
      ),
    ),

    // Tab content
    h('div', { id: activePanelId, className: 'flex-1 overflow-auto scrollbar-thin', role: 'tabpanel', 'aria-labelledby': `${object360Id}-tab-${activeTab}`, tabIndex: 0 },
      activeTab === 'overview' && OverviewTab(data),
      activeTab === 'timeline' && TimelineTab(data),
      activeTab === 'relationships' && PlaceholderTab('Relationships', 'Interactive node-edge relationship graph with expandable connected objects.'),
      activeTab === 'documents' && PlaceholderTab('Documents', 'Document grid with upload, download, preview, version history actions.'),
      activeTab === 'audit' && PlaceholderTab('Audit', 'Searchable audit event log: timestamp, user, action, resource, old → new values.'),
      activeTab === 'compliance' && PlaceholderTab('Compliance', 'Compliance status, active rules grid, open cases, screening status.'),
      activeTab === 'risk' && PlaceholderTab('Risk', 'Risk score, active risk measures (VaR, exposures, concentrations), limit breaches.'),
    )
  );
}

function OverviewTab(data) {
  const { attributes, kpis, recentActivity } = data;
  return h('div', { className: 'p-4 grid grid-cols-1 lg:grid-cols-3 gap-4' },
    // Left: Attributes (60%)
    h('div', { className: 'lg:col-span-2 space-y-4' },
      ...Object.entries(attributes).map(([section, rows]) =>
        h('div', { key: section, className: 'bg-surface-raised border border-surface-border rounded-lg overflow-hidden' },
          h('div', { className: 'px-4 py-2 bg-surface/50 border-b border-surface-border text-xs font-semibold text-slate-400 uppercase' }, section),
          h('div', { className: 'divide-y divide-surface-border' },
            ...rows.map(([label, value], i) =>
              h('div', { key: i, className: 'flex items-center px-4 py-2.5 text-sm' },
                h('span', { className: 'w-40 text-slate-500 shrink-0' }, label),
                h('span', { className: 'text-slate-200 font-mono text-sm' }, value)
              )
            )
          )
        )
      )
    ),
    // Right: Summary cards (40%)
    h('div', { className: 'space-y-4' },
      // Status card
      h('div', { className: 'bg-surface-raised border border-surface-border rounded-lg p-4' },
        h('div', { className: 'text-xs font-semibold text-slate-400 uppercase mb-2' }, 'Status'),
        h('div', { className: 'flex items-center gap-2' },
          h('div', { className: 'w-3 h-3 rounded-full bg-status-success' }),
          h('span', { className: 'text-lg font-semibold text-status-success' }, 'Active'),
        ),
        h('div', { className: 'mt-2 text-xs text-slate-500' }, 'Lifecycle: Issued → Active → (no upcoming events)'),
      ),
      // KPIs
      h('div', { className: 'bg-surface-raised border border-surface-border rounded-lg p-4' },
        h('div', { className: 'text-xs font-semibold text-slate-400 uppercase mb-3' }, 'Key Metrics'),
        ...kpis.map(kpi =>
          h('div', { key: kpi.label, className: 'flex items-center justify-between py-1.5' },
            h('span', { className: 'text-xs text-slate-500' }, kpi.label),
            h('div', { className: 'text-right' },
              h('div', { className: 'text-sm font-semibold text-slate-200' }, kpi.value),
              kpi.change && h('div', { className: `text-2xs ${kpi.change.startsWith('+') ? 'text-status-success' : 'text-status-danger'}` }, kpi.change),
            )
          )
        )
      ),
      // Recent Activity
      h('div', { className: 'bg-surface-raised border border-surface-border rounded-lg p-4' },
        h('div', { className: 'text-xs font-semibold text-slate-400 uppercase mb-3' }, 'Recent Activity'),
        ...recentActivity.map((evt, i) =>
          h('div', { key: i, className: 'py-1.5 border-b border-surface-border last:border-0' },
            h('div', { className: 'text-xs text-slate-300' }, evt.action),
            h('div', { className: 'text-2xs text-slate-500 truncate' }, evt.detail),
            h('div', { className: 'text-2xs text-slate-600 mt-0.5' }, `${evt.time} · ${evt.user}`),
          )
        )
      ),
    )
  );
}

function TimelineTab(data) {
  const { recentActivity } = data;
  return h('div', { className: 'p-4' },
    h('div', { className: 'bg-surface-raised border border-surface-border rounded-lg p-4' },
      h('div', { className: 'text-xs font-semibold text-slate-400 uppercase mb-3' }, 'Activity Timeline'),
      h('div', { className: 'space-y-0' },
        ...recentActivity.map((evt, i) =>
          h('div', { key: i, className: 'flex gap-3 py-3 border-b border-surface-border last:border-0' },
            h('div', { className: 'flex flex-col items-center' },
              h('div', { className: 'w-2 h-2 rounded-full bg-daos-500 mt-1.5' }),
              i < recentActivity.length - 1 && h('div', { className: 'w-px flex-1 bg-surface-border mt-1' })
            ),
            h('div', { className: 'flex-1 min-w-0' },
              h('div', { className: 'text-sm text-slate-200 font-medium' }, evt.action),
              h('div', { className: 'text-xs text-slate-400 mt-0.5' }, evt.detail),
              h('div', { className: 'text-2xs text-slate-500 mt-1' }, `${evt.time} · by ${evt.user}`),
            )
          )
        )
      )
    )
  );
}

function PlaceholderTab(title, description) {
  return h('div', { className: 'flex items-center justify-center h-full' },
    h('div', { className: 'text-center p-8' },
      h('div', { className: 'text-4xl mb-4' }, '📋'),
      h('h3', { className: 'text-lg font-medium text-slate-300 mb-2' }, title),
      h('p', { className: 'text-sm text-slate-500 max-w-md' }, description),
    )
  );
}

function StatusBadge(status) {
  const colors = {
    Active: 'bg-status-success/15 text-status-success border-status-success/30',
    Suspended: 'bg-status-warning/15 text-status-warning border-status-warning/30',
    Inactive: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };
  return h('span', {
    className: `inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${colors[status] || colors.Inactive}`
  }, status);
}
