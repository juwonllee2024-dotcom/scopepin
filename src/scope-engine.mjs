export const MAX_SELECTION_LENGTH = 12_000;

const SUPPORTED_AI_HOSTS = new Set([
  'chat.openai.com',
  'chatgpt.com',
  'claude.ai',
  'gemini.google.com',
  'grok.com',
]);

const STATUS_MESSAGES = {
  NO_SCOPE: 'No source is pinned. Pin a source tab before sending.',
  SOURCE_TAB_CLOSED: 'The pinned source tab is closed. Pin a new source before sending.',
  SOURCE_TAB_CHANGED: 'The active source tab changed. Pin the new source before sending.',
  SOURCE_URL_CHANGED: 'The pinned source navigated. Review and pin the new page before sending.',
  SOURCE_SELECTION_CHANGED: 'The selected excerpt changed. Pin the excerpt again before sending.',
  SCOPE_LIVE: 'Pinned context is live.',
};

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value ?? {}, key);

export function normalizeUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    url.hash = '';
    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, '');
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export function fingerprintText(value) {
  const text = String(value ?? '');
  const bytes = new TextEncoder().encode(text);
  let hash = 0x811c9dc5;

  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
}

export function createScope({
  sourceTabId = null,
  sourceUrl = '',
  sourceTitle = '',
  selectedText = '',
  createdAt = new Date().toISOString(),
} = {}) {
  const excerpt = String(selectedText ?? '').replace(/\r\n?/g, '\n').trim().slice(0, MAX_SELECTION_LENGTH);

  return {
    version: 1,
    sourceTabId: Number.isInteger(sourceTabId) ? sourceTabId : null,
    sourceUrl: normalizeUrl(sourceUrl),
    sourceTitle: String(sourceTitle ?? '').trim(),
    selectedText: excerpt,
    selectedHash: fingerprintText(excerpt),
    createdAt,
    staleReason: null,
  };
}

export function scopeStatus(scope, current = {}) {
  if (!scope) {
    return { state: 'blocked', code: 'NO_SCOPE', message: STATUS_MESSAGES.NO_SCOPE };
  }

  if (scope.staleReason) {
    return {
      state: 'blocked',
      code: scope.staleReason,
      message: STATUS_MESSAGES[scope.staleReason] ?? 'Pinned context is stale. Pin it again before sending.',
    };
  }

  if (hasOwn(current, 'sourceTabId') && scope.sourceTabId !== null && current.sourceTabId !== scope.sourceTabId) {
    return { state: 'blocked', code: 'SOURCE_TAB_CHANGED', message: STATUS_MESSAGES.SOURCE_TAB_CHANGED };
  }

  if (hasOwn(current, 'sourceUrl') && normalizeUrl(current.sourceUrl) !== scope.sourceUrl) {
    return { state: 'blocked', code: 'SOURCE_URL_CHANGED', message: STATUS_MESSAGES.SOURCE_URL_CHANGED };
  }

  if (scope.selectedText && hasOwn(current, 'selectedText') && String(current.selectedText ?? '').trim() !== scope.selectedText) {
    return { state: 'blocked', code: 'SOURCE_SELECTION_CHANGED', message: STATUS_MESSAGES.SOURCE_SELECTION_CHANGED };
  }

  return { state: 'live', code: 'SCOPE_LIVE', message: STATUS_MESSAGES.SCOPE_LIVE };
}

export function canSubmit(scope, current = {}) {
  const status = scopeStatus(scope, current);
  return { ok: status.state === 'live', status };
}

export function buildContextCapsule(scope) {
  if (!scope) return '[ScopePin blocked: no source pinned]';

  return [
    '[ScopePin v1]',
    `Source: ${scope.sourceTitle || 'Untitled source'}`,
    `URL: ${scope.sourceUrl || '(unknown)'}`,
    `Selection hash: ${scope.selectedHash}`,
    'Excerpt:',
    scope.selectedText || '(No excerpt selected.)',
    '[/ScopePin]',
  ].join('\n');
}

export function isSupportedAiUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    return [...SUPPORTED_AI_HOSTS].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}
