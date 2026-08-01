// ApprovalQueue — dual-pane maker-checker enforcement
// UX spec §5.6: Approve/Reject/Request Info, delegation, SLA timer

import { h, React } from '../lib/dom.js';

const MOCK_APPROVALS = [
  { id: 'APR-001', subject: 'NAV sign-off: Fund BR-Global-01 (Q2 2026)', maker: 'Alex Kim', amount: '$2.4B NAV', submitted: '2026-07-29 10:15', sla: '2h remaining', risk: 'Low', status: 'pending', type: 'NAV' },
  { id: 'APR-002', subject: 'Token minting: US0378331005 — 50,000 tokens', maker: 'Sarah Lee', amount: '50,000 AAPL-T', submitted: '2026-07-29 09:30', sla: '1h 15m remaining', risk: 'Medium', status: 'pending', type: 'Token' },
  { id: 'APR-003', subject: 'Participant onboarding: Goldman Sachs & Co.', maker: 'Rachel Brown', amount: '—', submitted: '2026-07-29 08:00', sla: 'BREACHED', risk: 'High', status: 'pending', type: 'Onboarding' },
  { id: 'APR-004', subject: 'Trade: Buy 10,000 MSFT @ 410.25 (Limit)', maker: 'James Sullivan', amount: '$4.1M', submitted: '2026-07-28 16:45', sla: 'BREACHED', risk: 'Medium', status: 'pending', type: 'Trade' },
  { id: 'APR-005', subject: 'Rule change: Investment Guideline IG-0047', maker: 'Maria Chen', amount: '—', submitted: '2026-07-28 14:20', sla: 'BREACHED', risk: 'High', status: 'pending', type: 'Compliance' },
  { id: 'APR-006', subject: 'Payment: $5.2M to Counterparty XYZ', maker: 'Alex Kim', amount: '$5.2M', submitted: '2026-07-29 11:00', sla: '3h remaining', risk: 'Medium', status: 'approved', type: 'Payment' },
];

