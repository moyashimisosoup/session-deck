/**
 * Offline interaction tests for the existing local-only demo dialogs.
 * This lightweight DOM double verifies focus behavior, NOT visual browser layout.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

function boot() {
  const events = new Map();
  const nodes = new Map();
  const document = {
    activeElement: null,
    body: { style: {} },
    addEventListener(name, callback) {
      const callbacks = events.get(name) || [];
      callbacks.push(callback);
      events.set(name, callbacks);
    },
    getElementById(id) { return nodes.get(id) || null; },
    querySelectorAll() { return []; },
  };
  function node(id) {
    const el = {
      id, hidden: ['detailDrawer', 'drawerBackdrop', 'formModal', 'modalBackdrop', 'toast'].includes(id),
      isConnected: true, style: {}, dataset: {}, innerHTML: '', textContent: '',
      classList: { add() {}, remove() {}, toggle() {} },
      controls: [],
      getClientRects() { return [1]; },
      focus() { document.activeElement = this; },
      addEventListener(name, fn) {
        const k = id + ':' + name;
        events.set(k, [...(events.get(k) || []), fn]);
      },
      querySelector() { return this.controls[0] || null; },
      querySelectorAll() { return this.controls; },
      contains(other) { return this.controls.includes(other); },
    };
    nodes.set(id, el);
    return el;
  }
  for (const id of ['mainContent','projectNav','crumbName','sidebar','detailDrawer',
    'drawerBackdrop','drawerContent','formModal','modalBackdrop','modalContent',
    'toast','exportBtn','resetBtn','menuToggle']) node(id);
  const makeControl = name => {
    const el = node(name);
    el.hidden = false;
    return el;
  };
  nodes.get('detailDrawer').controls = [makeControl('drawer-close'), makeControl('drawer-next')];
  nodes.get('formModal').controls = [makeControl('modal-first'), makeControl('modal-last')];
  const localStorage = { getItem() { return null; }, setItem() {} };
  const window = { scrollTo() {} };
  runInNewContext(source, { document, localStorage, window, console, Date, Intl, setTimeout,
    clearTimeout, confirm:() => false, navigator: {}, FormData }, { filename: 'app.js' });
  const opener = makeControl('outside-card');
  document.activeElement = opener;
  return {
    document, opener, get:id => nodes.get(id),
    click(action,id) {
      const el={dataset:{ action, id }};
      for (const fn of events.get('click')||[])fn({ target:{ closest:()=>el } });
    },
    key(key,shiftKey=false) {
      let prevented = false;
      for (const fn of events.get('keydown')||[])
        fn({key,shiftKey,preventDefault(){prevented=true;}});
      return prevented;
    },
  };
}

test('drawer Escape restores original card and traps Tab/Shift+Tab', () => {
  const ui=boot();
  ui.click('detail-work','OR-101');
  assert.equal(ui.get('detailDrawer').hidden,false);
  assert.equal(ui.document.activeElement,ui.get('drawer-close'));
  ui.get('drawer-next').focus();
  assert.equal(ui.key('Tab'),true);
  assert.equal(ui.document.activeElement,ui.get('drawer-close'));
  assert.equal(ui.key('Tab',true),true);
  assert.equal(ui.document.activeElement,ui.get('drawer-next'));
  ui.key('Escape');
  assert.equal(ui.get('detailDrawer').hidden,true);
  assert.equal(ui.document.activeElement,ui.opener);
});

test('closing nested modal returns to the drawer; closing drawer returns outside', () => {
  const ui=boot();
  ui.click('detail-work','OR-101');
  ui.get('drawer-next').focus();
  ui.click('new-session');
  assert.equal(ui.get('formModal').hidden,false);
  assert.equal(ui.document.activeElement,ui.get('modal-first'));
  ui.get('modal-last').focus();
  assert.equal(ui.key('Tab'),true);
  assert.equal(ui.document.activeElement,ui.get('modal-first'));
  ui.key('Escape');
  assert.equal(ui.get('formModal').hidden,true);
  assert.equal(ui.document.activeElement,ui.get('drawer-next'));
  ui.key('Escape');
  assert.equal(ui.get('detailDrawer').hidden,true);
  assert.equal(ui.document.activeElement,ui.opener);
});

test('removed trigger falls back to main content rather than stale node', () => {
  const ui=boot();
  ui.click('detail-work','OR-101');
  ui.opener.isConnected=false;
  ui.key('Escape');
  assert.equal(ui.document.activeElement,ui.get('mainContent'));
});
