// Dependency-free demo search parser and index. Supported: type:, status:, isin:, participant:, asset:, quoted terms.
export const SEARCH_INDEX = [
  { id: 'US0378331005', name: 'Apple Inc.', type: 'asset', label: 'Asset', status: 'Active', jurisdiction: 'US', path: '/workspace/assets/asset/US0378331005/overview' },
  { id: 'US5949181045', name: 'Microsoft Corp.', type: 'asset', label: 'Asset', status: 'Active', jurisdiction: 'US', path: '/workspace/assets/asset/US5949181045/overview' },
  { id: '5493000IBP32UQZ0KL24', name: 'Goldman Sachs & Co.', type: 'participant', label: 'Participant', status: 'Active', jurisdiction: 'US', path: '/workspace/participants/participant/5493000IBP32UQZ0KL24/overview' },
  { id: '549300HKKLO5N7NQFT87', name: 'JP Morgan Securities', type: 'participant', label: 'Participant', status: 'Active', jurisdiction: 'US', path: '/workspace/participants/participant/549300HKKLO5N7NQFT87/overview' },
  { id: 'TRD-20260728-000123', name: 'Buy 10,000 AAPL @ 198.50', type: 'transaction', label: 'Trade', status: 'Settled', jurisdiction: 'US', path: '/workspace/transactions/orders' },
  { id: 'STL-20260728-000456', name: 'DVP Settlement Batch 47', type: 'settlement', label: 'Settlement', status: 'Pending', jurisdiction: 'EU', path: '/workspace/settlement/fails' },
];

export function parseSearchQuery(raw = '') {
  const filters = {};
  const terms = [];
  const re = /([\w-]+):("[^"]+"|'[^']+'|[^\s]+)/g;
  let match;
  while ((match = re.exec(raw))) filters[match[1].toLowerCase()] = match[2].replace(/^['"]|['"]$/g, '');
  const remainder = raw.replace(re, ' ').trim();
  if (remainder) terms.push(...remainder.toLowerCase().split(/\s+/));
  return { filters, terms };
}

export function searchIndex(raw = '') {
  const { filters, terms } = parseSearchQuery(raw);
  return SEARCH_INDEX.filter((item) => {
    if (filters.type && item.type !== filters.type.toLowerCase() && item.label.toLowerCase() !== filters.type.toLowerCase()) return false;
    if (filters.status && item.status.toLowerCase() !== filters.status.toLowerCase()) return false;
    if (filters.isin && !item.id.toLowerCase().includes(filters.isin.toLowerCase())) return false;
    if (filters.participant && (item.type !== 'participant' || !item.name.toLowerCase().includes(filters.participant.toLowerCase()))) return false;
    if (filters.asset && (item.type !== 'asset' || !`${item.name} ${item.id}`.toLowerCase().includes(filters.asset.toLowerCase()))) return false;
    const haystack = `${item.id} ${item.name} ${item.label} ${item.status}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
