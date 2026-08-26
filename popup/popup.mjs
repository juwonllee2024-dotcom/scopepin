import { buildContextCapsule } from '../src/scope-engine.mjs';

const STORAGE_KEY = 'scopepinScope';
const pinButton = document.querySelector('#pin');
const copyButton = document.querySelector('#copy');
const clearButton = document.querySelector('#clear');
const statusElement = document.querySelector('#status');
const capsuleElement = document.querySelector('#capsule');
const noticeElement = document.querySelector('#notice');
let scope = null;

function notice(message) {
  noticeElement.textContent = message;
}

function render(nextScope) {
  scope = nextScope ?? null;
  const live = Boolean(scope && !scope.staleReason);
  statusElement.className = `status ${live ? 'live' : 'blocked'}`;

  if (!scope) {
    statusElement.textContent = 'BLOCKED · No source is pinned.';
    capsuleElement.textContent = 'Pin a source page to preview what the AI chat may use.';
  } else if (scope.staleReason) {
    statusElement.textContent = `BLOCKED · ${scope.staleReason.replaceAll('_', ' ').toLowerCase()}. Pin again.`;
    capsuleElement.textContent = buildContextCapsule(scope);
  } else {
    const excerpt = scope.selectedText ? `${scope.selectedText.length} selected characters` : 'No excerpt selected';
    statusElement.textContent = `LIVE · ${scope.sourceTitle || 'Untitled source'} · ${excerpt}`;
    capsuleElement.textContent = buildContextCapsule(scope);
  }

  copyButton.disabled = !scope;
}

async function getCurrentPageContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab is available.');

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({
      sourceUrl: location.href,
      sourceTitle: document.title,
      selectedText: window.getSelection()?.toString() ?? '',
    }),
  });

  return { sourceTabId: tab.id, ...result.result };
}

pinButton.addEventListener('click', async () => {
  pinButton.disabled = true;
  notice('Reading only the page and selection you chose…');

  try {
    const context = await getCurrentPageContext();
    const response = await chrome.runtime.sendMessage({ type: 'scopepin:pin', ...context });
    if (!response?.ok) throw new Error(response?.error || 'Pin failed.');
    render(response.scope);
    notice('Pinned locally. Nothing was sent to an AI provider.');
  } catch (error) {
    notice(`Could not pin this page: ${error.message}`);
  } finally {
    pinButton.disabled = false;
  }
});

copyButton.addEventListener('click', async () => {
  if (!scope) return;
  try {
    await navigator.clipboard.writeText(buildContextCapsule(scope));
    notice('Capsule copied. Review it before pasting into chat.');
  } catch (error) {
    notice(`Clipboard unavailable: ${error.message}`);
  }
});

clearButton.addEventListener('click', async () => {
  const response = await chrome.runtime.sendMessage({ type: 'scopepin:clear' });
  if (response?.ok) {
    render(null);
    notice('Scope cleared locally.');
  }
});

chrome.runtime.sendMessage({ type: 'scopepin:get' }).then((response) => render(response?.scope ?? null));
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEY]) {
    render(changes[STORAGE_KEY].newValue ?? null);
  }
});
