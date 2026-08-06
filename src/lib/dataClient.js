// dataClient.js — Core API seam for DAOS
// Dependency-free fetch wrapper with correlation IDs, abort support,
// normalized errors, and React query/mutation state hooks.
//
// Designed for enterprise use: every request carries a correlation ID,
// every error is normalized, and every hook surface handles all states.

import { React } from './dom.js';

// -- Configuration ----------------------------------------------------------

/** Return the API base URL from Vite env or empty string for same-origin. */
export function getBaseUrl() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return '';
}

// -- Correlation ID ---------------------------------------------------------

/** Generate a UUID v4 correlation ID for request tracing. */
export function generateCorrelationId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

// -- Normalized Error -------------------------------------------------------

/**
 * Normalized error for every data-client failure path.
 * Always carries: status (HTTP or 0), code (machine-readable),
 * message (human-readable), correlationId (for traceability).
 */
export class DataClientError extends Error {
  constructor({ status, code, message, details, correlationId }) {
    super(message);
    this.name = 'DataClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.correlationId = correlationId;
  }

  /** True if the request was intentionally cancelled (AbortSignal). */
  isCancelled() {
    return this.code === 'ABORTED';
  }

  /** True for network-level failures (no server response). */
  isNetworkError() {
    return this.status === 0 && this.code !== 'ABORTED';
  }

  /** True for 4xx client errors. */
  isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  /** True for 5xx server errors. */
  isServerError() {
    return this.status >= 500;
  }

  /** User-friendly summary for display in error banners. */
  toUserMessage() {
    if (this.isNetworkError()) return 'Unable to reach the server. Check your connection and try again.';
    if (this.isCancelled()) return 'Request was cancelled.';
    if (this.status === 401) return 'Your session has expired. Please sign in again.';
    if (this.status === 403) return 'You do not have permission to access this resource.';
    if (this.status === 404) return 'The requested resource was not found.';
    if (this.isServerError()) return 'The server encountered an error. Please try again later.';
    return this.message || 'An unexpected error occurred.';
  }
}

// -- JSON Request Helper ----------------------------------------------------

/**
 * Create a JSON request with automatic correlation ID, timeout, and abort support.
 *
 * @param {string} url - API path (appended to base URL)
 * @param {object} [options]
 * @param {string} [options.method='GET']
 * @param {object} [options.body] - JSON-serializable request body
 * @param {object} [options.headers] - Additional headers
 * @param {AbortSignal} [options.signal] - External abort signal
 * @param {number} [options.timeout=30000] - Timeout in ms (0 to disable)
 * @param {string} [options.baseUrl] - Override base URL
 * @returns {{ promise: Promise, abort: Function, correlationId: string }}
 */
export function createJsonRequest(url, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    signal,
    timeout = 30000,
    baseUrl,
  } = options;

  const correlationId = generateCorrelationId();
  const controller = new AbortController();
  let timeoutId = null;
  let timedOut = false;

  if (timeout > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);
  }

  // Combine external signal with our internal timeout signal
  const combinedSignal = signal
    ? combineSignals(signal, controller.signal)
    : controller.signal;

  const finalUrl = baseUrl !== undefined
    ? `${baseUrl}${url}`
    : `${getBaseUrl()}${url}`;

  const fetchInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Correlation-Id': correlationId,
      ...headers,
    },
    signal: combinedSignal,
  };

  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    fetchInit.body = JSON.stringify(body);
  }

  const promise = fetch(finalUrl, fetchInit)
    .then(async (response) => {
      clearTimeout(timeoutId);
      const text = await response.text();
      let data;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json') && text) {
        try { data = JSON.parse(text); }
        catch (_e) { data = text; }
      } else {
        data = text;
      }

      if (!response.ok) {
        throw new DataClientError({
          status: response.status,
          code: (data && typeof data === 'object' && data.code) ? data.code : `HTTP_${response.status}`,
          message: (data && typeof data === 'object' && data.message) ? data.message : `Request failed with status ${response.status}`,
          details: data && typeof data === 'object' ? (data.details || data) : data,
          correlationId,
        });
      }

      return { data, correlationId, status: response.status };
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      if (error instanceof DataClientError) throw error;
      if (error.name === 'AbortError') {
        throw new DataClientError({
          status: 0,
          code: 'ABORTED',
          message: timedOut ? 'Request timed out' : 'Request was cancelled',
          correlationId,
        });
      }
      throw new DataClientError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error',
        correlationId,
      });
    });

  return {
    promise,
    abort: () => controller.abort(),
    correlationId,
  };
}

