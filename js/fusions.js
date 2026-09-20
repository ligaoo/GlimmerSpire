/* 微光尖塔 - v7 卡牌熔铸系统
   篝火新增「熔铸」选项:凑齐配方所需的两张材料卡,可将其融合为一张更强的全新卡牌。
   - 融合结果 rarity:'special',不进入任何奖励/商店卡池,只能通过熔铸获得
   - 熔铸与休息/锻造/净化共享篝火次数(每次篝火只能选一项)
   - 消耗材料时优先移除未升级的副本,保留玩家的升级投入
   配方表 FUSIONS 供 UI 展示与引擎校验共用 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};
  const CARDS = global.GS.CARDS;
  if (!CARDS) throw new Error('fusions.js 必须在 cards.js 之后加载');
  function def(d) { CARDS.defs[d.id] = d; }

  /* ============ 新材料卡(神秘复苏:入普通卡池) ============ */
  def({
    id: 'mn_chaiknife', cls: 'mystery', type: 'attack', rarity: 'common', cost: 1, dmg: 9, target: 'enemy',
    name: '柴刀', desc: '造成 {D} 点伤害,魂火 +1。',
    up: { dmg: 12, desc: '造成 {D} 点伤害,魂火 +1。' },
    play(A) { A.attack(); A.addSoulfire(1); }
  });
  def({
    id: 'mn_coffinnail', cls: 'mystery', type: 'attack', rarity: 'common', cost: 0, dmg: 3, target: 'enemy',
    name: '棺材钉', desc: '造成 {D} 点伤害,施加 2 层易伤。',
    up: { dmg: 4, desc: '造成 {D} 点伤害,施加 3 层易伤。' },
    play(A, inst, t) { A.attack(); A.applyTo(t, 'vuln', inst.up ? 3 : 2); }
  });

  /* ============ 融合结果卡(rarity:special,不进卡池) ============ */
  // 神秘复苏:柴刀 + 棺材钉 → 诡异长枪
  def({
    id: 'fu_eeriespear', cls: 'mystery', type: 'attack', rarity: 'special', cost: 1, dmg: 8, hits: 2, target: 'enemy',
    name: '诡异长枪', desc: '造成 2 次 {D} 点伤害,施加 2 层易伤,魂火 +2。',
    up: { dmg: 10, desc: '造成 2 次 {D} 点伤害,施加 3 层易伤,魂火 +2。' },
    play(A, inst, t) { A.attack(null, { times: 2 }); A.applyTo(t, 'vuln', inst.up ? 3 : 2); A.addSoulfire(2); }
  });
  // 神秘复苏:鬼爪 + 鬼火焚身 → 鬼焰狂澜
  def({
    id: 'fu_ghostblaze', cls: 'mystery', type: 'attack', rarity: 'special', cost: 2, dmg: 7, target: 'all',
    name: '鬼焰狂澜', desc: '对所有敌人造成 {D} 点伤害,消耗所有魂火,每层使伤害 +2。',
    up: { dmg: 9, desc: '对所有敌人造成 {D} 点伤害,消耗所有魂火,每层使伤害 +3。' },
    play(A, inst) { A.attackBonus(A.spendSoulfire(99) * (inst.up ? 3 : 2)); A.attackAll(); }
  });
  // 神秘复苏:燃目 + 天眼通 → 洞玄真瞳
  def({
    id: 'fu_truepupil', cls: 'mystery', type: 'skill', rarity: 'special', cost: 1, exhaust: true, target: 'none',
    name: '洞玄真瞳', desc: '阴阳眼 +4,抽 2 张牌,获得 6 点格挡。',
    up: { desc: '阴阳眼 +5,抽 3 张牌,获得 9 点格挡。' },
    play(A, inst) { A.addEye(inst.up ? 5 : 4); A.draw(inst.up ? 3 : 2); A.gainBlock(inst.up ? 9 : 6); }
  });
  // 战士:重刃 + 顺势斩 → 崩山巨锤
  def({
    id: 'fu_warhammer', cls: 'warrior', type: 'attack', rarity: 'special', cost: 2, dmg: 24, target: 'enemy',
    name: '崩山巨锤', desc: '造成 {D} 点伤害,施加 3 层虚弱。',
    up: { dmg: 30, desc: '造成 {D} 点伤害,施加 3 层虚弱。' },
    play(A, inst, t) { A.attack(); A.applyTo(t, 'weak', 3); }
  });
  // 游侠:蛇击 + 致命毒素 → 蚀骨毒牙
  def({
    id: 'fu_venomfang', cls: 'ranger', type: 'attack', rarity: 'special', cost: 1, dmg: 8, target: 'enemy',
    name: '蚀骨毒牙', desc: '造成 {D} 点伤害,施加 6 层中毒;若目标已有中毒,伤害翻倍。',
    up: { dmg: 11, desc: '造成 {D} 点伤害,施加 8 层中毒;若目标已有中毒,伤害翻倍。' },
    play(A, inst, t) {
      if (A.poisonOf(t) > 0) A.attackBonus(CARDS.view({ id: inst.id, up: inst.up ? 1 : 0 }).dmg);
      A.attack();
      A.applyTo(t, 'poison', inst.up ? 8 : 6);
    }
  });
  // 术士:灵火 + 生命虹吸 → 噬魂魔焰
  def({
    id: 'fu_soulleech', cls: 'warlock', type: 'attack', rarity: 'special', cost: 1, dmg: 10, target: 'enemy',
    name: '噬魂魔焰', desc: '造成 {D} 点伤害,回复 5 点生命,抽 1 张牌。',
    up: { dmg: 13, desc: '造成 {D} 点伤害,回复 8 点生命,抽 1 张牌。' },
    play(A, inst) { A.attack(); A.heal(inst.up ? 8 : 5); A.draw(1); }
  });

  /* ============ 配方表 ============ */
  const FUSIONS = [
    { id: 'f_eeriespear', name: '诡异长枪', tag: '神秘复苏', note: '柴刃饮魂,钉封棺椁。',
      materials: ['mn_chaiknife', 'mn_coffinnail'], result: 'fu_eeriespear' },
    { id: 'f_ghostblaze', name: '鬼焰狂澜', tag: '神秘复苏', note: '爪携鬼火,焚尽生魂。',
      materials: ['mn_ghostclaw', 'mn_ghostfire'], result: 'fu_ghostblaze' },
    { id: 'f_truepupil', name: '洞玄真瞳', tag: '神秘复苏', note: '燃目窥镜,天眼始成。',
      materials: ['mn_fireeye', 'mn_seethrough'], result: 'fu_truepupil' },
    { id: 'f_warhammer', name: '崩山巨锤', tag: '战士', note: '重刃顺势,一锤崩山。',
      materials: ['heavy', 'clothesline'], result: 'fu_warhammer' },
    { id: 'f_venomfang', name: '蚀骨毒牙', tag: '游侠', note: '蛇吻喂毒,蚀骨销魂。',
      materials: ['venomstrike', 'deadlypoison'], result: 'fu_venomfang' },
    { id: 'f_soulleech', name: '噬魂魔焰', tag: '术士', note: '灵火噬命,虹吸成魔。',
      materials: ['soulfire', 'drain'], result: 'fu_soulleech' }
  ];

  global.GS.FUSIONS = {
    list: FUSIONS,
    get(id) { return FUSIONS.find(r => r.id === id) || null; },
    // 当前卡组可执行的配方(两件材料均在卡组中)
    available(run) {
      const deck = run && run.player && run.player.deck;
      if (!deck) return [];
      return FUSIONS.filter(r => r.materials.every(m => deck.some(x => x.id === m)));
    },
    // 单个配方是否可执行
    canFuse(run, r) {
      const deck = run && run.player && run.player.deck;
      return !!(r && deck && r.materials.every(m => deck.some(x => x.id === m)));
    }
  };

  // 新材料卡入神秘复苏普通卡池(THEMES.get 返回主题原对象,push 即生效)
  const MYST = global.GS.THEMES && global.GS.THEMES.get && global.GS.THEMES.get('mystery');
  if (MYST && MYST.pool && MYST.pool.indexOf('mn_chaiknife') < 0) {
    MYST.pool.push('mn_chaiknife', 'mn_coffinnail');
  }
})(typeof window !== 'undefined' ? window : globalThis);
