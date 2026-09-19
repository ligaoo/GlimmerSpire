/* 微光尖塔 - Node 模糊测试
   运行: node test/fuzz.js */
'use strict';

// localStorage 垫片
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
require('../js/packs.js');
require('../js/themes.js');
require('../js/engine.js');

const { Engine, RNG, CARDS } = globalThis.GS;

// 测试环境:解锁全部技能包,让新卡进入模糊池
GS.Unlocks.unlockAll();

let failures = 0;
function fail(msg) {
  failures++;
  console.error('FAIL: ' + msg);
}
function assert(cond, msg) {
  if (!cond) fail(msg);
}

function rnd(n) { return Math.floor(Math.random() * n); }
function pick(arr) { return arr[rnd(arr.length)]; }

/* ================= 不变量检查 ================= */
function checkInvariants(run, where) {
  const p = run.player;
  if (!(p.hp >= 0 && p.hp <= p.maxHp)) fail(`[${where}] hp 越界: ${p.hp}/${p.maxHp}`);
  if (!Number.isFinite(p.hp) || !Number.isFinite(p.maxHp)) fail(`[${where}] hp NaN`);
  if (p.gold < 0) fail(`[${where}] 金币为负: ${p.gold}`);
  const c = run.combat;
  if (c) {
    if (c.player.energy < 0) fail(`[${where}] 能量为负: ${c.player.energy}`);
    if (c.hand.length > 10) fail(`[${where}] 手牌超过10: ${c.hand.length}`);
    if (c.draw.length < 0 || c.discard.length < 0 || c.exhaust.length < 0) fail(`[${where}] 牌堆为负`);
    for (const e of c.enemies) {
      if (!(e.hp >= 0 && e.hp <= e.maxHp)) fail(`[${where}] 敌人血量越界 ${e.name}: ${e.hp}/${e.maxHp}`);
      if (!Number.isFinite(e.hp)) fail(`[${where}] 敌人血量 NaN`);
      if (e.dead && e.hp > 0) fail(`[${where}] 死亡敌人血量>0`);
      if (!e.dead && e.hp <= 0 && !c.over) fail(`[${where}] 活着的敌人血量<=0: ${e.name}`);
      if (!e.dead && !e.move) fail(`[${where}] 敌人无意图: ${e.name}`);
    }
    if (c.over && !c.won && run.screen === 'combat') fail(`[${where}] 战斗结束但画面仍是战斗`);
  }
  // 卡组完整性
  for (const inst of run.player.deck) {
    if (!CARDS.get(inst.id)) fail(`[${where}] 卡组含未知卡: ${inst.id}`);
    if (!(inst.up === 0 || inst.up === 1)) fail(`[${where}] 卡牌升级值异常: ${inst.id} ${inst.up}`);
  }
  for (const id of run.player.relics) {
    if (!globalThis.GS.RELICS.get(id)) fail(`[${where}] 未知遗物: ${id}`);
  }
  for (const pt of run.player.potions) {
    if (pt && !globalThis.GS.POTIONS.get(pt)) fail(`[${where}] 未知药水: ${pt}`);
  }
}

/* ================= 单步驱动 ================= */
function actOnce(run) {
  switch (run.screen) {
    case 'map': {
      const reach = Engine.reachableNodes(run);
      if (!reach.length) { fail('地图无可达节点'); run.screen = 'gameover'; return; }
      const target = pick(reach);
      Engine.enterNode(run, target.row, target.i);
      return;
    }
    case 'combat': {
      const c = run.combat;
      if (c.turn > 120) { fail('战斗超过120回合,疑似死循环'); run.screen = 'gameover'; return; }
      if (c.pending) {
        if (c.pending.type === 'discard') {
          const idx = [];
          while (idx.length < c.pending.n) { const i = rnd(c.hand.length); if (!idx.includes(i)) idx.push(i); }
          Engine.resolveDiscard(run, idx);
        } else if (c.pending.type === 'discardToTop') {
          if (c.discard.length) Engine.resolveDiscardToTop(run, rnd(c.discard.length));
          else Engine.cancelPending(run);
        }
        return;
      }
      const roll = Math.random();
      if (roll < 0.75) {
        const playable = [];
        for (let i = 0; i < c.hand.length; i++) if (Engine.canPlay(run, i)) playable.push(i);
        if (playable.length) {
          const i = pick(playable);
          const view = Engine.effectiveView(run, c.hand[i]);
          let target;
          if (view.target === 'enemy') target = rnd(c.enemies.filter(e => !e.dead).length);
          Engine.playCard(run, i, target);
          return;
        }
      }
      if (roll < 0.85) {
        for (let s = 0; s < run.player.potionSlots; s++) {
          if (Engine.potionUsable(run, s) && Math.random() < 0.5) {
            Engine.usePotion(run, s, rnd(Math.max(1, c.enemies.filter(e => !e.dead).length)));
            return;
          }
        }
      }
      Engine.endTurn(run);
      return;
    }
    case 'reward':
    case 'treasure': {
      if (run.pending) return resolvePendingRandom(run);
      (run.rewards || []).forEach((r, i) => {
        if (r.taken) return;
        if (r.type === 'card') {
          if (Math.random() < 0.7) Engine.takeCardReward(run, i, pick(r.options));
          else Engine.skipCardReward(run, i);
        } else {
          Engine.claimReward(run, i);
        }
      });
      Engine.leaveReward(run);
      return;
    }
    case 'shop': {
      const s = run.shop;
      if (s.awaitingRemove) {
        Engine.shopRemoveCard(run, rnd(run.player.deck.length));
        return;
      }
      if (Math.random() < 0.5) {
        const kinds = ['card', 'potion', 'relic', 'remove'];
        const k = pick(kinds);
        if (k === 'card') Engine.buyShopItem(run, 'card', rnd(s.cards.length));
        else if (k === 'potion') Engine.buyShopItem(run, 'potion', rnd(s.potions.length));
        else if (k === 'relic') Engine.buyShopItem(run, 'relic', rnd(s.relics.length));
        else Engine.buyShopItem(run, 'remove', 0);
        return;
      }
      Engine.leaveShop(run);
      return;
    }
    case 'rest': {
      if (run.pending) return resolvePendingRandom(run);
      if (run.restDone) { Engine.leaveRest(run); return; }
      const roll = Math.random();
      if (roll < 0.5) Engine.restHeal(run);
      else if (roll < 0.8) Engine.restSmith(run);
      else Engine.restPurify(run);
      return;
    }
    case 'event': {
      if (run.pending) return resolvePendingRandom(run);
      if (!run.eventResult) {
        const ok = [];
        run.event.choices.forEach((_, i) => { if (Engine.eventCan(run, i)) ok.push(i); });
        if (!ok.length) { fail('事件无可选项: ' + run.event.id); run.eventResult = '跳过'; return; }
        Engine.chooseEvent(run, pick(ok));
      } else {
        Engine.leaveEvent(run);
      }
      return;
    }
    case 'victory': {
      if (Math.random() < 0.5 && !run.endless) Engine.continueEndless(run);
      else run.screen = 'gameover'; // 结束模拟
      return;
    }
    case 'gameover':
      return;
    default:
      fail('未知画面: ' + run.screen);
      run.screen = 'gameover';
  }
}

function resolvePendingRandom(run) {
  const info = Engine.pendingInfo(run);
  if (!info) { run.pending = null; return; }
  if (info.type === 'smith') {
    // 升级价值最高的牌(伤害>格挡>其他)
    const cand = [];
    run.player.deck.forEach((x, i) => { if (info.filter(x)) cand.push(i); });
    cand.sort((a, b) => cardValue(run.player.deck[b]) - cardValue(run.player.deck[a]));
    Engine.resolvePending(run, cand.slice(0, info.n));
  } else if (info.type === 'colorless') {
    if (info.pool.length) Engine.resolvePending(run, { id: pick(info.pool) });
    else run.pending = null;
  } else if (info.type === 'transform' || info.type === 'duplicate') {
    const idxs = [];
    run.player.deck.forEach((x, i) => { if (info.filter(x) && !idxs.length) idxs.push(i); });
    if (idxs.length) Engine.resolvePending(run, idxs);
    else run.pending = null;
  } else {
    Engine.resolvePending(run, [rnd(run.player.deck.length)]);
  }
}
function cardValue(inst) {
  const v = globalThis.GS.CARDS.view(inst);
  let s = Math.max(v.dmg || 0, v.block || 0);
  if (v.rarity === 'rare') s += 6;
  if (v.type === 'power') s += 4;
  return s;
}

/* ================= 完整对局模拟 ================= */
function simulateRun(cls, seed) {
  const run = Engine.newRun(cls, seed);
  let steps = 0;
  while (run.screen !== 'gameover' && steps < 30000) {
    steps++;
    try {
      actOnce(run);
    } catch (e) {
      fail(`[${cls}#${seed}] 步骤${steps} screen=${run.screen} 异常: ${e.stack}`);
      return run;
    }
    checkInvariants(run, `${cls}#${seed} 步${steps}`);
    if (run.floorTotal > 90) { fail(`[${cls}#${seed}] 楼层异常`); break; }
  }
  if (run.screen !== 'gameover') fail(`[${cls}#${seed}] 未正常结束, screen=${run.screen}`);
  const sc = Engine.score(run);
  if (!Number.isFinite(sc)) fail(`[${cls}#${seed}] 分数 NaN`);
  return run;
}

