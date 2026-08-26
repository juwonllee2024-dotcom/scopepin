import { createScope, normalizeUrl } from '../src/scope-engine.mjs';

const STORAGE_KEY = 'scopepinScope';

async function readScope() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return stored[STORAGE_KEY] ?? null;
}

async function writeScope(scope) {
  await chrome.storage.local.set({ [STORAGE_KEY]: scope });
  return scope;
}

async function markSourceStale(tabId, staleReason) {
  const scope = await readScope();
  if (!scope || scope.sourceTabId !== tabId || scope.staleReason) return scope;

  return writeScope({
    ...scope,
    staleReason,
    staleAt: new Date().toISOString(),
  });
}

async function handleMessage(message = {}) {
  switch (message.type) {
    case 'scopepin:get':
      return { ok: true, scope: await readScope() };
    case 'scopepin:clear':
      await chrome.storage.local.remove(STORAGE_KEY);
      return { ok: true, scope: null };
    case 'scopepin:pin': {
      const scope = createScope({
        sourceTabId: message.sourceTabId,
        sourceUrl: message.sourceUrl,
        sourceTitle: message.sourceTitle,
        selectedText: message.selectedText,
      });
      return { ok: true, scope: await writeScope(scope) };
    }
    default:
      return { ok: false, error: 'UNKNOWN_MESSAGE' };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url) return;

  readScope().then((scope) => {
    if (!scope || scope.sourceTabId !== tabId || scope.staleReason) return;
    if (normalizeUrl(changeInfo.url) !== scope.sourceUrl) {
      return markSourceStale(tabId, 'SOURCE_URL_CHANGED');
    }
    return undefined;
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  markSourceStale(tabId, 'SOURCE_TAB_CLOSED');
});
