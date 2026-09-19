'use strict';
/* v5 机制自测:事件/新卡/词缀/难度/每日/客串/羁绊/主动技能/训练/图鉴 */
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
require('../js/codex.js');
require('../js/engine.js');
const { Engine, THEMES, CARDS, Codex } = globalThis.GS;

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

// 1) 每主题:35张池/6事件/2羁绊/5主动技能/全部卡牌 def 有效
for (const t of THEMES.all) {
  ok((t.pool || []).length >= 35, t.name + ' 卡池>=35 实际' + t.pool.length);
  ok((t.events || []).length === 6, t.name + ' 事件=6');
  ok((t.duos || []).length === 2, t.name + ' 羁绊=2');
  for (const a of t.allyDefs) {
    ok(a.active && a.active.name && a.active.fx, t.name + '/' + a.name + ' 有主动技能');
  }
  for (const id of t.pool) ok(CARDS.defs[id], '卡牌已定义 ' + id);
  // 事件结构
  for (const ev of t.events) {
    ok(ev.id && ev.name && ev.choices && ev.choices.length >= 2, '事件结构 ' + ev.id);
  }
}

// 2) 每张主题卡(含新卡)可被 view 且升级后可 view(A/B 分支)
for (const t of THEMES.all) {
  for (const id of t.pool) {
    const d = CARDS.defs[id];
    ok(d.up && Object.keys(d.up).length > 0, id + ' 有升级');
    const va = CARDS.view({ id, up: 1 });
    ok(va.name, id + ' view(up)');
    if (d.up2) {
      const vb = CARDS.view({ id, up: 1, path: 2 });
      ok(vb.name === (d.up2.name || d.name), id + ' view(up2) 名称');
    }
  }
}

// 3) 分支升级引擎
{
  const run = Engine.newThemeRun('mystery', 7, 'mn_a_dog');
  run.pending = { type: 'smith', n: 1 };
  const idx = run.player.deck.findIndex(x => x.id === 'mn_ghostclaw' || CARDS.branchable(x.id));
  if (idx >= 0) {
    Engine.resolvePendingBranch(run, idx, 2);
    ok(run.player.deck[idx].up === 1 && run.player.deck[idx].path === 2, '分支升级 B 生效');
    const v = CARDS.view(run.player.deck[idx]);
    ok(v.name && v.name.includes('·'), 'B 分支名称生效: ' + v.name);
  }
}

// 4) 主题事件:事件 ctx 新方法可用
{
  const run = Engine.newThemeRun('jjk', 99, 'jj_a_itadori');
  run.event = { id: 't', name: 't', art: 'x', text: 'x', choices: [{ label: 'a', fx(A) { const id = A.gainThemeCard('rare'); return 'ok' + id; } }] };
  run.screen = 'event';
  Engine.chooseEvent(run, 0);
  ok(run.eventResult && run.eventResult.startsWith('ok'), 'gainThemeCard 生效: ' + run.eventResult);
  run.event = { id: 't2', name: 't', art: 'x', text: 'x', choices: [{ label: 'a', fx(A) { A.addCurse(2); A.reduceCurse(1); return 'ok'; } }] };
  run.eventResult = null;
  Engine.chooseEvent(run, 0);
  ok(run.player.curse === 1, 'addCurse/reduceCurse 生效 cur=' + run.player.curse);
}

// 5) 词缀:act2 普通敌人概率出现,迅捷伤害上修,坚韧血量上修
{
  const run = Engine.newThemeRun('rezero', 5, 'rz_a_emilia');
  run.act = 2;
  let affixed = 0;
  for (let s = 0; s < 400; s++) {
    run.rng = { s: s + 1 };
    const e = Engine._testSpawn ? Engine._testSpawn(run, 'rz_dog', 1) : null;
    if (e && e.affix) affixed++;
  }
  console.log('词缀出现率(act2):', (affixed / 400 * 100).toFixed(1) + '%');
  ok(affixed > 20 && affixed < 320, '词缀概率合理');
}

// 6) 难度/进阶倍率
{
  const ez = Engine.newThemeRun('jjk', 1, null, { difficulty: 'easy' });
  const hd = Engine.newThemeRun('jjk', 1, null, { difficulty: 'hard', ascension: 5 });
  ok(Math.abs(hd.enemyHpMult / ez.enemyHpMult - (1.15 * 1.35) / 0.85) < 0.01, '难度/进阶血量倍率');
  ok(hd.player.maxHp < THEMES.get('jjk').startHp, '进阶起始生命削减 hard5 maxHp=' + hd.player.maxHp);
  const s1 = Engine.score(ez), s2 = Engine.score(hd);
  ok(s2 >= s1, '困难进阶分数更高');
}

// 7) 每日规则
{
  const info = Engine.dailyInfo('2026-09-19');
  ok(info.rule && info.theme, 'dailyInfo: ' + info.rule.name + ' / ' + info.theme.name);
  const run = Engine.newThemeRun(info.theme.id, info.seed, null, { daily: info.rule.id });
  ok(run.daily === info.rule.id, '每日 run 创建');
  if (info.rule.id === 'glass') ok(run.player.maxHp === 50, '玻璃大炮 50 血');
  if (info.rule.id === 'rich') ok(run.player.gold === 500, '贫穷贵公子 500 金');
  if (info.rule.id === 'cursedland') ok(run.player.curse === 3, '诅咒之地 污染3');
  // 全规则跑通创建
  for (const r of Engine.dailyRules) {
    const rr = Engine.newThemeRun('mystery', 42, null, { daily: r.id });
    ok(rr.player.hp > 0 && rr.player.maxHp > 0, '每日规则可创建 ' + r.id);
  }
}

