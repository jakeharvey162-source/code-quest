import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const script = fs.readFileSync(new URL('../public/startup.js', import.meta.url), 'utf8');
function boot(pathname = '/', hash = '') {
  const elements = Object.fromEntries(['startup-message','startup-recovery','startup-retry','root'].map(id => [id, { isConnected: true, hidden: true, addEventListener(type, fn) { this[type] = fn; } }]));
  const events = {}, removed = [], replacements = [];
  let timeout, mutation, reloaded = false, cleared = false;
  const context = {
    location: { pathname, hash, search: '?source=test', reload() { reloaded = true; } },
    history: { replaceState(_state, _title, url) { replacements.push(url); } },
    document: { getElementById: id => elements[id] },
    navigator: { onLine: true },
    window: { addEventListener: (type, fn) => events[type] = fn, removeEventListener: type => removed.push(type) },
    setTimeout(fn) { timeout = fn; return 1; }, clearTimeout() { cleared = true; },
    MutationObserver: class { constructor(fn) { mutation = fn; } observe() {} disconnect() {} },
    HTMLScriptElement: class {}, URL, Promise,
  };
  vm.runInNewContext(script, context);
  return { context, elements, events, removed, replacements, timeout: () => timeout(), mutation: () => mutation(), reloaded: () => reloaded, cleared: () => cleared };
}
test('direct route aliases preserve query strings, nested lessons and existing recovery hashes', () => {
  assert.equal(boot('/login').replacements[0], '/?source=test#account');
  assert.equal(boot('/learn/variables').replacements[0], '/?source=test#learn/variables');
  assert.equal(boot('/dashboard', '#terminal').replacements[0], '/?source=test#terminal');
  assert.equal(boot('/api/voice').replacements.length, 0);
  assert.equal(boot('/assets/missing.js').replacements.length, 0);
});
test('slow startup and failed entry scripts expose a working recovery action', async () => {
  const b = boot(); b.timeout();
  assert.equal(b.elements['startup-recovery'].hidden, false);
  b.elements['startup-recovery'].hidden = true;
  b.events.error({ target: new b.context.HTMLScriptElement() });
  assert.equal(b.elements['startup-recovery'].hidden, false);
  await b.elements['startup-retry'].click();
  assert.equal(b.reloaded(), true);
});
test('offline retry preserves the shell, and mounting React cleans up startup listeners', async () => {
  const b = boot(); b.context.navigator.onLine = false;
  await b.elements['startup-retry'].click();
  assert.equal(b.reloaded(), false);
  assert.match(b.elements['startup-message'].textContent, /offline/);
  b.elements['startup-message'].isConnected = false; b.mutation();
  assert.equal(b.cleared(), true);
  assert.deepEqual(b.removed, ['error','offline']);
});
