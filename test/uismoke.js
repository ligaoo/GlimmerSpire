/* 微光尖塔 - UI 冒烟测试
   用极简 DOM 桩驱动 ui.js,验证所有画面 / 弹窗 / 主题专属组件都能正常渲染。
   运行:node test/uismoke.js */
'use strict';
const store = {};
globalThis.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};

/* ---------------- 极简 DOM ---------------- */
let idSeq = 0;
function classSel(sel) {
  // 极简 CSS 选择器:.a
  return sel.trim().split(/\s+/).pop();
}
function matches(node, sel) {
  const s = classSel(sel);
  if (s.startsWith('.')) return node._cls.has(s.slice(1));
  if (s.startsWith('#')) return (node.dataset && node.dataset.__id === s.slice(1));
  return node.tagName === s.toUpperCase();
}
function deepQuery(root, sel) {
  const out = [];
  const walk = n => {
    for (const c of n.children) {
      if (matches(c, sel)) out.push(c);
      walk(c);
    }
  };
  walk(root);
  return out;
}
function makeEl(tag) {
  const e = {
    __id: ++idSeq, tagName: String(tag).toUpperCase(), children: [], parentElement: null,
    _cls: new Set(), _html: '', _text: '', style: {}, dataset: {}, title: '', disabled: false,
    offsetWidth: 120, onclick: null, checked: false,
    get innerHTML() { return this._html; },
    set innerHTML(v) {
      this._html = String(v);
      this.children = [];
      // 极简解析:把 <div class="x"> / <div id="x"> 之类的标签建成子节点,便于 querySelector
      const re = /<(\w+)([^>]*?)>/g;
      let m;
      while ((m = re.exec(this._html))) {
        const attrs = m[2] || '';
        const cm = /class="([^"]*)"/.exec(attrs);
        const im = /id="([^"]*)"/.exec(attrs);
        if (!cm && !im) continue;
        const child = makeEl(m[1]);
        if (cm) child.className = cm[1];
        if (im) { child.id = im[1]; registry.set(im[1], child); }
        child.parentElement = this;
        this.children.push(child);
      }
    },
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); },
    get className() { return [...this._cls].join(' '); },
    set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); },
    classList: null,
    appendChild(c) { if (c.parentElement) c.parentElement.removeChild(c); c.parentElement = this; this.children.push(c); return c; },
    append(...cs) { for (const c of cs) this.appendChild(c); },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parentElement = null; return c; },
    remove() { if (this.parentElement) this.parentElement.removeChild(this); },
    insertBefore(c) { return this.appendChild(c); },
    addEventListener() { }, removeEventListener() { },
    querySelector(sel) { return this._query(sel)[0] || null; },
    querySelectorAll(sel) { return this._query(sel); },
    _query(sel) { return deepQuery(this, sel); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 120, height: 160, bottom: 160, right: 120 }; },
    scrollIntoView() { },
    getContext() { return ctxStub; },
    closest() { return null; }
  };
  e.classList = {
    add: (...cs) => cs.forEach(c => e._cls.add(c)),
    remove: (...cs) => cs.forEach(c => e._cls.delete(c)),
    contains: c => e._cls.has(c),
    toggle: (c, on) => { if (on === undefined) { e._cls.has(c) ? e._cls.delete(c) : e._cls.add(c); } else if (on) e._cls.add(c); else e._cls.delete(c); }
  };
  return e;
}
const ctxStub = new Proxy({}, { get: () => () => { } });
const registry = new Map();
const document = {
  _root: makeEl('body'),
  createElement: t => makeEl(t),
  getElementById(id) { return registry.get(id) || null; },
  querySelector(sel) {
    if (sel.startsWith('#')) return registry.get(sel.slice(1)) || null;
    for (const e of registry.values()) { const hit = e.querySelector(sel); if (hit) return hit; }
    return document._root.querySelector(sel);
  },
  querySelectorAll(sel) {
    const out = [];
    for (const e of registry.values()) out.push(...e.querySelectorAll(sel));
    return out;
  },
  addEventListener() { }, removeEventListener() { },
  body: makeEl('body')
};
document.body.classList = makeEl('div').classList;
globalThis.document = document;
globalThis.window = globalThis;
globalThis.innerWidth = 1400;
globalThis.innerHeight = 900;
globalThis.requestAnimationFrame = () => 0;
globalThis.setTimeout = globalThis.setTimeout;
globalThis.addEventListener = () => { };
globalThis.AudioContext = function () {
  return {
    createOscillator: () => ({ connect() { }, start() { }, stop() { }, frequency: { value: 0, setValueAtTime() { } }, type: '' }),
    createGain: () => ({ connect() { }, gain: { value: 0, setValueAtTime() { }, exponentialRampToValueAtTime() { }, linearRampToValueAtTime() { } } }),
    destination: {}, currentTime: 0, state: 'running', resume() { }
  };
};
globalThis.webkitAudioContext = globalThis.AudioContext;

