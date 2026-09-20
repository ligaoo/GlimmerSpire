/* 微光尖塔 - 药水数据库 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};

  const P = {};

  function def(d) { P[d.id] = d; }

  def({ id: 'healpotion', name: '治疗药水', art: '🧴', rarity: 'common', target: 'none', anywhere: true,
    desc: '回复 20% 最大生命。', use(A) { A.heal(Math.floor(A.maxHp() * 0.2)); } });
  def({ id: 'strpotion', name: '力量药水', art: '💪', rarity: 'common', target: 'none',
    desc: '获得 2 点力量。', use(A) { A.applySelf('str', 2); } });
  def({ id: 'dexpotion', name: '敏捷药水', art: '🤸', rarity: 'common', target: 'none',
    desc: '获得 2 点敏捷。', use(A) { A.applySelf('dex', 2); } });
  def({ id: 'swiftpotion', name: '迅捷药水', art: '💨', rarity: 'common', target: 'none',
    desc: '抽 3 张牌。', use(A) { A.draw(3); } });
  def({ id: 'energypotion', name: '能量药水', art: '⚡', rarity: 'common', target: 'none',
    desc: '获得 2 点能量。', use(A) { A.gainEnergy(2); } });
  def({ id: 'firepotion', name: '火焰药水', art: '🔥', rarity: 'common', target: 'enemy',
    desc: '对 1 名敌人造成 20 点伤害。', use(A, inst, t) { A.dealMagicDamage(t, 20); } });
  def({ id: 'frostpotion', name: '冰霜药水', art: '❄️', rarity: 'common', target: 'none',
    desc: '获得 15 点格挡。', use(A) { A.gainBlock(15); } });
  def({ id: 'poisonpotion', name: '剧毒药水', art: '☠️', rarity: 'common', target: 'enemy',
    desc: '施加 8 层中毒。', use(A, inst, t) { A.applyTo(t, 'poison', 8); } });
  def({ id: 'weakpotion', name: '虚弱药水', art: '🍵', rarity: 'common', target: 'all',
    desc: '对所有敌人施加 3 层虚弱。', use(A) { A.applyAll('weak', 3); } });
  def({ id: 'ruinpotion', name: '腐蚀药水', art: '🧪', rarity: 'common', target: 'all',
    desc: '对所有敌人施加 3 层易伤。', use(A) { A.applyAll('vuln', 3); } });
  def({ id: 'luckypotion', name: '幸运药水', art: '🍀', rarity: 'rare', target: 'none', anywhere: true,
    desc: '获得 120 金币。', use(A) { A.gainGold(120); } });
  def({ id: 'thornspotion', name: '荆棘药水', art: '🌵', rarity: 'common', target: 'none',
    desc: '获得 5 点荆棘。', use(A) { A.applySelf('thorns', 5); } });

  /* ===== 稀有战斗药水 =====
     之前的稀有药水只有「幸运药水」(给 120 金币,不是战斗效果),导致药水整体只有小数值加成,
     玩家没有"这瓶留给 BOSS"的心理,实测整局带着 3 瓶一口不喝。这里补上真正能改变战斗的药水。 */
  def({ id: 'mightpotion', name: '巨力药水', art: '🦾', rarity: 'rare', target: 'none',
    desc: '获得 3 点力量与 3 点敏捷。', use(A) { A.applySelf('str', 3); A.applySelf('dex', 3); } });
  def({ id: 'aegispotion', name: '圣盾药水', art: '🛡️', rarity: 'rare', target: 'none',
    desc: '获得 30 点格挡。', use(A) { A.gainBlock(30); } });
  def({ id: 'timeslip', name: '时之药水', art: '⏳', rarity: 'rare', target: 'none',
    desc: '抽 5 张牌,并获得 2 点能量。', use(A) { A.draw(5); A.gainEnergy(2); } });
  def({ id: 'executioner', name: '处决药水', art: '⚔️', rarity: 'rare', target: 'enemy',
    desc: '对 1 名敌人造成 45 点伤害。', use(A, inst, t) { A.dealMagicDamage(t, 45); } });

  const IDS = Object.keys(P);

  global.GS.POTIONS = {
    defs: P,
    get(id) { return P[id]; },
    all: IDS,
    // 按稀有度加权随机
    random(run) {
      const pool = [];
      const weights = [];
      for (const id of IDS) {
        pool.push(id);
        weights.push(P[id].rarity === 'rare' ? 1 : 4);
      }
      return GS.RNG.weighted(run, pool, weights);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
