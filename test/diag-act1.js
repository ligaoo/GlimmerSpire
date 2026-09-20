/* 第 1 幕死因聚合诊断 —— 判断"第 1 幕难"是集中在少数不公平点,还是均匀地难
   运行: node test/diag-act1.js [局数] [--base=N]
   输出: 第 1 幕死亡按遭遇组合/层级/节点类型分布,以及每场战斗的掉血 */
'use strict';
const { loadBot } = require('./botlib');
const { GS, Engine, driveSmartRun } = loadBot();

const argv = process.argv.slice(2);
const baseArg = argv.find(a => a.startsWith('--base='));
const BASE = baseArg ? (parseInt(baseArg.split('=')[1], 10) >>> 0) : 0x5EED;
const N = parseInt(argv.filter(a => !a.startsWith('--'))[0], 10) || 60;

let seedCursor = 0;
const nextSeed = () => (Math.imul(0x9E3779B9, ++seedCursor) + BASE) >>> 0;
const NODE_CN = { combat: '普通战', elite: '精英', boss: 'BOSS', rest: '篝火', shop: '商店', event: '事件', treasure: '宝箱' };

/* 钩住进节点:记录层/节点类型/进入时血量 —— 相邻两次差值≈上一节点的净掉血 */
let enterLog = [];
const origEnter = Engine.enterNode;
Engine.enterNode = function (run, row, i) {
  const n = run.map && run.map[row] ? run.map[row][i] : null;
  enterLog.push({ act: run.act, floor: run.floorTotal, type: n ? n.type : '?', hp: run.player.hp, max: run.player.maxHp });
  return origEnter.apply(this, arguments);
};

const rows = [], allFights = [];
for (let i = 0; i < N; i++) {
  const seed = nextSeed();
  const cls = ['warrior', 'ranger', 'warlock'][i % 3];
  const run = Engine.newRun(cls, seed);
  enterLog = [];
  driveSmartRun(run, 'act1 ' + cls + '#' + seed);
  const won = !!(run.player.stats && run.player.stats.won);

  // 死亡现场:run.combat 仍保存着最后一场战斗的敌人
  let killer = '-', kind = '-';
  if (!won && run.combat && run.combat.enemies) {
    killer = run.combat.enemies.map(e => e.name).join('+');
    kind = run.combat.kind === 'elite' ? '精英' : run.combat.kind === 'boss' ? 'BOSS' : '普通';
  }
  rows.push({ cls, won, deadAct: won ? 0 : run.act, floor: run.floorTotal, killer, kind });

  // 每场战斗的净掉血 = 下一节点进入血量 - 本节点进入血量
  for (let k = 0; k < enterLog.length - 1; k++) {
    const a = enterLog[k], b = enterLog[k + 1];
    allFights.push({ act: a.act, type: a.type, loss: a.hp - b.hp, hpPct: a.hp / a.max });
  }
}

const dead = rows.filter(r => !r.won && r.deadAct === 1);
console.log(`\n=== 第 1 幕死因聚合 (n=${N},固定 base=${BASE}) ===`);
console.log(`第 1 幕死亡 ${dead.length}/${N} 局(${Math.round(dead.length / N * 100)}%)`);
const byKind = {}; dead.forEach(r => byKind[r.kind] = (byKind[r.kind] || 0) + 1);
console.log('按遭遇类型:', JSON.stringify(byKind));
console.log('按被杀组合:');
const byPack = {}; dead.forEach(r => byPack[r.killer] = (byPack[r.killer] || 0) + 1);
Object.entries(byPack).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
const byFloor = {}; dead.forEach(r => byFloor[r.floor] = (byFloor[r.floor] || 0) + 1);
console.log('按层级:', Object.entries(byFloor).sort((a, b) => +a[0] - +b[0]).map(([k, v]) => `${k}层:${v}`).join('  '));

console.log('\n第 1 幕每节点净掉血(不分胜负):');
const agg = {};
for (const f of allFights) {
  if (f.act !== 1) continue;
  const k = NODE_CN[f.type] || f.type;
  const b = agg[k] = agg[k] || { n: 0, loss: 0, hpPct: 0 };
  b.n++; b.loss += f.loss; b.hpPct += f.hpPct;
}
for (const k of Object.keys(agg)) {
  const b = agg[k];
  console.log(`  ${k.padEnd(4, ' ')}: ${String(b.n).padStart(4)} 次,平均掉血 ${(b.loss / b.n).toFixed(1)},进入时平均血量 ${(b.hpPct / b.n * 100).toFixed(0)}%`);
}