/** Combine multiple AbortSignals — the combined signal aborts when any source aborts. */
function combineSignals(...signals) {
  const controller = new AbortController();
  const onAbort = () => controller.abort();

  for (const sig of signals) {
    if (sig.aborted) {
      controller.abort();
      return controller.signal;
    }
    sig.addEventListener('abort', onAbort, { once: true });
  }

  return controller.signal;
}

// -- Query State Constants --------------------------------------------------

export const QUERY_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  EMPTY: 'empty',
  ERROR: 'error',
};

/**
 * useQuery — data-fetching hook with all states covered.
 *
 * States: idle → loading → success | empty | error → (retry) → loading → ...
 *
 * @param {Function} queryFn - Returns { promise, abort, correlationId }
 * @param {object} [options]
 * @param {boolean} [options.immediate=true] - Fetch on mount
 * @param {Array} [options.deps=[]] - Dependency array for re-fetch
 * @returns {{ data, status, loading, empty, error, retry, refetch }}
 */
export function useQuery(queryFn, options = {}) {
  const { immediate = true, deps = [] } = options;

  const [state, setState] = React.useState({
    status: immediate ? QUERY_STATUS.LOADING : QUERY_STATUS.IDLE,
    data: null,
    error: null,
  });

  const abortRef = React.useRef(null);
  const mountedRef = React.useRef(true);

  const execute = React.useCallback(() => {
    if (abortRef.current) abortRef.current();

    setState((prev) => ({ status: QUERY_STATUS.LOADING, data: prev.data, error: null }));

    const { promise, abort } = queryFn();
    abortRef.current = abort;

    promise
      .then(({ data }) => {
        if (!mountedRef.current) return;
        const isEmpty = Array.isArray(data) ? data.length === 0 : data == null;
        setState({
          status: isEmpty ? QUERY_STATUS.EMPTY : QUERY_STATUS.SUCCESS,
          data,
          error: null,
        });
      })
      .catch((error) => {
        if (!mountedRef.current) return;
        setState({
          status: QUERY_STATUS.ERROR,
          data: null,
          error: error instanceof DataClientError ? error : new DataClientError({
            status: 0,
            code: 'UNKNOWN',
            message: error.message || 'Unknown error',
          }),
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  React.useEffect(() => {
    mountedRef.current = true;
    if (immediate) execute();
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const retry = React.useCallback(() => { execute(); }, deps);

  return {
    data: state.data,
    status: state.status,
    loading: state.status === QUERY_STATUS.LOADING,
    empty: state.status === QUERY_STATUS.EMPTY,
    error: state.error,
    retry,
    refetch: execute,
  };
}

// -- Mutation State Constants -----------------------------------------------

export const MUTATION_STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * useMutation — write-operation hook.
 *
 * States: idle → pending → success | error → (reset) → idle
 *
 * @param {Function} mutationFn - (payload) => { promise, abort, correlationId }
 * @param {object} [options]
 * @param {Function} [options.onSuccess] - Called with response data
 * @param {Function} [options.onError] - Called with DataClientError
 * @returns {{ data, status, pending, error, execute, reset }}
 */
export function useMutation(mutationFn, options = {}) {
  const { onSuccess, onError } = options;

  const [state, setState] = React.useState({
    status: MUTATION_STATUS.IDLE,
    data: null,
    error: null,
  });

  const abortRef = React.useRef(null);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = React.useCallback((payload) => {
    if (abortRef.current) abortRef.current();

    setState({ status: MUTATION_STATUS.PENDING, data: null, error: null });

    const { promise, abort } = mutationFn(payload);
    abortRef.current = abort;

    promise
      .then(({ data }) => {
        if (!mountedRef.current) return;
        setState({ status: MUTATION_STATUS.SUCCESS, data, error: null });
        if (onSuccess) onSuccess(data);
      })
      .catch((error) => {
        if (!mountedRef.current) return;
        const normalized = error instanceof DataClientError ? error : new DataClientError({
          status: 0,
          code: 'UNKNOWN',
          message: error.message || 'Unknown error',
        });
        setState({ status: MUTATION_STATUS.ERROR, data: null, error: normalized });
        if (onError) onError(normalized);
      });
  }, [mutationFn, onSuccess, onError]);

  const reset = React.useCallback(() => {
    setState({ status: MUTATION_STATUS.IDLE, data: null, error: null });
  }, []);

  return {
    data: state.data,
    status: state.status,
    pending: state.status === MUTATION_STATUS.PENDING,
    error: state.error,
    execute,
    reset,
  };
}
