const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'photo-collage/index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function runShow(speechMode, audioMode) {
  let now = 0, nextId = 0;
  const jobs = new Map(), nodes = new Map();
  const history = [], speechCalls = [];
  const documentListeners = new Map();
  const audio = { instances: 0, resumes: 0, notes: 0, loops: 0, activated: false };
  const node = id => {
    if (!nodes.has(id)) {
      const classes = new Set();
      nodes.set(id, { style: {}, textContent: '', listeners: {},
        addEventListener(type, cb) { this.listeners[type] = cb; },
        setAttribute(name, value) { this[name] = value; },
        classList: {
          add(...items) { items.forEach(x => classes.add(x)); history.push([...classes]); },
          remove(...items) { items.forEach(x => classes.delete(x)); history.push([...classes]); },
          contains(x) { return classes.has(x); }
        }
      });
    }
    return nodes.get(id);
  };
  const window = {
    setTimeout(fn, delay) { const id = ++nextId; jobs.set(id, { at: now + delay, fn }); return id; },
    clearTimeout(id) { jobs.delete(id); },
    setInterval(fn, delay) {
      audio.loops++;
      const id = ++nextId;
      jobs.set(id, { at: now + delay, fn, interval: delay });
      return id;
    }

  };
  if (audioMode) {
    window.AudioContext = class {
      constructor() { audio.instances++; this.state = audioMode === 'allowed' ? 'running' : 'suspended'; this.currentTime = 0; }
      addEventListener(type, listener) { this.listener = listener; }
      resume() {
        audio.resumes++;
        if (!audio.activated) return Promise.reject(new Error('NotAllowedError'));
        this.state = 'running'; this.listener(); return Promise.resolve();
      }
      createGain() { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
      createOscillator() { return { frequency: {}, connect() {}, disconnect() {}, start() { audio.notes++; }, stop() {} }; }
    };
  }
  const context = { window, document: {
    getElementById: node, querySelector: node,
    addEventListener(type, callback) { documentListeners.set(type, callback); }
  },
    Date: class extends Date { static now() { return now; } } };
  if (speechMode) {
    context.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    window.speechSynthesis = {
      cancel() {}, getVoices() { return []; },
      speak(utterance) {
        speechCalls.push(utterance.text);
        if (speechMode === 'throw') throw new Error('Speech denied');
        if (speechMode === 'end' || speechMode === 'error' || speechMode === 'both') {
          const end = utterance.onend, error = utterance.onerror;
          window.setTimeout(() => {
            if (speechMode !== 'error') end();
            if (speechMode !== 'end') error();
          }, 100);
        }
        // "hang" intentionally fires no callbacks.
      }
    };
  }
  vm.runInNewContext(script, context);
  function advance(ms) {
    const end = now + ms;
    let steps = 0;
    while (true) {
      const pending = [...jobs].sort((a,b) => a[1].at - b[1].at)[0];
      if (!pending || pending[1].at > end) break;
      assert.ok(++steps < 2000, 'timer loop must be bounded');
      now = pending[1].at; jobs.delete(pending[0]); pending[1].fn();
      if (pending[1].interval) jobs.set(pending[0], { ...pending[1], at: now + pending[1].interval });
    }
    now = end;
  }
  return { node, advance, history, speechCalls, audio,
    gesture(type) { audio.activated = true; documentListeners.get(type)(); }
  };
}

test('every Vercel root publishes an index and all its referenced assets', () => {
  for (const dir of ['', 'photo-collage', 'photo-collage/photo-collage']) {
    const config = JSON.parse(fs.readFileSync(path.join(root, dir, 'vercel.json')));
    assert.equal(config.framework, null);
    assert.equal(config.buildCommand, '');
    assert.equal(config.installCommand, '');
    const output = path.join(root, dir, config.outputDirectory);
    assert.ok(fs.statSync(path.join(output, 'index.html')).isFile());
    for (const [asset] of html.matchAll(/assets\/[\w.-]+/g)) {
      assert.ok(fs.statSync(path.join(output, asset)).size > 0, asset);
    }
  }
});

test('the legacy nested entry is synchronized', () => {
  assert.equal(html, fs.readFileSync(path.join(root, 'photo-collage/photo-collage/index.html'), 'utf8'));
});

test('birthday charms are animated and layered behind the full photo', () => {
  assert.match(html, /<canvas id="birthday-charms"/);
  assert.match(html, /requestAnimationFrame\(drawCharms\)/);
  assert.match(html, /pointermove/);
  assert.match(html, /\.birthday-charm\s*\{\s*display:\s*none;/);
  assert.match(html, /\.birthday-charms[\s\S]*?z-index:\s*0/);
  assert.match(html, /\.portrait-stage > img\s*\{\s*position:\s*relative;\s*z-index:\s*1;/);
});

test('slideshow completes without audio APIs', () => {
  const show = runShow();
  show.advance(180000);
  assert.equal(show.speechCalls.length, 0);
  assert.ok(show.history.some(classes => classes.includes('celebration-mode')));
  assert.ok(show.history.some(classes => classes.includes('person-visible')));
  assert.ok(show.history.some(classes => classes.length === 0));
  assert.ok(show.node('hero-image').src.startsWith('assets/'));
});

for (const mode of [undefined, 'end', 'error', 'throw', 'hang', 'both']) {
  test(`slideshow stays live with speech mode: ${mode || 'unsupported'}`, () => {
    const show = runShow(mode);
    show.advance(300000);
    assert.ok(show.history.some(classes => classes.includes('person-visible')));
    assert.ok(show.history.some(classes => classes.length === 0));
    // Duplicate end/error callbacks must not launch parallel slideshow loops.
    if (mode === 'both') assert.ok(show.speechCalls.length < 65);
  });
}


test('music starts on load when browser autoplay is allowed and never duplicates the loop', () => {
  const show = runShow(undefined, 'allowed');
  assert.equal(show.audio.notes, 7);
  assert.equal(show.audio.loops, 1);
  show.gesture('click'); show.gesture('touchend'); show.gesture('keydown');
  assert.equal(show.audio.instances, 1);
  assert.equal(show.audio.loops, 1);
  show.advance(6500);
  assert.equal(show.audio.notes, 14);
});

for (const gesture of ['click', 'touchend', 'keydown']) {
  test(`blocked music starts from ${gesture} without a sound button`, async () => {
    const show = runShow(undefined, 'blocked');
    await Promise.resolve();
    assert.equal(show.audio.resumes, 1, 'attempt autoplay on load');
    assert.equal(show.audio.notes, 0, 'respect browser autoplay restrictions');
    show.advance(10000);
    assert.ok(show.node('hero-image').src, 'visuals continue while audio is blocked');
    show.gesture(gesture);
    await Promise.resolve();
    assert.equal(show.audio.notes, 7);
    assert.equal(show.audio.loops, 1);
    assert.ok(!html.includes('id="sound-button"'));
  });
}
