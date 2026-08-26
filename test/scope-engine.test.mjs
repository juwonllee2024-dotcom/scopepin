import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildContextCapsule,
  canSubmit,
  createScope,
  isSupportedAiUrl,
  scopeStatus,
} from '../src/scope-engine.mjs';

test('creates a bounded scope with normalized URL and selection fingerprint', () => {
  const scope = createScope({
    sourceTabId: 42,
    sourceUrl: 'https://example.com/article#comments',
    sourceTitle: 'An article',
    selectedText: '  Keep this excerpt.  ',
    createdAt: 123,
  });

  assert.deepEqual(scope, {
    version: 1,
    sourceTabId: 42,
    sourceUrl: 'https://example.com/article',
    sourceTitle: 'An article',
    selectedText: 'Keep this excerpt.',
    selectedHash: 'b2d01061',
    createdAt: 123,
    staleReason: null,
  });
});

test('keeps live scope when source tab and selected content still match', () => {
  const scope = createScope({
    sourceTabId: 7,
    sourceUrl: 'https://docs.example.test/guide',
    selectedText: 'Do the safe thing.',
  });

  const result = scopeStatus(scope, {
    sourceTabId: 7,
    sourceUrl: 'https://docs.example.test/guide#top',
    selectedText: 'Do the safe thing.',
  });

  assert.equal(result.state, 'live');
  assert.equal(result.code, 'SCOPE_LIVE');
});

test('blocks stale source navigation, closure, and changed selection', () => {
  const scope = createScope({
    sourceTabId: 7,
    sourceUrl: 'https://docs.example.test/guide',
    selectedText: 'Original excerpt',
  });

  assert.equal(scopeStatus({ ...scope, staleReason: 'SOURCE_TAB_CLOSED' }, {}).code, 'SOURCE_TAB_CLOSED');
  assert.equal(scopeStatus(scope, { sourceTabId: 7, sourceUrl: 'https://docs.example.test/other' }).code, 'SOURCE_URL_CHANGED');
  assert.equal(scopeStatus(scope, { sourceTabId: 7, sourceUrl: scope.sourceUrl, selectedText: 'Changed excerpt' }).code, 'SOURCE_SELECTION_CHANGED');
  assert.equal(canSubmit(scope, { sourceTabId: 7, sourceUrl: 'https://docs.example.test/other' }).ok, false);
});

test('requires a scope and recognizes supported AI chat URLs', () => {
  assert.equal(canSubmit(null, {}).ok, false);
  assert.equal(scopeStatus(null, {}).code, 'NO_SCOPE');
  assert.equal(isSupportedAiUrl('https://chatgpt.com/c/123'), true);
  assert.equal(isSupportedAiUrl('https://claude.ai/new'), true);
  assert.equal(isSupportedAiUrl('https://example.com/chat'), false);
});

test('builds a reviewable capsule without silently sending it', () => {
  const scope = createScope({
    sourceTabId: 1,
    sourceUrl: 'https://example.com/guide',
    sourceTitle: 'Guide',
    selectedText: 'Use the preview before sending.',
  });

  assert.equal(buildContextCapsule(scope), [
    '[ScopePin v1]',
    'Source: Guide',
    'URL: https://example.com/guide',
    `Selection hash: ${scope.selectedHash}`,
    'Excerpt:',
    'Use the preview before sending.',
    '[/ScopePin]',
  ].join('\n'));
});
