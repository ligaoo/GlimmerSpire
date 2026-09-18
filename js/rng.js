/* 微光尖塔 - 种子随机数 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};

  // mulberry32:状态只有一个 32 位整数,方便随存档序列化
  function next(state) {
    state = (state + 0x6D2B79F5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return { s: state, v: ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
  }

  const RNG = {
    newSeed() { return (Math.random() * 4294967296) >>> 0; },
    // 返回 [0,1)
    float(run) {
      const r = next(run.rng.s | 0);
      run.rng.s = r.s;
      return r.v;
    },
    // [a,b] 闭区间整数
    int(run, a, b) {
      if (b <= a) return a;
      return a + Math.floor(RNG.float(run) * (b - a + 1));
    },
    chance(run, p) { return RNG.float(run) < p; },
    pick(run, arr) { return arr[Math.floor(RNG.float(run) * arr.length)]; },
    // 加权抽取:weights 与 arr 等长
    weighted(run, arr, weights) {
      let total = 0;
      for (const w of weights) total += w;
      let roll = RNG.float(run) * total;
      for (let i = 0; i < arr.length; i++) {
        roll -= weights[i];
        if (roll < 0) return arr[i];
      }
      return arr[arr.length - 1];
    },
    shuffle(run, arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(RNG.float(run) * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
  };

  global.GS.RNG = RNG;
})(typeof window !== 'undefined' ? window : globalThis);
