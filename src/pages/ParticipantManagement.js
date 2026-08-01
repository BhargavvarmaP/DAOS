// ParticipantManagement — workspace pages for Participant Management
// Pages: explorer (DataGrid), participant-view (Object360Page), onboarding (placeholder)

import { h, React } from '../lib/dom.js';
import { DataGrid } from '../components/DataGrid.js';
import { Object360Page } from '../components/Object360Page.js';
import { MOCK_PARTICIPANTS } from '../data/mockParticipants.js';

// Build Object360 data from a participant
function buildParticipant360Data(participant) {
  return {
    name: participant.name,
    id: participant.id,
    type: participant.type,
    status: participant.status,
    jurisdiction: participant.jurisdiction,
    lastUpdated: participant.onboardedDate + ' 09:00 UTC',
    updatedBy: 'System',
    attributes: {
      Identifiers: [
        ['Participant ID', participant.id],
        ['LEI', participant.lei],
        ['Type', participant.type],
        ['Jurisdiction', participant.jurisdiction],
      ],
      'Contact & Roles': [
        ['Email', participant.email],
        ['Roles', participant.roles.join(', ')],
        ['Onboarded', participant.onboardedDate],
      ],
      'Regulatory': [
        ['Status', participant.status],
        ['LEI Status', 'Issued'],
        ['KYC Status', participant.status === 'Active' ? 'Verified' : 'Pending'],
        ['KYB Status', participant.status === 'Active' ? 'Verified' : 'Pending'],
        ['AML Screening', participant.status === 'Active' ? 'Cleared' : 'In Review'],
      ],
    },
    kpis: [
      { label: 'Linked Accounts', value: String(Math.floor(Math.random() * 20) + 1), change: '' },
      { label: 'Active Products', value: String(Math.floor(Math.random() * 8) + 1), change: '' },
      { label: 'Open Positions', value: String(Math.floor(Math.random() * 50) + 5), change: '' },
      { label: 'Last Activity', value: `${Math.floor(Math.random() * 14) + 1}d ago`, change: '' },
    ],
    recentActivity: [
      { action: 'KYC review completed', detail: 'Annual KYC refresh — all documents verified', time: '3 hours ago', user: 'Compliance Team' },
      { action: 'Role updated', detail: `${participant.roles[0]} role confirmed`, time: '1 day ago', user: 'Admin' },
      { action: 'Document uploaded', detail: 'Updated Certificate of Incorporation', time: '3 days ago', user: participant.name },
      { action: 'Account linked', detail: `Custody account ACC-${participant.id} created`, time: '1 week ago', user: 'System' },
      { action: 'Onboarding initiated', detail: `Onboarding workflow started for ${participant.name}`, time: participant.onboardedDate, user: 'Operations Team' },
    ],
  };
}

const PARTICIPANT_COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'type', label: 'Type', sortable: true, filterable: true },
  { key: 'lei', label: 'LEI', sortable: true, mono: true },
  { key: 'jurisdiction', label: 'Jurisdiction', sortable: true, width: '80px' },
  {
    key: 'status', label: 'Status', sortable: true, filterable: true,
    render: (value) => {
      const color = value === 'Active' ? 'bg-status-success/15 text-status-success border-status-success/30'
        : value === 'Suspended' ? 'bg-status-warning/15 text-status-warning border-status-warning/30'
        : 'bg-slate-500/15 text-slate-400 border-slate-500/30';
      return h('span', { className: `inline-block px-2 py-0.5 rounded-full text-2xs font-medium border ${color}` }, value);
    }
  },
  { key: 'onboardedDate', label: 'Onboarded', sortable: true },
];

export function ParticipantManagement({ page }) {
  const [selectedParticipant, setSelectedParticipant] = React.useState(MOCK_PARTICIPANTS[0]);

  const handleRowClick = (row) => {
    setSelectedParticipant(row);
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'participant-view' }));
  };

  if (page === 'explorer') {
    return h(DataGrid, {
      data: MOCK_PARTICIPANTS,
      columns: PARTICIPANT_COLUMNS,
      idKey: 'id',
      onRowClick: handleRowClick,
    });
  }

  if (page === 'participant-view') {
    return h(Object360Page, {
      objectData: buildParticipant360Data(selectedParticipant),
    });
  }

  if (page === 'onboarding') {
    return h('div', { className: 'flex items-center justify-center h-full' },
      h('div', { className: 'text-center p-8' },
        h('div', { className: 'text-4xl mb-4' }, '📝'),
        h('h3', { className: 'text-lg font-medium text-slate-300 mb-2' }, 'Onboarding'),
        h('p', { className: 'text-sm text-slate-500 max-w-md' }, 'Participant onboarding workflow — KYC/KYB data collection, document upload, risk scoring, and approval routing.'),
      )
    );
  }

  return h('div', { className: 'flex items-center justify-center h-full text-slate-500' }, 'Unknown page');
}
