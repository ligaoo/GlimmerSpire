/* 诊断:聪明Bot死因分析 */
'use strict';
const store = {};
globalThis.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
require('../js/rng.js');
require('../js/cards.js');
require('../js/enemies.js');
require('../js/relics.js');
require('../js/potions.js');
require('../js/events.js');
require('../js/engine.js');
// 复用 fuzz 的 smart 逻辑
const fuzzSrc = require('fs').readFileSync(__dirname + '/fuzz.js', 'utf8');
// 直接 require 会跑全部测试,这里手动抽取——为简单起见,复制策略核心
// (通过 eval 提取函数定义)
const { Engine } = globalThis.GS;

// ---- 简版复刻 smart 策略(与 fuzz.js 保持一致) ----
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function intentIsAttack(e) {
  const d = globalThis.GS.ENEMIES.get(e.id);
  const mv = d.moves[e.move];
  return mv && ['attack', 'attackDebuff', 'attackDefend', 'strong'].includes(mv.intent);
}
function intentDmg(run, e) {
  const d = globalThis.GS.ENEMIES.get(e.id);
  const mv = d.moves[e.move];
  if (!mv || !mv.dmg) return 0;
  let atk = mv.dmg + (e.statuses.str || 0);
  if ((e.statuses.weak || 0) > 0) atk = Math.floor(atk * 0.75);
  if ((run.combat.player.statuses.vuln || 0) > 0) atk = Math.floor(atk * 1.5);
  return (mv.hits || 1) * atk;
}
function smartCombat(run) {
  const c = run.combat;
  if (c.pending) {
    if (c.pending.type === 'discard') {
      const idx = [];
      while (idx.length < c.pending.n) { const i = Math.floor(Math.random() * c.hand.length); if (!idx.includes(i)) idx.push(i); }
      Engine.resolveDiscard(run, idx);
    } else if (c.pending.type === 'discardToTop') Engine.resolveDiscardToTop(run, 0);
    return;
  }
  const living = c.enemies.filter(e => !e.dead);
  const incoming = living.reduce((s, e) => s + (intentIsAttack(e) ? intentDmg(run, e) : 0), 0);
  const threat = incoming > run.player.hp * 0.3;
  for (let guard = 0; guard < 12; guard++) {
    let bestI = -1, bestScore = -1e9;
    for (let i = 0; i < c.hand.length; i++) {
      if (!Engine.canPlay(run, i)) continue;
      const v = Engine.effectiveView(run, c.hand[i]);
      let sc;
      if (v.type === 'attack') sc = 10 + (Engine.calcCardDamage(run, c.hand[i]) || 0) * 1.5 - (threat ? 15 : 0);
      else if (v.type === 'skill' && v.block) sc = threat ? 40 + Engine.calcCardBlock(run, c.hand[i]) : 5;
      else if (v.type === 'power') sc = 25;
      else if (v.cls === 'curse' || v.cls === 'status') continue;
      else sc = 15;
      if (sc > bestScore) { bestScore = sc; bestI = i; }
    }
    if (bestI === -1) break;
    const v = Engine.effectiveView(run, c.hand[bestI]);
    let target = 0;
    if (v.target === 'enemy' && living.length) {
      let pi = 0;
      const dmg = Engine.calcCardDamage(run, c.hand[bestI]);
      for (let j = 0; j < living.length; j++) {
        if (dmg >= living[j].hp + living[j].block) { pi = j; break; }
        if (living[j].hp > living[pi].hp) pi = j;
      }
      target = pi;
    }
    Engine.playCard(run, bestI, target);
    if (run.screen !== 'combat') return;
  }
  Engine.endTurn(run);
}

const seed = Number(process.argv[2]) || 12345;
const run = Engine.newRun('warrior', seed);
let log = [];
let steps = 0;
outer:
while (run.screen !== 'gameover' && run.screen !== 'victory' && steps < 5000) {
  steps++;
  if (run.screen === 'combat') {
    const c = run.combat;
    if (c.turn === 1) {
      log.push(`[层${run.floorTotal}] 战斗:${c.enemies.map(e => e.name + '(' + e.hp + ')').join(',')} 类型:${c.kind} 我方HP:${run.player.hp} 卡组:${run.player.deck.length}`);
    }
    if (c.turn > 60) { log.push('  超过60回合!'); break; }
    smartCombat(run);
    if (run.screen === 'gameover') {
      log.push(`  >> 死亡 回合${c.turn} 敌:${c.enemies.map(e => e.name + (e.dead ? '(死)' : ':' + e.hp)).join(',')}`);
      break outer;
    }
    if (run.screen === 'reward') log.push(`  << 胜利 回合${c.turn} 我方HP:${run.player.hp}`);
  } else if (run.screen === 'map') {
    const reach = Engine.reachableNodes(run);
    const lowHp = run.player.hp < run.player.maxHp * 0.45;
    const score = p => {
      const t = run.map[p.row][p.i].type;
      if (lowHp) return { rest: 100, treasure: 90, event: 70, combat: 50, shop: 40, elite: 5, boss: 10 }[t];
      return { treasure: 100, elite: 85, combat: 75, event: 60, rest: 30, shop: 45, boss: 50 }[t];
    };
    reach.sort((a, b) => score(b) - score(a));
    Engine.enterNode(run, reach[0].row, reach[0].i);
    log.push(`[层${run.floorTotal}] 进入节点:${run.map[run.nodeIndex.row][run.nodeIndex.i].type} HP:${run.player.hp}`);
  } else if (run.screen === 'reward' || run.screen === 'treasure') {
    (run.rewards || []).forEach((r, i) => {
      if (r.taken) return;
      if (r.type === 'card') { if (run.player.deck.length < 16) Engine.takeCardReward(run, i, pick(r.options)); else Engine.skipCardReward(run, i); }
      else Engine.claimReward(run, i);
    });
    Engine.leaveReward(run);
  } else if (run.screen === 'rest') {
    if (run.pending) run.pending = null;
    if (run.player.hp < run.player.maxHp * 0.6) Engine.restHeal(run);
    else Engine.restSmith(run);
    if (run.pending) run.pending = null;
    Engine.leaveRest(run);
    log.push(`  篝火 HP:${run.player.hp}`);
  } else if (run.screen === 'event') {
    if (run.pending) run.pending = null;
    if (!run.eventResult) {
      const ok = [];
      run.event.choices.forEach((_, i) => { if (Engine.eventCan(run, i)) ok.push(i); });
      Engine.chooseEvent(run, ok[ok.length - 1]);
    } else Engine.leaveEvent(run);
  } else if (run.screen === 'shop') {
    if (run.shop.awaitingRemove) Engine.shopRemoveCard(run, 0);
    else Engine.leaveShop(run);
  } else if (run.screen === 'victory') {
    log.push('!!! 登顶成功');
    break;
  }
}
console.log(log.join('\n'));
console.log('\n最终: screen=' + run.screen + ' 幕=' + run.act + ' 层=' + run.floorTotal + ' HP=' + run.player.hp + '/' + run.player.maxHp);
console.log('卡组: ' + run.player.deck.map(x => globalThis.GS.CARDS.get(x.id).name + (x.up ? '+' : '')).join(', '));
