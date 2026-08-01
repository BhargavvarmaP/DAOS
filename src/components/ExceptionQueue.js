// ExceptionQueue — severity-classified exception management queue
// UX spec §5.5: Severity icons, type badges, aging with escalation, resolution workflow

import { h, React } from '../lib/dom.js';

const MOCK_EXCEPTIONS = [
  { id: 'EXC-001', subject: 'Reconciliation break — ISIN US0378331005 (Apple Inc.)', severity: 'Critical', type: 'Reconciliation Break', age: '2h', escalated: true, source: 'Custody Reconciliation Engine', assignee: 'Maria Chen', status: 'Open', trend: 'Recurring (3rd this month)', correlationId: 'CORR-8842' },
  { id: 'EXC-002', subject: 'Settlement fail — STL-000456 (DTCC)', severity: 'Critical', type: 'Settlement Fail', age: '4h', escalated: true, source: 'DTCC Matching Service', assignee: 'Sarah Lee', status: 'Investigating', trend: 'First occurrence', correlationId: 'CORR-8845' },
  { id: 'EXC-003', subject: 'AML alert — Participant Goldman Sachs (High Risk)', severity: 'Critical', type: 'AML Alert', age: '30m', escalated: false, source: 'AML Transaction Monitor', assignee: null, status: 'Open', trend: 'Linked to SAR-FIL-2026-0042', correlationId: 'CORR-8901' },
  { id: 'EXC-004', subject: 'Screening hit — Counterparty XYZ matches OFAC SDN', severity: 'Critical', type: 'Screening Hit', age: '1h', escalated: true, source: 'Sanctions Screening Engine', assignee: 'James Sullivan', status: 'Investigating', trend: 'New list update triggered', correlationId: 'CORR-8912' },
  { id: 'EXC-005', subject: 'NAV variance exceed threshold — Fund BR-Global-01 (±2.3%)', severity: 'Material', type: 'Data Quality Exception', age: '3h', escalated: false, source: 'NAV Calculation Engine', assignee: 'Alex Kim', status: 'Open', trend: 'Second occurrence this week', correlationId: 'CORR-8765' },
  { id: 'EXC-006', subject: 'Missing LEI for participant — Blackstone RE Fund III', severity: 'Material', type: 'Data Quality Exception', age: '1d', escalated: false, source: 'Participant Data Validator', assignee: null, status: 'Open', trend: 'New participant onboarding', correlationId: 'CORR-8700' },
  { id: 'EXC-007', subject: 'Trade confirmation mismatch — TRD-20260728-000123', severity: 'Material', type: 'Reconciliation Break', age: '6h', escalated: false, source: 'Trade Confirmation Matcher', assignee: 'Rachel Brown', status: 'Investigating', trend: 'Price variance $0.15/sh', correlationId: 'CORR-8801' },
  { id: 'EXC-008', subject: 'Settlement fail investigation — STL-000501 (Euroclear)', severity: 'Material', type: 'Settlement Fail', age: '8h', escalated: true, source: 'Euroclear Settlement Feed', assignee: 'Maria Chen', status: 'Investigating', trend: 'Insufficient securities', correlationId: 'CORR-8915' },
  { id: 'EXC-009', subject: 'Data quality — Incomplete SSI for custody account CUST-0456', severity: 'Minor', type: 'Data Quality Exception', age: '2d', escalated: false, source: 'SSI Validator', assignee: null, status: 'Open', trend: 'First occurrence', correlationId: 'CORR-8600' },
  { id: 'EXC-010', subject: 'Payment routing validation — UETR-abc123def456', severity: 'Material', type: 'Settlement Fail', age: '12h', escalated: true, source: 'Payment Routing Engine', assignee: 'Sarah Lee', status: 'Investigating', trend: 'Invalid BIC', correlationId: 'CORR-8920' },
  { id: 'EXC-011', subject: 'Corporate action election mismatch — MSFT dividend', severity: 'Minor', type: 'Reconciliation Break', age: '1d', escalated: false, source: 'Corporate Action Relay', assignee: null, status: 'Open', trend: 'First occurrence', correlationId: 'CORR-8550' },
  { id: 'EXC-012', subject: 'Margin call dispute — Counterparty XYZ (CSA-0042)', severity: 'Critical', type: 'Settlement Fail', age: '1h', escalated: false, source: 'Collateral Management Engine', assignee: 'James Sullivan', status: 'Open', trend: 'Third dispute this quarter', correlationId: 'CORR-8930' },
  { id: 'EXC-013', subject: 'Screening hit — Payment to high-risk jurisdiction (Cayman Islands)', severity: 'Critical', type: 'Screening Hit', age: '20m', escalated: false, source: 'Payment Screening Service', assignee: null, status: 'Open', trend: 'First occurrence', correlationId: 'CORR-8940' },
  { id: 'EXC-014', subject: 'Position reconciliation break — Fund Alpha vs Custodian', severity: 'Material', type: 'Reconciliation Break', age: '5h', escalated: false, source: 'Position Reconciliation Engine', assignee: 'Alex Kim', status: 'Open', trend: 'Quantity mismatch 500 shares', correlationId: 'CORR-8950' },
  { id: 'EXC-015', subject: 'AML alert — Structuring pattern detected (Participant DEF)', severity: 'Critical', type: 'AML Alert', age: '45m', escalated: true, source: 'AML Transaction Monitor', assignee: 'Maria Chen', status: 'Investigating', trend: 'Multiple sub-$10K transactions', correlationId: 'CORR-8960' },
  { id: 'EXC-016', subject: 'Token supply reconciliation — On-chain vs ledger (US0378331005)', severity: 'Material', type: 'Reconciliation Break', age: '3h', escalated: false, source: 'On-Chain Reconciliation Engine', assignee: null, status: 'Open', trend: 'First occurrence', correlationId: 'CORR-8970' },
];

