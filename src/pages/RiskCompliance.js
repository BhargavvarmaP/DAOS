// RiskCompliance — Risk & Compliance workspace pages
// Pages: dashboard (ExceptionQueue + summary), cases (ExceptionQueue filtered), audit (AuditExplorer)

import { h, React } from '../lib/dom.js';
import { ExceptionQueue } from '../components/ExceptionQueue.js';
import { AuditExplorer } from '../components/AuditExplorer.js';
import { MOCK_COMPLIANCE_CASES } from '../data/mockCompliance.js';

function ComplianceSummary() {
  const cases = MOCK_COMPLIANCE_CASES;
  const critical = cases.filter(c => c.severity === 'Critical' && c.status !== 'Resolved');
  const material = cases.filter(c => c.severity === 'Material' && c.status !== 'Resolved');
  const open = cases.filter(c => c.status !== 'Resolved');
  const resolvedThisMonth = cases.filter(c => {
    if (c.status !== 'Resolved') return false;
    const d = new Date(c.openedDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const tiles = [
    { label: 'Critical', value: critical.length, color: 'text-priority-critical', bg: 'bg-priority-critical/10', border: 'border-priority-critical/30' },
    { label: 'Material', value: material.length, color: 'text-priority-high', bg: 'bg-priority-high/10', border: 'border-priority-high/30' },
    { label: 'Open Cases', value: open.length, color: 'text-status-warning', bg: 'bg-status-warning/10', border: 'border-status-warning/30' },
    { label: 'Resolved (MTD)', value: resolvedThisMonth.length, color: 'text-status-success', bg: 'bg-status-success/10', border: 'border-status-success/30' },
  ];

  return h('div', { className: 'grid grid-cols-4 gap-3 px-4 py-3 border-b border-surface-border bg-surface' },
    ...tiles.map(tile =>
      h('div', {
        key: tile.label,
        className: `flex flex-col items-center py-2 rounded-lg border ${tile.bg} ${tile.border}`,
      },
        h('span', { className: `text-2xl font-bold ${tile.color}` }, String(tile.value)),
        h('span', { className: 'text-2xs text-slate-400 mt-0.5 uppercase tracking-wider' }, tile.label),
      )
    )
  );
}

export function RiskCompliance({ page }) {
  if (page === 'dashboard' || !page) {
    return h('div', { className: 'flex flex-col h-full' },
      h('div', { className: 'flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-raised/50' },
        h('div', { className: 'flex items-center gap-2' },
          h('h2', { className: 'text-sm font-semibold text-slate-200' }, 'Compliance Dashboard'),
          h('span', { className: 'text-2xs text-slate-500' }, `${MOCK_COMPLIANCE_CASES.length} cases tracked`),
        ),
      ),
      h(ComplianceSummary, {}),
      h('div', { className: 'flex-1 overflow-hidden' },
        h(ExceptionQueue, {})
      )
    );
  }

  if (page === 'cases') {
    // Cases page: same ExceptionQueue with full view
    return h('div', { className: 'flex flex-col h-full' },
      h('div', { className: 'flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-raised/50' },
        h('div', { className: 'flex items-center gap-2' },
          h('h2', { className: 'text-sm font-semibold text-slate-200' }, 'Case Manager'),
          h('span', { className: 'text-2xs text-slate-500' }, 'All compliance cases'),
        ),
        h('div', { className: 'flex items-center gap-2' },
          h('button', { className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring' }, '+ New Case'),
          h('button', { className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring' }, '📥 Export'),
        )
      ),
      h('div', { className: 'flex-1 overflow-hidden' },
        h(ExceptionQueue, {})
      )
    );
  }

  if (page === 'audit') {
    return h('div', { className: 'flex flex-col h-full' },
      h(AuditExplorer, {})
    );
  }

  return h('div', { className: 'flex items-center justify-center h-full text-slate-500' }, 'Unknown page');
}
