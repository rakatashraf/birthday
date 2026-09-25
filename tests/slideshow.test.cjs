const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const appRoot = path.join(root, 'photo-collage');
const html = fs.readFileSync(path.join(appRoot, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function runShow(audioMode) {
  let now = 0;
  let nextId = 0;
  const jobs = new Map();
  const nodes = new Map();
  const history = [];
  const documentListeners = new Map();
  const audio = { playCalls: 0, started: false, activated: false };

  const node = id => {
    if (!nodes.has(id)) {
      const classes = new Set();
      const element = {
        style: {},
        textContent: '',
        listeners: {},
        src: id === 'hero-image' ? 'assets/02.jpg' : '',
        alt: '',
        paused: id === 'background-music',
        volume: 1,
        addEventListener(type, callback) { this.listeners[type] = callback; },
        setAttribute(name, value) { this[name] = value; },
        classList: {
          add(...items) { items.forEach(x => classes.add(x)); history.push([...classes]); },
          remove(...items) { items.forEach(x => classes.delete(x)); history.push([...classes]); },
          contains(x) { return classes.has(x); }
        }
      };
      if (id === 'background-music') {
        element.play = () => {
          audio.playCalls++;
          if (audioMode === 'blocked' && !audio.activated) {
            return { catch(callback) { callback(new Error('NotAllowedError')); return this; } };
          }
          element.paused = false;
          audio.started = true;
          return { catch() { return this; } };
        };
      }
      nodes.set(id, element);
    }
    return nodes.get(id);
  };

  const window = {
    setTimeout(fn, delay) {
      const id = ++nextId;
      jobs.set(id, { at: now + delay, fn });
      return id;
    },
    clearTimeout(id) { jobs.delete(id); }
  };
  const document = {
    getElementById: node,
    querySelector: node,
    addEventListener(type, callback) { documentListeners.set(type, callback); }
  };

  vm.runInNewContext(script, { window, document });

  function advance(ms) {
    const end = now + ms;
    let steps = 0;
    while (true) {
      const pending = [...jobs].sort((a, b) => a[1].at - b[1].at)[0];
      if (!pending || pending[1].at > end) break;
      assert.ok(++steps < 2000, 'timer loop must be bounded');
      now = pending[1].at;
      jobs.delete(pending[0]);
      pending[1].fn();
    }
    now = end;
  }

  return {
    node,
    advance,
    history,
    audio,
    gesture(type) {
      audio.activated = true;
      documentListeners.get(type)();
    }
  };
}

test('the repository has one canonical static app and all referenced assets', () => {
  assert.ok(fs.statSync(path.join(appRoot, 'index.html')).isFile());
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8');
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /path:\s*\.\/photo-collage/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.equal(fs.existsSync(path.join(root, 'vercel.json')), false);
  assert.equal(fs.existsSync(path.join(appRoot, 'vercel.json')), false);

  const assets = [...new Set(html.match(/assets\/[\w.-]+/g))];
  for (const asset of assets) {
    assert.ok(fs.statSync(path.join(appRoot, asset)).size > 0, asset);
  }
  assert.ok(fs.statSync(path.join(appRoot, 'assets/background-music.mp3')).size > 0);
  assert.ok(!fs.existsSync(path.join(root, 'birthday-main')));
  assert.ok(!fs.existsSync(path.join(appRoot, 'photo-collage')));
});

test('the uploaded MP3 is the only configured background audio', () => {
  assert.match(html, /<audio id="background-music" src="assets\/background-music\.mp3" preload="auto" autoplay loop playsinline/);
  assert.doesNotMatch(html, /<audio[^>]*\bmuted\b/);
  assert.doesNotMatch(html, /AudioContext|webkitAudioContext|speechSynthesis|SpeechSynthesisUtterance|ambientScore|soft-birthday-music|sound-button/);
});

test('birthday charms remain animated and layered behind the full photo', () => {
  assert.match(html, /<canvas id="birthday-charms"/);
  assert.match(html, /requestAnimationFrame\(drawCharms\)/);
  assert.match(html, /pointermove/);
  assert.match(html, /\.birthday-charms[\s\S]*?z-index:\s*0/);
  assert.match(html, /\.portrait-stage > img\s*\{\s*position:\s*relative;\s*z-index:\s*1;/);
});

test('slideshow continues with visual captions and no narration APIs', () => {
  const show = runShow();
  show.advance(180000);
  assert.ok(show.history.some(classes => classes.includes('celebration-mode')));
  assert.ok(show.history.some(classes => classes.includes('person-visible')));
  assert.ok(show.history.some(classes => classes.length === 0));
  assert.ok(show.node('hero-image').src.startsWith('assets/'));
});

test('background music attempts autoplay once and never duplicates playback', () => {
  const show = runShow('allowed');
  assert.equal(show.audio.playCalls, 1);
  assert.equal(show.audio.started, true);
  show.gesture('click');
  show.gesture('touchend');
  show.gesture('keydown');
  assert.equal(show.audio.playCalls, 1);
});

for (const gesture of ['click', 'touchend', 'keydown']) {
  test(`blocked background music retries from ${gesture} without a sound button`, () => {
    const show = runShow('blocked');
    assert.equal(show.audio.playCalls, 1, 'attempt autoplay on load');
    assert.equal(show.audio.started, false, 'respect browser autoplay restrictions');
    show.advance(10000);
    assert.ok(show.node('hero-image').src, 'visuals continue while audio is blocked');
    show.gesture(gesture);
    assert.equal(show.audio.playCalls, 2);
    assert.equal(show.audio.started, true);
    assert.ok(!html.includes('id="sound-button"'));
  });
}
