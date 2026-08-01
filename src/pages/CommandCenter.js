// CommandCenter — Executive Command Center workspace pages
// Pages: dashboard (Dashboard), governance (DataGrid), org-chart (static hierarchy)

import { h, React } from '../lib/dom.js';
import { Dashboard } from '../components/Dashboard.js';
import { DataGrid } from '../components/DataGrid.js';

// Mock board resolutions for governance page
const BOARD_RESOLUTIONS = [
  { id: 'RES-2026-042', title: 'Approval of Q3 Investment Strategy — Digital Asset Allocation Increase', status: 'Approved', date: '2026-07-28', sponsor: 'Maria Chen', type: 'Investment Policy' },
  { id: 'RES-2026-041', title: 'Risk Appetite Framework Update — Crypto Exposure Limit Raised to 3%', status: 'Approved', date: '2026-07-25', sponsor: 'James Sullivan', type: 'Risk Management' },
  { id: 'RES-2026-040', title: 'New Custody Partner Onboarding — Copper Technologies', status: 'Pending', date: '2026-07-22', sponsor: 'Sarah Lee', type: 'Operational' },
  { id: 'RES-2026-039', title: 'ESG Screening Criteria Update — Article 8 Fund Classification', status: 'Approved', date: '2026-07-18', sponsor: 'Rachel Brown', type: 'Compliance' },
  { id: 'RES-2026-038', title: 'Tokenized Money Market Fund Launch — BR Prime Liquidity Token', status: 'Approved', date: '2026-07-15', sponsor: 'Alex Kim', type: 'Product' },
  { id: 'RES-2026-037', title: 'Annual Review of Counterparty Credit Limits — Q3 2026', status: 'In Review', date: '2026-07-10', sponsor: 'James Sullivan', type: 'Risk Management' },
];

const RESOLUTION_COLUMNS = [
  { key: 'id', label: 'Resolution ID', sortable: true },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'sponsor', label: 'Sponsor', sortable: true },
];

// Org hierarchy data
const ORG_HIERARCHY = [
  { id: 'BR-GLOBAL', name: 'BR Global Asset Management Ltd.', jurisdiction: 'Bermuda', type: 'Holding Company', parent: null },
  { id: 'BR-US', name: 'BR Global US LLC', jurisdiction: 'Delaware, US', type: 'Operating Company', parent: 'BR-GLOBAL' },
  { id: 'BR-EU', name: 'BR Global Europe S.A.', jurisdiction: 'Luxembourg', type: 'Operating Company', parent: 'BR-GLOBAL' },
  { id: 'BR-APAC', name: 'BR Global Asia Pacific Pte. Ltd.', jurisdiction: 'Singapore', type: 'Operating Company', parent: 'BR-GLOBAL' },
  { id: 'BR-FUND-I', name: 'BR Global Fund I SICAV', jurisdiction: 'Luxembourg', type: 'Fund Vehicle', parent: 'BR-EU' },
  { id: 'BR-FUND-II', name: 'BR Global Fund II LP', jurisdiction: 'Cayman Islands', type: 'Fund Vehicle', parent: 'BR-GLOBAL' },
  { id: 'BR-FUND-III', name: 'BR Digital Assets Feeder Ltd.', jurisdiction: 'BVI', type: 'Fund Vehicle', parent: 'BR-FUND-II' },
  { id: 'BR-SERVICES', name: 'BR Fund Services Ltd.', jurisdiction: 'Ireland', type: 'Service Company', parent: 'BR-EU' },
  { id: 'BR-TRUST', name: 'BR Global Trust Co.', jurisdiction: 'Delaware, US', type: 'Trust Company', parent: 'BR-US' },
];

export function CommandCenter({ page }) {
  if (page === 'dashboard' || !page) {
    return h(Dashboard, {});
  }

  if (page === 'governance') {
    return h('div', { className: 'flex flex-col h-full' },
      h('div', { className: 'flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-raised/50' },
        h('div', { className: 'flex items-center gap-2' },
          h('h2', { className: 'text-sm font-semibold text-slate-200' }, 'Governance Board'),
          h('span', { className: 'text-2xs text-slate-500' }, `${BOARD_RESOLUTIONS.length} resolutions`),
        ),
        h('div', { className: 'flex items-center gap-2' },
          h('button', { className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring' }, '+ New Resolution'),
        )
      ),
      h('div', { className: 'flex-1 overflow-hidden' },
        h(DataGrid, {
          data: BOARD_RESOLUTIONS,
          columns: RESOLUTION_COLUMNS,
          idKey: 'id',
        })
      )
    );
  }

  if (page === 'org-chart') {
    return h('div', { className: 'flex flex-col h-full' },
      h('div', { className: 'flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-raised/50' },
        h('div', { className: 'flex items-center gap-2' },
          h('h2', { className: 'text-sm font-semibold text-slate-200' }, 'Organisational Structure'),
          h('span', { className: 'text-2xs text-slate-500' }, `${ORG_HIERARCHY.length} entities`),
        ),
      ),
      h('div', { className: 'flex-1 overflow-auto scrollbar-thin p-6' },
        h('div', { className: 'max-w-3xl mx-auto' },
          ...ORG_HIERARCHY.filter(e => !e.parent).map(root =>
            h('div', { key: root.id, className: 'mb-6' },
              // Root node
              h('div', { className: 'flex items-center justify-center' },
                h('div', { className: 'bg-daos-900/40 border border-daos-500/40 rounded-lg px-6 py-4 text-center' },
                  h('div', { className: 'text-sm font-semibold text-daos-300' }, root.name),
                  h('div', { className: 'text-2xs text-daos-400 mt-1' }, `${root.type} · ${root.jurisdiction}`),
                )
              ),
              // Connector line
              h('div', { className: 'flex justify-center py-2' },
                h('svg', { width: 2, height: 24, 'aria-hidden': 'true' },
                  h('line', { x1: 1, y1: 0, x2: 1, y2: 24, stroke: '#475569', strokeWidth: 1 })
                )
              ),
              // Children
              h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
                ...ORG_HIERARCHY.filter(e => e.parent === root.id).map(child => {
                  const grandchildren = ORG_HIERARCHY.filter(e => e.parent === child.id);
                  return h('div', { key: child.id, className: 'flex flex-col items-center' },
                    h('div', { className: 'bg-surface-raised/60 border border-surface-border rounded-lg px-5 py-3 text-center w-full' },
                      h('div', { className: 'text-sm font-medium text-slate-200' }, child.name),
                      h('div', { className: 'text-2xs text-slate-500 mt-1' }, `${child.type} · ${child.jurisdiction}`),
                    ),
                    grandchildren.length > 0 && h('div', { className: 'flex flex-col items-center w-full' },
                      h('div', { className: 'py-2' },
                        h('svg', { width: 2, height: 16, 'aria-hidden': 'true' },
                          h('line', { x1: 1, y1: 0, x2: 1, y2: 16, stroke: '#475569', strokeWidth: 1 })
                        )
                      ),
                      ...grandchildren.map(gc =>
                        h('div', { key: gc.id, className: 'bg-surface/50 border border-surface-border rounded px-4 py-2 text-center w-full mb-2' },
                          h('div', { className: 'text-xs text-slate-300' }, gc.name),
                          h('div', { className: 'text-2xs text-slate-500' }, `${gc.type} · ${gc.jurisdiction}`),
                        )
                      ),
                    ),
                  );
                })
              ),
            )
          )
        ),
      )
    );
  }

  return h('div', { className: 'flex items-center justify-center h-full text-slate-500' }, 'Unknown page');
}
