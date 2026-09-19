/* 微光尖塔 - 图鉴收集系统
   记录见过的卡牌/敌人/事件/伙伴,按收集进度发放积分里程碑奖励 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};

  const CODEX_KEY = 'glimmerSpireCodex';

  function load() {
    try {
      const raw = localStorage.getItem(CODEX_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        return {
          seen: d.seen || { cards: {}, enemies: {}, events: {}, allies: {} },
          claimed: d.claimed || {}
        };
      }
    } catch (e) { }
    return { seen: { cards: {}, enemies: {}, events: {}, allies: {} }, claimed: {} };
  }
  function save(data) {
    try { localStorage.setItem(CODEX_KEY, JSON.stringify(data)); } catch (e) { }
  }

  // 里程碑:[key, 说明, 奖励积分]
  const MILESTONES = [
    { id: 'cards_theme_half', label: '任一主题卡牌收集过半', pts: 150 },
    { id: 'cards_theme_full', label: '任一主题卡牌收集完成', pts: 400 },
    { id: 'enemies_half', label: '敌人图鉴过半', pts: 150 },
    { id: 'enemies_full', label: '敌人图鉴完成', pts: 300 },
    { id: 'events_theme_half', label: '任一主题事件收集过半', pts: 100 },
    { id: 'allies_all', label: '集齐所有联动伙伴', pts: 300 }
  ];

  const Codex = {
    record(kind, id) {
      if (!id || !kind) return;
      const d = load();
      if (!d.seen[kind]) d.seen[kind] = {};
      if (d.seen[kind][id]) return;
      d.seen[kind][id] = 1;
      save(d);
    },
    seen(kind, id) {
      const d = load();
      return !!(d.seen[kind] && d.seen[kind][id]);
    },
    counts() {
      const d = load();
      const out = {};
      for (const k of Object.keys(d.seen)) out[k] = Object.keys(d.seen[k]).length;
      return out;
    },

    // 各维度的统计:返回 { total, got, entries: [{id, name, got}] }
    statsCards() {
      const d = load();
      const entries = [];
      const CARDS = global.GS.CARDS;
      for (const id in CARDS.defs) {
        const def = CARDS.defs[id];
        if (!def || !def.rarity || def.rarity === 'basic' || def.cls === 'curse' || def.cls === 'status' || def.cls === 'colorless') continue;
        if (def.pack) continue;
        entries.push({ id, name: def.name, got: !!d.seen.cards[id] });
      }
      return { total: entries.length, got: entries.filter(e => e.got).length, entries };
    },
    statsEnemies() {
      const d = load();
      const EN = global.GS.ENEMIES;
      const entries = [];
      const ids = EN.all || Object.keys(EN.defs || {});
      for (const id of ids) {
        const def = EN.get ? EN.get(id) : (EN.defs || {})[id];
        if (!def || !def.name) continue;
        entries.push({ id, name: def.name, got: !!d.seen.enemies[id] });
      }
      return { total: entries.length, got: entries.filter(e => e.got).length, entries };
    },
    statsEvents() {
      const d = load();
      const entries = [];
      for (const t of (global.GS.THEMES ? global.GS.THEMES.all : [])) {
        for (const ev of (t.events || [])) {
          entries.push({ id: ev.id, name: t.name + ' · ' + ev.name, got: !!d.seen.events[ev.id] });
        }
      }
      return { total: entries.length, got: entries.filter(e => e.got).length, entries };
    },
    statsAllies() {
      const d = load();
      const entries = [];
      for (const a of (global.GS.THEMES ? global.GS.THEMES.allies : [])) {
        entries.push({ id: a.id, name: a.name, got: !!d.seen.allies[a.id] });
      }
      return { total: entries.length, got: entries.filter(e => e.got).length, entries };
    },

    // 计算并发放未领取的里程碑奖励,返回 [{label, pts}]
    claimMilestones() {
      const d = load();
      const won = [];
      const award = (id) => {
        if (d.claimed[id]) return;
        d.claimed[id] = 1;
        const ms = MILESTONES.find(m => m.id === id);
        if (ms && global.GS.Engine) global.GS.Engine.grantPoints(ms.pts);
        if (ms) won.push({ label: ms.label, pts: ms.pts });
      };
      // 任一主题卡牌收集进度
      const THEMES = global.GS.THEMES;
      const CARDS = global.GS.CARDS;
      if (THEMES && CARDS) {
        let half = false, full = false;
        for (const t of THEMES.all) {
          const ids = (t.pool || []).filter(id => CARDS.defs[id]);
          const got = ids.filter(id => d.seen.cards[id]).length;
          if (ids.length && got >= Math.ceil(ids.length / 2)) half = true;
          if (ids.length && got >= ids.length) full = true;
        }
        if (half) award('cards_theme_half');
        if (full) award('cards_theme_full');
      }
      const en = this.statsEnemies();
      if (en.total && en.got >= Math.ceil(en.total / 2)) award('enemies_half');
      if (en.total && en.got >= en.total) award('enemies_full');
      if (THEMES) {
        let eh = false;
        for (const t of THEMES.all) {
          const evs = t.events || [];
          if (evs.length && evs.filter(e => d.seen.events[e.id]).length >= Math.ceil(evs.length / 2)) eh = true;
        }
        if (eh) award('events_theme_half');
        const al = this.statsAllies();
        if (al.total && al.got >= al.total) award('allies_all');
      }
      save(d);
      return won;
    },

    milestones() { return MILESTONES; },

    // 测试用
    reset() { save({ seen: { cards: {}, enemies: {}, events: {}, allies: {} }, claimed: {} }); }
  };

  global.GS.Codex = Codex;
})(typeof window !== 'undefined' ? window : globalThis);