// 8) 羁绊 + 主动技能 + 训练
{
  const run = Engine.newThemeRun('rezero', 11, 'rz_a_emilia');
  run.player.allies = ['rz_a_emilia', 'rz_a_rem'];
  const blockBefore = run.combat ? 0 : 0;
  Engine._testStartCombat && Engine._testStartCombat(run, ['rz_dog'], 'normal');
  ok(run.screen === 'combat', '进入战斗');
  ok(run.evts.some(e => e.msg && e.msg.includes('羁绊「冰蓝女仆」')), '双人羁绊发动');
  const infos = Engine.allyActiveInfo(run);
  ok(infos.length === 2 && infos.every(i => i.active), '主动技能信息');
  const e0 = run.combat.enemies[0];
  const hpBefore = e0.hp;
  ok(Engine.useAllyActive(run, 'rz_a_rem') === true, '蕾姆发动主动技');
  ok(!Engine.useAllyActive(run, 'rz_a_rem'), '每场一次限制');
  // 训练
  run.screen = 'shop';
  run.shop = Engine._testGenShop(run);
  run.player.gold = 500;
  const price = Engine.allyTrainPrice(run, 'rz_a_rem');
  ok(price === 90, '训练价格 lv1=90 实际' + price);
  ok(Engine.buyAllyTrain(run, 'rz_a_rem'), '购买训练');
  ok(Engine.allyLv(run, 'rz_a_rem') === 2, '伙伴升级 lv2');
  run.screen = 'combat';
  run.combat.allyActiveUsed = {};
  const e1 = run.combat.enemies[0];
  const hp1 = e1.hp;
  Engine.useAllyActive(run, 'rz_a_emilia');
  ok(run.combat.enemies[0].hp < hp1, '爱蜜莉雅主动技造成伤害');
  void hpBefore; void e0; void blockBefore;
}

// 9) 客串卡:大量 roll 中应偶现其他主题牌
{
  const run = Engine.newThemeRun('mystery', 3, null);
  let foreign = 0;
  for (let s = 0; s < 3000; s++) {
    run.rng = { s: s + 1 };
    const ids = Engine._testRewardCards ? Engine._testRewardCards(run, 3) : null;
    if (ids) for (const id of ids) {
      const d = CARDS.defs[id];
      if (d && d.cls && !['mystery', 'none', 'curse', 'status', 'colorless'].includes(d.cls)) foreign++;
    }
  }
  console.log('客串卡出现次数/9000:', foreign);
  ok(foreign > 0 && foreign < 400, '客串卡低概率出现');
}

// 10) 图鉴
{
  Codex.reset();
  Engine.newThemeRun('jjk', 8, 'jj_a_itadori');
  ok(Codex.seen('cards', 'strike'), '图鉴记录初始牌');
  ok(Codex.seen('allies', 'jj_a_itadori'), '图鉴记录伙伴');
  const cs = Codex.statsCards();
  ok(cs.total > 250, '卡牌图鉴总量 ' + cs.total);
  const won = Codex.claimMilestones();
  console.log('图鉴里程碑:', won);
}

// 11) v6:遗物图鉴
{
  Codex.reset();
  const run = Engine.newThemeRun('jjk', 8, 'jj_a_itadori');
  ok(Codex.seen('relics', 'jjkcore'), '图鉴记录初始遗物');
  Engine.acquireRelic(run, 'mystbell');
  ok(Codex.seen('relics', 'mystbell'), 'acquireRelic 记录图鉴');
  const rl = Codex.statsRelics();
  ok(rl.total >= 70, '遗物图鉴总量 ' + rl.total);
  ok(rl.got >= 2, '遗物图鉴已见 ' + rl.got);
}
// 12) v6:种子确定性
{
  const r1 = Engine.newThemeRun('mystery', 20260919, null);
  const r2 = Engine.newThemeRun('mystery', 20260919, null);
  const sig = m => m.map(row => row.map(n => n.type).join(',')).join('|');
  ok(sig(r1.map) === sig(r2.map), '同种子地图一致');
  ok(Engine.seedFromString('12345') === 12345, '数字种子直取');
  ok(Engine.seedFromString('abc') === Engine.seedFromString('abc'), '字符串种子稳定');
}
// 13) v6:每日成绩榜
{
  const run = Engine.newThemeRun('jjk', 7, null, { daily: 'glass' });
  run.floorTotal = 30; run.player.stats.won = false;
  Engine.onGameOver(run);
  const board = Engine.dailyBoard();
  ok(board.length >= 1 && board[0].score > 0, '每日败局入榜 score=' + (board[0] && board[0].score));
}
// 14) v6:BOSS 过半变身
{
  const run = Engine.newThemeRun('jjk', 4242, null);
  Engine._testStartCombat(run, ['jj_kingofcurses'], 'boss');
  const boss = run.combat.enemies[0];
  boss.statuses.vuln = 3;
  const half = Math.floor(boss.maxHp / 2);
  ok(Engine._testHit(run, boss, boss.maxHp - half - 1) >= 0 && !boss._enraged, '半血以上未触发');
  ok(Engine._testHit(run, boss, 1) >= 0 && boss._enraged === true, '过半触发变身');
  ok((boss.statuses.str || 0) === 2, '变身后力量+2');
  ok(!boss.statuses.vuln, '变身挣脱减益');
}
console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
