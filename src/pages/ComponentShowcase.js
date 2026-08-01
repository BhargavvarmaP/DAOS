// ComponentShowcase — demo page showing all component patterns
// Serves as the main `/` route

import { h, React } from '../lib/dom.js';
import { DataGrid } from '../components/DataGrid.js';
import { WorkQueue } from '../components/WorkQueue.js';
import { Object360Page } from '../components/Object360Page.js';
import { ApprovalQueue } from '../components/ApprovalQueue.js';
import { ExceptionQueue } from '../components/ExceptionQueue.js';
import { WorkflowWizard } from '../components/WorkflowWizard.js';
import { TimelineView } from '../components/TimelineView.js';
import { RelationshipGraph } from '../components/RelationshipGraph.js';
import { AuditExplorer } from '../components/AuditExplorer.js';
import { Dashboard } from '../components/Dashboard.js';

const DEMOS = [
  { id: 'datagrid', label: 'DataGrid', component: DataGrid, spec: '§5.1', description: 'Sortable, filterable, paginated data grid with multi-select, bulk actions, density modes.', status: 'complete' },
  { id: 'workqueue', label: 'WorkQueue', component: WorkQueue, spec: '§5.4', description: 'Assignable, prioritised, SLA-tracked task list with drag-and-drop team assignment.', status: 'complete' },
  { id: 'object360', label: 'Object360', component: Object360Page, spec: '§5.2', description: 'Signature 360 object page with Overview, Timeline, Relationships, Documents, Audit, Compliance, Risk tabs.', status: 'complete' },
  { id: 'approval', label: 'ApprovalQueue', component: ApprovalQueue, spec: '§5.6', description: 'Dual-pane maker-checker approval queue with Approve/Reject/Request Info actions.', status: 'complete' },
  { id: 'exception', label: 'ExceptionQueue', component: ExceptionQueue, spec: '§5.5', description: 'Severity-classified exception resolution with Accept/Reject/Adjust actions and audit trail.', status: 'complete' },
  { id: 'wizard', label: 'Wizard', component: WorkflowWizard, spec: '§5.3', description: 'Multi-step guided workflow with validation, save draft, context panel, and completion summary.', status: 'complete' },
  { id: 'timeline', label: 'Timeline', component: TimelineView, spec: '§5.7', description: 'Chronological event timeline with filtering, grouping, correlation view, and CSV export.', status: 'complete' },
  { id: 'graph', label: 'Graph', component: RelationshipGraph, spec: '§5.8', description: 'Interactive Canvas force-directed relationship graph with zoom/pan, minimap, tooltips.', status: 'complete' },
  { id: 'audit', label: 'Audit', component: AuditExplorer, spec: '§5.9', description: 'Searchable audit event log with old/new value comparison and causation chain breadcrumb.', status: 'complete' },
  { id: 'dashboard', label: 'Dashboard', component: Dashboard, spec: '§5.10', description: 'KPI tiles, time-series/bar/donut charts (SVG), alert panel, recent activity feed.', status: 'complete' },
];

export function ComponentShowcase({ state, update }) {
  const [activeDemo, setActiveDemo] = React.useState('datagrid');

  const CurrentComponent = DEMOS.find(d => d.id === activeDemo)?.component || DataGrid;
  const currentDemo = DEMOS.find(d => d.id === activeDemo);
  const completeCount = DEMOS.filter(d => d.status === 'complete').length;

  return h('div', { className: 'flex h-full' },
    // Sidebar: component list
    h('div', { className: 'w-64 border-r border-surface-border bg-surface flex flex-col shrink-0' },
      h('div', { className: 'px-4 py-3 border-b border-surface-border' },
        h('h2', { className: 'text-sm font-semibold text-slate-200' }, 'Component Library'),
        h('p', { className: 'text-2xs text-slate-500 mt-0.5' }, `10 UI patterns · ${completeCount} complete · 257 pages target`),
      ),
      h('div', { className: 'flex-1 overflow-auto scrollbar-thin py-1', role: 'listbox' },
        ...DEMOS.map(demo =>
          h('button', {
            key: demo.id,
            className: `w-full text-left px-4 py-2.5 text-sm transition-colors focus-ring border-l-2 ${activeDemo === demo.id ? 'border-daos-500 bg-daos-900/20 text-daos-300' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-surface-overlay'}`,
            onClick: () => setActiveDemo(demo.id),
            role: 'option',
            'aria-selected': String(activeDemo === demo.id),
          },
            h('div', { className: 'flex items-center gap-2' },
              h('span', { className: 'text-xs font-mono text-slate-600 w-8' }, demo.spec),
              h('span', { className: 'font-medium' }, demo.label),
              demo.status === 'complete' && h('span', { className: 'text-status-success text-2xs ml-auto' }, '✓'),
            ),
            h('div', { className: 'text-2xs text-slate-500 mt-0.5 ml-10' }, demo.description),
          )
        )
      ),
      // Status
      h('div', { className: 'px-4 py-3 border-t border-surface-border text-2xs text-slate-500' },
        h('div', { className: 'text-status-success' }, `🟢 All 10 components fully implemented`),
        h('div', { className: 'mt-1' }, `DataGrid · WorkQueue · Object360 · ApprovalQueue`),
        h('div', {}, `ExceptionQueue · Wizard · Timeline · Graph · Audit · Dashboard`),
      ),
    ),
    // Main content
    h('div', { className: 'flex-1 flex flex-col min-w-0' },
      // Demo header
      h('div', { className: 'px-4 py-2 border-b border-surface-border bg-surface-raised/30 flex items-center gap-3' },
        h('span', { className: 'text-xs font-mono text-daos-400' }, currentDemo?.spec),
        h('span', { className: 'text-sm font-semibold text-slate-200' }, currentDemo?.label),
        h('span', { className: 'text-2xs text-slate-500 hidden sm:inline' }, currentDemo?.description),
        h('div', { className: 'flex-1' }),
        h('span', { className: 'text-2xs text-slate-600' }, 'DAOS v1.0-mvp'),
      ),
      // Component render area
      h('div', { className: 'flex-1 overflow-hidden' },
        h(CurrentComponent, {})
      ),
    )
  );
}