export function ApprovalQueue() {
  const [approvals, setApprovals] = React.useState(MOCK_APPROVALS);
  const [selectedId, setSelectedId] = React.useState(approvals[0]?.id || null);
  const [comment, setComment] = React.useState('');

  const selected = approvals.find(a => a.id === selectedId);
  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const breachedCount = approvals.filter(a => a.sla === 'BREACHED').length;

  const handleAction = (action) => {
    if ((action === 'reject' || action === 'request-info') && !comment.trim()) return;
    setApprovals(prev => prev.map(a =>
      a.id === selectedId ? { ...a, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'info-requested' } : a
    ));
    setComment('');
    // Select next pending
    const next = approvals.find(a => a.status === 'pending' && a.id !== selectedId);
    if (next) setSelectedId(next.id);
  };

  const riskColors = {
    Low: 'bg-status-success/15 text-status-success',
    Medium: 'bg-status-warning/15 text-status-warning',
    High: 'bg-status-danger/15 text-status-danger',
  };

  if (!selected) {
    return h('div', { className: 'flex items-center justify-center h-full text-slate-500' }, 'No approvals pending');
  }

  return h('div', { className: 'flex h-full' },
    // Left pane: Approval list
    h('div', { className: 'w-80 border-r border-surface-border flex flex-col bg-surface' },
      h('div', { className: 'px-4 py-3 border-b border-surface-border' },
        h('div', { className: 'flex items-center justify-between' },
          h('h2', { className: 'text-sm font-semibold text-slate-200' }, 'Approval Queue'),
          h('div', { className: 'flex gap-1 text-2xs' },
            h('span', { className: 'px-1.5 py-0.5 bg-status-warning/15 text-status-warning rounded-full' }, `${pendingCount} pending`),
            h('span', { className: 'px-1.5 py-0.5 bg-status-danger/15 text-status-danger rounded-full' }, `${breachedCount} breached`),
          )
        )
      ),
      // Tabs
      h('div', { className: 'flex border-b border-surface-border text-xs' },
        ...['All', 'Pending', 'Breached', 'High Risk'].map(t =>
          h('button', { key: t, className: `flex-1 py-2 text-center text-slate-400 hover:text-slate-200 border-b-2 border-transparent hover:border-slate-600 focus-ring` }, t)
        )
      ),
      // List
      h('div', { className: 'flex-1 overflow-auto scrollbar-thin' },
        ...approvals.map(a =>
          h('button', {
            key: a.id,
            className: `w-full text-left px-4 py-3 border-b border-surface-border hover:bg-surface-overlay transition-colors focus-ring ${selectedId === a.id ? 'bg-daos-900/20 border-l-2 border-l-daos-500' : ''} ${a.status !== 'pending' ? 'opacity-60' : ''}`,
            onClick: () => setSelectedId(a.id),
          },
            h('div', { className: 'flex items-center justify-between' },
              h('span', { className: 'text-xs font-mono text-slate-500' }, a.id),
              h('span', { className: `text-2xs px-1.5 py-0.5 rounded-full ${riskColors[a.risk]}` }, a.risk)
            ),
            h('div', { className: 'text-sm text-slate-200 mt-0.5 line-clamp-2' }, a.subject),
            h('div', { className: 'flex items-center gap-2 mt-1.5 text-2xs text-slate-500' },
              h('span', {}, `Maker: ${a.maker}`),
              a.amount !== '—' && h('span', {}, a.amount),
            ),
            h('div', { className: `text-2xs mt-0.5 ${a.sla.includes('BREACHED') ? 'text-status-danger font-medium' : a.sla.includes('remaining') && parseInt(a.sla) <= 2 ? 'text-status-warning' : 'text-slate-500'}` },
              `⏱ ${a.sla}`
            ),
            a.status !== 'pending' && h('div', { className: `text-2xs mt-1 font-medium ${a.status === 'approved' ? 'text-status-success' : a.status === 'rejected' ? 'text-status-danger' : 'text-status-info'}` },
              a.status === 'approved' ? '✓ Approved' : a.status === 'rejected' ? '✗ Rejected' : '↩ Info Requested'
            )
          )
        )
      )
    ),

    // Right pane: Item detail
    h('div', { className: 'flex-1 flex flex-col min-w-0' },
      // Detail header
      h('div', { className: 'px-6 py-4 border-b border-surface-border bg-surface-raised/50' },
        h('div', { className: 'text-xs font-mono text-slate-500' }, `${selected.id} · ${selected.type}`),
        h('h3', { className: 'text-base font-semibold text-slate-100 mt-1' }, selected.subject),
        h('div', { className: 'grid grid-cols-2 gap-x-8 gap-y-1 mt-3 text-sm' },
          h('div', { className: 'flex justify-between' },
            h('span', { className: 'text-slate-500' }, 'Maker'),
            h('span', { className: 'text-slate-300' }, selected.maker),
          ),
          h('div', { className: 'flex justify-between' },
            h('span', { className: 'text-slate-500' }, 'Submitted'),
            h('span', { className: 'text-slate-300 text-xs' }, selected.submitted),
          ),
          h('div', { className: 'flex justify-between' },
            h('span', { className: 'text-slate-500' }, 'Risk Level'),
            h('span', { className: `font-medium ${selected.risk === 'High' ? 'text-status-danger' : selected.risk === 'Medium' ? 'text-status-warning' : 'text-status-success'}` }, selected.risk),
          ),
          h('div', { className: 'flex justify-between' },
            h('span', { className: 'text-slate-500' }, 'SLA'),
            h('span', { className: selected.sla.includes('BREACHED') ? 'text-status-danger' : 'text-slate-300' }, selected.sla),
          ),
        ),
      ),
      // Maker-Checker enforcement
      h('div', { className: 'px-6 py-2 bg-status-danger/5 border-b border-status-danger/10 text-xs text-status-warning' },
        '⚠ Maker ≠ Checker enforced: maker was ' + selected.maker + '. You are James Sullivan.'
      ),
      // Detail content placeholder
      h('div', { className: 'flex-1 overflow-auto scrollbar-thin p-6' },
        h('div', { className: 'bg-surface rounded-lg border border-surface-border p-4 text-sm text-slate-400' },
          h('p', {}, 'Full context and supporting documents would appear here.'),
          h('p', { className: 'mt-2' }, 'This includes: trade details, participant information, risk assessment, compliance checks, and any attached documents.')
        ),
        // Approval history
        selected.status !== 'pending' && h('div', { className: 'mt-4 p-4 bg-surface rounded-lg border border-surface-border' },
          h('h4', { className: 'text-xs font-semibold text-slate-400 uppercase mb-3' }, 'Approval History'),
          h('div', { className: 'text-xs text-slate-500' }, `${selected.status === 'approved' ? '✓' : selected.status === 'rejected' ? '✗' : '↩'} ${selected.status} by James Sullivan · Just now`),
        ),
      ),
      // Action buttons
      selected.status === 'pending' && h('div', { className: 'border-t border-surface-border px-6 py-4 bg-surface-raised/30' },
        // Comment
        h('div', { className: 'mb-3' },
          h('textarea', {
            value: comment,
            onInput: (e) => setComment(e.target.value),
            placeholder: 'Add comment (required for Reject / Request Info)...',
            rows: 2,
            className: 'w-full px-3 py-2 bg-surface border border-surface-border rounded text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-daos-500 resize-none',
            'aria-label': 'Approval comment'
          })
        ),
        // Buttons
        h('div', { className: 'flex items-center gap-3' },
          h('button', {
            className: 'flex-1 py-2.5 bg-status-success hover:bg-status-success/90 text-white rounded font-medium text-sm focus-ring',
            onClick: () => handleAction('approve'),
          }, '✓ Approve'),
          h('button', {
            className: 'flex-1 py-2.5 bg-status-danger hover:bg-status-danger/90 text-white rounded font-medium text-sm focus-ring',
            onClick: () => handleAction('reject'),
          }, '✗ Reject'),
          h('button', {
            className: 'flex-1 py-2.5 bg-status-warning hover:bg-status-warning/90 text-white rounded font-medium text-sm focus-ring',
            onClick: () => handleAction('request-info'),
          }, '↩ Request Info'),
          h('button', {
            className: 'px-3 py-2.5 border border-surface-border rounded text-sm text-slate-400 hover:text-slate-200 hover:bg-surface-overlay focus-ring',
            'aria-label': 'Delegate approval'
          }, 'Delegate'),
        )
      ),
      selected.status !== 'pending' && h('div', { className: 'border-t border-surface-border px-6 py-4 text-center' },
        h('span', {
          className: `text-sm font-medium ${selected.status === 'approved' ? 'text-status-success' : selected.status === 'rejected' ? 'text-status-danger' : 'text-status-info'}`
        }, selected.status === 'approved' ? '✓ Approved' : selected.status === 'rejected' ? '✗ Rejected' : '↩ Info Requested'),
      ),
    )
  );
}
