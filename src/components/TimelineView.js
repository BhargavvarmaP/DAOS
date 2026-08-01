// TimelineView — chronological event display with filtering, correlation view, export
// UX spec §5.7: Vertical timeline, event cards, date navigation, filter bar, group by

import { h, React } from '../lib/dom.js';

const EVENT_TYPES = ['Business', 'Lifecycle', 'Compliance', 'System', 'Audit', 'Settlement', 'Payment', 'Risk'];

const TYPE_COLORS = {
  Business: 'bg-status-info/15 text-status-info border-status-info/30',
  Lifecycle: 'bg-status-success/15 text-status-success border-status-success/30',
  Compliance: 'bg-priority-critical/15 text-priority-critical border-priority-critical/30',
  System: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  Audit: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Settlement: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  Payment: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  Risk: 'bg-status-danger/15 text-status-danger border-status-danger/30',
};

const ACTORS = ['Maria Chen', 'James Sullivan', 'Alex Kim', 'Sarah Lee', 'Rachel Brown', 'System', 'DTCC Feed', 'Bloomberg Feed', 'Euroclear Feed'];

function generateMockEvents(n) {
  const events = [];
  const subjects = [
    'Trade executed: BUY 10,000 AAPL @ 195.30',
    'Settlement confirmed: STL-000456 matched',
    'NAV published: Fund BR-Global-01 at $2.4B',
    'Participant onboarded: Goldman Sachs & Co.',
    'KYC review completed: Participant DEF',
    'Token minted: 50,000 AAPL-T on Ethereum',
    'Payment executed: $5.2M via SWIFT gpi',
    'Reconciliation break detected: ISIN US0378331005',
    'Margin call issued: Counterparty XYZ CSA-0042',
    'Compliance rule RL-0047 breach: Concentration > 10%',
    'Corporate action announced: MSFT dividend $0.75/sh',
    'Sanctions screening: Participant cleared',
    'Smart contract deployed: AAPL-T ERC-3643',
    'Audit log archived: Q2 2026 batch',
    'Fund lifecycle event: Distribution declared',
    'SSI validated: DTCC ALERT match confirmed',
    'Position update: 5,000 shares MSFT added to ABOR',
    'FX trade executed: EUR/USD 10M @ 1.0850',
    'AML alert generated: Structuring pattern detected',
    'Collateral substitution: CSA-0042 recalled excess',
    'Subscription order processed: 100,000 units Fund Alpha',
    'Regulatory filing submitted: Form PF to SEC',
    'Risk limit breach warning: VaR > 95% threshold',
    'Document verified: Certificate of Incorporation',
    'API key rotated: Participant JPMorgan',
  ];
  for (let i = 0; i < n; i++) {
    const idx = i % subjects.length;
    const eventType = EVENT_TYPES[i % EVENT_TYPES.length];
    const actor = ACTORS[i % ACTORS.length];
    const daysAgo = Math.floor(i / 3);
    const hoursAgo = (i * 2) % 24;
    const minsAgo = (i * 7) % 60;
    const date = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000 - minsAgo * 60000);
    const correlationGroup = `CORR-${String(8000 + (i % 10) * 10).padStart(4, '0')}`;
    events.push({
      id: `EVT-${String(1000 + i).padStart(4, '0')}`,
      timestamp: date.toISOString(),
      eventType,
      actor,
      subject: subjects[idx],
      correlationId: correlationGroup,
      description: `Detailed event log entry for ${subjects[idx]}. This event is part of the ${eventType.toLowerCase()} workflow.`,
      payload: {
        eventId: `EVT-${String(1000 + i).padStart(4, '0')}`,
        timestamp: date.toISOString(),
        eventType,
        actor,
        correlationId: correlationGroup,
        source: actor.includes('Feed') ? 'External Feed' : 'DAOS Platform',
        details: {
          subject: subjects[idx],
          impacts: ['Position', 'Ledger', 'Audit'].slice(0, 1 + (i % 3)),
          version: i + 1,
        }
      }
    });
  }
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

const ALL_EVENTS = generateMockEvents(36);

const CORRELATIONS = [...new Set(ALL_EVENTS.map(e => e.correlationId))];