for (const f of ['rng', 'cards', 'enemies', 'relics', 'potions', 'events', 'packs', 'themes', 'engine', 'audio', 'ui']) require('../js/' + f + '.js');

// 预置 index.html 中的关键节点
const ids = ['hud', 'hp-orb', 'hud-gold', 'hud-floor', 'hud-title', 'hud-potions', 'hud-relics', 'hud-allies', 'screen',
  'combat-bottom', 'player-avatar', 'player-block', 'player-status', 'hand', 'pile-draw', 'pile-discard',
  'energy-text', 'energy-orb', 'btn-endturn', 'float-layer', 'modal-layer', 'tooltip', 'toast', 'vignette',
  'bg-stars', 'btn-deck', 'btn-help', 'btn-mute', 'btn-menu', 'hand-area'];
for (const id of ids) {
  const e = makeEl(id === 'bg-stars' ? 'canvas' : (id.startsWith('btn') ? 'button' : 'div'));
  registry.set(id, e);
  document._root.appendChild(e);
}
registry.get('hp-orb').appendChild(makeEl('div')).classList.add('hp-fill');
registry.get('hp-orb').appendChild(makeEl('div')).classList.add('hp-text');

const { UI, Engine, GS: GSR } = globalThis.GS;
const ALL_THEMES = globalThis.GS.THEMES.all;
UI.init();
const problems = [];
function step(label, fn) {
  try { fn(); } catch (e) { problems.push(label + ' :: ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 4).join('\n')); }
}

step('renderMenu(classic)', () => UI.render());
for (const t of ALL_THEMES) step('renderMenu(theme ' + t.id + ')', () => { UI.selTheme = t.id; UI.render(); });

const THEME_PROBE = {
  mystery: 'mn_carrycoffin', jjk: 'jj_blackflash', rezero: 'rz_dragonsword',
  ultraman: 'ul_zeperion', journey: 'xy_seastack', fairytail: 'ft_dragonforce'
};
for (const themeId of ALL_THEMES.map(t => t.id)) {
  step('newThemeRun ' + themeId, () => {
    UI.run = Engine.newThemeRun(themeId, 4242);
    UI.selTheme = themeId;
    // 灌水:保证能走到后期画面(胜利/下一段/商店),只验证渲染不验证平衡
    UI.run.player.maxHp = 900; UI.run.player.hp = 900; UI.run.player.gold = 5000;
    for (let k = 0; k < 8; k++) UI.run.player.deck.push({ id: THEME_PROBE[themeId], up: 1, uid: 9000 + k });
    UI.update();
  });
  const run = UI.run;
  step('render map ' + themeId, () => UI.render());
  // 走到战斗 / 事件 / 节点
  let guard = 0;
  let sawCombat = false, sawEvent = false, sawShop = false, sawRest = false, sawReward = false, sawCurse = false, sawWard = false;
  while (guard++ < 800 && run.screen !== 'gameover' && run.screen !== 'victory') {
    if (run.screen === 'combat') { run.player.hp = run.player.maxHp; }
    const scr = run.screen;
    step(`${themeId} render ${scr}`, () => UI.render());
    if (scr === 'combat') {
      sawCombat = true;
      step(`${themeId} fieldGauge`, () => {
        if (run.combat.field && !document._root._query('.field-gauge').length) throw new Error('域之量表未渲染');
      });
      step(`${themeId} handCards`, () => {
        const hand = registry.get('hand');
        if (run.combat.hand.length && !hand.children.length) throw new Error('手牌未渲染');
      });
      step(`${themeId} tooltip`, () => {
        for (const h of run.combat.hand) UI.cardTip(h, Engine.effectiveView(run, h));
      });
      let played = 0;
      for (let i = run.combat.hand.length - 1; i >= 0; i--) {
        if (Engine.canPlay(run, i)) {
          const v = Engine.effectiveView(run, run.combat.hand[i]);
          step(`${themeId} play ${v.name}`, () => { Engine.playCard(run, i, 0); UI.update(); });
          played++;
          break;
        }
      }
      if (!played) step(`${themeId} endTurn`, () => { Engine.endTurn(run); UI.update(); });
      continue;
    }
    if (scr === 'event') {
      sawEvent = true;
      if (run.event.id === 'domain_curse') sawCurse = true;
      if (run.event.id === 'domain_ward') sawWard = true;
      step(`${themeId} chooseEvent`, () => { Engine.chooseEvent(run, 0); UI.update(); });
      step(`${themeId} leaveEvent`, () => { Engine.leaveEvent(run); UI.update(); });
      continue;
    }
    if (scr === 'shop') { sawShop = true; step(`${themeId} shop`, () => { UI.packShopModal(); UI.closeModal(); Engine.leaveShop(run); UI.update(); }); continue; }
    if (scr === 'rest') { sawRest = true; step(`${themeId} rest`, () => { Engine.restHeal(run); Engine.leaveRest(run); UI.update(); }); continue; }
    if (scr === 'reward' || scr === 'treasure') {
      sawReward = true;
      step(`${themeId} claimRewards`, () => {
        (run.rewards || []).forEach((r, i) => { if (!r.taken) { if (r.type === 'card') Engine.skipCardReward(run, i); else Engine.claimReward(run, i); } });
        Engine.leaveReward(run); UI.update();
      });
      continue;
    }
    const reach = Engine.reachableNodes(run);
    if (!reach.length) break;
    // 有祭坛/结界就优先走,覆盖主题专属节点
    const prefer = reach.find(p => ['curse', 'ward'].includes(run.map[p.row][p.i].type));
    const target = prefer || reach[0];
    step(`${themeId} enterNode ${run.map[target.row][target.i].type}`, () => { Engine.enterNode(run, target.row, target.i); UI.update(); });
  }
  console.log(`${themeId}: combat=${sawCombat} event=${sawEvent} shop=${sawShop} rest=${sawRest} reward=${sawReward} 祭坛=${sawCurse} 结界=${sawWard} screen=${run.screen} act=${run.act} floor=${run.floorTotal}`);
  step(`${themeId} deckModal`, () => UI.deckModal());
  step(`${themeId} closeModal`, () => UI.closeModal());
  step(`${themeId} helpModal`, () => UI.helpModal());
  step(`${themeId} statsModal`, () => UI.statsModal());
  step(`${themeId} victory`, () => { run.screen = 'victory'; run.player.stats.won = true; UI.render(); });
  step(`${themeId} gameover`, () => { run.screen = 'gameover'; UI.render(); });
}
step('packShopModal', () => UI.packShopModal());
step('closeModal2', () => UI.closeModal());

// 经典模式也回归一遍
step('classic run', () => { UI.selTheme = null; UI.run = Engine.newRun('warrior', 777); UI.update(); });
step('classic map', () => UI.render());
step('classic enter', () => { const r = UI.run; const reach = Engine.reachableNodes(r); Engine.enterNode(r, reach[0].row, reach[0].i); UI.update(); UI.render(); });

if (problems.length) {
  console.error('\n发现 ' + problems.length + ' 个 UI 渲染问题:');
  problems.forEach(p => console.error(' - ' + p));
  process.exit(1);
}
console.log('\nUI 冒烟测试通过 ✓');