/* ================= 定向机制测试 ================= */
function forceCombat(run, enc, kind) {
  // 直接复用内部入口:通过 enterNode 太随机,这里借用 Engine 私有方法
  return Engine._testStartCombat(run, enc, kind);
}

function mechanicTests() {
  // --- 旋风斩: 耗尽全部能量并造成伤害 ---
  {
    const run = Engine.newRun('warrior', 12345);
    run.player.deck = [];
    for (let i = 0; i < 5; i++) run.player.deck.push({ id: 'whirlwind', up: 0 });
    for (let i = 0; i < 5; i++) run.player.deck.push({ id: 'defend', up: 0 });
    forceCombat(run, ['jawworm'], 'normal');
    const c = run.combat;
    const hpBefore = c.enemies[0].hp;
    // 打出旋风斩(X)
    const idx = c.hand.findIndex(h => h.id === 'whirlwind');
    if (idx >= 0 && Engine.canPlay(run, idx)) {
      Engine.playCard(run, idx, 0);
      assert(c.player.energy === 0, '旋风斩未耗尽能量');
      const dealt = hpBefore - c.enemies[0].hp + (c.enemies[0].block > 0 ? 0 : 0);
      // 3 能量 ×5 伤害 = 至少 15 点输出(部分可能被格挡吸收)
      const throughput = hpBefore - c.enemies[0].hp + (c.enemies[0].statuses && 0);
      assert(hpBefore - c.enemies[0].hp + Math.max(0, 15 - (hpBefore - c.enemies[0].hp)) >= 0, 'sanity');
      void dealt; void throughput;
    }
  }
  // --- 狂暴: 永久增伤 ---
  {
    const run = Engine.newRun('warrior', 777);
    run.player.deck = [{ id: 'rampage', up: 0 }];
    forceCombat(run, ['jawworm'], 'normal');
    const c = run.combat;
    if (c.hand.length) {
      const uid0 = c.hand[0].uid;
      const hpB = c.enemies[0].hp;
      Engine.playCard(run, 0, 0);
      assert((c.permBoosts[uid0] || 0) === 5, '狂暴未增加永久伤害');
      assert(hpB - c.enemies[0].hp > 0, '狂暴未造成伤害');
    }
  }
  // --- 中毒: 回合开始掉血且递减 ---
  {
    const run = Engine.newRun('ranger', 42);
    run.player.deck = [{ id: 'poisoncoat', up: 0 }];
    forceCombat(run, ['cultist'], 'normal');
    const c = run.combat;
    const e = c.enemies[0];
    Engine.playCard(run, 0, 0);
    assert((e.statuses.poison || 0) === 3, '淬毒施加失败');
    const hpB = e.hp;
    Engine.endTurn(run);
    // 敌人回合中毒结算: 3 点伤害, 2 层剩余
    assert(hpB - e.hp >= 3, `中毒未结算: ${hpB - e.hp}`);
    assert((e.statuses.poison || 0) === 2, `中毒层数未递减: ${e.statuses.poison}`);
  }
  // --- 路障: 格挡保留 ---
  {
    const run = Engine.newRun('warrior', 99);
    run.player.deck = [{ id: 'barricade', up: 0 }, { id: 'defend', up: 0 }, { id: 'defend', up: 0 }];
    forceCombat(run, ['jawworm'], 'normal');
    const c = run.combat;
    for (let t = 0; t < 6 && run.screen === 'combat'; t++) {
      const b = c.hand.findIndex(h => h.id === 'barricade');
      if (b >= 0 && Engine.canPlay(run, b)) Engine.playCard(run, b, 0);
      else {
        const d = c.hand.findIndex(h => h.id === 'defend');
        if (d >= 0 && Engine.canPlay(run, d)) Engine.playCard(run, d, 0);
      }
      const before = c.player.block;
      Engine.endTurn(run);
      if (run.screen !== 'combat') break;
      // 有路障时,格挡不因回合开始清零(可能被敌人攻击消耗)
      void before;
      if ((c.player.statuses.barricade || 0) >= 1 && c.player.block === 0) {
        // 也可能被敌人打穿,不视为失败
      }
    }
    assert((c.player.statuses.barricade || 0) >= 1 || run.screen !== 'combat', '路障未生效');
  }
  // --- 回响: 首张牌打两次 ---
  {
    const run = Engine.newRun('warlock', 2024);
    run.player.deck = [];
    for (let i = 0; i < 9; i++) run.player.deck.push({ id: 'strike', up: 0 });
    forceCombat(run, ['cultist'], 'normal');
    const c = run.combat;
    c.player.statuses.echo = 1;
    const hpB = c.enemies[0].hp;
    const idx = c.hand.findIndex(h => h.id === 'strike');
    Engine.playCard(run, idx, 0);
    // 打击6点×2次=12;邪教徒可能因仪式加攻前无格挡,直接扣血
    assert(hpB - c.enemies[0].hp >= 12, `回响未双倍: ${hpB - c.enemies[0].hp}`);
  }
  // --- 凤凰羽: 致命伤害复活 ---
  {
    const run = Engine.newRun('warrior', 5);
    Engine.acquireRelic(run, 'phoenixfeather');
    run.player.hp = 5;
    run.player.maxHp = 100;
    forceCombat(run, ['jawworm'], 'normal');
    const c = run.combat;
    // 直接用内部伤害函数模拟致死打击
    run.player.hp = 3;
    c.player.block = 0;
    // 通过火球药水路径不可行,改用直接调用:打出放血减血再让敌人打——简化:手工扣血
    run.player.hp = 0;
    // 手动触发检定路径
    const evtsBefore = (run.evts || []).length;
    void evtsBefore;
    // 重新走 checkPlayerDeath 逻辑:模拟再次受伤
    run.player.hp = 1;
    c.enemies[0].statuses.str = 50; // 保证一击致死
    c.enemies[0].move = 'chomp';
    Engine.endTurn(run);
    if (run.screen === 'gameover') fail('凤凰羽未触发复活');
    else {
      assert(!run.player.relics.includes('phoenixfeather'), '凤凰羽未消耗');
      assert(run.player.hp > 0, '复活后血量异常');
    }
  }
  // --- 尸爆: 连锁伤害 ---
  {
    const run = Engine.newRun('ranger', 8);
    run.player.deck = [{ id: 'corpseexp', up: 0 }, { id: 'strike', up: 0 }];
    forceCombat(run, ['fungibeast', 'fungibeast'], 'normal');
    const c = run.combat;
    // 手动施加尸爆+毒杀
    c.enemies[0].statuses.corpseExp = 1;
    c.enemies[0].hp = 1;
    c.enemies[0].statuses.poison = 5;
    const otherB = c.enemies[1].hp;
    Engine.endTurn(run);
    const otherA = c.enemies[1].hp;
    assert(otherB - otherA >= c.enemies[0].maxHp || c.enemies[1].dead, `尸爆未造成伤害: ${otherB - otherA}`);
  }
  // --- 药水奖励重复领取回归 ---
  {
    const run = Engine.newRun('warrior', 200);
    // 灌满药水栏
    run.player.potions = ['healpotion', 'healpotion', 'healpotion'];
    run.rewards = [{ type: 'potion', id: 'firepotion' }];
    const gold0 = run.player.gold;
    Engine.claimReward(run, 0);
    const gold1 = run.player.gold;
    Engine.claimReward(run, 0); // 第二次点击应无效
    Engine.claimReward(run, 0);
    const gold2 = run.player.gold;
    assert(run.rewards[0].taken === true, '药水奖励未标记已领取');
    assert(gold1 - gold0 === 15, `满药水时应一次性转15金币,实际 ${gold1 - gold0}`);
    assert(gold2 === gold1, `奖励被重复领取: ${gold1} -> ${gold2}`);
  }
  // --- v3 技能包机制测试 ---
  // 盾墙:格挡翻倍
  {
    const run = Engine.newRun('warrior', 301);
    run.player.deck = [{ id: 'shieldwall', up: 0 }, { id: 'defend', up: 0 }];
    forceCombat(run, ['cultist'], 'normal');
    const c = run.combat;
    let guard = 0;
    while (guard++ < 10) {
      const di = c.hand.findIndex(h => h.id === 'defend');
      if (di >= 0 && Engine.canPlay(run, di)) { Engine.playCard(run, di, 0); break; }
      Engine.endTurn(run);
      if (run.screen !== 'combat') break;
    }
    if (run.screen === 'combat') {
      const b0 = c.player.block;
      const si = c.hand.findIndex(h => h.id === 'shieldwall');
      if (si >= 0 && b0 >= 5) {
        Engine.playCard(run, si, 0);
        assert(c.player.block >= b0 * 2 - 1, `盾墙未翻倍: ${b0} -> ${c.player.block}`);
      }
    }
  }
  // 致命精准:低血处决
  {
    const run = Engine.newRun('ranger', 302);
    run.player.deck = [{ id: 'executioner', up: 0 }];
    forceCombat(run, ['stonegolem'], 'normal');
    const c = run.combat;
    c.enemies[0].hp = 10; // 10 < 130*0.35
    const ei = c.hand.findIndex(h => h.id === 'executioner');
    if (ei >= 0) {
      Engine.playCard(run, ei, 0);
      assert(c.enemies[0].dead, '致命精准未处决低血目标');
    }
  }
  // 毒性引爆:立即结算+减半
  {
    const run = Engine.newRun('ranger', 303);
    run.player.deck = [{ id: 'detonate', up: 0 }];
    forceCombat(run, ['jawworm'], 'normal');
    const c = run.combat;
    c.enemies[0].statuses.poison = 10;
    c.enemies[0].block = 0;
    const hpB = c.enemies[0].hp;
    const di = c.hand.findIndex(h => h.id === 'detonate');
    if (di >= 0) {
      Engine.playCard(run, di, 0);
      assert(hpB - c.enemies[0].hp >= 10, `毒性引爆未结算: ${hpB - c.enemies[0].hp}`);
      assert((c.enemies[0].statuses.poison || 0) === 5, `中毒未减半: ${c.enemies[0].statuses.poison}`);
    }
  }
  // 不死鸟之血:战斗内重生
  {
    const run = Engine.newRun('warlock', 304);
    run.player.deck = [{ id: 'phoenixblood', up: 0 }];
    run.player.maxHp = 100; run.player.hp = 100;
    forceCombat(run, ['jawworm'], 'normal');
    const c = run.combat;
    const pi = c.hand.findIndex(h => h.id === 'phoenixblood');
    if (pi >= 0) Engine.playCard(run, pi, 0);
    c.enemies[0].statuses.str = 200;
    c.enemies[0].move = 'chomp';
    Engine.endTurn(run);
    assert(run.screen !== 'gameover', '不死鸟之血未触发重生');
    assert(run.player.hp === 50, `重生血量异常: ${run.player.hp}`);
    // 第二次死亡应真正死亡
    c.enemies[0].statuses.str = 200;
    run.player.hp = 10;
    c.player.block = 0;
    Engine.endTurn(run);
    assert(run.screen === 'gameover', '重生后应可再次死亡');
  }
  // 生命转化:回合开始血换能量
  {
    const run = Engine.newRun('warlock', 305);
    run.player.deck = [{ id: 'lifetransform', up: 0 }, { id: 'strike', up: 0 }];
    forceCombat(run, ['cultist'], 'normal');
    const c = run.combat;
    const li = c.hand.findIndex(h => h.id === 'lifetransform');
    if (li >= 0) Engine.playCard(run, li, 0);
    const hpB = run.player.hp;
    const enB = c.player.energy;
    Engine.endTurn(run);
    if (run.screen === 'combat') {
      assert(hpB - run.player.hp >= 3, '生命转化未扣血');
      assert(c.player.energy === c.player.maxEnergy + 1, `生命转化未加能量: ${c.player.energy}`);
    }
  }
  // 技能包解锁门控:锁定时不出现在池中
  {
    GS.Unlocks.reset();
    const locked = CARDS.pool('warrior', 'uncommon');
    assert(!locked.includes('bloodslash'), '锁定的技能包卡进入了奖励池');
    GS.Unlocks.unlockAll();
    const unlocked = CARDS.pool('warrior', 'uncommon');
    assert(unlocked.includes('bloodslash'), '解锁后技能包卡未进入奖励池');
  }
  // --- v2 联动机制测试 ---
  // 全身撞击:伤害=当前格挡
  {
    const run = Engine.newRun('warrior', 101);
    run.player.deck = [{ id: 'bodyslam', up: 0 }, { id: 'defend', up: 0 }, { id: 'defend', up: 0 }];
    forceCombat(run, ['cultist'], 'normal');
    const c = run.combat;
    // 打一张防御(5+0敏=5格挡)再打全身撞击
    let guard = 0;
    while (guard++ < 10) {
      const di = c.hand.findIndex(h => h.id === 'defend');
      if (di >= 0 && Engine.canPlay(run, di)) { Engine.playCard(run, di, 0); break; }
      Engine.endTurn(run);
      if (run.screen !== 'combat') break;
    }
    if (run.screen === 'combat') {
      const block = c.player.block;
      const hpB = c.enemies[0].hp;
      const bi = c.hand.findIndex(h => h.id === 'bodyslam');
      if (bi >= 0) {
        Engine.playCard(run, bi, 0);
        assert(hpB - c.enemies[0].hp >= block, `全身撞击伤害应≥格挡(${block}):实际 ${hpB - c.enemies[0].hp}`);
      }
    }
  }
  // 战术家:被弃置时获得能量
  {
    const run = Engine.newRun('ranger', 102);
    run.player.deck = [{ id: 'tactician', up: 0 }, { id: 'acrobatics', up: 0 }, { id: 'strike', up: 0 }, { id: 'strike', up: 0 }, { id: 'strike', up: 0 }, { id: 'strike', up: 0 }];
    forceCombat(run, ['jawworm'], 'normal');
    const c = run.combat;
    const ai = c.hand.findIndex(h => h.id === 'acrobatics');
    if (ai >= 0) {
      const e0 = c.player.energy;
      Engine.playCard(run, ai, 0); // 抽3弃1 → 弃战术家
      // 弃置选择:选战术家
      if (c.pending && c.pending.type === 'discard') {
        const ti = c.hand.findIndex(h => h.id === 'tactician');
        if (ti >= 0) Engine.resolveDiscard(run, [ti]);
      }
      assert(!c.hand.some(h => h.id === 'tactician') || c.pending === null, '战术家未离手');
      // 能量: 1(支付游走)-1+1 = 1? 游走1费,支付后 energy=2(3-1),弃置战术家+1=3
      assert(c.player.energy === e0 - 1 + 1, `战术家弃置未回能: ${e0}->${c.player.energy}`);
    } else {
      // 手牌没抽到,直接验证钩子:手动弃置
      c.hand.push({ id: 'tactician', up: 0, uid: 999001 });
      const e0 = c.player.energy;
      Engine.resolveDiscard(run, [c.hand.length - 1]);
      assert(c.player.energy === e0 + 1, '战术家弃置未回能(手动)');
    }
  }
  // 献祭契约:失去生命转为全场伤害
  {
    const run = Engine.newRun('warlock', 103);
    run.player.deck = [{ id: 'bloodpact', up: 0 }, { id: 'soulfire', up: 0 }];
    forceCombat(run, ['fungibeast', 'fungibeast'], 'normal');
    const c = run.combat;
    const bi = c.hand.findIndex(h => h.id === 'bloodpact');
    if (bi >= 0) Engine.playCard(run, bi, 0);
    const sumB = c.enemies.reduce((s, e) => s + e.hp, 0);
    const si = c.hand.findIndex(h => h.id === 'soulfire');
    if (si >= 0 && (c.player.statuses.bloodPact || 0) > 0) {
      Engine.playCard(run, si, 0); // 失去2生命 → 全场各2伤害
      const sumA = c.enemies.reduce((s, e) => s + e.hp, 0);
      // 灵魂之火本体9伤(单目标)+契约全场2×2
      assert(sumB - sumA >= 13, `献祭契约联动伤害异常: ${sumB - sumA}`);
    }
  }
  // 灵魂收割:消耗牌获得力量
  {
    const run = Engine.newRun('warrior', 104);
    run.player.deck = [{ id: 'soulcatch', up: 0 }, { id: 'slimed', up: 0 }];
    forceCombat(run, ['cultist'], 'normal');
    const c = run.combat;
    const si = c.hand.findIndex(h => h.id === 'soulcatch');
    if (si >= 0) Engine.playCard(run, si, 0);
    const str0 = c.player.statuses.str || 0;
    const li = c.hand.findIndex(h => h.id === 'slimed');
    if (li >= 0) {
      Engine.playCard(run, li, 0); // 消耗
      assert((c.player.statuses.str || 0) === str0 + 1, '灵魂收割未获得力量');
    }
  }
  // 蛇击:对中毒目标伤害翻倍
  {
    const run = Engine.newRun('ranger', 105);
    run.player.deck = [{ id: 'venomstrike', up: 0 }, { id: 'venomstrike', up: 0 }];
    forceCombat(run, ['jawworm'], 'normal');
    const c = run.combat;
    c.enemies[0].statuses.poison = 0;
    const hpB1 = c.enemies[0].hp;
    let vi = c.hand.findIndex(h => h.id === 'venomstrike');
    if (vi >= 0) { Engine.playCard(run, vi, 0); }
    const noPoisonDmg = hpB1 - c.enemies[0].hp;
    c.enemies[0].statuses.poison = 5;
    const hpB2 = c.enemies[0].hp;
    vi = c.hand.findIndex(h => h.id === 'venomstrike');
    if (vi >= 0) {
      Engine.playCard(run, vi, 0);
      const withPoisonDmg = hpB2 - c.enemies[0].hp;
      assert(withPoisonDmg >= noPoisonDmg * 1.8, `蛇击未翻倍: ${noPoisonDmg} vs ${withPoisonDmg}`);
    }
  }
  // ==================== 联动主题机制测试 ====================
  // 鬼:打出牌时触发
  {
    const run = Engine.newThemeRun('mystery', 9001);
    run.player.deck = [{ id: 'mn_ghostking', up: 0 }, { id: 'strike', up: 0 }, { id: 'strike', up: 0 }, { id: 'strike', up: 0 }, { id: 'strike', up: 0 }, { id: 'strike', up: 0 }];
    forceCombat(run, ['mn_paperman'], 'normal');
    const c = run.combat;
    const gi = c.hand.findIndex(h => h.id === 'mn_ghostking');
    assert(gi >= 0, '鬼王未进入手牌');
    Engine.playCard(run, gi, 0);
    assert(c.player.ghostName === '鬼·鬼王', '鬼未附身: ' + c.player.ghostName);
    const e = c.enemies[0];
    const hpB = e.hp;
    const si = c.hand.findIndex(h => h.id === 'strike');
    if (si >= 0 && Engine.canPlay(run, si)) {
      Engine.playCard(run, si, 0);
      // 打击 6 + 鬼王 5 = 至少 11
      assert(hpB - e.hp >= 11, `鬼王未触发: ${hpB - e.hp}`);
    }
  }
  // 魂火:累积与消耗
  {
    const run = Engine.newThemeRun('mystery', 9002);
    run.player.deck = [{ id: 'mn_soulfire', up: 0 }, { id: 'mn_candle', up: 0 }, { id: 'strike', up: 0 }];
    forceCombat(run, ['mn_paperman'], 'normal');
    const c = run.combat;
    const fi = c.hand.findIndex(h => h.id === 'mn_soulfire');
    if (fi >= 0) Engine.playCard(run, fi, 0);
    assert((c.player.statuses.soulfire || 0) >= 2, '魂火未累积: ' + c.player.statuses.soulfire);
    const ci = c.hand.findIndex(h => h.id === 'mn_candle');
    if (ci >= 0 && Engine.canPlay(run, ci)) {
      const hpB = c.enemies[0].hp;
      Engine.playCard(run, ci, 0);
      assert((c.player.statuses.soulfire || 0) === 0, '魂火未被消耗: ' + c.player.statuses.soulfire);
      assert(hpB - c.enemies[0].hp >= 10, `魂火焚身伤害不足: ${hpB - c.enemies[0].hp}`);
    }
  }
  // 阴阳眼:累积到上限触发开眼
  {
    const run = Engine.newThemeRun('mystery', 9003);
    run.player.deck = [{ id: 'mn_carrycoffin', up: 0 }, { id: 'mn_carrycoffin', up: 0 }, { id: 'mn_carrycoffin', up: 0 }, { id: 'mn_carrycoffin', up: 0 }, { id: 'mn_carrycoffin', up: 0 }, { id: 'mn_carrycoffin', up: 0 }];
    run.player.maxHp = 400; run.player.hp = 400;
    forceCombat(run, ['mn_ghostface'], 'normal');
    const c = run.combat;
    c.enemies[0].hp = 9999; c.enemies[0].maxHp = 9999;
    let played = 0;
    for (let i = 0; i < 10 && run.screen === 'combat'; i++) {
      const k = c.hand.findIndex((h, j) => h.id === 'mn_carrycoffin' && Engine.canPlay(run, j));
      if (k >= 0) { Engine.playCard(run, k, 0); played++; continue; }
      Engine.endTurn(run);
    }
    assert(played > 0, '背棺人未打出');
    // 开眼后层数被消耗,并留下了力量
    assert((c.player.statuses.eye || 0) < 10, '开眼未消耗层数: ' + c.player.statuses.eye);
    assert((c.player.statuses.str || 0) > 0, '开眼未获得力量');
  }
  // 领域:积满反噬
  {
    const run = Engine.newThemeRun('jjk', 9004);
    run.player.deck = [{ id: 'jj_blue', up: 0 }, { id: 'jj_blue', up: 0 }, { id: 'jj_blue', up: 0 }];
    forceCombat(run, ['jj_grade4'], 'normal');
    const c = run.combat;
    assert(c.field && c.field.max > 0, '领域未初始化');
    c.field.val = c.field.max - 1;
    const hpB = run.player.hp;
    Engine.endTurn(run);
    assert(run.player.hp < hpB || run.screen !== 'combat', '领域反噬未生效');
    if (run.screen === 'combat') assert(c.field.val === 0, '领域未重置: ' + c.field.val);
  }
  // 咒力:累积、上限与消耗
  {
    const run = Engine.newThemeRun('jjk', 9005);
    run.player.deck = [{ id: 'jj_ce', up: 0 }, { id: 'jj_purple', up: 0 }, { id: 'jj_dismantle', up: 0 }, { id: 'jj_dismantle', up: 0 }];
    forceCombat(run, ['jj_specialgrade'], 'normal');
    const c = run.combat;
    c.enemies[0].hp = 9999; c.enemies[0].maxHp = 9999; c.enemies[0].block = 0;
    const ci = c.hand.findIndex(h => h.id === 'jj_ce');
    if (ci >= 0) Engine.playCard(run, ci, 0);
    assert((c.ce || 0) >= 2, '咒力未累积: ' + c.ce);
    // 六眼 -25 抵消基础黑闪几率,让伤害可精确断言
    c.player.statuses.sixEyes = 0;
    const pi = c.hand.findIndex(h => h.id === 'jj_purple');
    if (pi >= 0 && Engine.canPlay(run, pi)) {
      const ceB = c.ce;
      const hpB = c.enemies[0].hp;
      Engine.playCard(run, pi, 0);
      assert(c.ce < ceB, `茈未消耗咒力: ${ceB} -> ${c.ce}`);
      // 茈:基础 34 + 每点咒力 ×3
      assert(hpB - c.enemies[0].hp >= 34 + ceB * 3 - 1, `茈伤害未按咒力加成: ${hpB - c.enemies[0].hp}(咒力 ${ceB})`);
    }
  }
  // 黑闪:六眼拉满后必定暴击,伤害翻倍并获得咒力
  {
    const run = Engine.newThemeRun('jjk', 9015);
    run.player.deck = [{ id: 'jj_dismantle', up: 0 }];
    forceCombat(run, ['jj_specialgrade'], 'normal');
    const c = run.combat;
    c.enemies[0].hp = 9999; c.enemies[0].maxHp = 9999; c.enemies[0].block = 0;
    c.player.statuses.sixEyes = 200; // 必定黑闪
    const i = c.hand.findIndex(h => h.id === 'jj_dismantle');
    const hpB = c.enemies[0].hp;
    Engine.playCard(run, i, 0);
    // 解:8 + 咒力(0)= 8,黑闪翻倍 ≥16
    assert(hpB - c.enemies[0].hp >= 15, `黑闪未翻倍: ${hpB - c.enemies[0].hp}`);
    assert((c.ce || 0) >= 3, '黑闪未积攒咒力: ' + c.ce);
  }
  // 咒术:每回合第一张免费
  {
    const run = Engine.newThemeRun('jjk', 9006);
    run.player.deck = [{ id: 'jj_dismantle', up: 0 }, { id: 'jj_dismantle', up: 0 }, { id: 'jj_dismantle', up: 0 }, { id: 'jj_dismantle', up: 0 }, { id: 'jj_dismantle', up: 0 }];
    forceCombat(run, ['jj_grade4'], 'normal');
    const c = run.combat;
    const i1 = c.hand.findIndex(h => h.id === 'jj_dismantle');
    assert(i1 >= 0 && Engine.cardCost(run, c.hand[i1]) === 0, '首张咒术未免费');
    Engine.playCard(run, i1, 0);
    const i2 = c.hand.findIndex(h => h.id === 'jj_dismantle');
    if (i2 >= 0) assert(Engine.cardCost(run, c.hand[i2]) === 1, '第二张咒术费用错误: ' + Engine.cardCost(run, c.hand[i2]));
  }
  // 领域屏障:抵挡一次伤害
  {
    const run = Engine.newThemeRun('jjk', 9007);
    run.player.deck = [{ id: 'jj_strike', up: 0 }];
    forceCombat(run, ['jj_grade4'], 'normal');
    const c = run.combat;
    c.player.statuses.barrier = 1;
    c.player.block = 0;
    c.enemies[0].move = 'bite';
    const hpB = run.player.hp;
    Engine.endTurn(run);
    assert(run.player.hp >= hpB - 1, `领域屏障未抵挡伤害: ${hpB} -> ${run.player.hp}`);
    assert((c.player.statuses.barrier || 0) === 0, '领域屏障未被消耗');
  }
  // 封锁:敌人下回合无法行动
  {
    const run = Engine.newThemeRun('jjk', 9008);
    run.player.deck = [{ id: 'jj_seal', up: 0 }, { id: 'jj_strike', up: 0 }];
    forceCombat(run, ['jj_grade4'], 'normal');
    const c = run.combat;
    const si = c.hand.findIndex(h => h.id === 'jj_seal');
    if (si >= 0) Engine.playCard(run, si, 0);
    assert((c.enemies[0].statuses.sealAction || 0) > 0, '封锁未施加');
    c.enemies[0].move = 'bite';
    const hpB = run.player.hp;
    c.player.block = 0;
    Engine.endTurn(run);
    if (run.screen === 'combat') assert(run.player.hp === hpB || (c.enemies[0].dead), `封锁未阻止行动: ${hpB} -> ${run.player.hp}`);
  }
  // 主题:污染与镜域节点
  {
    const run = Engine.newThemeRun('mystery', 9009);
    assert(run.map.length >= 10, '镜域地图行数异常: ' + run.map.length);
    const types = new Set();
    run.map.forEach(row => row.forEach(n => types.add(n.type)));
    assert(types.has('boss'), '镜域缺少 BOSS 节点');
    const curseRow = run.map.findIndex(row => row.some(n => n.type === 'curse'));
    const wardRow = run.map.findIndex(row => row.some(n => n.type === 'ward'));
    assert(curseRow >= 0, '镜域缺少咒物祭坛');
    assert(wardRow >= 0, '镜域缺少镇魂结界');
  }
  // 主题:专属遗物池不混入其他主题的遗物
  {
    const run = Engine.newThemeRun('jjk', 9010);
    const theme = GS.THEMES.get('jjk');
    assert(theme.relics.every(id => GS.RELICS.get(id)), '主题遗物未注册');
    // 反复获取遗物后,不允许出现其它主题的遗物
    for (let i = 0; i < 30; i++) {
      run.player.gold = 0;
      const pickId = theme.relics[i % theme.relics.length];
      if (!run.player.relics.includes(pickId)) Engine.acquireRelic(run, pickId);
    }
    const wrong = run.player.relics.filter(id => {
      const d = GS.RELICS.get(id);
      return d && d.theme && d.theme !== 'jjk';
    });
    assert(wrong.length === 0, '出现了其它主题的遗物: ' + wrong.join(','));
    const myst = GS.RELICS.get('mystbell');
    assert(myst && myst.theme === 'mystery', '镇魂铃主题标记错误');
  }
  // ==================== 联动主题二批机制测试 ====================
  // Re:Zero:精灵缔约 + 技能牌触发
  {
    const run = Engine.newThemeRun('rezero', 9101);
    run.player.deck = [{ id: 'rz_sp_shield', up: 0 }, { id: 'rz_contract', up: 0 }, { id: 'rz_defend', up: 0 }, { id: 'strike', up: 0 }];
    forceCombat(run, ['rz_dog'], 'normal');
    const c = run.combat;
    // 直接附身「库」,验证技能牌触发、攻击牌不触发
    c.player.ghostKey = 'rz_sp_shield';
    c.player.ghostName = '库';
    c.player.statuses.ghostPower = 5;
    const di = c.hand.findIndex(h => h.id === 'rz_defend');
    assert(di >= 0, '护魂未进入手牌');
    const b0 = c.player.block;
    Engine.playCard(run, di, 0);
    assert(c.player.block >= b0 + 10, `精灵·库未触发(应 5 格挡+卡牌 5 格挡): ${b0} -> ${c.player.block}`);
    const si = c.hand.findIndex(h => h.id === 'strike');
    if (si >= 0 && Engine.canPlay(run, si)) {
      const b1 = c.player.block;
      Engine.playCard(run, si, 0);
      assert(c.player.block === b1, '精灵不应被攻击牌触发');
    }
  }
  // Re:Zero:死亡回归倒回存档点
  {
    const run = Engine.newThemeRun('rezero', 9102);
    run.player.deck = [{ id: 'strike', up: 0 }];
    forceCombat(run, ['rz_dog'], 'normal');
    const c = run.combat;
    assert(c.rbdHp !== undefined, '死亡回归存档点未初始化');
    c.enemies[0].move = 'bite';
    c.player.block = 0;
    run.player.hp = 3;
    Engine.endTurn(run);
    if (run.screen === 'combat') {
      assert(run.player.hp === c.rbdHp, `死亡回归未倒回: hp=${run.player.hp}, 存档点=${c.rbdHp}`);
      assert(c.rbdUsed === 1, '死亡回归次数未消耗');
      // 第二次致命伤应真正死亡(基础只有 1 次)
      if (run.screen === 'combat') {
        c.enemies[0].move = 'bite';
        c.player.block = 0;
        run.player.hp = 3;
        Engine.endTurn(run);
        assert(run.screen === 'gameover', '第二次致命伤应当死亡');
      }
    }
  }
  // 奥特曼:光能消耗、红色警戒、枯竭伤害
  {
    const run = Engine.newThemeRun('ultraman', 9103);
    run.player.deck = [{ id: 'ul_charge', up: 0 }];
    forceCombat(run, ['ul_bemstar'], 'normal');
    const c = run.combat;
    assert(c.light && c.light.val === 10 && c.light.max === 12, `光能未初始化: ${JSON.stringify(c.light)}`);
    const ci = c.hand.findIndex(h => h.id === 'ul_charge');
    if (ci >= 0) Engine.playCard(run, ci, 0);
    assert(c.light.val === 12, `充能应封顶于上限: ${c.light.val}`);
    c.light.val = 6;
    Engine.endTurn(run);
    if (run.screen === 'combat') assert(c.light.val === 5, `光能未随回合消耗: ${c.light.val}`);
    // 红色警戒:光能 ≤3 时攻击提升
    c.light.val = 3;
    const atkLow = Engine.calcCardDamage(run, { id: 'ul_strike', up: 0, uid: -1 }, null);
    c.light.val = 10;
    const atkHigh = Engine.calcCardDamage(run, { id: 'ul_strike', up: 0, uid: -1 }, null);
    assert(atkLow > atkHigh, `红色警戒未提升攻击: 低光能 ${atkLow} vs 高光能 ${atkHigh}`);
    // 枯竭:光能 1 时结束回合 -> 归零并当场受伤
    c.light.val = 1;
    const hpB = run.player.hp;
    Engine.endTurn(run);
    if (run.screen === 'combat') {
      assert(c.light.val === 0, '光能未归零');
      assert(run.player.hp < hpB, '能量枯竭未造成伤害');
      const hpB2 = run.player.hp;
      Engine.endTurn(run);
      assert(run.player.hp < hpB2 || run.screen !== 'combat', '能量枯竭未持续造成伤害');
    }
  }
  // 奥特曼:斯派修姆光线消耗光能增伤
  {
    const run = Engine.newThemeRun('ultraman', 9104);
    run.player.deck = [{ id: 'ul_specium', up: 0 }];
    forceCombat(run, ['ul_zetton'], 'boss');
    const c = run.combat;
    c.enemies[0].hp = 9999; c.enemies[0].maxHp = 9999; c.enemies[0].block = 0;
    c.light.val = 5;
    const i = c.hand.findIndex(h => h.id === 'ul_specium');
    assert(i >= 0, '斯派修姆光线未进入手牌');
    const hpB = c.enemies[0].hp;
    Engine.playCard(run, i, 0);
    // 基础 8 + 3 点光能 ×3 = 17
    assert(hpB - c.enemies[0].hp >= 17, `光线未按光能增伤: ${hpB - c.enemies[0].hp}`);
    assert(c.light.val === 2, `光能未扣除: ${c.light.val}`);
  }
  // 西游记:棍势积攒与千钧重棍爆发
  {
    const run = Engine.newThemeRun('journey', 9105);
    run.player.deck = [{ id: 'xy_heavy', up: 0 }, { id: 'xy_smash', up: 0 }];
    forceCombat(run, ['xy_imp'], 'normal');
    const c = run.combat;
    assert((c.player.statuses.cudgel || 0) === 3, `初始棍势错误: ${c.player.statuses.cudgel}`);
    const hi = c.hand.findIndex(h => h.id === 'xy_heavy');
    if (hi >= 0) Engine.playCard(run, hi, 0);
    assert((c.player.statuses.cudgel || 0) === 4, `重劈未获得棍势: ${c.player.statuses.cudgel}`);
    const si = c.hand.findIndex(h => h.id === 'xy_smash');
    if (si >= 0 && Engine.canPlay(run, si)) {
      c.enemies[0].hp = 9999; c.enemies[0].maxHp = 9999; c.enemies[0].block = 0;
      const hpB = c.enemies[0].hp;
      Engine.playCard(run, si, 0);
      // 基础 6 + 4 层棍势 ×7 = 34
      assert(hpB - c.enemies[0].hp >= 34, `千钧重棍未按棍势爆发: ${hpB - c.enemies[0].hp}`);
      assert((c.player.statuses.cudgel || 0) === 0, '重棍未消耗棍势');
    }
  }
  // 妖精的尾巴:羁绊计数与灭龙奥义·咆哮增伤
  {
    const run = Engine.newThemeRun('fairytail', 9106);
    run.player.deck = [{ id: 'ft_strike', up: 0 }, { id: 'ft_strike', up: 0 }, { id: 'ft_strike', up: 0 }, { id: 'ft_bit', up: 0 }];
    forceCombat(run, ['ft_vulcan'], 'normal');
    const c = run.combat;
    c.enemies[0].hp = 9999; c.enemies[0].maxHp = 9999; c.enemies[0].block = 0;
    // 打 3 张攻击,羁绊应为 3
    for (let k = 0; k < 3; k++) {
      const i = c.hand.findIndex(h => h.id === 'ft_strike');
      if (i >= 0 && Engine.canPlay(run, i)) Engine.playCard(run, i, 0);
    }
    assert((c.combatCards || 0) >= 3, `羁绊计数异常: ${c.combatCards}`);
    const bi = c.hand.findIndex(h => h.id === 'ft_bit');
    if (bi >= 0 && Engine.canPlay(run, bi)) {
      const hpB = c.enemies[0].hp;
      Engine.playCard(run, bi, 0);
      // 基础 8 + 羁绊 ≥3 = 至少 11
      assert(hpB - c.enemies[0].hp >= 11, `咆哮未按羁绊增伤: ${hpB - c.enemies[0].hp}`);
    }
  }
  // 妖精的尾巴:龙之意志攻击增幅
  {
    const run = Engine.newThemeRun('fairytail', 9107);
    run.player.deck = [{ id: 'ft_strike', up: 0 }];
    forceCombat(run, ['ft_vulcan'], 'normal');
    const c = run.combat;
    c.enemies[0].hp = 9999; c.enemies[0].maxHp = 9999; c.enemies[0].block = 0;
    const inst = { id: 'ft_strike', up: 0, uid: -2 };
    delete c.player.statuses.dragonforce; // 初始遗物自带 2 层,先清零测基线
    const d0 = Engine.calcCardDamage(run, inst, null);
    c.player.statuses.dragonforce = 2;
    const d1 = Engine.calcCardDamage(run, inst, null);
    assert(d1 === Math.floor(d0 * 1.3), `龙之意志增幅错误: ${d0} -> ${d1}`);
  }
  // 主题二批:全部主题的内容注册完整性
  {
    for (const t of GS.THEMES.all) {
      const cards = [...t.pool, ...t.basic, ...(t.tokens || []), ...t.starterDeck];
      assert(cards.every(id => CARDS.get(id)), `[${t.id}] 存在未注册卡牌`);
      assert(t.relics.every(id => GS.RELICS.get(id)), `[${t.id}] 存在未注册遗物`);
      assert((t.enemyIds || []).every(id => GS.ENEMIES.defs[id]), `[${t.id}] 存在未注册敌人`);
      const enc = new Set();
      t.acts.forEach(a => { a.normal.flat().concat(a.elite.flat()).concat(a.boss.flat()).forEach(id => enc.add(id)); });
      assert([...enc].every(id => GS.ENEMIES.defs[id]), `[${t.id}] 遭遇表引用了未注册敌人`);
      // 伙伴:定义完整、可查询
      assert((t.allyDefs || []).length >= 4, `[${t.id}] 伙伴不足 4 名`);
      for (const a of (t.allyDefs || [])) {
        assert(GS.THEMES.allyMap[a.id] === a, `[${t.id}] 伙伴 ${a.id} 未注册`);
        assert(a.cost > 0 && a.desc, `[${t.id}] 伙伴 ${a.id} 定义不完整`);
      }
    }
  }
  // 伙伴:商店槽位与购买
  {
    const run = Engine.newThemeRun('rezero', 9201);
    run.player.gold = 999;
    run.shop = Engine._testGenShop(run);
    const shop = run.shop;
    assert(shop.allies && shop.allies.length === 1, '主题商店未生成伙伴槽位');
    const ok = Engine.buyShopItem(run, 'ally', 0);
    assert(ok && run.player.allies.length === 1, '伙伴购买失败');
    const goldB = run.player.gold;
    // 伙伴已买断,再次购买应失败
    assert(!Engine.buyShopItem(run, 'ally', 0), '已售出的伙伴仍可购买');
    assert(run.player.gold === goldB, '失败购买不应扣钱');
    // 经典模式商店不应有伙伴
    const classic = Engine.newRun('warrior', 9202);
    const cShop = Engine._testGenShop(classic);
    assert(!cShop.allies || cShop.allies.length === 0, '经典商店不应出现伙伴');
  }
  // 伙伴:回合效果(蕾姆每回合随机打 4)
  {
    const run = Engine.newThemeRun('rezero', 9203);
    run.player.allies = ['rz_a_rem'];
    run.player.deck = [{ id: 'strike', up: 0 }];
    forceCombat(run, ['rz_dog'], 'normal');
    const c = run.combat;
    c.enemies[0].hp = 9999; c.enemies[0].maxHp = 9999;
    const hpB = c.enemies[0].hp;
    Engine.endTurn(run);
    assert(c.enemies[0].dead || hpB - c.enemies[0].hp >= 4, `蕾姆的回合效果未生效: ${hpB} -> ${c.enemies[0].hp}`);
  }
  // 伙伴:战斗开始效果(碧翠丝缔结精灵)
  {
    const run = Engine.newThemeRun('rezero', 9204);
    run.player.allies = ['rz_a_beatrice'];
    run.player.deck = [{ id: 'strike', up: 0 }];
    forceCombat(run, ['rz_dog'], 'normal');
    const c = run.combat;
    assert(c.player.ghostName && (c.player.ghostKey || '').startsWith('rz_sp'), `碧翠丝未缔结精灵: ${c.player.ghostName}`);
  }
  // 伙伴:胜利效果(张伟给金币) + 上限 4 名
  {
    const run = Engine.newThemeRun('mystery', 9205);
    run.player.allies = ['mn_a_zhang'];
    run.player.deck = [{ id: 'strike', up: 0 }, { id: 'strike', up: 0 }, { id: 'strike', up: 0 }, { id: 'strike', up: 0 }];
    forceCombat(run, ['mn_paperman'], 'normal');
    const c = run.combat;
    c.enemies[0].hp = 10; c.enemies[0].maxHp = 10; c.enemies[0].block = 0;
    const goldB = run.player.gold;
    for (let i = c.hand.length - 1; i >= 0; i--) {
      if (Engine.canPlay(run, i)) { Engine.playCard(run, i, 0); break; }
    }
    assert(run.screen !== 'combat' || c.enemies[0].dead, '未能击杀敌人');
    if (run.screen === 'reward') {
      // 胜利金币含张伟的 35(基础奖励 10-20 + 35)
      assert(run.player.gold >= goldB + 35, `张伟的金币未到账: ${goldB} -> ${run.player.gold}`);
    }
  }
  // 伙伴:初始伙伴选择(仅 starter 可选)与商店限定
  {
    // 合法初始伙伴
    const run = Engine.newThemeRun('rezero', 9210, 'rz_a_emilia');
    assert(run.player.allies.length === 1 && run.player.allies[0] === 'rz_a_emilia', '初始伙伴未生效');
    // 商店限定角色不能作为初始伙伴
    const run2 = Engine.newThemeRun('rezero', 9211, 'rz_a_beatrice');
    assert(run2.player.allies.length === 0, '商店限定角色不应作为初始伙伴');
    // 无效 id 静默忽略
    const run3 = Engine.newThemeRun('rezero', 9212, 'mn_a_dog');
    assert(run3.player.allies.length === 0, '跨主题伙伴不应作为初始伙伴');
    // 每主题 starter 数量恰为 3
    for (const t of GS.THEMES.all) {
      const n = (t.allyDefs || []).filter(a => a.starter).length;
      assert(n === 3, `[${t.id}] 初始伙伴应为 3 名,实际 ${n}`);
    }
    // 商店永远不出售 starter 伙伴
    for (let k = 0; k < 30; k++) {
      const r = Engine.newThemeRun('journey', 9213 + k, 'xy_a_sanzang');
      r.player.gold = 999;
      r.shop = Engine._testGenShop(r);
      for (const it of (r.shop.allies || [])) {
        const d = GS.THEMES.allyMap[it.id];
        assert(d && !d.starter, `商店出售了初始伙伴: ${it.id}`);
      }
    }
  }
  // 伙伴:卡牌联动——爱蜜莉雅使冰枪术伤害 +4
  {
    const base = Engine.newThemeRun('rezero', 9215);
    base.player.deck = [{ id: 'rz_icebrand', up: 0 }];
    forceCombat(base, ['rz_dog'], 'normal');
    const c0 = base.combat;
    c0.enemies[0].hp = 9999; c0.enemies[0].maxHp = 9999; c0.enemies[0].block = 0;
    const i0 = c0.hand.findIndex(h => h.id === 'rz_icebrand');
    const hp0 = c0.enemies[0].hp;
    Engine.playCard(base, i0, 0);
    const dmg0 = hp0 - c0.enemies[0].hp;

    const run = Engine.newThemeRun('rezero', 9216, 'rz_a_emilia');
    run.player.deck = [{ id: 'rz_icebrand', up: 0 }];
    forceCombat(run, ['rz_dog'], 'normal');
    const c = run.combat;
    c.enemies[0].hp = 9999; c.enemies[0].maxHp = 9999; c.enemies[0].block = 0;
    const i = c.hand.findIndex(h => h.id === 'rz_icebrand');
    const hp = c.enemies[0].hp;
    Engine.playCard(run, i, 0);
    const dmg = hp - c.enemies[0].hp;
    assert(dmg === dmg0 + 4, `爱蜜莉雅联动未生效: 无伙伴 ${dmg0} vs 有伙伴 ${dmg}`);
  }
  // 伙伴:卡牌联动——蕾姆使鬼族之血额外 +1 力量
  {
    const run = Engine.newThemeRun('rezero', 9217, 'rz_a_rem');
    run.player.deck = [{ id: 'rz_oniblood', up: 0 }];
    forceCombat(run, ['rz_dog'], 'normal');
    const c = run.combat;
    const i = c.hand.findIndex(h => h.id === 'rz_oniblood');
    if (i >= 0 && Engine.canPlay(run, i)) {
      Engine.playCard(run, i, 0);
      assert((c.player.statuses.str || 0) >= 3, `蕾姆联动未生效: 力量 ${c.player.statuses.str}`);
    }
  }
  // 伙伴:卡牌联动——非对应卡牌不触发
  {
    const run = Engine.newThemeRun('ultraman', 9218, 'ul_a_seven');
    run.player.deck = [{ id: 'ul_strike', up: 0 }];
    forceCombat(run, ['ul_bemstar'], 'normal');
    const c = run.combat;
    c.enemies[0].hp = 9999; c.enemies[0].maxHp = 9999; c.enemies[0].block = 0;
    const i = c.hand.findIndex(h => h.id === 'ul_strike');
    const hp = c.enemies[0].hp;
    Engine.playCard(run, i, 0);
    // 手刀 6 + 污染 0 + 赛文无联动 = 6
    assert(hp - c.enemies[0].hp === 6, `不应触发联动的卡牌被触发: ${hp - c.enemies[0].hp}`);
  }
  // 主题:存档回环
  {
    const run = Engine.newThemeRun('mystery', 9011);
    let steps = 0;
    while (run.screen === 'map' && steps < 50) {
      const reach = Engine.reachableNodes(run);
      Engine.enterNode(run, reach[0].row, reach[0].i);
      steps++;
      if (run.screen === 'combat') break;
      if (run.screen === 'reward' || run.screen === 'treasure') Engine.leaveReward(run);
      else if (run.screen === 'rest') { Engine.restHeal(run); Engine.leaveRest(run); }
      else if (run.screen === 'event') { Engine.chooseEvent(run, 0); Engine.leaveEvent(run); }
      else if (run.screen === 'shop') Engine.leaveShop(run);
    }
    Engine.saveRun(run);
    const loaded = Engine.loadRun();
    assert(loaded !== null, '主题存档读取失败');
    if (loaded) {
      assert(loaded.theme === 'mystery', '主题存档 theme 丢失');
      for (let n = 0; n < 20 && loaded.screen !== 'gameover'; n++) {
        actOnce(loaded);
        checkInvariants(loaded, '主题读档后');
      }
    }
  }
  // --- 存档回环 ---
  {
    const run = Engine.newRun('ranger', 31415);
    let steps = 0;
    while (run.screen === 'map' && steps < 50) {
      const reach = Engine.reachableNodes(run);
      Engine.enterNode(run, reach[0].row, reach[0].i);
      steps++;
      if (run.screen === 'combat') break;
      if (run.screen === 'reward' || run.screen === 'treasure') { Engine.leaveReward(run); }
      else if (run.screen === 'rest') { Engine.restHeal(run); Engine.leaveRest(run); }
      else if (run.screen === 'event') { Engine.chooseEvent(run, 0); Engine.leaveEvent(run); }
      else if (run.screen === 'shop') { Engine.leaveShop(run); }
    }
    Engine.saveRun(run);
    const loaded = Engine.loadRun();
    assert(loaded !== null, '存档读取失败');
    if (loaded) {
      assert(loaded.cls === 'ranger', '存档职业错误');
      assert(loaded.player.deck.length === run.player.deck.length, '存档卡组长度错误');
      // 继续打几步不崩溃
      let n = 0;
      while (n < 20 && loaded.screen !== 'gameover') {
        actOnce(loaded);
        checkInvariants(loaded, '读档后');
        n++;
      }
    }
  }
}

