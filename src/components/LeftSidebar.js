// LeftSidebar — workspace-specific navigation
// UX spec §1.3.1: collapsible, section groups, badge counts

import { h, React } from '../lib/dom.js';

// Navigation items per workspace. Workspace IDs match workspaces.js
const OPERATIONAL_NAV = (section, pages) => [{ section, pages }];
const NAV_MAP = {
  deals: OPERATIONAL_NAV('Deal Management', [
    { id: 'overview', label: 'Deal Pipeline', icon: '🤝' }, { id: 'diligence', label: 'Due Diligence', icon: '🔎' }, { id: 'approvals', label: 'Approvals', icon: '✅' },
  ]),
  investments: OPERATIONAL_NAV('Investment Management', [
    { id: 'overview', label: 'Portfolio Overview', icon: '📊' }, { id: 'research', label: 'Research', icon: '📚' }, { id: 'orders', label: 'Investment Orders', icon: '📝' },
  ]),
  products: OPERATIONAL_NAV('Product Operations', [
    { id: 'overview', label: 'Product Overview', icon: '📦' }, { id: 'nav', label: 'NAV Operations', icon: '🧮' }, { id: 'lifecycle', label: 'Lifecycle', icon: '🔁' },
  ]),
  'digital-rep': OPERATIONAL_NAV('Digital Representation', [
    { id: 'overview', label: 'Representation Overview', icon: '⛓️' }, { id: 'issuance', label: 'Issuance', icon: '🏷️' }, { id: 'reconciliation', label: 'Reconciliation', icon: '⚖️' },
  ]),
  investors: OPERATIONAL_NAV('Investor Operations', [
    { id: 'overview', label: 'Investor Overview', icon: '💰' }, { id: 'transfers', label: 'Transfers', icon: '↔️' }, { id: 'communications', label: 'Communications', icon: '✉️' },
  ]),
  transactions: OPERATIONAL_NAV('Transaction Operations', [
    { id: 'overview', label: 'Transaction Overview', icon: '💹' }, { id: 'orders', label: 'Orders', icon: '📝' }, { id: 'exceptions', label: 'Exceptions', icon: '⚠️' },
  ]),
  treasury: OPERATIONAL_NAV('Treasury & Liquidity', [
    { id: 'overview', label: 'Liquidity Overview', icon: '🏦' }, { id: 'cash', label: 'Cash Positions', icon: '💵' }, { id: 'fx', label: 'FX Exposure', icon: '💱' },
  ]),
  custody: OPERATIONAL_NAV('Custody Operations', [
    { id: 'overview', label: 'Custody Overview', icon: '🔐' }, { id: 'accounts', label: 'Accounts', icon: '🗄️' }, { id: 'servicing', label: 'Asset Servicing', icon: '⚙️' },
  ]),
  settlement: OPERATIONAL_NAV('Settlement Network', [
    { id: 'overview', label: 'Control Tower', icon: '🤖' }, { id: 'instructions', label: 'Instructions', icon: '📨' }, { id: 'fails', label: 'Settlement Fails', icon: '⚠️' },
  ]),
  'data-intel': OPERATIONAL_NAV('Data & Intelligence', [
    { id: 'overview', label: 'Data Health', icon: '🧠' }, { id: 'quality', label: 'Data Quality', icon: '✅' }, { id: 'lineage', label: 'Lineage & Controls', icon: '🔗' },
  ]),
  admin: OPERATIONAL_NAV('Administration', [
    { id: 'overview', label: 'Administration Overview', icon: '⚙️' }, { id: 'users', label: 'Users & Roles', icon: '👤' }, { id: 'integrations', label: 'Integrations', icon: '🔌' },
  ]),
  executive: [
    { section: 'Overview', pages: [
      { id: 'dashboard', label: 'Command Dashboard', icon: '📊' },
      { id: 'governance', label: 'Governance Board', icon: '📋' },
      { id: 'org-chart', label: 'Org Structure', icon: '🏛️' },
    ]},
  ],
  participants: [
    { section: 'Participant Management', pages: [
      { id: 'explorer', label: 'Participant Explorer', icon: '🔍' },
      { id: 'participant-view', label: 'Participant 360', icon: '👤' },
      { id: 'onboarding', label: 'Onboarding', icon: '📝' },
    ]},
  ],
  assets: [
    { section: 'Asset Operations', pages: [
      { id: 'explorer', label: 'Asset Explorer', icon: '🔍' },
      { id: 'asset-view', label: 'Asset 360', icon: '💎' },
      { id: 'positions', label: 'Positions', icon: '📈' },
    ]},
  ],
  'risk-compliance': [
    { section: 'Overview', pages: [
      { id: 'dashboard', label: 'Compliance Dashboard', icon: '📊' },
      { id: 'cases', label: 'Case Manager', icon: '📋' },
      { id: 'audit', label: 'Audit Explorer', icon: '🔍' },
    ]},
  ],
};

