// Dashboard — KPI tiles, charts, alert summary, configurable layout
// UX spec §5.10: 12-column grid, draggable widgets, SVG charts, auto-refresh

import { h, React } from '../lib/dom.js';

// KPI tile data
const KPI_DATA = [
  { id: 'aum', label: 'Total AUM', value: '$48.7B', change: '+2.4%', trend: 'up', sparkline: [20, 22, 23, 25, 24, 27, 28, 26, 29, 31, 32, 30, 33, 35, 34, 36, 38, 37, 39, 42, 41, 43, 45, 44, 46, 47, 46, 48, 47, 49] },
  { id: 'nav', label: 'NAV (BR-Global-01)', value: '$2.41B', change: '+0.8%', trend: 'up', sparkline: [2.35, 2.36, 2.37, 2.36, 2.38, 2.39, 2.38, 2.40, 2.41] },
  { id: 'cash', label: 'Total Cash', value: '$3.2B', change: '-1.2%', trend: 'down', sparkline: [3.4, 3.38, 3.36, 3.35, 3.33, 3.30, 3.28, 3.25, 3.22, 3.20] },
  { id: 'positions', label: 'Active Positions', value: '2,847', change: '+12', trend: 'up', sparkline: [2800, 2810, 2820, 2815, 2830, 2825, 2835, 2840, 2838, 2847] },
  { id: 'settlements', label: 'Settlements Today', value: '342', change: '-8', trend: 'down', sparkline: [350, 348, 345, 340, 342, 338, 335, 340, 342, 342] },
  { id: 'exceptions', label: 'Open Exceptions', value: '47', change: '+3', trend: 'up', sparkline: [40, 42, 41, 43, 44, 42, 45, 46, 44, 47], alert: true },
  { id: 'fx', label: 'FX Exposure', value: '€892M', change: '+0.5%', trend: 'up', sparkline: [880, 882, 885, 883, 886, 888, 887, 890, 889, 892] },
  { id: 'risk', label: 'VaR (95%)', value: '$12.4M', change: '-3.1%', trend: 'down', sparkline: [13.2, 13.0, 12.9, 12.8, 12.7, 12.6, 12.5, 12.5, 12.4, 12.4] },
];

// Chart data
const TIME_SERIES_DATA = [
  { date: 'Jul 22', aum: 47.2, nav: 2.38, cash: 3.35 },
  { date: 'Jul 23', aum: 47.5, nav: 2.39, cash: 3.32 },
  { date: 'Jul 24', aum: 47.8, nav: 2.40, cash: 3.30 },
  { date: 'Jul 25', aum: 48.0, nav: 2.39, cash: 3.28 },
  { date: 'Jul 26', aum: 48.2, nav: 2.40, cash: 3.25 },
  { date: 'Jul 27', aum: 48.5, nav: 2.41, cash: 3.22 },
  { date: 'Jul 28', aum: 48.7, nav: 2.41, cash: 3.20 },
];

const BAR_DATA = [
  { label: 'Equity', value: 28.4 },
  { label: 'Fixed Inc.', value: 12.1 },
  { label: 'Alts', value: 5.2 },
  { label: 'Cash', value: 3.0 },
];

const DONUT_DATA = [
  { label: 'US', value: 52, color: '#5c7cfa' },
  { label: 'EU', value: 24, color: '#22c55e' },
  { label: 'APAC', value: 14, color: '#f59e0b' },
  { label: 'LatAm', value: 6, color: '#ef4444' },
  { label: 'MENA', value: 4, color: '#a855f7' },
];

const ALERT_DATA = [
  { id: 1, severity: 'Critical', title: 'Settlement fail — STL-000456 DTCC', time: '4h ago', status: 'Open' },
  { id: 2, severity: 'Critical', title: 'AML alert — Goldman Sachs (High Risk)', time: '30m ago', status: 'Investigating' },
  { id: 3, severity: 'High', title: 'Margin call dispute — CSA-0042', time: '1h ago', status: 'Open' },
  { id: 4, severity: 'High', title: 'NAV variance > 2% — Fund Alpha', time: '3h ago', status: 'Open' },
  { id: 5, severity: 'Medium', title: 'Missing LEI for Blackstone RE Fund', time: '1d ago', status: 'Pending' },
  { id: 6, severity: 'Medium', title: 'Token supply reconciliation drift', time: '3h ago', status: 'Investigating' },
  { id: 7, severity: 'Low', title: 'Incomplete SSI for CUST-0456', time: '2d ago', status: 'Open' },
];

