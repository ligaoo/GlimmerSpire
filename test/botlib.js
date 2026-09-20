/* 共享工具:测试脚本里复用 fuzz.js 的策略 Bot
   为什么需要它:fuzz.js 是"require 即跑全套测试"的入口脚本,不能直接 require。
   这里把它的函数定义段(主流程之前的部分)抽出来求值,拿到 driveSmartRun 等。
   做法与 test/diag.js 一致,但集中在这里,避免每个诊断脚本都复制一遍。 */
'use strict';
const fs = require('fs'), path = require('path');

let cached = null;

function loadBot() {
  if (cached) return cached;
  const store = {};
  globalThis.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  require('../js/rng.js'); require('../js/cards.js'); require('../js/enemies.js');
  require('../js/relics.js'); require('../js/potions.js'); require('../js/events.js');
  require('../js/packs.js'); require('../js/themes.js'); require('../js/fusions.js');
  require('../js/codex.js'); require('../js/engine.js');
  const GS = globalThis.GS;
  GS.Unlocks.unlockAll();   // 与 fuzz.js 一致:新卡全部进池

  const src = fs.readFileSync(path.join(__dirname, 'fuzz.js'), 'utf8');
  const cut = src.indexOf('/* ================= 主流程 ================= */');
  if (cut < 0) throw new Error('fuzz.js 结构变了:找不到主流程分隔注释');
  // 去掉 require 行(new Function 里没有 require;模块已在本文件顶部加载)
  const body = src.slice(0, cut).replace(/^\s*require\([^)]*\);\s*$/gm, '');
  const api = new Function(body +
    '\nreturn { driveSmartRun: driveSmartRun, simulateSmart: simulateSmart, simulateRun: simulateRun,' +
    ' smartCombatAct: smartCombatAct, smartMapAct: smartMapAct, actOnce: actOnce,' +
    ' checkInvariants: checkInvariants, getFailures: function(){ return failures; } };')();

  cached = {
    GS, Engine: GS.Engine, CARDS: GS.CARDS, RNG: GS.RNG, CTX: api,
    driveSmartRun: api.driveSmartRun,
    simulateSmart: api.simulateSmart,
    failures: () => api.getFailures()
  };
  return cached;
}

module.exports = { loadBot };