// Default nav for workspaces without specific nav items
const DEFAULT_NAV = [
  { section: 'Overview', pages: [
    { id: 'overview', label: 'Overview', icon: '📊' },
  ]},
];

export function LeftSidebar({ workspace, activePage, sidebarCollapsed, update }) {
  const nav = NAV_MAP[workspace.id] || DEFAULT_NAV;
  const [collapsedSections, setCollapsedSections] = React.useState({});

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handlePageClick = (pageId) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: pageId }));
  };

  return h('aside', {
    className: `bg-surface-raised border-r border-surface-border shrink-0 transition-all duration-200 scrollbar-thin overflow-y-auto ${sidebarCollapsed ? 'w-[60px]' : 'w-[240px]'}`,
    role: 'navigation',
    'aria-label': `${workspace.name} navigation`,
    'aria-expanded': String(!sidebarCollapsed),
  },
    // Collapse toggle
    h('button', {
      className: `w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-surface-overlay focus-ring transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`,
      onClick: () => update({ sidebarCollapsed: !sidebarCollapsed }),
      'aria-label': sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
      title: 'Ctrl+B'
    },
      h('svg', {
        className: `w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`,
        fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2
      }, h('path', { d: 'M15 18l-6-6 6-6' })),
      !sidebarCollapsed && h('span', {}, 'Collapse')
    ),

    !sidebarCollapsed && h('div', { className: 'px-3 py-3 border-b border-surface-border' },
      h('div', { className: 'flex items-center gap-2' },
        h('span', { className: 'text-lg' }, workspace.icon),
        h('div', {},
          h('div', { className: 'text-sm font-semibold text-slate-200' }, workspace.name),
          h('div', { className: 'text-2xs text-slate-500 truncate' }, workspace.description),
        )
      )
    ),

    // Navigation sections
    h('nav', { className: 'py-2' },
      ...nav.map(section =>
        h('div', { key: section.section },
          // Section header
          h('button', {
            className: `w-full flex items-center gap-2 px-3 py-1.5 text-2xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 focus-ring ${sidebarCollapsed ? 'justify-center' : ''}`,
            onClick: () => !sidebarCollapsed && toggleSection(section.section),
          },
            !sidebarCollapsed && h('span', { className: 'truncate' }, section.section),
            !sidebarCollapsed && h('svg', {
              className: `w-3 h-3 ml-auto transition-transform ${collapsedSections[section.section] ? '-rotate-90' : ''}`,
              fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2
            }, h('path', { d: 'M6 9l6 6 6-6' }))
          ),
          // Page links
          !collapsedSections[section.section] && section.pages.map(page =>
            h('button', {
              key: page.id,
              className: `w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors focus-ring
                ${activePage === page.id
                  ? 'bg-daos-900/30 text-daos-300 border-l-2 border-daos-500 pl-[10px]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-overlay border-l-2 border-transparent pl-[10px]'
                } ${sidebarCollapsed ? 'justify-center' : ''}`,
              onClick: () => handlePageClick(page.id),
              title: sidebarCollapsed ? page.label : undefined,
            },
              h('span', {}, page.icon),
              !sidebarCollapsed && h('span', { className: 'flex-1 truncate' }, page.label),
              !sidebarCollapsed && page.badge && h('span', { className: 'px-1.5 py-0.5 text-2xs bg-status-danger/20 text-status-danger rounded-full font-medium' }, page.badge)
            )
          )
        )
      )
    ),

    // Footer actions
    !sidebarCollapsed && h('div', { className: 'border-t border-surface-border px-3 py-2 mt-auto' },
      h('button', {
        className: 'w-full text-left text-xs text-daos-400 hover:text-daos-300 py-1.5 focus-ring',
        onClick: () => update({ showShortcuts: true })
      }, '⌨ Keyboard Shortcuts')
    )
  );
}
