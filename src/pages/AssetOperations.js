// AssetOperations — workspace pages for Asset Operations
// Pages: explorer (DataGrid), asset-view (Object360Page), positions (placeholder)

import { h, React } from '../lib/dom.js';
import { DataGrid } from '../components/DataGrid.js';
import { Object360Page } from '../components/Object360Page.js';
import { MOCK_ASSETS } from '../data/mockAssets.js';

// Build Object360 data from an asset
function buildAsset360Data(asset) {
  return {
    name: asset.name,
    id: asset.isin,
    type: asset.class,
    status: asset.status,
    jurisdiction: asset.jurisdiction,
    lastUpdated: '2026-07-29 14:32 UTC',
    updatedBy: 'Maria Chen',
    attributes: {
      Identifiers: [
        ['ISIN', asset.isin],
        ['Asset ID', asset.id],
        ['Class', asset.class],
        ['Issuer', asset.issuer],
      ],
      Classification: [
        ['Asset Class', asset.class],
        ['Jurisdiction', asset.jurisdiction],
        ['Representation', asset.representationModel],
        ['Currency', 'USD'],
        ['Sector', asset.class === 'Equity' ? 'Various' : asset.class === 'Bond' ? 'Fixed Income' : 'Multi-Asset'],
      ],
      'Lifecycle': [
        ['Status', asset.status],
        ['Created', '2024-06-01'],
        ['Last Modified', '2026-07-28'],
        ['Version', '3'],
      ],
    },
    kpis: [
      { label: 'Market Value', value: `$${(Math.random() * 5000 + 100).toFixed(1)}M`, change: `+${(Math.random() * 10).toFixed(1)}%` },
      { label: 'Positions', value: String(Math.floor(Math.random() * 500) + 10), change: '' },
      { label: 'Daily Volume', value: `${(Math.random() * 100).toFixed(1)}M`, change: `-${(Math.random() * 5).toFixed(1)}%` },
      { label: 'Holders', value: String(Math.floor(Math.random() * 2000) + 100), change: `+${Math.floor(Math.random() * 50)}` },
    ],
    recentActivity: [
      { action: 'Price update received', detail: 'Market data feed — latest NAV published', time: '14 min ago', user: 'System' },
      { action: 'Position reconciliation', detail: 'Custody vs books reconciled — 0 breaks', time: '2 hours ago', user: 'Alex Kim' },
      { action: 'Corporate action processed', detail: 'Income distribution processed for period Q3', time: '1 day ago', user: 'System' },
      { action: 'Representation updated', detail: `${asset.representationModel} configuration confirmed`, time: '3 days ago', user: 'Digital Assets Team' },
      { action: 'Asset onboarded', detail: `Asset master created for ${asset.name}`, time: '2024-06-01', user: 'Operations Team' },
    ],
  };
}

const ASSET_COLUMNS = [
  { key: 'isin', label: 'ISIN', sortable: true, mono: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'class', label: 'Class', sortable: true, filterable: true },
  { key: 'issuer', label: 'Issuer', sortable: true },
  { key: 'jurisdiction', label: 'Jur', sortable: true, width: '60px' },
  {
    key: 'representationModel', label: 'Representation', sortable: true, filterable: true,
    render: (value) => {
      const isDigital = value.includes('Token') || value.includes('Digital');
      const color = isDigital ? 'bg-daos-500/15 text-daos-300 border-daos-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-500/30';
      return h('span', { className: `inline-block px-2 py-0.5 rounded-full text-2xs font-medium border ${color}` }, value);
    }
  },
  {
    key: 'status', label: 'Status', sortable: true, filterable: true,
    render: (value) => {
      const color = value === 'Active' ? 'bg-status-success/15 text-status-success border-status-success/30'
        : value === 'Inactive' ? 'bg-slate-500/15 text-slate-400 border-slate-500/30'
        : 'bg-status-warning/15 text-status-warning border-status-warning/30';
      return h('span', { className: `inline-block px-2 py-0.5 rounded-full text-2xs font-medium border ${color}` }, value);
    }
  },
];

export function AssetOperations({ page }) {
  const [selectedAsset, setSelectedAsset] = React.useState(MOCK_ASSETS[0]);

  const handleRowClick = (row) => {
    setSelectedAsset(row);
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'asset-view' }));
  };

  if (page === 'explorer') {
    return h(DataGrid, {
      data: MOCK_ASSETS,
      columns: ASSET_COLUMNS,
      idKey: 'id',
      onRowClick: handleRowClick,
    });
  }

  if (page === 'asset-view') {
    return h(Object360Page, {
      objectData: buildAsset360Data(selectedAsset),
    });
  }

  if (page === 'positions') {
    return h('div', { className: 'flex items-center justify-center h-full' },
      h('div', { className: 'text-center p-8' },
        h('div', { className: 'text-4xl mb-4' }, '📈'),
        h('h3', { className: 'text-lg font-medium text-slate-300 mb-2' }, 'Positions'),
        h('p', { className: 'text-sm text-slate-500 max-w-md' }, 'Position Explorer — view and manage all positions across custody accounts, with tax lot drill-down, P&L attribution, and reconciliation status.'),
      )
    );
  }

  return h('div', { className: 'flex items-center justify-center h-full text-slate-500' }, 'Unknown page');
}
