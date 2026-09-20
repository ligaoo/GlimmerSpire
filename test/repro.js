/* 同种子可复现性回归测试
   运行: node test/repro.js
   目的: Bot 的随机必须走 run 的 RNG 流。此前 Bot 用 Math.random,
        同一颗种子跑两次结果不同,单主题 n=30 时"活过第 1 幕"噪声可达 ±15%,
        调平衡时极易得出错误结论(未改动的主题也会"掉 13-17 个点")。 */
'use strict';
const { loadBot } = require('./botlib');
const { Engine, driveSmartRun } = loadBot();

let fails = 0;
function snapshot(run) {
  return JSON.stringify({
    act: run.act, floor: run.floorTotal, screen: run.screen,
    hp: run.player.hp, maxHp: run.player.maxHp, gold: run.player.gold,
    deck: run.player.deck.map(c => c.id + '+' + (c.up || 0) + (c.path || '')),
    relics: [...run.player.relics].sort(),
    curse: run.player.curse || 0
  });
}
function play(seed, cls) {
  const run = cls ? Engine.newRun(cls, seed) : Engine.newThemeRun('journey', seed);
  driveSmartRun(run, 'repro');
  return snapshot(run);
}

const cases = [
  ['经典·warrior', 11111, 'warrior'],
  ['经典·warlock', 22222, 'warlock'],
  ['主题·西游记', 33333, null],
  ['主题·西游记', 44444, null]
];
for (const [label, seed, cls] of cases) {
  const a = play(seed, cls);
  const b = play(seed, cls);
  if (a === b) console.log(`ok - ${label} 种子 ${seed} 两次结果一致`);
  else {
    fails++;
    console.error(`FAIL: ${label} 种子 ${seed} 不可复现\n  第一次: ${a.slice(0, 200)}\n  第二次: ${b.slice(0, 200)}`);
  }
}

console.log(fails ? `\n${fails} 项失败` : '\n全部通过 ✓');
process.exit(fails ? 1 : 0);