export function TimelineView() {
  const [events] = React.useState(ALL_EVENTS);
  const [filteredEvents, setFilteredEvents] = React.useState(ALL_EVENTS);
  const [expandedId, setExpandedId] = React.useState(null);
  const [selectedTypes, setSelectedTypes] = React.useState(new Set());
  const [actorFilter, setActorFilter] = React.useState('');
  const [correlationFilter, setCorrelationFilter] = React.useState('');
  const [groupBy, setGroupBy] = React.useState('none'); // none, type, date, actor
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);

  const applyFilters = () => {
    let filtered = events;
    if (selectedTypes.size > 0) {
      filtered = filtered.filter(e => selectedTypes.has(e.eventType));
    }
    if (actorFilter) {
      filtered = filtered.filter(e => e.actor.toLowerCase().includes(actorFilter.toLowerCase()));
    }
    if (correlationFilter) {
      filtered = filtered.filter(e => e.correlationId.toLowerCase().includes(correlationFilter.toLowerCase()));
    }
    if (dateFrom) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(dateTo + 'T23:59:59'));
    }
    setFilteredEvents(filtered);
  };

  React.useEffect(() => { applyFilters(); }, [selectedTypes, actorFilter, correlationFilter, dateFrom, dateTo]);

  const toggleType = (type) => {
    const next = new Set(selectedTypes);
    if (next.has(type)) next.delete(type); else next.add(type);
    setSelectedTypes(next);
  };

  const clearFilters = () => {
    setSelectedTypes(new Set());
    setActorFilter('');
    setCorrelationFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const showRelated = (correlationId) => {
    setCorrelationFilter(correlationId);
    setSelectedTypes(new Set());
    setActorFilter('');
  };

  const formatRelative = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatDate = (ts) => {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const activeFilterCount = selectedTypes.size + (actorFilter ? 1 : 0) + (correlationFilter ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  // Group events
  let groupedEvents;
  if (groupBy === 'none') {
    groupedEvents = { 'All Events': filteredEvents };
  } else if (groupBy === 'type') {
    groupedEvents = {};
    filteredEvents.forEach(e => {
      if (!groupedEvents[e.eventType]) groupedEvents[e.eventType] = [];
      groupedEvents[e.eventType].push(e);
    });
  } else if (groupBy === 'date') {
    groupedEvents = {};
    filteredEvents.forEach(e => {
      const day = new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (!groupedEvents[day]) groupedEvents[day] = [];
      groupedEvents[day].push(e);
    });
  } else if (groupBy === 'actor') {
    groupedEvents = {};
    filteredEvents.forEach(e => {
      if (!groupedEvents[e.actor]) groupedEvents[e.actor] = [];
      groupedEvents[e.actor].push(e);
    });
  }

  const exportCSV = () => {
    const header = 'ID,Timestamp,Type,Actor,Subject,Correlation\n';
    const rows = filteredEvents.map(e => `${e.id},${e.timestamp},${e.eventType},"${e.actor}","${e.subject}",${e.correlationId}`).join('\n');
    // Simulate export — in production would trigger download
    console.log('CSV Export:', header + rows);
    alert(`Exported ${filteredEvents.length} events to CSV (see console)`);
  };

  return h('div', { className: 'flex flex-col h-full' },
    // Header
    h('div', { className: 'flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-raised/50' },
      h('div', { className: 'flex items-center gap-2' },
        h('h2', { className: 'text-sm font-semibold text-slate-200' }, 'Event Timeline'),
        h('span', { className: 'text-2xs text-slate-500' }, `${filteredEvents.length} events`),
      ),
      h('div', { className: 'flex items-center gap-2' },
        h('button', {
          className: `px-2 py-1 text-xs border rounded focus-ring ${showFilters ? 'bg-daos-700 text-daos-200 border-daos-500' : 'text-slate-400 hover:text-slate-200 border-surface-border'}`,
          onClick: () => setShowFilters(!showFilters),
        }, `🔍 Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`),
        h('select', {
          value: groupBy,
          onChange: (e) => setGroupBy(e.target.value),
          className: 'bg-surface border border-surface-border rounded px-2 py-1 text-xs text-slate-300 focus-ring',
          'aria-label': 'Group by'
        },
          h('option', { value: 'none' }, 'No Grouping'),
          h('option', { value: 'type' }, 'By Type'),
          h('option', { value: 'date' }, 'By Date'),
          h('option', { value: 'actor' }, 'By Actor'),
        ),
        h('button', {
          className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring',
          onClick: exportCSV,
          'aria-label': 'Export to CSV'
        }, '📥 Export'),
      )
    ),

    // Filter bar
    showFilters && h('div', { className: 'px-4 py-3 border-b border-surface-border bg-surface space-y-3 animate-slide-in' },
      // Event type multi-select
      h('div', {},
        h('label', { className: 'block text-2xs font-medium text-slate-500 uppercase mb-1.5' }, 'Event Types'),
        h('div', { className: 'flex flex-wrap gap-1.5' },
          ...EVENT_TYPES.map(type =>
            h('button', {
              key: type,
              className: `px-2 py-0.5 rounded-full text-2xs border transition-colors focus-ring ${selectedTypes.has(type) ? TYPE_COLORS[type] + ' font-medium' : 'border-surface-border text-slate-400 hover:text-slate-200'}`,
              onClick: () => toggleType(type),
              'aria-pressed': String(selectedTypes.has(type)),
            }, type)
          )
        )
      ),
      h('div', { className: 'flex gap-3 flex-wrap' },
        h('div', { className: 'flex-1 min-w-[150px]' },
          h('label', { className: 'block text-2xs font-medium text-slate-500 uppercase mb-1' }, 'Actor'),
          h('input', {
            type: 'text',
            value: actorFilter,
            onInput: (e) => setActorFilter(e.target.value),
            placeholder: 'Search actor...',
            className: 'w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-daos-500',
            'aria-label': 'Filter by actor'
          })
        ),
        h('div', { className: 'flex-1 min-w-[150px]' },
          h('label', { className: 'block text-2xs font-medium text-slate-500 uppercase mb-1' }, 'Correlation ID'),
          h('input', {
            type: 'text',
            value: correlationFilter,
            onInput: (e) => setCorrelationFilter(e.target.value),
            placeholder: 'e.g., CORR-8842',
            className: 'w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-daos-500',
            'aria-label': 'Filter by correlation ID'
          })
        ),
        h('div', { className: 'min-w-[120px]' },
          h('label', { className: 'block text-2xs font-medium text-slate-500 uppercase mb-1' }, 'From'),
          h('input', {
            type: 'date',
            value: dateFrom,
            onChange: (e) => setDateFrom(e.target.value),
            className: 'w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-slate-200 focus:outline-none focus:border-daos-500',
            'aria-label': 'Date from'
          })
        ),
        h('div', { className: 'min-w-[120px]' },
          h('label', { className: 'block text-2xs font-medium text-slate-500 uppercase mb-1' }, 'To'),
          h('input', {
            type: 'date',
            value: dateTo,
            onChange: (e) => setDateTo(e.target.value),
            className: 'w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-slate-200 focus:outline-none focus:border-daos-500',
            'aria-label': 'Date to'
          })
        ),
        h('div', { className: 'flex items-end' },
          h('button', {
            className: 'px-3 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded focus-ring',
            onClick: clearFilters,
          }, 'Clear All')
        ),
      ),
      // Active filter chips
      (correlationFilter || actorFilter || selectedTypes.size > 0) && h('div', { className: 'flex gap-1.5 flex-wrap' },
        correlationFilter && h('span', { className: 'px-2 py-0.5 bg-daos-900/30 text-daos-300 border border-daos-500/30 rounded-full text-2xs flex items-center gap-1' },
          `Correlation: ${correlationFilter}`,
          h('button', { className: 'hover:text-daos-100', onClick: () => setCorrelationFilter(''), 'aria-label': 'Remove correlation filter' }, '×')
        ),
        actorFilter && h('span', { className: 'px-2 py-0.5 bg-daos-900/30 text-daos-300 border border-daos-500/30 rounded-full text-2xs flex items-center gap-1' },
          `Actor: ${actorFilter}`,
          h('button', { className: 'hover:text-daos-100', onClick: () => setActorFilter(''), 'aria-label': 'Remove actor filter' }, '×')
        ),
        ...Array.from(selectedTypes).map(t =>
          h('span', { key: t, className: `px-2 py-0.5 ${TYPE_COLORS[t]} rounded-full text-2xs flex items-center gap-1` },
            t,
            h('button', { className: 'hover:opacity-70', onClick: () => toggleType(t), 'aria-label': `Remove ${t} filter` }, '×')
          )
        ),
      ),
    ),

    // Timeline area
    h('div', { className: 'flex-1 overflow-auto scrollbar-thin' },
      h('div', { className: 'max-w-3xl mx-auto py-4 px-4' },
        Object.keys(groupedEvents).length === 0
          ? h('div', { className: 'text-center py-12 text-slate-500' },
            h('div', { className: 'text-3xl mb-2' }, '📅'),
            h('p', { className: 'text-sm' }, 'No events match the current filters.')
          )
          : Object.entries(groupedEvents).map(([group, evts]) =>
            h('div', { key: group, className: 'mb-6' },
              group !== 'All Events' && h('div', { className: 'text-xs font-semibold text-slate-400 uppercase mb-3 px-2 py-1 bg-surface-raised/30 rounded border border-surface-border sticky top-0 z-10' },
                h('span', {}, group),
                h('span', { className: 'text-slate-500 ml-2' }, `(${evts.length} events)`)
              ),
              h('div', { className: 'relative' },
                // Vertical line
                h('div', { className: 'absolute left-3 top-0 bottom-0 w-0.5 bg-surface-border' }),
                ...evts.map((event, i) => {
                  const typeStyle = TYPE_COLORS[event.eventType] || TYPE_COLORS.System;
                  const isExpanded = expandedId === event.id;
                  return h('div', { key: event.id, className: 'relative pl-10 pb-4' },
                    // Timeline dot
                    h('div', { className: `absolute left-1 top-1 w-4 h-4 rounded-full border-2 bg-surface z-10 ${typeStyle.split(' ').find(c => c.startsWith('border-')) || 'border-slate-500'}` },
                      h('div', { className: `absolute inset-0.5 rounded-full ${typeStyle.split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-500'}` }),
                    ),
                    // Event card
                    h('div', {
                      className: `bg-surface-raised/30 border border-surface-border rounded-lg overflow-hidden hover:border-surface-border-hover transition-colors cursor-pointer ${isExpanded ? 'ring-1 ring-daos-500/50' : ''}`,
                      onClick: () => setExpandedId(isExpanded ? null : event.id),
                      role: 'button',
                      'aria-expanded': String(isExpanded),
                      tabIndex: 0,
                      onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(isExpanded ? null : event.id); } },
                    },
                      h('div', { className: 'px-3 py-2 flex items-start gap-3' },
                        h('div', { className: 'flex-1 min-w-0' },
                          h('div', { className: 'flex items-center gap-2 mb-1 flex-wrap' },
                            h('span', { className: `px-1.5 py-0.5 rounded text-2xs border ${typeStyle}` }, event.eventType),
                            h('span', { className: 'text-xs font-mono text-slate-500' }, event.id),
                          ),
                          h('p', { className: 'text-sm text-slate-200' }, event.subject),
                          h('div', { className: 'flex items-center gap-3 mt-1.5 text-xs' },
                            h('span', { className: 'text-slate-500' }, `${formatDate(event.timestamp)} (${formatRelative(event.timestamp)})`),
                            h('span', { className: 'text-slate-600' }, '·'),
                            h('span', { className: 'text-slate-400' }, event.actor),
                            h('span', { className: 'text-slate-600' }, '·'),
                            h('span', { className: 'text-slate-600 font-mono text-2xs' }, event.correlationId),
                          ),
                        ),
                        h('button', {
                          className: 'text-slate-500 hover:text-slate-200 transition-colors shrink-0',
                          onClick: (ev) => { ev.stopPropagation(); setExpandedId(isExpanded ? null : event.id); },
                          'aria-label': isExpanded ? 'Collapse details' : 'Expand details'
                        }, isExpanded ? '▲' : '▼'),
                      ),
                      // Expanded detail
                      isExpanded && h('div', { className: 'border-t border-surface-border px-3 py-3 bg-surface/50 animate-slide-in' },
                        h('p', { className: 'text-xs text-slate-400 mb-2' }, event.description),
                        h('div', { className: 'mb-2' },
                          h('div', { className: 'text-2xs font-medium text-slate-500 uppercase mb-1' }, 'Event Payload'),
                          h('pre', { className: 'text-xs text-slate-300 bg-surface border border-surface-border rounded p-2 overflow-x-auto font-mono whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-thin' },
                            JSON.stringify(event.payload, null, 2)
                          ),
                        ),
                        h('div', { className: 'flex gap-2' },
                          h('button', {
                            className: 'px-2 py-1 text-xs text-daos-400 hover:text-daos-300 border border-daos-500/30 rounded hover:bg-daos-900/20 focus-ring',
                            onClick: (ev) => { ev.stopPropagation(); showRelated(event.correlationId); },
                          }, '🔗 Show Related Events'),
                          h('button', {
                            className: 'px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded hover:bg-surface-overlay focus-ring',
                            onClick: (ev) => { ev.stopPropagation(); },
                          }, '📋 Copy Event ID'),
                        ),
                      ),
                    )
                  );
                })
              )
            )
          ),
        // Infinite scroll indicator
        filteredEvents.length > 0 && h('div', { className: 'text-center py-6' },
          h('span', { className: 'text-xs text-slate-600' }, `Showing ${filteredEvents.length} of ${events.length} total events`),
        ),
      )
    ),
  );
}
