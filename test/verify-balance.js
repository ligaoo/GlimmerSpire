/* 修复验证:妖尾开局数值 + 魔障取舍 + 其他主题机制抽查 */
'use strict';
const store = {};
globalThis.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
require('../js/rng.js'); require('../js/cards.js'); require('../js/enemies.js');
require('../js/relics.js'); require('../js/potions.js'); require('../js/events.js');
require('../js/packs.js'); require('../js/themes.js'); require('../js/codex.js');
require('../js/engine.js');
const GS = globalThis.GS;
const { Engine } = GS;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('FAIL: ' + m); } else console.log('ok - ' + m); };

/* 妖尾开局:模拟第一层(污染1)后的第一场战斗 */
const run = Engine.newThemeRun('fairytail', 424242);
run.player.curse = 1; // 第一层进入后自动 +1
Engine._testStartCombat(run, ['ft_vulcan'], 'normal');
const c = run.combat;
const e = c.enemies[0];
console.log(`\n[妖尾第一层] 敌人: ${e.name} HP ${e.hp}/${e.maxHp}  污染=${run.player.curse}  龙之意志=${c.player.statuses.dragonforce || 0}`);
// ft_vulcan 基础 26-30 → ×1.08(污染1) → ×1.2(第一幕) = 33-38
ok(e.hp >= 33 && e.hp <= 38, `第一层敌人血量 33-38(实际 ${e.hp})`);
// 打击伤害:6 + 2(污染) = 8, ×1.3 = 10(妖尾保留每层 +2)
const inst = { id: 'strike', up: 0, uid: -1 };
const d = Engine.calcCardDamage(run, inst, null);
ok(d === 10, `开局打击伤害 = 10(实际 ${d})`);

/* 污染玩家加成:四主题已改为每层 +1、12 层触顶 +12(不再 6 层就失效);妖尾/奥特曼保留每层 +2 */
{
  const r = Engine.newThemeRun('journey', 424243);
  r.player.curse = 1;
  ok(Engine.curseDamageBonus(r) === 1, `西游记污染1层加成 +1(实际 ${Engine.curseDamageBonus(r)})`);
  r.player.curse = 6;
  ok(Engine.curseDamageBonus(r) === 6, `西游记污染6层加成 +6(实际 ${Engine.curseDamageBonus(r)})`);
  r.player.curse = 12;
  ok(Engine.curseDamageBonus(r) === 12, `西游记污染12层加成 +12(实际 ${Engine.curseDamageBonus(r)})`);
  r.player.curse = 30;
  ok(Engine.curseDamageBonus(r) === 12, `西游记污染30层仍封顶 +12(实际 ${Engine.curseDamageBonus(r)})`);
  const r2 = Engine.newThemeRun('fairytail', 424243);
  r2.player.curse = 6;
  ok(Engine.curseDamageBonus(r2) === 12, `妖尾污染6层仍 +12(实际 ${Engine.curseDamageBonus(r2)})`);
}

/* 龙之意志 3 层封顶(不再被吞) */
c.enemies[0].hp = 99999; c.enemies[0].maxHp = 99999;
c.player.statuses.dragonforce = 3;
const d3 = Engine.calcCardDamage(run, inst, null);
ok(d3 === Math.floor(8 * 1.45), `3 层龙之意志 ×1.45(实际 ${d3}, 期望 ${Math.floor(8 * 1.45)})`);
c.player.statuses.dragonforce = 5;
const d5 = Engine.calcCardDamage(run, inst, null);
ok(d5 === d3, `超过 3 层不再增长(实际 ${d5})`);
c.player.statuses.dragonforce = 0;

