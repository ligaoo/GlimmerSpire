/* 难度曲线形状诊断(聚合) —— 调平衡用
   运行: node test/diag-shape.js [每主题局数] [每职业局数] [--base=N]
   输出: 每个主题/职业的 通关率 / 死于各幕的分布 / 活过第 1 幕比例 / 换幕血量
   为什么需要它: test/diag.js 只打印单局死因日志,看不出"难度前置还是后置"。
   种子是固定的(由 base 派生),所以改数值前后的两次运行是同一批种子,天然配对可比,
   不会像随机种子那样把噪声当成改动效果。换了数值要对比时保持 base 不变。
   对照参考(2026-09-20 实测): 经典 活过第 1 幕仅 7-20%(难度前置);
                            主题 活过第 1 幕 90-100%(第 1 幕基本无威胁)。 */
'use strict';
const { loadBot } = require('./botlib');
const { GS, Engine, driveSmartRun, simulateSmart } = loadBot();

const argv = process.argv.slice(2);
const baseArg = argv.find(a => a.startsWith('--base='));
const BASE = baseArg ? (parseInt(baseArg.split('=')[1], 10) >>> 0) : 0x5EED;
const positional = argv.filter(a => !a.startsWith('--'));
const THEME_N = parseInt(positional[0], 10) || 30;
const CLASS_N = parseInt(positional[1], 10) || 15;

// 固定种子序列:同一 base 下每局的种子恒定,便于改前改后配对比较
let seedCursor = 0;
function nextSeed() { return (Math.imul(0x9E3779B9, ++seedCursor) + BASE) >>> 0; }

/* 记录每次进入节点时的状态,用来还原血量轨迹与各幕死亡分布 */
let trace = [];
const origEnter = Engine.enterNode;
Engine.enterNode = function (run, row, i) {
  trace.push({ act: run.act, floor: run.floorTotal, hp: run.player.hp, max: run.player.maxHp });
  return origEnter.apply(this, arguments);
};

function summarize(name, rows) {
  const n = rows.length;
  const wins = rows.filter(r => r.won).length;
  const deaths = { 1: 0, 2: 0, 3: 0 };
  for (const r of rows) if (!r.won) deaths[r.deadAct] = (deaths[r.deadAct] || 0) + 1;
  let hp2 = 0, c2 = 0, hp3 = 0, c3 = 0;
  for (const r of rows) {
    if (r.actStartHp[2]) { hp2 += r.actStartHp[2].hp / r.actStartHp[2].max; c2++; }
    if (r.actStartHp[3]) { hp3 += r.actStartHp[3].hp / r.actStartHp[3].max; c3++; }
  }
  const pct = (x) => Math.round(x * 100) + '%';
  console.log(
    `${name.padEnd(20, ' ')} n=${n}  通关 ${String(wins).padStart(2)}(${pct(wins / n)})  ` +
    `死于1幕 ${String(deaths[1] || 0).padStart(2)} / 2幕 ${String(deaths[2] || 0).padStart(2)} / 3幕 ${String(deaths[3] || 0).padStart(2)}  ` +
    `活过1幕 ${pct((n - (deaths[1] || 0)) / n)}  ` +
    `换幕血 1→2 ${c2 ? pct(hp2 / c2) : '-'}  2→3 ${c3 ? pct(hp3 / c3) : '-'}`
  );
}

function oneRun(run) {
  const steps = trace.slice();
  const byAct = {};
  for (const s of steps) (byAct[s.act] = byAct[s.act] || []).push(s);
  const actStartHp = {};
  for (const a of Object.keys(byAct).map(Number)) actStartHp[a] = byAct[a][0];
  return {
    won: !!(run.player.stats && run.player.stats.won),
    deadAct: (run.player.stats && run.player.stats.won) ? 0 : run.act,
    floor: run.floorTotal,
    actStartHp
  };
}

console.log(`\n=== 难度曲线形状 (每主题 ${THEME_N} 局 / 每职业 ${CLASS_N} 局) ===\n`);

const classAgg = [];
for (const theme of GS.THEMES.all) {
  const rows = [];
  for (let i = 0; i < THEME_N; i++) {
    const seed = nextSeed();
    const starters = (theme.allyDefs || []).filter(a => a.starter);
    const starter = (seed % 2 === 1 && starters.length) ? starters[seed % starters.length].id : undefined;
    trace = [];
    const run = Engine.newThemeRun(theme.id, seed, starter);
    driveSmartRun(run, 'shape ' + theme.id + '#' + seed);
    rows.push(oneRun(run));
  }
  summarize('主题·' + theme.name, rows);
}

console.log('');
for (const cls of ['warrior', 'ranger', 'warlock']) {
  const rows = [];
  for (let i = 0; i < CLASS_N; i++) {
    const seed = nextSeed();
    trace = [];
    rows.push(oneRun(simulateSmart(cls, seed)));
  }
  summarize('经典·' + cls, rows);
  classAgg.push(...rows);
}
summarize('经典·合计', classAgg);
