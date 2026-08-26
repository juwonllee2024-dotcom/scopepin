const STORAGE_KEY = 'scopepinScope';
let scope = null;
let banner = null;
let flashTimer = null;

function isLive() {
  return Boolean(scope && !scope.staleReason);
}

function ensureBanner() {
  if (banner) return banner;

  banner = document.createElement('aside');
  banner.id = 'scopepin-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  document.documentElement.appendChild(banner);
  return banner;
}

function render(nextScope) {
  scope = nextScope ?? null;
  const element = ensureBanner();
  const live = isLive();
  element.className = live ? 'scopepin-live' : 'scopepin-blocked';
  element.replaceChildren();

  const label = document.createElement('strong');
  label.textContent = live ? 'ScopePin LIVE' : 'ScopePin BLOCKED';

  const detail = document.createElement('span');
  if (!scope) {
    detail.textContent = ' · Pin a source tab before sending';
  } else if (scope.staleReason) {
    detail.textContent = ' · Source changed or closed; pin again';
  } else {
    const title = scope.sourceTitle || 'Pinned source';
    const selection = scope.selectedText ? ` · ${scope.selectedText.length} chars pinned` : '';
    detail.textContent = ` · ${title}${selection}`;
  }

  element.append(label, detail);
}

function flash(message) {
  const element = ensureBanner();
  element.dataset.flash = message;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    delete element.dataset.flash;
  }, 3200);
}

function isComposer(target) {
  return target instanceof Element && Boolean(target.closest('textarea, [contenteditable="true"], [role="textbox"]'));
}

function looksLikeSendButton(target) {
  if (!(target instanceof Element)) return false;
  const button = target.closest('button, [role="button"]');
  if (!button) return false;
  const label = [button.getAttribute('aria-label'), button.getAttribute('data-testid'), button.textContent]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /send|submit|전송|보내/.test(label);
}

function block(event, message) {
  if (isLive()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  flash(message);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && isComposer(event.target)) {
    block(event, 'Pin a live source before sending.');
  }
}, true);

document.addEventListener('click', (event) => {
  if (looksLikeSendButton(event.target)) {
    block(event, 'Sending is blocked until the pinned source is live.');
  }
}, true);

chrome.storage.local.get(STORAGE_KEY).then((stored) => render(stored[STORAGE_KEY] ?? null));
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEY]) {
    render(changes[STORAGE_KEY].newValue ?? null);
  }
});