const RECENT_ACTIVITY = [
  { id: 1, action: 'Trade executed', detail: 'BUY 10,000 AAPL @ 195.30', time: '15m ago', actor: 'Alex Kim' },
  { id: 2, action: 'Settlement confirmed', detail: 'STL-000456 matched at DTCC', time: '22m ago', actor: 'System' },
  { id: 3, action: 'NAV published', detail: 'BR-Global-01 Q2 NAV: $2.41B', time: '1h ago', actor: 'Maria Chen' },
  { id: 4, action: 'Participant onboarded', detail: 'Goldman Sachs & Co. LLC', time: '2h ago', actor: 'Rachel Brown' },
  { id: 5, action: 'Payment executed', detail: '$5.2M to Counterparty XYZ via SWIFT', time: '3h ago', actor: 'Sarah Lee' },
];

// Simple SVG Sparkline
function Sparkline({ data, width, height, color, alert }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((d, i) =>
    `${i * stepX},${height - ((d - min) / range) * (height - 4) - 2}`
  ).join(' ');

  return h('svg', { width, height, className: 'shrink-0', 'aria-hidden': 'true', viewBox: `0 0 ${width} ${height}` },
    h('polyline', {
      points,
      fill: 'none',
      stroke: alert ? '#ef4444' : (color || '#5c7cfa'),
      strokeWidth: 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    // Fill area
    h('polygon', {
      points: `0,${height} ${points} ${width},${height}`,
      fill: (alert ? '#ef4444' : (color || '#5c7cfa')) + '15',
      stroke: 'none',
    })
  );
}

// SVG Line Chart
function LineChart({ data, width, height }) {
  const padding = { top: 20, right: 20, bottom: 24, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = data.flatMap(d => [d.aum, d.nav, d.cash]);
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  const range = max - min || 1;

  const scaleX = (i) => padding.left + (i / (data.length - 1)) * chartW;
  const scaleY = (v) => padding.top + chartH - ((v - min) / range) * chartH;

  const yTicks = 5;
  const yStep = range / yTicks;

  const makePath = (key, color) => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(d[key])}`).join(' ');
  };

  return h('svg', { width, height, viewBox: `0 0 ${width} ${height}`, 'aria-label': 'Time series chart showing AUM, NAV, and cash over time', role: 'img' },
    // Grid lines
    ...Array.from({ length: yTicks + 1 }, (_, i) => {
      const y = scaleY(min + i * yStep);
      return h('line', { key: `grid-${i}`, x1: padding.left, y1: y, x2: width - padding.right, y2: y, stroke: '#334155', strokeWidth: 0.5 });
    }),
    // Y-axis labels
    ...Array.from({ length: yTicks + 1 }, (_, i) => {
      const val = min + i * yStep;
      return h('text', { key: `ylabel-${i}`, x: padding.left - 8, y: scaleY(val) + 4, textAnchor: 'end', fill: '#64748b', fontSize: 9, fontFamily: 'Inter, system-ui' }, `$${val.toFixed(1)}B`);
    }),
    // X-axis labels
    ...data.map((d, i) =>
      h('text', { key: `xlabel-${i}`, x: scaleX(i), y: height - 4, textAnchor: 'middle', fill: '#64748b', fontSize: 8, fontFamily: 'Inter, system-ui' }, d.date)
    ),
    // Lines
    h('path', { d: makePath('aum', '#5c7cfa'), fill: 'none', stroke: '#5c7cfa', strokeWidth: 2, strokeLinejoin: 'round' }),
    h('path', { d: makePath('nav', '#22c55e'), fill: 'none', stroke: '#22c55e', strokeWidth: 2, strokeLinejoin: 'round' }),
    h('path', { d: makePath('cash', '#f59e0b'), fill: 'none', stroke: '#f59e0b', strokeWidth: 2, strokeLinejoin: 'round' }),
    // Legend
    h('text', { x: padding.left, y: 12, fill: '#5c7cfa', fontSize: 9, fontFamily: 'Inter, system-ui', fontWeight: 600 }, '— AUM'),
    h('text', { x: padding.left + 50, y: 12, fill: '#22c55e', fontSize: 9, fontFamily: 'Inter, system-ui', fontWeight: 600 }, '— NAV'),
    h('text', { x: padding.left + 100, y: 12, fill: '#f59e0b', fontSize: 9, fontFamily: 'Inter, system-ui', fontWeight: 600 }, '— Cash'),
  );
}

// SVG Bar Chart
function BarChart({ data, width, height }) {
  const padding = { top: 10, right: 10, bottom: 24, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map(d => d.value)) * 1.15;
  const barW = (chartW / data.length) * 0.6;
  const gap = (chartW / data.length) * 0.4;

  const scaleX = (i) => padding.left + i * (chartW / data.length) + gap / 2;
  const scaleY = (v) => padding.top + chartH - (v / max) * chartH;

  return h('svg', { width, height, viewBox: `0 0 ${width} ${height}`, 'aria-label': 'Bar chart showing asset allocation by class', role: 'img' },
    // Bars
    ...data.map((d, i) =>
      h('rect', {
        key: d.label,
        x: scaleX(i),
        y: scaleY(d.value),
        width: barW,
        height: (d.value / max) * chartH,
        fill: ['#5c7cfa', '#22c55e', '#f59e0b', '#3b82f6'][i] || '#6b7280',
        rx: 2,
      })
    ),
    // Values on top
    ...data.map((d, i) =>
      h('text', { key: `val-${d.label}`, x: scaleX(i) + barW / 2, y: scaleY(d.value) - 4, textAnchor: 'middle', fill: '#e2e8f0', fontSize: 9, fontFamily: 'Inter, system-ui', fontWeight: 600 }, `$${d.value}B`)
    ),
    // Labels
    ...data.map((d, i) =>
      h('text', { key: `label-${d.label}`, x: scaleX(i) + barW / 2, y: height - 4, textAnchor: 'middle', fill: '#94a3b8', fontSize: 8, fontFamily: 'Inter, system-ui' }, d.label)
    ),
    // Baseline
    h('line', { x1: padding.left, y1: padding.top + chartH, x2: padding.left + chartW, y2: padding.top + chartH, stroke: '#475569', strokeWidth: 1 }),
  );
}

// SVG Donut Chart
function DonutChart({ data, width, height }) {
  const cx = width / 2;
  const cy = height / 2;
  const outerR = Math.min(cx, cy) - 8;
  const innerR = outerR * 0.55;
  const total = data.reduce((s, d) => s + d.value, 0);

  let cumulativeAngle = -Math.PI / 2;

  const arcs = data.map(d => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    cumulativeAngle += sliceAngle;
    const endAngle = cumulativeAngle;
    return { ...d, startAngle, endAngle };
  });

  const describeArc = (start, end, r) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M ${cx + outerR * Math.cos(start)} ${cy + outerR * Math.sin(start)} A ${outerR} ${outerR} 0 ${largeArc} 1 ${cx + outerR * Math.cos(end)} ${cy + outerR * Math.sin(end)} L ${cx + innerR * Math.cos(end)} ${cy + innerR * Math.sin(end)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${cx + innerR * Math.cos(start)} ${cy + innerR * Math.sin(start)} Z`;
  };

  return h('svg', { width, height, viewBox: `0 0 ${width} ${height}`, 'aria-label': 'Donut chart: Jurisdiction distribution — US 52%, EU 24%, APAC 14%, LatAm 6%, MENA 4%', role: 'img' },
    ...arcs.map((d, i) =>
      h('path', {
        key: d.label,
        d: describeArc(d.startAngle, d.endAngle, outerR),
        fill: d.color,
        stroke: '#0f172a',
        strokeWidth: 1.5,
      })
    ),
    // Center text
    h('text', { x: cx, y: cy - 6, textAnchor: 'middle', fill: '#e2e8f0', fontSize: 16, fontFamily: 'Inter, system-ui', fontWeight: 'bold' }, `${total}%`),
    h('text', { x: cx, y: cy + 10, textAnchor: 'middle', fill: '#94a3b8', fontSize: 8, fontFamily: 'Inter, system-ui' }, 'by Jurisdiction'),
    // Legend
    ...arcs.map((d, i) =>
      h('g', { key: `legend-${d.label}` },
        h('rect', { x: width - 80, y: 8 + i * 16, width: 8, height: 8, fill: d.color, rx: 1 }),
        h('text', { x: width - 68, y: 15 + i * 16, fill: '#94a3b8', fontSize: 8, fontFamily: 'Inter, system-ui' }, `${d.label} ${d.value}%`),
      )
    ),
  );
}

export function Dashboard() {
  const [kpIs] = React.useState(KPI_DATA);
  const [alerts] = React.useState(ALERT_DATA);
  const [activity] = React.useState(RECENT_ACTIVITY);
  const [dateRange, setDateRange] = React.useState('7d');
  const [refreshKey, setRefreshKey] = React.useState(0);

  const severityColor = (s) => {
    if (s === 'Critical') return 'bg-priority-critical/15 text-priority-critical border-priority-critical/30';
    if (s === 'High') return 'bg-priority-high/15 text-priority-high border-priority-high/30';
    if (s === 'Medium') return 'bg-priority-medium/15 text-priority-medium border-priority-medium/30';
    return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  };

  return h('div', { className: 'flex flex-col h-full' },
    // Dashboard header
    h('div', { className: 'flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-raised/50' },
      h('div', { className: 'flex items-center gap-2' },
        h('h2', { className: 'text-sm font-semibold text-slate-200' }, 'Executive Dashboard'),
        h('span', { className: 'text-2xs text-slate-500' }, 'Updated 15s ago'),
      ),
      h('div', { className: 'flex items-center gap-2' },
        ...['1d', '7d', '30d', 'QTD', 'YTD'].map(r =>
          h('button', {
            key: r,
            className: `px-2 py-1 text-xs rounded focus-ring ${dateRange === r ? 'bg-daos-700 text-daos-200' : 'text-slate-400 hover:text-slate-200'}`,
            onClick: () => setDateRange(r),
          }, r)
        ),
        h('button', {
          className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring',
          onClick: () => setRefreshKey(k => k + 1),
          'aria-label': 'Refresh dashboard'
        }, '⟳ Refresh'),
        h('button', {
          className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring',
        }, '⚙ Customize'),
      )
    ),

    // Main dashboard content
    h('div', { className: 'flex-1 overflow-auto scrollbar-thin' },
      h('div', { className: 'p-4' },

        // KPI Tiles Row
        h('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-3 mb-4' },
          ...kpIs.map(kpi =>
            h('div', {
              key: kpi.id,
              className: `bg-surface-raised/30 border rounded-lg p-3 hover:bg-surface-overlay/30 transition-colors cursor-pointer ${kpi.alert ? 'border-priority-critical/20' : 'border-surface-border'}`,
              tabIndex: 0,
              role: 'button',
              'aria-label': `${kpi.label}: ${kpi.value}, ${kpi.change}`
            },
              h('div', { className: 'flex items-start justify-between mb-2' },
                h('span', { className: 'text-xs text-slate-500 truncate' }, kpi.label),
                kpi.alert && h('span', { className: 'w-2 h-2 rounded-full bg-priority-critical animate-pulse shrink-0', 'aria-hidden': 'true' }),
              ),
              h('div', { className: 'flex items-end justify-between' },
                h('div', {},
                  h('div', { className: 'text-xl font-bold text-slate-100' }, kpi.value),
                  h('div', { className: `text-xs font-medium mt-0.5 ${kpi.trend === 'up' ? (kpi.alert ? 'text-priority-critical' : 'text-status-success') : 'text-status-danger'}` },
                    `${kpi.trend === 'up' ? '▲' : '▼'} ${kpi.change}`
                  ),
                ),
                h(Sparkline, { data: kpi.sparkline, width: 60, height: 28, alert: kpi.alert }),
              )
            )
          )
        ),

        // Charts Row
        h('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4' },
          // Line chart (spans 2)
          h('div', { className: 'lg:col-span-2 bg-surface-raised/30 border border-surface-border rounded-lg p-3' },
            h('div', { className: 'flex items-center justify-between mb-2' },
              h('h3', { className: 'text-xs font-semibold text-slate-400 uppercase' }, 'Portfolio Performance'),
              h('span', { className: 'text-2xs text-slate-500' }, `Last ${dateRange}`),
            ),
            h('div', { className: 'flex justify-center' },
              h(LineChart, { data: TIME_SERIES_DATA, width: 520, height: 220 })
            ),
          ),
          // Donut chart
          h('div', { className: 'bg-surface-raised/30 border border-surface-border rounded-lg p-3' },
            h('div', { className: 'flex items-center justify-between mb-2' },
              h('h3', { className: 'text-xs font-semibold text-slate-400 uppercase' }, 'Jurisdiction Breakdown'),
              h('span', { className: 'text-2xs text-slate-500' }, 'by AUM'),
            ),
            h('div', { className: 'flex justify-center' },
              h(DonutChart, { data: DONUT_DATA, width: 240, height: 240 })
            ),
          ),
        ),

        // Second row: Bar chart + Alert Panel
        h('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4' },
          // Bar chart
          h('div', { className: 'lg:col-span-2 bg-surface-raised/30 border border-surface-border rounded-lg p-3' },
            h('div', { className: 'flex items-center justify-between mb-2' },
              h('h3', { className: 'text-xs font-semibold text-slate-400 uppercase' }, 'Asset Allocation'),
              h('span', { className: 'text-2xs text-slate-500' }, `Current`),
            ),
            h('div', { className: 'flex justify-center' },
              h(BarChart, { data: BAR_DATA, width: 480, height: 180 })
            ),
          ),
          // Alert summary panel
          h('div', { className: 'bg-surface-raised/30 border border-surface-border rounded-lg p-3 flex flex-col' },
            h('div', { className: 'flex items-center justify-between mb-2' },
              h('h3', { className: 'text-xs font-semibold text-slate-400 uppercase' }, 'Active Alerts'),
              h('div', { className: 'flex gap-1 text-2xs' },
                h('span', { className: 'px-1.5 py-0.5 bg-priority-critical/15 text-priority-critical rounded-full' }, alerts.filter(a => a.severity === 'Critical').length),
                h('span', { className: 'px-1.5 py-0.5 bg-priority-high/15 text-priority-high rounded-full' }, alerts.filter(a => a.severity === 'High').length),
                h('span', { className: 'px-1.5 py-0.5 bg-priority-medium/15 text-priority-medium rounded-full' }, alerts.filter(a => a.severity === 'Medium').length),
              )
            ),
            h('div', { className: 'flex-1 overflow-auto scrollbar-thin space-y-1' },
              ...alerts.map(alert =>
                h('div', {
                  key: alert.id,
                  className: 'flex items-start gap-2 py-1.5 px-2 rounded hover:bg-surface-overlay/50 cursor-pointer text-xs border border-transparent hover:border-surface-border',
                  tabIndex: 0,
                  role: 'button',
                  'aria-label': `${alert.severity}: ${alert.title}`
                },
                  h('span', { className: `inline-block px-1.5 py-0.5 rounded text-2xs border shrink-0 ${severityColor(alert.severity)}` }, alert.severity),
                  h('div', { className: 'flex-1 min-w-0' },
                    h('p', { className: 'text-slate-200 truncate text-xs' }, alert.title),
                    h('span', { className: 'text-2xs text-slate-500' }, alert.time),
                  ),
                )
              ),
              h('button', { className: 'w-full text-xs text-daos-400 hover:text-daos-300 mt-1 focus-ring' }, 'View All Alerts →'),
            ),
          ),
        ),

        // Recent Activity
        h('div', { className: 'bg-surface-raised/30 border border-surface-border rounded-lg p-3' },
          h('div', { className: 'flex items-center justify-between mb-2' },
            h('h3', { className: 'text-xs font-semibold text-slate-400 uppercase' }, 'Recent Activity'),
            h('button', { className: 'text-xs text-daos-400 hover:text-daos-300 focus-ring' }, 'View All'),
          ),
          h('div', { className: 'space-y-1' },
            ...activity.map(a =>
              h('div', { key: a.id, className: 'flex items-center gap-3 py-1.5 px-2 rounded hover:bg-surface-overlay/50 text-xs' },
                h('span', { className: 'text-status-info shrink-0' }, '●'),
                h('span', { className: 'text-slate-200 truncate flex-1' }, a.detail),
                h('span', { className: 'text-slate-500 text-2xs shrink-0' }, a.time),
                h('span', { className: 'text-slate-500 text-2xs shrink-0 hidden md:inline' }, a.actor),
              )
            ),
          ),
        ),
      )
    ),
  );
}
