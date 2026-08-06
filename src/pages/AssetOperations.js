// AssetOperations — workspace pages for Asset Operations
// Pages: explorer (DataGrid), asset-view (Object360Page), positions (placeholder)

import { h, React } from '../lib/dom.js';
import { DataGrid } from '../components/DataGrid.js';
import { Object360Page } from '../components/Object360Page.js';
import { MOCK_ASSETS } from '../data/mockAssets.js';

const POSITION_DATA = [
  { id: 'POS-1001', account: 'CUST-001 · Global Custody', owner: 'Northstar Capital', asset: 'US912810ST36', quantity: 125000, value: 12843750, costBasis: 12450000, pnl: 393750, status: 'Reconciled' },
  { id: 'POS-1002', account: 'CUST-014 · Digital Assets', owner: 'Atlas Family Office', asset: 'DE000A0D9PT0', quantity: 8420, value: 1037740, costBasis: 1012000, pnl: 25740, status: 'Exception' },
  { id: 'POS-1003', account: 'CUST-006 · Prime Brokerage', owner: 'Orion Pension Fund', asset: 'US0378331005', quantity: 18200, value: 4219660, costBasis: 3998000, pnl: 221660, status: 'Reconciled' },
  { id: 'POS-1004', account: 'CUST-021 · Fund Admin', owner: 'PIMCO Europe Ltd', asset: 'LU1861134382', quantity: 51000, value: 2784600, costBasis: 2811000, pnl: -26400, status: 'Pending' },
  { id: 'POS-1005', account: 'CUST-009 · Global Custody', owner: 'Helios Foundation', asset: 'CH0012032048', quantity: 9700, value: 2588080, costBasis: 2425000, pnl: 163080, status: 'Exception' },
];
const money = (n) => `${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const POSITION_COLUMNS = [
  { key: 'account', label: 'Account', sortable: true }, { key: 'owner', label: 'Owner', sortable: true },
  { key: 'asset', label: 'Asset', sortable: true, mono: true }, { key: 'quantity', label: 'Quantity', sortable: true },
  { key: 'value', label: 'Value', sortable: true, render: (v) => money(v) }, { key: 'costBasis', label: 'Cost basis', sortable: true, render: (v) => money(v) },
  { key: 'pnl', label: 'P&L', sortable: true, render: (v) => h('span', { className: v >= 0 ? 'text-status-success' : 'text-status-danger' }, `${v >= 0 ? '+' : ''}${money(v)}`) },
  { key: 'status', label: 'Status', sortable: true, filterable: true, render: (v) => h('span', { className: `px-2 py-0.5 rounded-full text-2xs border ${v === 'Reconciled' ? 'text-status-success border-status-success/30 bg-status-success/10' : v === 'Exception' ? 'text-status-danger border-status-danger/30 bg-status-danger/10' : 'text-status-warning border-status-warning/30 bg-status-warning/10'}` }, v) },
];

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

function PositionsScreen() {
  const [rows, setRows] = React.useState(POSITION_DATA);
  const [selectedException, setSelectedException] = React.useState(null);
  const [notice, setNotice] = React.useState('');
  const exceptions = rows.filter((row) => row.status === 'Exception');
  const resolve = (id) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, status: 'Reconciled' } : row));
    setSelectedException(null);
    setNotice('Exception marked resolved in demo state — no backend update was made.');
  };
  return h('div', { className: 'flex flex-col h-full overflow-auto' },
    h('div', { className: 'px-5 py-4 border-b border-surface-border' },
      h('div', { className: 'flex items-center justify-between' }, h('div', {}, h('h2', { className: 'text-lg font-semibold text-slate-100' }, 'Positions & Reconciliation'), h('p', { className: 'text-xs text-slate-500 mt-1' }, 'Demo operational view · as of 31 Jul 2026 · mock data')), h('span', { className: 'text-xs text-slate-500' }, `${rows.length} positions`)),
      h('div', { className: 'grid grid-cols-4 gap-3 mt-4' },
        ...[['Market value', money(rows.reduce((a, r) => a + r.value, 0))], ['Cost basis', money(rows.reduce((a, r) => a + r.costBasis, 0))], ['Unrealised P&L', money(rows.reduce((a, r) => a + r.pnl, 0))], ['Exceptions', String(exceptions.length)]].map(([label, value]) => h('div', { key: label, className: 'p-3 rounded border border-surface-border bg-surface-raised/40' }, h('div', { className: 'text-2xs uppercase text-slate-500' }, label), h('div', { className: 'text-base font-semibold text-slate-200 mt-1' }, value)))
      )
    ),
    notice && h('div', { className: 'mx-5 mt-3 px-3 py-2 rounded border border-status-success/30 bg-status-success/10 text-xs text-status-success', role: 'status' }, notice),
    h('div', { className: 'p-5' }, h(DataGrid, { data: rows, columns: POSITION_COLUMNS, idKey: 'id', onRowClick: (row) => row.status === 'Exception' ? setSelectedException(row) : undefined })),
    h('div', { className: 'mx-5 mb-5 rounded border border-status-warning/30 bg-status-warning/5 p-4' },
      h('div', { className: 'flex items-center justify-between mb-3' }, h('div', {}, h('h3', { className: 'text-sm font-semibold text-slate-200' }, 'Reconciliation exceptions'), h('p', { className: 'text-xs text-slate-500 mt-1' }, 'Select a break to inspect and resolve in demo state.')), h('span', { className: 'text-xs text-status-warning' }, `${exceptions.length} open`)),
      exceptions.length === 0 ? h('p', { className: 'text-xs text-status-success' }, 'All positions reconciled.') : h('div', { className: 'space-y-2' }, ...exceptions.map((row) => h('div', { key: row.id, className: 'flex items-center justify-between p-2 rounded bg-surface border border-surface-border' }, h('div', {}, h('button', { className: 'text-left text-xs text-daos-300 hover:text-daos-200 focus-ring', onClick: () => setSelectedException(row) }, `${row.id} · ${row.owner}`), h('div', { className: 'text-2xs text-slate-500' }, `${row.account} · ${row.asset}`)), selectedException?.id === row.id && h('button', { className: 'px-3 py-1.5 rounded bg-daos-600 hover:bg-daos-700 text-xs text-white focus-ring', onClick: () => resolve(row.id) }, 'Resolve break')))),
      selectedException && h('p', { className: 'text-2xs text-slate-500 mt-3' }, `Demo resolution: custody quantity variance review for ${selectedException.id}.`)
    )
  );
}

export function AssetOperations({ page, objectId, activeTab, onTabChange }) {
  const [selectedAsset, setSelectedAsset] = React.useState(() => MOCK_ASSETS.find((item) => item.id === objectId) || MOCK_ASSETS[0]);
  React.useEffect(() => {
    if (objectId) setSelectedAsset(MOCK_ASSETS.find((item) => item.id === objectId) || MOCK_ASSETS[0]);
  }, [objectId]);

  const handleRowClick = (row) => {
    setSelectedAsset(row);
    window.history.pushState({}, '', `/workspace/assets/asset/${encodeURIComponent(row.id)}/overview`);
    window.dispatchEvent(new PopStateEvent('popstate'));
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
      activeTab,
      onTabChange,
    });
  }

  if (page === 'positions') {
    return h(PositionsScreen);
  }

  return h('div', { className: 'flex items-center justify-center h-full text-slate-500' }, 'Unknown page');
}
