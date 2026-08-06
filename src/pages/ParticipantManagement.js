// ParticipantManagement — workspace pages for Participant Management
// Pages: explorer (DataGrid), participant-view (Object360Page), onboarding (placeholder)

import { h, React } from '../lib/dom.js';
import { DataGrid } from '../components/DataGrid.js';
import { Object360Page } from '../components/Object360Page.js';
import { useQuery, QUERY_STATUS } from '../lib/dataClient.js';
import { queryParticipants } from '../lib/mockAdapter.js';
import { WorkflowWizard } from '../components/WorkflowWizard.js';

const ONBOARDING_STEPS = [
  { id: 'intake', label: 'Intake', description: 'Capture the participant mandate and legal identity.', fields: [
    { key: 'legalName', label: 'Legal entity name', type: 'text', required: true, placeholder: 'e.g., Northstar Capital LLC' },
    { key: 'entityType', label: 'Entity type', type: 'select', required: true, options: ['Corporation', 'LLC', 'Partnership', 'Trust', 'Individual'] },
    { key: 'jurisdiction', label: 'Jurisdiction', type: 'select', required: true, options: ['US', 'UK', 'DE', 'CH', 'SG', 'LU', 'IE'] },
  ] },
  { id: 'identity', label: 'Identity / KYB', description: 'Validate registry identifiers and controlling parties.', fields: [
    { key: 'lei', label: 'LEI', type: 'text', required: true, placeholder: '20-character LEI' },
    { key: 'registrationNumber', label: 'Registration number', type: 'text', required: true, placeholder: 'Registry reference' },
    { key: 'beneficialOwners', label: 'Beneficial owners identified', type: 'select', required: true, options: ['Yes', 'No — follow-up required'] },
  ] },
  { id: 'documents', label: 'Documents / Evidence', description: 'Collect evidence required for review.', fields: [
    { key: 'incorporation', label: 'Certificate of incorporation', type: 'file', required: true },
    { key: 'ownershipEvidence', label: 'Ownership evidence', type: 'file', required: true },
    { key: 'taxForm', label: 'Tax form (W-8/W-9)', type: 'file', required: true },
  ] },
  { id: 'screening', label: 'Screening', description: 'Record sanctions, PEP and adverse media screening readiness.', fields: [
    { key: 'screeningScope', label: 'Screening scope confirmed', type: 'select', required: true, options: ['Entity and owners', 'Entity only — exception'] },
    { key: 'screeningProvider', label: 'Screening provider', type: 'select', required: true, options: ['Demo screening service', 'External provider'] },
  ] },
  { id: 'risk', label: 'Risk / Accreditation', description: 'Classify risk and confirm participant eligibility.', fields: [
    { key: 'riskClass', label: 'Risk classification', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Prohibited'] },
    { key: 'accreditation', label: 'Accreditation status', type: 'select', required: true, options: ['Verified', 'Pending evidence', 'Not applicable'] },
  ] },
  { id: 'decision', label: 'Review / Decision', description: 'Review the case and submit a demo decision.', fields: [] },
];

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

export function ParticipantManagement({ page, objectId, activeTab, onTabChange }) {
  const participantsQuery = useQuery(() => queryParticipants(), { immediate: true, deps: [page] });
  const participants = participantsQuery.data || [];
  const [selectedParticipant, setSelectedParticipant] = React.useState(null);
  React.useEffect(() => {
    if (objectId && participants.length) {
      setSelectedParticipant(participants.find((item) => item.id === objectId) || null);
    }
  }, [objectId, participants]);

  const handleRowClick = (row) => {
    setSelectedParticipant(row);
    window.history.pushState({}, '', `/workspace/participants/participant/${encodeURIComponent(row.id)}/overview`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (page === 'explorer') {
    if (participantsQuery.status === QUERY_STATUS.LOADING) {
      return h('div', { className: 'flex items-center justify-center h-full text-slate-400', role: 'status' }, 'Loading participants…');
    }
    if (participantsQuery.status === QUERY_STATUS.ERROR) {
      return h('div', { className: 'flex flex-col items-center justify-center h-full gap-3 text-center' },
        h('p', { className: 'text-sm text-status-danger', role: 'alert' }, participantsQuery.error.toUserMessage()),
        h('button', { type: 'button', className: 'px-3 py-1.5 rounded bg-daos-600 hover:bg-daos-700 text-sm focus-ring', onClick: participantsQuery.retry }, 'Retry'));
    }
    if (participantsQuery.status === QUERY_STATUS.EMPTY) {
      return h('div', { className: 'flex items-center justify-center h-full text-slate-400' }, 'No participants found.');
    }
    return h(DataGrid, {
      data: participants,
      columns: PARTICIPANT_COLUMNS,
      idKey: 'id',
      onRowClick: handleRowClick,
    });
  }

  if (page === 'participant-view') {
    if (!selectedParticipant) return h('div', { className: 'p-8 text-slate-400' }, 'Participant not found.');
    return h(Object360Page, {
      objectData: buildParticipant360Data(selectedParticipant),
      activeTab,
      onTabChange,
    });
  }

  if (page === 'onboarding') {
    return h(WorkflowWizard, {
      title: 'Participant onboarding case',
      steps: ONBOARDING_STEPS,
      demoLabel: 'Demo state — drafts and decisions are not persisted to a backend.',
      onComplete: (data) => console.info('Demo onboarding submitted', data),
    });
  }

  return h('div', { className: 'flex items-center justify-center h-full text-slate-500' }, 'Unknown page');
}
