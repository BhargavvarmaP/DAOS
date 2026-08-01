import { WORKSPACES } from '../data/workspaces.js';

export const DEFAULT_PAGES = {
  executive: 'dashboard', participants: 'explorer', assets: 'explorer', 'risk-compliance': 'dashboard',
  deals: 'overview', investments: 'overview', products: 'overview', 'digital-rep': 'overview', investors: 'overview',
  transactions: 'overview', treasury: 'overview', custody: 'overview', settlement: 'overview', 'data-intel': 'overview', admin: 'overview',
};

export const WORKSPACE_PAGES = {
  executive: ['dashboard', 'governance', 'org-chart'], participants: ['explorer', 'participant-view', 'onboarding'],
  assets: ['explorer', 'asset-view', 'positions'], 'risk-compliance': ['dashboard', 'cases', 'audit'],
  deals: ['overview', 'diligence', 'approvals'], investments: ['overview', 'research', 'orders'],
  products: ['overview', 'nav', 'lifecycle'], 'digital-rep': ['overview', 'issuance', 'reconciliation'],
  investors: ['overview', 'transfers', 'communications'], transactions: ['overview', 'orders', 'exceptions'],
  treasury: ['overview', 'cash', 'fx'], custody: ['overview', 'accounts', 'servicing'],
  settlement: ['overview', 'instructions', 'fails'], 'data-intel': ['overview', 'quality', 'lineage'],
  admin: ['overview', 'users', 'integrations'],
};

const workspaceById = new Map(WORKSPACES.map((workspace) => [workspace.id, workspace]));
const OBJECT_PAGE = { participant: { workspace: 'participants', page: 'participant-view' }, asset: { workspace: 'assets', page: 'asset-view' } };

export function parseRoute(pathname = window.location.pathname) {
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const routeParts = parts[0] === 'workspace' ? parts.slice(1) : parts;
  const workspace = workspaceById.get(routeParts[0]);
  if (!workspace) return { kind: 'not-found', workspaceId: routeParts[0] || null, pageId: routeParts[1] || null };

  const objectType = routeParts[1] === 'participant' || routeParts[1] === 'asset' ? routeParts[1] : null;
  if (objectType) {
    const objectId = routeParts[2];
    const tab = routeParts[3] || 'overview';
    const expected = OBJECT_PAGE[objectType];
    if (workspace.id !== expected.workspace || !objectId || !isObjectTab(tab)) return { kind: 'not-found', workspaceId: workspace.id, pageId: routeParts[1] };
    return { kind: 'object', workspace, workspaceId: workspace.id, pageId: expected.page, objectType, objectId, tab };
  }

  const pageId = routeParts[1] || DEFAULT_PAGES[workspace.id];
  if (!WORKSPACE_PAGES[workspace.id]?.includes(pageId) || routeParts.length > 2) return { kind: 'not-found', workspaceId: workspace.id, pageId };
  return { kind: 'page', workspace, workspaceId: workspace.id, pageId, tab: 'overview' };
}

export function routePath({ workspaceId, pageId, objectType, objectId, tab = 'overview' }) {
  if (objectType && objectId) return `/workspace/${workspaceId}/${objectType}/${encodeURIComponent(objectId)}/${tab}`;
  return `/workspace/${workspaceId}/${pageId || DEFAULT_PAGES[workspaceId]}`;
}

export function isObjectTab(tab) {
  return ['overview', 'timeline', 'relationships', 'documents', 'audit', 'compliance', 'risk'].includes(tab);
}

export function routeFromState(state) {
  return routePath({ workspaceId: state.activeWorkspace.id, pageId: state.activePage, objectType: state.objectType, objectId: state.objectId, tab: state.activeTab });
}
