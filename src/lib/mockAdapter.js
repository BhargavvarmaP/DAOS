// mockAdapter.js — Mock data adapter for DAOS
// Provides the same interface as the real API client, backed by local mock data.
// Simulates realistic network latency and supports error injection for testing.
//
// All query functions return { promise, abort, correlationId } — the same shape
// as createJsonRequest, making them drop-in replacements.
//
// Default: mock adapter is always used (backend is not available).

import { DataClientError } from './dataClient.js';
import { MOCK_PARTICIPANTS } from '../data/mockParticipants.js';
import { MOCK_ASSETS } from '../data/mockAssets.js';

// -- Latency configuration --------------------------------------------------

const DEFAULT_DELAY = { min: 120, max: 380 };

function randomDelay(range = DEFAULT_DELAY) {
  return Math.floor(Math.random() * (range.max - range.min)) + range.min;
}

// -- Response helpers -------------------------------------------------------

/**
 * Simulate a successful API response after a random delay.
 * Respects AbortSignal for cancellation.
 */
function createMockResponse(data, signal) {
  const controller = new AbortController();
  let timeoutId;
  let settled = false;
  const correlationId = `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const promise = new Promise((resolve, reject) => {
    const onAbort = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      reject(new DataClientError({ status: 0, code: 'ABORTED', message: 'Request was cancelled', correlationId }));
    };

    if (signal?.aborted) { onAbort(); return; }
    signal?.addEventListener('abort', onAbort, { once: true });
    controller.signal.addEventListener('abort', onAbort, { once: true });

    timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      const clone = typeof structuredClone === 'function' ? structuredClone(data) : JSON.parse(JSON.stringify(data));
      resolve({ data: clone, correlationId, status: 200 });
    }, randomDelay());
  });

  return { promise, abort: () => controller.abort(), correlationId };
}

/**
 * Simulate an error response after a random delay.
 */
function createMockError({ status, code, message, details }, signal) {
  const controller = new AbortController();
  let timeoutId;
  let settled = false;
  const correlationId = `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const promise = new Promise((_resolve, reject) => {
    const onAbort = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      reject(new DataClientError({ status: 0, code: 'ABORTED', message: 'Request was cancelled', correlationId }));
    };
    if (signal?.aborted) { onAbort(); return; }
    signal?.addEventListener('abort', onAbort, { once: true });
    controller.signal.addEventListener('abort', onAbort, { once: true });
    timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      reject(new DataClientError({ status, code, message, details, correlationId }));
    }, randomDelay());
  });

  return { promise, abort: () => controller.abort(), correlationId };
}

// -- Participant queries ----------------------------------------------------

/**
 * Query the participant list.
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @param {object} [options.filters] — { status?, type?, search? }
 */
export function queryParticipants({ signal, filters } = {}) {
  let data = [...MOCK_PARTICIPANTS];

  if (filters) {
    if (filters.status) data = data.filter((p) => p.status === filters.status);
    if (filters.type) data = data.filter((p) => p.type === filters.type);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.lei.toLowerCase().includes(q)
      );
    }
  }

  return createMockResponse(data, signal);
}

/**
 * Query a single participant by ID.
 * @param {string} id
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 */
export function queryParticipant(id, { signal } = {}) {
  const participant = MOCK_PARTICIPANTS.find((p) => p.id === id);

  if (!participant) {
    return createMockError({
      status: 404,
      code: 'NOT_FOUND',
      message: `Participant ${id} not found`,
    }, signal);
  }

  return createMockResponse(participant, signal);
}

// -- Asset queries ----------------------------------------------------------

/**
 * Query the asset list.
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @param {object} [options.filters] — { status?, class?, search? }
 */
export function queryAssets({ signal, filters } = {}) {
  let data = [...MOCK_ASSETS];

  if (filters) {
    if (filters.status) data = data.filter((a) => a.status === filters.status);
    if (filters.class) data = data.filter((a) => a.class === filters.class);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.isin.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }
  }

  return createMockResponse(data, signal);
}

/**
 * Query a single asset by ID.
 * @param {string} id
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 */
export function queryAsset(id, { signal } = {}) {
  const asset = MOCK_ASSETS.find((a) => a.id === id);

  if (!asset) {
    return createMockError({
      status: 404,
      code: 'NOT_FOUND',
      message: `Asset ${id} not found`,
    }, signal);
  }

  return createMockResponse(asset, signal);
}

// -- Adapter mode -----------------------------------------------------------

// The mock adapter is the default (and only) mode while backend is unavailable.
let adapterMode = 'mock';

/** Return the current adapter mode: 'mock' or 'real'. */
export function getAdapterMode() {
  return adapterMode;
}

/** Switch adapter mode. Only 'mock' is supported currently. */
export function setAdapterMode(mode) {
  if (mode !== 'mock' && mode !== 'real') {
    throw new Error(`Unknown adapter mode: ${mode}. Use 'mock' or 'real'.`);
  }
  adapterMode = mode;
}
