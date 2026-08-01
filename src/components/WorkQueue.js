// WorkQueue — assignable, prioritised, SLA-tracked task list
// UX spec §5.4

import { h, React } from '../lib/dom.js';

const MOCK_ITEMS = [
  { id: 'WQ-001', subject: 'Reconciliation break — ISIN US0378331005', status: 'Open', priority: 'Critical', age: '2h', sla: 'breached', assignee: null, type: 'Reconciliation' },
  { id: 'WQ-002', subject: 'Settlement fail investigation — STL-000456', status: 'In Progress', priority: 'High', age: '4h', sla: 'at-risk', assignee: 'Maria Chen', type: 'Settlement' },
  { id: 'WQ-003', subject: 'KYC document review — Goldman Sachs', status: 'Open', priority: 'High', age: '1d', sla: 'ok', assignee: null, type: 'Onboarding' },
  { id: 'WQ-004', subject: 'NAV review for Q2 close — Fund BR-Global-01', status: 'Open', priority: 'Medium', age: '3d', sla: 'ok', assignee: 'Alex Kim', type: 'Fund Ops' },
  { id: 'WQ-005', subject: 'Corporate action election — MSFT dividend', status: 'Open', priority: 'Medium', age: '1d', sla: 'ok', assignee: null, type: 'Corp Action' },
  { id: 'WQ-006', subject: 'Payment routing validation — UETR-abc123', status: 'In Progress', priority: 'Critical', age: '30m', sla: 'at-risk', assignee: 'Sarah Lee', type: 'Payment' },
  { id: 'WQ-007', subject: 'Margin call response — Counterparty XYZ', status: 'Open', priority: 'High', age: '6h', sla: 'breached', assignee: null, type: 'Collateral' },
  { id: 'WQ-008', subject: 'Data quality exception — Missing LEI for participant', status: 'Open', priority: 'Low', age: '5d', sla: 'ok', assignee: null, type: 'Data Quality' },
  { id: 'WQ-009', subject: 'Approval: New product launch — Fund Alpha', status: 'Pending', priority: 'High', age: '2d', sla: 'at-risk', assignee: 'James Sullivan', type: 'Approval' },
  { id: 'WQ-010', subject: 'Token minting request — US0378331005', status: 'Open', priority: 'Medium', age: '8h', sla: 'ok', assignee: null, type: 'Digital Asset' },
];

const TEAM = [
  { id: 'js', name: 'James Sullivan', avatar: 'JS', available: true, load: 3 },
  { id: 'mc', name: 'Maria Chen', avatar: 'MC', available: true, load: 5 },
  { id: 'ak', name: 'Alex Kim', avatar: 'AK', available: false, load: 8 },
  { id: 'sl', name: 'Sarah Lee', avatar: 'SL', available: true, load: 4 },
  { id: 'rb', name: 'Rachel Brown', avatar: 'RB', available: true, load: 2 },
];