/* 魔障敌人攻击补偿:污染 5 层 → 敌方攻击 ×1.2(0.04×5, 与意图展示同路径) */
run.player.curse = 5;
e.move = 'punch';
const ii = Engine.intentInfo(run, e);
ok(ii.dmg === Math.floor(8 * 1.2), `污染5层敌方攻击 8→${Math.floor(8 * 1.2)}(实际 ${ii.dmg})`);
run.player.curse = 20; // 超上限,封顶 ×1.24
const ii2 = Engine.intentInfo(run, e);
ok(ii2.dmg === Math.floor(8 * 1.24), `敌方攻击补偿封顶 ×1.24(实际 ${ii2.dmg})`);
run.player.curse = 1;

/* 敌人血量随污染加深(0.08/层, 封顶 0.3) */
const run2 = Engine.newThemeRun('fairytail', 777);
run2.player.curse = 10;
Engine._testStartCombat(run2, ['ft_vulcan'], 'normal');
const e2 = run2.combat.enemies[0];
// 26-30 → ×1.2(封顶) → ×1.2(第一幕) = 37-43
ok(e2.hp >= 37 && e2.hp <= 43, `高污染敌人血量提升(实际 ${e2.hp})`);

/* 第一幕 BOSS 不吃 ×1.2 */
const run3 = Engine.newThemeRun('fairytail', 778);
Engine._testStartCombat(run3, ['ft_gazille'], 'boss');
const b = run3.combat.enemies[0];
ok(b.hp >= 130 && b.hp <= 145, `第一幕 BOSS 血量不变 130-145(实际 ${b.hp})`);

/* 其他主题抽查:全部主题第一幕非 BOSS 敌人血量档位 */
console.log('\n[各主题第一幕普通怪血量(修复后)]');
for (const t of GS.THEMES.all) {
  const r = Engine.newThemeRun(t.id, 123);
  const ids = [...new Set(t.acts[0].normal.flat())];
  const hps = ids.map(id => {
    const rr = Engine.newThemeRun(t.id, 55);
    rr.player.curse = 1;
    Engine._testStartCombat(rr, [id], 'normal');
    return rr.combat.enemies[0].hp;
  });
  console.log(`${t.name}: ${ids.map((id, i) => `${GS.THEMES.enemyDefs[id].name}${hps[i]}血`).join(' ')}`);
}

/* 机制封顶扫描:其他主题的资源型机制是否有"加成被吞"问题 */
console.log('\n[机制抽查]');
// 咒术回战:咒力核心给 3 咒力
{
  const r = Engine.newThemeRun('jjk', 9010);
  Engine._testStartCombat(r, ['jj_grade4'], 'normal');
  ok((r.combat.ce || 0) === 3, `咒力核心开局 3 咒力(实际 ${r.combat.ce})`);
}
// 西游:如意金箍棒给 3 棍势
{
  const r = Engine.newThemeRun('journey', 9011);
  Engine._testStartCombat(r, ['xy_imp'], 'normal');
  ok((r.combat.player.statuses.cudgel || 0) === 3, `金箍棒开局 3 棍势(实际 ${r.combat.player.statuses.cudgel})`);
}
// 奥特曼:光能上限 +2
{
  const r = Engine.newThemeRun('ultraman', 9012);
  Engine._testStartCombat(r, ['ul_bemstar'], 'normal');
  ok((r.combat.light ? r.combat.light.max : 0) >= 5, `光能上限提升(实际 ${r.combat.light ? r.combat.light.max : '无'})`);
}
// 神秘复苏:镇魂铃随机鬼
{
  const r = Engine.newThemeRun('mystery', 9013);
  Engine._testStartCombat(r, ['mn_paperman'], 'normal');
  ok(!!r.combat.player.ghostKey, `镇魂铃开局有鬼(${r.combat.player.ghostName || '无'})`);
}
// 从零:福音书随机精灵
{
  const r = Engine.newThemeRun('rezero', 9014);
  Engine._testStartCombat(r, ['rz_dog'], 'normal');
  ok(!!r.combat.player.ghostKey, `福音书开局有精灵(${r.combat.player.ghostName || '无'})`);
}

console.log(fails ? `\n${fails} 项失败` : '\n全部通过');
process.exit(fails ? 1 : 0);