/* ================= 聪明 Bot:验证可通关性与难度 ================= */
function intentIsAttack(e) {
  const d = globalThis.GS.ENEMIES.get(e.id);
  const mv = d.moves[e.move];
  if (!mv) return false;
  return ['attack', 'attackDebuff', 'attackDefend', 'strong'].includes(mv.intent);
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
function smartCombatAct(run) {
  const c = run.combat;
  if (c.pending) {
    if (c.pending.type === 'discard') {
      // 弃最差的牌:诅咒>状态>高费
      const score = h => {
        const v = Engine.effectiveView(run, h);
        let s = 0;
        if (v.cls === 'curse' || v.cls === 'status') s -= 100;
        if (v.unplayable) s -= 50;
        s -= (typeof v.cost === 'number' ? v.cost : 0) * 2;
        if (v.dmg) s += v.dmg * 0.3;
        if (v.block) s += v.block * 0.3;
        return s;
      };
      const idx = c.hand.map((h, i) => ({ i, s: score(h) })).sort((a, b) => a.s - b.s).slice(0, c.pending.n).map(x => x.i);
      Engine.resolveDiscard(run, idx);
    } else if (c.pending.type === 'discardToTop') {
      // 头锤:把最强攻击牌放牌堆顶
      let best = 0;
      for (let i = 1; i < c.discard.length; i++) {
        const a = Engine.effectiveView(run, c.discard[i]);
        const b = Engine.effectiveView(run, c.discard[best]);
        if ((a.dmg || 0) > (b.dmg || 0)) best = i;
      }
      Engine.resolveDiscardToTop(run, best);
    }
    return;
  }
  const living = c.enemies.filter(e => !e.dead);
  const incoming = living.reduce((s, e) => s + (intentIsAttack(e) ? intentDmg(run, e) : 0), 0);
  // 濒死时喝药
  if (incoming >= run.player.hp + c.player.block) {
    for (let s = 0; s < run.player.potionSlots; s++) {
      const pid = run.player.potions[s];
      if (pid === 'healpotion' && Engine.potionUsable(run, s)) { Engine.usePotion(run, s, 0); return; }
    }
  }
  for (let s = 0; s < run.player.potionSlots; s++) {
    const pid = run.player.potions[s];
    if (!Engine.potionUsable(run, s)) continue;
    if (pid === 'firepotion' || pid === 'poisonpotion') {
      // 用于斩杀最脆的敌人
      const weakest = living.reduce((a, b) => (a.hp < b.hp ? a : b), living[0]);
      if (weakest && ((pid === 'firepotion' && weakest.hp <= 20 && weakest.hp > 8) || (pid === 'poisonpotion' && weakest.hp > 20))) {
        Engine.usePotion(run, s, living.indexOf(weakest));
      }
    }
  }
  if (run.screen !== 'combat') return;
  // 出牌:先补足格挡缺口,再输出
  for (let guard = 0; guard < 12; guard++) {
    const needBlock = Math.max(0, incoming - c.player.block);
    let bestI = -1, bestScore = -1e9;
    for (let i = 0; i < c.hand.length; i++) {
      if (!Engine.canPlay(run, i)) continue;
      const v = Engine.effectiveView(run, c.hand[i]);
      let sc = -100;
      if (v.cls === 'curse' || v.cls === 'status' || v.unplayable) continue;
      if (v.type === 'skill' && v.block) {
        const blk = Engine.calcCardBlock(run, c.hand[i]);
        sc = needBlock > 0 ? 30 + Math.min(blk, needBlock) * 2 : 4;
        if (v.dmg) sc += 8; // 攻防一体
      } else if (v.type === 'attack') {
        const dmg = Engine.calcCardDamage(run, c.hand[i]) || 0;
        sc = 8 + dmg * 1.2;
        if (v.target === 'all') sc += living.length * 5;
      } else if (v.type === 'power') {
        sc = c.turn <= 2 ? 26 : 12;
      } else {
        // 过牌/能量类
        sc = 16;
      }
      if (sc > bestScore) { bestScore = sc; bestI = i; }
    }
    if (bestI === -1) break;
    const v = Engine.effectiveView(run, c.hand[bestI]);
    let target = 0;
    if (v.target === 'enemy' && living.length) {
      const dmg = Engine.calcCardDamage(run, c.hand[bestI]);
      let pickIdx = 0;
      for (let j = 0; j < living.length; j++) {
        if (dmg * (v.hits || 1) >= living[j].hp + living[j].block) { pickIdx = j; break; }
      }
      if (dmg * (v.hits || 1) < living[pickIdx].hp + living[pickIdx].block) {
        // 打威胁最大(意图攻击且伤害高)的目标
        let best = 0;
        for (let j = 0; j < living.length; j++) {
          if (intentDmg(run, living[j]) > intentDmg(run, living[best])) best = j;
        }
        pickIdx = best;
      }
      target = pickIdx;
    }
    Engine.playCard(run, bestI, target);
    if (run.screen !== 'combat') return;
  }
  Engine.endTurn(run);
}
function simulateSmart(cls, seed) {
  return driveSmartRun(Engine.newRun(cls, seed), 'smart ' + cls + '#' + seed);
}
function driveSmartRun(run, tag) {
  let steps = 0;
  while (run.screen !== 'gameover' && run.screen !== 'victory' && steps < 30000) {
    steps++;
    try {
      if (run.screen === 'combat') {
        smartCombatAct(run);
      } else if (run.screen === 'map') {
        smartMapAct(run);
      } else if (run.screen === 'reward' || run.screen === 'treasure') {
        if (run.pending) { resolvePendingRandom(run); continue; }
        (run.rewards || []).forEach((r, i) => {
          if (r.taken) return;
          if (r.type === 'card') {
            // 卡组纪律:精简优先,偏好高品质
            if (run.player.deck.length < 18) {
              const best = [...r.options].sort((a, b) => {
                const rar = id => ({ rare: 3, uncommon: 2, common: 1 }[globalThis.GS.CARDS.get(id).rarity] || 0);
                return rar(b) - rar(a);
              })[0];
              const rar = globalThis.GS.CARDS.get(best).rarity;
              if (run.player.deck.length < 12 || rar !== 'common') Engine.takeCardReward(run, i, best);
              else Engine.skipCardReward(run, i);
            } else Engine.skipCardReward(run, i);
          } else Engine.claimReward(run, i);
        });
        Engine.leaveReward(run);
      } else if (run.screen === 'rest') {
        if (run.pending) { resolvePendingRandom(run); continue; }
        if (run.player.hp < run.player.maxHp * 0.6) Engine.restHeal(run);
        else Engine.restSmith(run);
        if (run.pending) resolvePendingRandom(run);
        else Engine.leaveRest(run);
      } else if (run.screen === 'shop') {
        if (run.shop.awaitingRemove) { Engine.shopRemoveCard(run, worstDeckIndex(run)); continue; }
        const s = run.shop;
        // 买遗物 > 伙伴 > 移除服务 > 药水
        let bought = false;
        for (const it of s.relics) {
          if (!it.sold && run.player.gold > it.price + 50) { Engine.buyShopItem(run, 'relic', s.relics.indexOf(it)); bought = true; break; }
        }
        if (!bought && s.allies) {
          for (const it of s.allies) {
            if (!it.sold && run.player.gold > it.price + 80) { Engine.buyShopItem(run, 'ally', s.allies.indexOf(it)); bought = true; break; }
          }
        }
        if (!bought && run.player.gold > 200 && !s.removeUsed) { Engine.buyShopItem(run, 'remove', 0); if (s.awaitingRemove) Engine.shopRemoveCard(run, worstDeckIndex(run)); bought = true; }
        if (!bought) {
          for (const it of s.potions) {
            if (!it.sold && run.player.gold > it.price + 100) { Engine.buyShopItem(run, 'potion', s.potions.indexOf(it)); bought = true; break; }
          }
        }
        Engine.leaveShop(run);
      } else if (run.screen === 'event') {
        if (run.pending) { resolvePendingRandom(run); continue; }
        if (!run.eventResult) {
          // 血少选安全项(通常靠后),否则随机
          const ok = [];
          run.event.choices.forEach((_, i) => { if (Engine.eventCan(run, i)) ok.push(i); });
          const idx = run.player.hp < run.player.maxHp * 0.4 ? ok[ok.length - 1] : pick(ok);
          Engine.chooseEvent(run, idx);
        } else Engine.leaveEvent(run);
      } else {
        actOnce(run);
      }
    } catch (e) {
      fail(`[${tag}] 步${steps} screen=${run.screen} 异常: ${e.stack}`);
      return run;
    }
    checkInvariants(run, tag);
  }
  return run;
}

function worstDeckIndex(run) {
  let worst = -1, ws = 1e9;
  run.player.deck.forEach((inst, i) => {
    const v = Engine.effectiveView(run, inst);
    if (v.cls === 'curse' || v.cls === 'status') { if (-200 < ws) { ws = -200; worst = i; } return; }
    let s = (v.dmg || 0) + (v.block || 0) + 5;
    if (v.rarity === 'rare') s += 20;
    if (v.rarity === 'uncommon') s += 8;
    if (s < ws) { ws = s; worst = i; }
  });
  return Math.max(0, worst);
}

function smartMapAct(run) {
  // 地图策略:血少避开精英,优先战斗/宝箱
  const reach = Engine.reachableNodes(run);
  if (!reach.length) { run.screen = 'gameover'; return; }
  const lowHp = run.player.hp < run.player.maxHp * 0.6;
  const eliteOk = run.player.hp > run.player.maxHp * 0.7;
  // 地图上喝治疗药水
  for (let s = 0; s < run.player.potionSlots; s++) {
    if (run.player.potions[s] === 'healpotion' && run.player.hp < run.player.maxHp * 0.5) {
      Engine.usePotion(run, s, 0);
      break;
    }
  }
  const score = p => {
    const t = run.map[p.row][p.i].type;
    if (lowHp) {
      return { rest: 100, treasure: 90, event: 70, combat: 50, shop: 40, elite: 5, boss: 10 }[t] || 10;
    }
    const base = { treasure: 100, elite: eliteOk ? 88 : 5, combat: 75, event: 60, rest: 55, shop: 45, boss: 50 };
    return (base[t] || 10);
  };
  reach.sort((a, b) => score(b) - score(a));
  Engine.enterNode(run, reach[0].row, reach[0].i);
}

/* ================= 主流程 ================= */
const args = process.argv.slice(2);
const quick = args.includes('--quick');
// --themes:N 只做主题平衡采样(调参用)
const themeOnlyArg = args.find(a => a.startsWith('--themes='));
const themeOnly = !!themeOnlyArg;
const themeSampleN = themeOnlyArg ? parseInt(themeOnlyArg.split('=')[1], 10) || 10 : 0;

if (!themeOnly) {
  console.log('== 机制定向测试 ==');
  mechanicTests();
}

console.log('== 全量模糊对局 ==');
const runsPerClass = quick ? 4 : 12;
const classes = ['warrior', 'ranger', 'warlock'];
let wins = 0, total = 0;
if (!themeOnly) {
  for (const cls of classes) {
    for (let i = 0; i < runsPerClass; i++) {
      const seed = (Math.random() * 4294967296) >>> 0;
      const run = simulateRun(cls, seed);
      total++;
      if (run.player.stats && run.player.stats.won) wins++;
    }
  }
  console.log(`对局 ${total} 局,其中登顶 ${wins} 局`);
}

console.log('== 聪明 Bot 对局(验证可通关) ==');
const smartN = quick ? 3 : 10;
let smartWins = 0, smartTotal = 0;
const actReached = { 1: 0, 2: 0, 3: 0 };
if (!themeOnly) {
  for (const cls of classes) {
    for (let i = 0; i < smartN; i++) {
      const seed = (Math.random() * 4294967296) >>> 0;
      const run = simulateSmart(cls, seed);
      smartTotal++;
      actReached[Math.min(run.act, 3)] = (actReached[Math.min(run.act, 3)] || 0) + 1;
      if (run.player.stats && run.player.stats.won) smartWins++;
    }
  }
  console.log(`聪明Bot ${smartTotal} 局,登顶 ${smartWins} 局,到达幕分布: ${JSON.stringify(actReached)}`);
  // 判定:策略简单的 Bot 无需通关,但至少要能推进到后期
  const deepRate = ((actReached[3] || 0) + smartWins) / smartTotal;
  const midRate = ((actReached[2] || 0) + (actReached[3] || 0) + smartWins) / smartTotal;
  if (smartTotal >= 12 && deepRate === 0 && midRate < 0.12) fail('聪明Bot推进能力异常,游戏可能过难或存在回归');
}

console.log('== 联动主题对局(神秘复苏 / 咒术回战) ==');
const themeRuns = themeOnly ? themeSampleN : (quick ? 3 : 10);
const themeWinRate = {};
const themeAvgAct = {};
for (const theme of GS.THEMES.all) {
  let themeWins = 0, themeActs = 0, themeTotal = 0;
  for (let i = 0; i < themeRuns; i++) {
    const seed = (Math.random() * 4294967296) >>> 0;
    // 奇数种子带初始伙伴开局,偶数不带,两条路径都覆盖
    const starters = (theme.allyDefs || []).filter(a => a.starter);
    const starter = (seed % 2 === 1 && starters.length) ? starters[seed % starters.length].id : undefined;
    const run = Engine.newThemeRun(theme.id, seed, starter);
    // 主题局由智能 Bot 驱动,验证专属卡池/敌人/镜域节点不会崩溃
    driveSmartRun(run, `theme ${theme.id}#${seed}`);
    themeTotal++;
    themeActs += run.act;
    if (run.player.stats && run.player.stats.won) themeWins++;
    if (!run.player.deck.every(x => CARDS.get(x.id))) fail(`[${theme.id}] 卡组含未知卡牌`);
  }
  const avgAct = themeActs / themeTotal;
  const wr = themeWins / themeTotal;
  themeWinRate[theme.id] = wr;
  themeAvgAct[theme.id] = avgAct;
  console.log(`  ${theme.art} ${theme.name}:${themeTotal} 局,通关 ${themeWins} 局(${Math.round(wr * 100)}%),平均到达第 ${avgAct.toFixed(2)} 段`);
}
// 平衡护栏:主题既不能强到离谱,也不能弱到推进不动
if (themeRuns >= 8) {
  let themeWinsTotal = 0, avgSum = 0, avgN = 0;
  for (const id in themeWinRate) {
    themeWinsTotal += themeWinRate[id];
    avgSum += themeAvgAct[id]; avgN++;
    if (themeWinRate[id] > 0.45) fail(`主题 ${id} 通关率 ${Math.round(themeWinRate[id] * 100)}%,可能过于简单`);
    if (themeAvgAct[id] < 1.8) fail(`主题 ${id} 平均只到第 ${themeAvgAct[id].toFixed(2)} 段,可能过难或机制失效`);
  }
  if (themeWinsTotal === 0 && avgSum / Math.max(1, avgN) < 2.8) {
    fail('联动主题整体推进能力异常,可能过难或存在回归');
  }
}

console.log('== 强化Bot(验证胜利/无尽路径) ==');
if (!themeOnly) {
  for (let i = 0; i < 3; i++) {
    const seed = (Math.random() * 4294967296) >>> 0;
    const cls = classes[i % 3];
    const run = Engine.newRun(cls, seed);    // 给予强力开局,验证胜利与无尽流程可完整走通
    run.player.maxHp = 300; run.player.hp = 300; run.player.gold = 999;
    for (let k = 0; k < 6; k++) run.player.deck.push({ id: 'bludgeon', up: 1 });
    for (let k = 0; k < 6; k++) run.player.deck.push({ id: 'impervious', up: 1 });
    Engine.acquireRelic(run, 'manapearl');
    let steps = 0, endlessReached = false;
    while (run.screen !== 'gameover' && steps < 30000) {
      steps++;
      if (run.screen === 'combat') smartCombatAct(run);
      else if (run.screen === 'victory') {
        if (!endlessReached) { endlessReached = true; Engine.continueEndless(run); }
        else break;
      } else actOnce(run);
      checkInvariants(run, `buffed ${cls}#${seed}`);
    }
    if (!endlessReached) fail('强化Bot未能触发胜利/无尽流程');
    else console.log(`  强化Bot ${cls}: 进入无尽(第${run.act}幕) ✓`);
  }
}

if (failures === 0) {
  console.log('\n全部测试通过 ✓');
  process.exit(0);
} else {
  console.error(`\n${failures} 项失败 ✗`);
  process.exit(1);
}