export function WorkQueue() {
  const [items, setItems] = React.useState(MOCK_ITEMS);
  const [activeTab, setActiveTab] = React.useState('all');
  const [selected, setSelected] = React.useState(new Set());
  const [dragOver, setDragOver] = React.useState(null);
  const [expandedItem, setExpandedItem] = React.useState(null);

  const tabs = ['All', 'My Items', 'Unassigned', 'Overdue', 'High Priority'];

  const filtered = items.filter(item => {
    if (activeTab === 'my-items') return item.assignee === 'James Sullivan';
    if (activeTab === 'unassigned') return !item.assignee;
    if (activeTab === 'overdue') return item.sla === 'breached';
    if (activeTab === 'high-priority') return item.priority === 'Critical' || item.priority === 'High';
    return true;
  });

  const counts = {
    all: items.length,
    'my-items': items.filter(i => i.assignee === 'James Sullivan').length,
    unassigned: items.filter(i => !i.assignee).length,
    overdue: items.filter(i => i.sla === 'breached').length,
    'high-priority': items.filter(i => i.priority === 'Critical' || i.priority === 'High').length,
  };

  const priorityColor = (p) => {
    if (p === 'Critical') return 'text-priority-critical';
    if (p === 'High') return 'text-priority-high';
    if (p === 'Medium') return 'text-priority-medium';
    return 'text-slate-500';
  };

  const slaBadge = (sla) => {
    if (sla === 'breached') return h('span', { className: 'px-1.5 py-0.5 bg-status-danger/15 text-status-danger text-2xs rounded-full font-medium' }, 'BREACHED');
    if (sla === 'at-risk') return h('span', { className: 'px-1.5 py-0.5 bg-status-warning/15 text-status-warning text-2xs rounded-full font-medium' }, 'AT RISK');
    return h('span', { className: 'px-1.5 py-0.5 bg-status-success/15 text-status-success text-2xs rounded-full font-medium' }, 'OK');
  };

  const assignTo = (itemId, memberId) => {
    const member = TEAM.find(t => t.id === memberId);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, assignee: member ? member.name : null } : i));
  };

  return h('div', { className: 'flex h-full' },
    // Main queue area
    h('div', { className: 'flex-1 flex flex-col min-w-0' },
      // Header
      h('div', { className: 'flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-raised/50' },
        h('h2', { className: 'text-sm font-semibold text-slate-200' }, 'Work Queue'),
        h('div', { className: 'flex items-center gap-2' },
          h('button', { className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring' }, '⚙ Filters'),
          h('button', { className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring' }, '📋 Views'),
        )
      ),
      // Tabs
      h('div', { className: 'flex border-b border-surface-border bg-surface', role: 'tablist' },
        ...tabs.map(tab => {
          const key = tab.toLowerCase().replace(/\s+/g, '-');
          const slug = key === 'all' ? 'all' : key === 'my-items' ? 'my-items' : key === 'unassigned' ? 'unassigned' : key === 'overdue' ? 'overdue' : 'high-priority';
          const count = counts[slug] || 0;
          return h('button', {
            key,
            className: `px-4 py-2 text-xs font-medium border-b-2 transition-colors focus-ring ${activeTab === slug ? 'border-daos-500 text-daos-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`,
            onClick: () => setActiveTab(slug),
            role: 'tab',
            'aria-selected': String(activeTab === slug),
          }, `${tab}${count > 0 ? ` (${count})` : ''}`);
        })
      ),
      // Item list
      h('div', { className: 'flex-1 overflow-auto scrollbar-thin' },
        h('table', { className: 'w-full', role: 'grid', 'aria-label': 'Work queue items' },
          h('thead', { className: 'bg-surface sticky top-0 z-10' },
            h('tr', {},
              h('th', { className: 'w-8 px-2' }),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'ID'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Subject'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Status'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Priority'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Age'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'SLA'),
              h('th', { className: 'px-3 py-2 text-left text-2xs font-semibold text-slate-500 uppercase' }, 'Assigned'),
              h('th', { className: 'w-10' }),
            )
          ),
          h('tbody', {},
            ...filtered.map(item =>
              h('tr', {
                key: item.id,
                className: `border-b border-surface-border hover:bg-surface-overlay/50 transition-colors cursor-pointer ${expandedItem === item.id ? 'bg-surface-overlay/30' : ''}`,
                draggable: true,
                onDragStart: (e) => { e.dataTransfer.setData('text/plain', item.id); },
                onClick: () => setExpandedItem(expandedItem === item.id ? null : item.id),
                role: 'row',
              },
                h('td', { className: 'px-2' },
                  h('input', {
                    type: 'checkbox',
                    checked: selected.has(item.id),
                    onChange: (e) => {
                      e.stopPropagation();
                      const next = new Set(selected);
                      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                      setSelected(next);
                    },
                    'aria-label': `Select ${item.id}`
                  })
                ),
                h('td', { className: 'px-3 py-2 text-xs font-mono text-slate-500' }, item.id),
                h('td', { className: 'px-3 py-2 text-sm text-slate-200 max-w-[300px] truncate' }, item.subject),
                h('td', { className: 'px-3 py-2 text-xs' },
                  h('span', { className: `px-1.5 py-0.5 rounded-full text-2xs ${item.status === 'Open' ? 'bg-slate-500/15 text-slate-300' : item.status === 'In Progress' ? 'bg-status-info/15 text-status-info' : 'bg-status-warning/15 text-status-warning'}` }, item.status)
                ),
                h('td', { className: `px-3 py-2 text-xs font-medium ${priorityColor(item.priority)}` }, item.priority),
                h('td', { className: 'px-3 py-2 text-xs text-slate-400' }, item.age),
                h('td', { className: 'px-3 py-2' }, slaBadge(item.sla)),
                h('td', { className: 'px-3 py-2 text-xs text-slate-400' }, item.assignee || h('span', { className: 'text-slate-600 italic' }, 'Unassigned')),
                h('td', { className: 'px-2' },
                  h('button', { className: 'p-1 text-slate-500 hover:text-slate-200 focus-ring', 'aria-label': `Actions for ${item.id}` }, '⋮')
                )
              )
            )
          )
        )
      ),
      // Bulk actions toolbar
      selected.size > 0 && h('div', { className: 'flex items-center gap-2 px-4 py-2 border-t border-surface-border bg-daos-900/20 text-sm animate-slide-in' },
        h('span', { className: 'text-daos-300' }, `${selected.size} selected`),
        h('button', { className: 'px-3 py-1 text-xs bg-daos-600 hover:bg-daos-700 rounded focus-ring' }, 'Assign ▾'),
        h('button', { className: 'px-3 py-1 text-xs bg-surface border border-surface-border rounded hover:bg-surface-overlay focus-ring' }, 'Change Priority ▾'),
        h('button', { className: 'px-3 py-1 text-xs text-status-warning border border-status-warning/30 rounded hover:bg-status-warning/10 focus-ring' }, 'Escalate'),
      ),
      // Pagination
      h('div', { className: 'flex items-center justify-between px-4 py-1.5 border-t border-surface-border text-xs text-slate-500' },
        h('span', {}, `1–${filtered.length} of ${filtered.length}`),
      ),
    ),

    // Team assignment sidebar
    h('div', { className: 'w-56 border-l border-surface-border bg-surface-raised/30 p-3 hidden lg:block' },
      h('h3', { className: 'text-xs font-semibold text-slate-400 uppercase mb-3' }, 'Team (drag items)'),
      ...TEAM.map(member =>
        h('div', {
          key: member.id,
          className: `flex items-center gap-2 px-2 py-2 rounded mb-1 text-sm transition-colors ${dragOver === member.id ? 'bg-daos-700/30 ring-1 ring-daos-500' : 'hover:bg-surface-overlay'} ${!member.available ? 'opacity-50' : ''}`,
          onDragOver: (e) => { e.preventDefault(); setDragOver(member.id); },
          onDragLeave: () => setDragOver(null),
          onDrop: (e) => {
            e.preventDefault();
            setDragOver(null);
            const itemId = e.dataTransfer.getData('text/plain');
            if (itemId && member.available) assignTo(itemId, member.id);
          },
        },
          h('div', { className: `w-7 h-7 rounded-full flex items-center justify-center text-2xs font-bold ${member.available ? 'bg-daos-700 text-daos-200' : 'bg-slate-700 text-slate-400'}` }, member.avatar),
          h('div', { className: 'flex-1 min-w-0' },
            h('div', { className: 'text-xs text-slate-300 truncate' }, member.name),
            h('div', { className: 'text-2xs text-slate-500' }, `${member.load} items`),
          ),
          member.available
            ? h('div', { className: 'w-1.5 h-1.5 rounded-full bg-status-success' })
            : h('div', { className: 'w-1.5 h-1.5 rounded-full bg-slate-500' }),
        )
      ),
    ),
  );
}