const SEVERITY_CONFIG = {
  Critical: { icon: '⛔', color: 'text-priority-critical', bg: 'bg-priority-critical/15', border: 'border-priority-critical/30', label: 'Critical' },
  Material: { icon: '⚠', color: 'text-priority-high', bg: 'bg-priority-high/15', border: 'border-priority-high/30', label: 'Material' },
  Minor: { icon: '🔹', color: 'text-priority-medium', bg: 'bg-priority-medium/15', border: 'border-priority-medium/30', label: 'Minor' },
};

const TYPE_COLORS = {
  'Reconciliation Break': 'bg-status-info/15 text-status-info',
  'Settlement Fail': 'bg-status-danger/15 text-status-danger',
  'Screening Hit': 'bg-priority-critical/15 text-priority-critical',
  'AML Alert': 'bg-status-danger/15 text-status-danger',
  'Data Quality Exception': 'bg-status-warning/15 text-status-warning',
};

const STATUS_COLORS = {
  'Open': 'bg-slate-500/15 text-slate-300',
  'Investigating': 'bg-status-info/15 text-status-info',
  'Resolved': 'bg-status-success/15 text-status-success',
};

export function ExceptionQueue() {
  const [exceptions, setExceptions] = React.useState(MOCK_EXCEPTIONS);
  const [activeTab, setActiveTab] = React.useState('all');
  const [selectedId, setSelectedId] = React.useState(null);
  const [resolutionComment, setResolutionComment] = React.useState('');
  const [showResolvePanel, setShowResolvePanel] = React.useState(false);
  const [resolveAction, setResolveAction] = React.useState(null);
  const [auditTrail, setAuditTrail] = React.useState([]);

  const tabs = [
    { key: 'all', label: 'All', count: exceptions.length },
    { key: 'critical', label: 'Critical', count: exceptions.filter(e => e.severity === 'Critical').length },
    { key: 'open', label: 'Unassigned', count: exceptions.filter(e => !e.assignee).length },
    { key: 'escalated', label: 'Escalated', count: exceptions.filter(e => e.escalated).length },
    { key: 'investigating', label: 'In Progress', count: exceptions.filter(e => e.status === 'Investigating').length },
  ];

  const filtered = exceptions.filter(e => {
    if (activeTab === 'critical') return e.severity === 'Critical';
    if (activeTab === 'open') return !e.assignee;
    if (activeTab === 'escalated') return e.escalated;
    if (activeTab === 'investigating') return e.status === 'Investigating';
    return true;
  });

  const selected = exceptions.find(e => e.id === selectedId);

  const handleResolve = (action) => {
    if (action === 'Accept' || action === 'Reject' || action === 'Adjust') {
      if (!resolutionComment.trim()) return;
    }
    const now = new Date().toISOString();
    const entry = {
      timestamp: now,
      action,
      comment: resolutionComment,
      actor: 'James Sullivan',
      exceptionId: selectedId,
    };
    setAuditTrail(prev => [entry, ...prev]);
    setExceptions(prev => prev.map(e =>
      e.id === selectedId ? { ...e, status: 'Resolved' } : e
    ));
    setResolutionComment('');
    setShowResolvePanel(false);
    setResolveAction(null);
    setSelectedId(null);
  };

  const openResolve = (action) => {
    setResolveAction(action);
    setShowResolvePanel(true);
    setResolutionComment('');
  };

  return h('div', { className: 'flex h-full' },
    // Main list area
    h('div', { className: 'flex-1 flex flex-col min-w-0' },
      // Header
      h('div', { className: 'flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-raised/50' },
        h('div', { className: 'flex items-center gap-2' },
          h('h2', { className: 'text-sm font-semibold text-slate-200' }, 'Exception Queue'),
          h('span', { className: 'text-2xs text-slate-500' }, `${exceptions.filter(e => e.status !== 'Resolved').length} active`),
        ),
        h('div', { className: 'flex items-center gap-2' },
          h('button', { className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring' }, '⚙ Filters'),
          h('button', { className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring' }, '📥 Export'),
        )
      ),
      // Tabs
      h('div', { className: 'flex border-b border-surface-border bg-surface', role: 'tablist' },
        ...tabs.map(tab =>
          h('button', {
            key: tab.key,
            className: `px-4 py-2 text-xs font-medium border-b-2 transition-colors focus-ring ${activeTab === tab.key ? 'border-daos-500 text-daos-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`,
            onClick: () => setActiveTab(tab.key),
            role: 'tab',
            'aria-selected': String(activeTab === tab.key),
          }, `${tab.label} (${tab.count})`)
        )
      ),
      // Exception list
      h('div', { className: 'flex-1 overflow-auto scrollbar-thin' },
        h('table', { className: 'w-full', role: 'grid', 'aria-label': 'Exception queue items' },
          h('thead', { className: 'bg-surface sticky top-0 z-10' },
            h('tr', {},
              h('th', { className: 'w-10 px-2' }),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'ID'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Severity'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Subject'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Type'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Source'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Age'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Owner'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Status'),
              h('th', { className: 'w-10' }),
            )
          ),
          h('tbody', {},
            ...filtered.map(exc => {
              const sev = SEVERITY_CONFIG[exc.severity];
              return h('tr', {
                key: exc.id,
                className: `border-b border-surface-border hover:bg-surface-overlay/50 transition-colors cursor-pointer ${selectedId === exc.id ? 'bg-daos-900/20' : ''} ${exc.status === 'Resolved' ? 'opacity-50' : ''}`,
                onClick: () => setSelectedId(selectedId === exc.id ? null : exc.id),
                role: 'row',
              },
                h('td', { className: 'px-2' },
                  exc.escalated && h('span', { className: 'text-priority-critical text-xs', title: 'Escalated' }, '⇧')
                ),
                h('td', { className: 'px-3 py-2 text-xs font-mono text-slate-500' }, exc.id),
                h('td', { className: 'px-3 py-2' },
                  h('span', { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium ${sev.bg} ${sev.color} border ${sev.border}` },
                    h('span', {}, sev.icon),
                    h('span', {}, sev.label)
                  )
                ),
                h('td', { className: 'px-3 py-2 text-sm text-slate-200 max-w-[280px] truncate' }, exc.subject),
                h('td', { className: 'px-3 py-2 text-xs' },
                  h('span', { className: `px-1.5 py-0.5 rounded-full text-2xs ${TYPE_COLORS[exc.type] || 'bg-slate-500/15 text-slate-400'}` }, exc.type)
                ),
                h('td', { className: 'px-3 py-2 text-xs text-slate-400 max-w-[160px] truncate' }, exc.source),
                h('td', { className: 'px-3 py-2 text-xs text-slate-400' }, exc.age),
                h('td', { className: 'px-3 py-2 text-xs text-slate-400' }, exc.assignee || h('span', { className: 'text-slate-600 italic' }, 'Unassigned')),
                h('td', { className: 'px-3 py-2 text-xs' },
                  h('span', { className: `px-1.5 py-0.5 rounded-full text-2xs ${STATUS_COLORS[exc.status] || 'bg-slate-500/15 text-slate-300'}` }, exc.status)
                ),
                h('td', { className: 'px-2' },
                  h('button', { className: 'p-1 text-slate-500 hover:text-slate-200 focus-ring', 'aria-label': `Actions for ${exc.id}`, onClick: (ev) => ev.stopPropagation() }, '⋮')
                )
              );
            })
          )
        )
      ),
      // Footer
      h('div', { className: 'flex items-center justify-between px-4 py-1.5 border-t border-surface-border text-xs text-slate-500' },
        h('span', {}, `Showing ${filtered.length} exceptions`),
        h('span', {}, `${exceptions.filter(e => e.escalated).length} escalated`),
      ),
    ),

    // Right detail / resolution panel
    selected && h('div', { className: 'w-96 border-l border-surface-border bg-surface-raised/30 flex flex-col overflow-auto scrollbar-thin' },
      // Detail header
      h('div', { className: 'px-4 py-3 border-b border-surface-border' },
        h('div', { className: 'flex items-center justify-between mb-2' },
          h('span', { className: 'text-xs font-mono text-slate-500' }, selected.id),
          h('button', {
            className: 'text-slate-500 hover:text-slate-200 text-xs focus-ring',
            onClick: () => setSelectedId(null),
            'aria-label': 'Close detail'
          }, '✕')
        ),
        h('div', { className: 'flex items-center gap-2 mb-2' },
          h('span', { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium ${SEVERITY_CONFIG[selected.severity].bg} ${SEVERITY_CONFIG[selected.severity].color} border ${SEVERITY_CONFIG[selected.severity].border}` },
            SEVERITY_CONFIG[selected.severity].icon, SEVERITY_CONFIG[selected.severity].label
          ),
          h('span', { className: `px-1.5 py-0.5 rounded-full text-2xs ${TYPE_COLORS[selected.type] || 'bg-slate-500/15 text-slate-400'}` }, selected.type),
          selected.escalated && h('span', { className: 'px-1.5 py-0.5 bg-priority-critical/15 text-priority-critical text-2xs rounded-full font-medium' }, 'ESCALATED'),
        ),
        h('h3', { className: 'text-sm text-slate-200 mb-3' }, selected.subject),
        h('div', { className: 'grid grid-cols-2 gap-1 text-xs' },
          h('span', { className: 'text-slate-500' }, 'Age'),
          h('span', { className: 'text-slate-300' }, selected.age),
          h('span', { className: 'text-slate-500' }, 'Source'),
          h('span', { className: 'text-slate-300 truncate' }, selected.source),
          h('span', { className: 'text-slate-500' }, 'Assigned'),
          h('span', { className: 'text-slate-300' }, selected.assignee || 'Unassigned'),
          h('span', { className: 'text-slate-500' }, 'Status'),
          h('span', { className: `font-medium ${selected.status === 'Resolved' ? 'text-status-success' : 'text-slate-300'}` }, selected.status),
          h('span', { className: 'text-slate-500' }, 'Trend'),
          h('span', { className: 'text-slate-300 truncate' }, selected.trend),
          h('span', { className: 'text-slate-500' }, 'Correlation'),
          h('span', { className: 'text-slate-300 font-mono text-2xs truncate' }, selected.correlationId),
        ),
      ),

      // Resolution workflow (only for unresolved)
      selected.status !== 'Resolved' && h('div', { className: 'border-b border-surface-border' },
        h('div', { className: 'px-4 py-3' },
          h('div', { className: 'text-xs font-semibold text-slate-400 uppercase mb-3' }, 'Resolution'),
          !showResolvePanel
            ? h('div', { className: 'flex gap-2' },
              h('button', {
                className: 'flex-1 py-2 bg-status-success/15 text-status-success border border-status-success/30 rounded text-xs font-medium hover:bg-status-success/25 focus-ring',
                onClick: () => openResolve('Accept'),
              }, '✓ Accept'),
              h('button', {
                className: 'flex-1 py-2 bg-status-danger/15 text-status-danger border border-status-danger/30 rounded text-xs font-medium hover:bg-status-danger/25 focus-ring',
                onClick: () => openResolve('Reject'),
              }, '✗ Reject'),
              h('button', {
                className: 'flex-1 py-2 bg-status-warning/15 text-status-warning border border-status-warning/30 rounded text-xs font-medium hover:bg-status-warning/25 focus-ring',
                onClick: () => openResolve('Adjust'),
              }, '↻ Adjust'),
            )
            : h('div', {},
              h('div', { className: 'text-xs text-slate-300 mb-2' }, `${resolveAction} exception — explain rationale:`),
              h('textarea', {
                value: resolutionComment,
                onInput: (e) => setResolutionComment(e.target.value),
                placeholder: `Required: Reason for ${resolveAction.toLowerCase()}...`,
                rows: 3,
                className: 'w-full px-3 py-2 bg-surface border border-surface-border rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-daos-500 resize-none mb-2',
                'aria-label': 'Resolution comment'
              }),
              h('div', { className: 'flex gap-2' },
                h('button', {
                  className: `flex-1 py-1.5 rounded text-xs font-medium focus-ring ${resolveAction === 'Accept' ? 'bg-status-success text-white' : resolveAction === 'Reject' ? 'bg-status-danger text-white' : 'bg-status-warning text-white'}`,
                  onClick: () => handleResolve(resolveAction),
                }, `Confirm ${resolveAction}`),
                h('button', {
                  className: 'flex-1 py-1.5 bg-surface border border-surface-border rounded text-xs text-slate-400 hover:text-slate-200 focus-ring',
                  onClick: () => { setShowResolvePanel(false); setResolveAction(null); setResolutionComment(''); },
                }, 'Cancel'),
              )
            )
        )
      ),

      // Audit trail
      h('div', { className: 'flex-1 overflow-auto' },
        h('div', { className: 'px-4 py-3' },
          h('div', { className: 'text-xs font-semibold text-slate-400 uppercase mb-3' }, 'Resolution Audit Trail'),
          auditTrail.filter(e => e.exceptionId === selected.id).length === 0 && auditTrail.length === 0
            ? h('p', { className: 'text-xs text-slate-600 italic' }, 'No resolution actions recorded yet.')
            : auditTrail.filter(e => e.exceptionId === selected.id).map((entry, i) =>
              h('div', { key: i, className: 'mb-2 py-2 px-3 bg-surface rounded border border-surface-border text-xs' },
                h('div', { className: 'flex items-center justify-between mb-1' },
                  h('span', { className: `font-medium ${entry.action === 'Accept' ? 'text-status-success' : entry.action === 'Reject' ? 'text-status-danger' : 'text-status-warning'}` }, entry.action),
                  h('span', { className: 'text-slate-500 text-2xs' }, new Date(entry.timestamp).toLocaleTimeString()),
                ),
                h('div', { className: 'text-slate-400' }, entry.comment),
                h('div', { className: 'text-slate-600 text-2xs mt-0.5' }, `by ${entry.actor}`),
              )
            ),
          auditTrail.filter(e => e.exceptionId !== selected.id && e.exceptionId).length > 0 && h('div', { className: 'mt-3 pt-3 border-t border-surface-border' },
            h('div', { className: 'text-2xs text-slate-500 uppercase mb-2' }, 'Recent Resolutions'),
            ...auditTrail.filter(e => e.exceptionId !== selected.id).slice(0, 5).map((entry, i) =>
              h('div', { key: `other-${i}`, className: 'mb-1 py-1 px-2 bg-surface rounded text-2xs text-slate-500 flex justify-between' },
                h('span', {}, `${entry.exceptionId}: ${entry.action}`),
                h('span', {}, new Date(entry.timestamp).toLocaleTimeString()),
              )
            )
          )
        )
      ),
    ),
  );
}
