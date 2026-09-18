/* 微光尖塔 - 卡牌数据库
   卡牌实例: {id, up} ; 定义通过 GS.CARDS[id] 查询
   fx(A, inst, target) 中 A 为引擎提供的动作接口 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};

  const C = {}; // id -> def

  function def(d) { C[d.id] = d; }

  /* ============ 通用牌 ============ */
  def({
    id: 'strike', cls: 'none', type: 'attack', rarity: 'basic', cost: 1, dmg: 6, target: 'enemy',
    name: '打击', desc: '造成 {D} 点伤害。',
    up: { dmg: 9, desc: '造成 {D} 点伤害。' }
  });
  def({
    id: 'defend', cls: 'none', type: 'skill', rarity: 'basic', cost: 1, block: 5, target: 'none',
    name: '防御', desc: '获得 {B} 点格挡。',
    up: { block: 8, desc: '获得 {B} 点格挡。' }
  });

  /* ============ 剑士 ============ */
  def({
    id: 'bash', cls: 'warrior', type: 'attack', rarity: 'basic', cost: 2, dmg: 8, target: 'enemy',
    name: '痛击', desc: '造成 {D} 点伤害,施加 2 层易伤。',
    up: { dmg: 10, desc: '造成 {D} 点伤害,施加 3 层易伤。' },
    play(A, inst, t) { A.attack(t); A.applyTo(t, 'vuln', inst.up ? 3 : 2); }
  });
  def({
    id: 'heavy', cls: 'warrior', type: 'attack', rarity: 'common', cost: 2, dmg: 14, target: 'enemy',
    name: '重斩', desc: '造成 {D} 点伤害。',
    up: { dmg: 18, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'ironwave', cls: 'warrior', type: 'attack', rarity: 'common', cost: 1, dmg: 5, block: 5, target: 'enemy',
    name: '铁波斩', desc: '获得 {B} 点格挡,造成 {D} 点伤害。',
    up: { dmg: 7, block: 7, desc: '获得 {B} 点格挡,造成 {D} 点伤害。' },
    play(A, inst, t) { A.gainBlock(); A.attack(t); }
  });
  def({
    id: 'pommel', cls: 'warrior', type: 'attack', rarity: 'common', cost: 1, dmg: 9, target: 'enemy',
    name: '剑柄打击', desc: '造成 {D} 点伤害,抽 1 张牌。',
    up: { dmg: 10, desc: '造成 {D} 点伤害,抽 2 张牌。' },
    play(A, inst, t) { A.attack(t); A.draw(inst.up ? 2 : 1); }
  });
  def({
    id: 'twin', cls: 'warrior', type: 'attack', rarity: 'common', cost: 1, dmg: 5, hits: 2, target: 'enemy',
    name: '双重打击', desc: '造成 2 次 {D} 点伤害。',
    up: { dmg: 7, desc: '造成 2 次 {D} 点伤害。' },
    play(A, inst, t) { A.attack(t, { times: 2 }); }
  });
  def({
    id: 'rip', cls: 'warrior', type: 'attack', rarity: 'common', cost: 1, dmg: 8, target: 'all',
    name: '撕裂', desc: '对所有敌人造成 {D} 点伤害。',
    up: { dmg: 11, desc: '对所有敌人造成 {D} 点伤害。' },
    play(A) { A.attackAll(); }
  });
  def({
    id: 'clothesline', cls: 'warrior', type: 'attack', rarity: 'common', cost: 2, dmg: 12, target: 'enemy',
    name: '顺势斩', desc: '造成 {D} 点伤害,施加 2 层虚弱。',
    up: { dmg: 14, desc: '造成 {D} 点伤害,施加 3 层虚弱。' },
    play(A, inst, t) { A.attack(t); A.applyTo(t, 'weak', inst.up ? 3 : 2); }
  });
  def({
    id: 'shrug', cls: 'warrior', type: 'skill', rarity: 'common', cost: 1, block: 8, target: 'none',
    name: '卸力', desc: '获得 {B} 点格挡,抽 1 张牌。',
    up: { block: 11, desc: '获得 {B} 点格挡,抽 1 张牌。' },
    play(A) { A.gainBlock(); A.draw(1); }
  });
  def({
    id: 'inflame', cls: 'warrior', type: 'power', rarity: 'common', cost: 1, target: 'none',
    name: '燃魂', desc: '获得 2 点力量。', up: { desc: '获得 3 点力量。' },
    play(A, inst) { A.applySelf('str', inst.up ? 3 : 2); }
  });
  def({
    id: 'metallicize', cls: 'warrior', type: 'power', rarity: 'common', cost: 1, target: 'none',
    name: '金属化', desc: '每回合结束时获得 3 点格挡。', up: { desc: '每回合结束时获得 4 点格挡。' },
    play(A, inst) { A.applySelf('metal', inst.up ? 4 : 3); }
  });
  def({
    id: 'headbutt', cls: 'warrior', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 9, target: 'enemy',
    name: '头锤', desc: '造成 {D} 点伤害。将弃牌堆中的一张牌置于抽牌堆顶。',
    up: { dmg: 12, desc: '造成 {D} 点伤害。将弃牌堆中的一张牌置于抽牌堆顶。' },
    play(A) { A.attack(); A.chooseDiscardToTop(); }
  });
  def({
    id: 'shockwave', cls: 'warrior', type: 'skill', rarity: 'uncommon', cost: 2, exhaust: true, target: 'all',
    name: '震荡波', desc: '对所有敌人施加 3 层虚弱和 3 层易伤。消耗。',
    up: { desc: '对所有敌人施加 5 层虚弱和 5 层易伤。消耗。' },
    play(A, inst) { const n = inst.up ? 5 : 3; A.applyAll('weak', n); A.applyAll('vuln', n); }
  });
  def({
    id: 'whirlwind', cls: 'warrior', type: 'attack', rarity: 'uncommon', cost: 'X', dmg: 5, target: 'all',
    name: '旋风斩', desc: '消耗所有能量。对所有敌人造成 {D} 点伤害,每消耗 1 点能量攻击一次。',
    up: { dmg: 8, desc: '消耗所有能量。对所有敌人造成 {D} 点伤害,每消耗 1 点能量攻击一次。' },
    play(A) { const x = A.spendAllEnergy(); if (x > 0) A.attackAll({ times: x }); }
  });
  def({
    id: 'ghostarmor', cls: 'warrior', type: 'skill', rarity: 'uncommon', cost: 1, block: 10, ethereal: true, target: 'none',
    name: '鬼魂护甲', desc: '虚无:回合结束时若在手牌中则消耗。获得 {B} 点格挡。',
    up: { block: 13, desc: '虚无:回合结束时若在手牌中则消耗。获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'flex', cls: 'warrior', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    name: '力量爆发', desc: '本回合获得 2 点力量。', up: { desc: '本回合获得 4 点力量。' },
    play(A, inst) { A.applySelf('tempStr', inst.up ? 4 : 2); }
  });
  def({
    id: 'bloodletting', cls: 'warrior', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    name: '放血', desc: '失去 4 点生命,获得 2 点能量。', up: { desc: '失去 2 点生命,获得 2 点能量。' },
    play(A, inst) { A.loseHp(inst.up ? 2 : 4); A.gainEnergy(2); }
  });
  def({
    id: 'rampage', cls: 'warrior', type: 'attack', rarity: 'rare', cost: 1, dmg: 8, target: 'enemy',
    name: '狂暴', desc: '造成 {D} 点伤害。本场战斗中此牌伤害永久提高 5 点。',
    up: { desc: '造成 {D} 点伤害。本场战斗中此牌伤害永久提高 8 点。' },
    play(A, inst, t) { A.attack(t); A.permBoost(inst, inst.up ? 8 : 5); }
  });
  def({
    id: 'bludgeon', cls: 'warrior', type: 'attack', rarity: 'rare', cost: 3, dmg: 32, target: 'enemy',
    name: '重锤', desc: '造成 {D} 点伤害。',
    up: { dmg: 42, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'demonform', cls: 'warrior', type: 'power', rarity: 'rare', cost: 3, target: 'none',
    name: '恶魔形态', desc: '每回合开始时获得 2 点力量。', up: { desc: '每回合开始时获得 3 点力量。' },
    play(A, inst) { A.applySelf('ritual', inst.up ? 3 : 2); }
  });
  def({
    id: 'barricade', cls: 'warrior', type: 'power', rarity: 'rare', cost: 3, target: 'none',
    name: '路障', desc: '格挡不再在回合开始时消失。', up: { cost: 2, desc: '格挡不再在回合开始时消失。' },
    play(A) { A.applySelf('barricade', 1); }
  });
  def({
    id: 'impervious', cls: 'warrior', type: 'skill', rarity: 'rare', cost: 2, block: 30, exhaust: true, target: 'none',
    name: '金刚不坏', desc: '获得 {B} 点格挡。消耗。',
    up: { block: 40, desc: '获得 {B} 点格挡。消耗。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'feelnopain', cls: 'warrior', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    name: '麻痹痛楚', desc: '每当有牌被消耗时,获得 3 点格挡。', up: { desc: '每当有牌被消耗时,获得 4 点格挡。' },
    play(A, inst) { A.applySelf('feelNoPain', inst.up ? 4 : 3); }
  });
  def({
    id: 'reaper', cls: 'warrior', type: 'attack', rarity: 'rare', cost: 2, dmg: 4, exhaust: true, target: 'all',
    name: '收割', desc: '对所有敌人造成 {D} 点伤害,回复等同总伤害的生命。消耗。',
    up: { dmg: 5, desc: '对所有敌人造成 {D} 点伤害,回复等同总伤害的生命。消耗。' },
    play(A, inst) { const d = A.attackAll(); A.heal(d); }
  });
  def({
    id: 'offering', cls: 'warrior', type: 'skill', rarity: 'rare', cost: 0, exhaust: true, target: 'none',
    name: '献祭', desc: '失去 6 点生命,获得 2 点能量,抽 3 张牌。消耗。',
    up: { desc: '失去 6 点生命,获得 2 点能量,抽 5 张牌。消耗。' },
    play(A, inst) { A.loseHp(6); A.gainEnergy(2); A.draw(inst.up ? 5 : 3); }
  });

  def({
    id: 'bodyslam', cls: 'warrior', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 0, target: 'enemy',
    name: '全身撞击', desc: '造成等同当前格挡值的伤害。',
    up: { cost: 0, desc: '造成等同当前格挡值的伤害。' },
    play(A) { A.attackBonus(A.currentBlock()); A.attack(); }
  });
  def({
    id: 'soulcatch', cls: 'warrior', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    name: '灵魂收割', desc: '每当有牌被消耗,获得 1 点力量。', up: { desc: '每当有牌被消耗,获得 2 点力量。' },
    play(A, inst) { A.applySelf('soulCatch', inst.up ? 2 : 1); }
  });
  def({
    id: 'secondwind', cls: 'warrior', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '二次呼吸', desc: '消耗手牌中所有状态牌和诅咒牌,每张获得 8 点格挡。消耗。',
    up: { desc: '消耗手牌中所有状态牌和诅咒牌,每张获得 11 点格挡。消耗。' },
    play(A, inst) {
      const n = A.exhaustHandWhere(v => v.cls === 'status' || v.cls === 'curse');
      if (n > 0) A.gainBlock(n * (inst.up ? 11 : 8));
    }
  });

  /* ============ 游侠 ============ */
  def({
    id: 'neutralize', cls: 'ranger', type: 'attack', rarity: 'basic', cost: 1, dmg: 3, target: 'enemy',
    name: '致晕打击', desc: '造成 {D} 点伤害,施加 1 层虚弱。',
    up: { dmg: 4, desc: '造成 {D} 点伤害,施加 2 层虚弱。' },
    play(A, inst, t) { A.attack(t); A.applyTo(t, 'weak', inst.up ? 2 : 1); }
  });
  def({
    id: 'poisoncoat', cls: 'ranger', type: 'skill', rarity: 'basic', cost: 1, target: 'enemy',
    name: '淬毒', desc: '施加 3 层中毒。',
    up: { desc: '施加 4 层中毒。' },
    play(A, inst, t) { A.applyTo(t, 'poison', inst.up ? 4 : 3); }
  });
  def({
    id: 'sleeve', cls: 'ranger', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    name: '袖箭', desc: '将 1 张「刃」加入手牌。',
    up: { desc: '将 2 张「刃」加入手牌。' },
    play(A, inst) { A.addToken('shiv', inst.up ? 2 : 1); }
  });
  def({
    id: 'bladedance', cls: 'ranger', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '刀刃乱舞', desc: '将 3 张「刃」加入手牌。',
    up: { desc: '将 4 张「刃」加入手牌。' },
    play(A, inst) { A.addToken('shiv', inst.up ? 4 : 3); }
  });
  def({
    id: 'quickslash', cls: 'ranger', type: 'attack', rarity: 'common', cost: 1, dmg: 8, target: 'enemy',
    name: '快斩', desc: '造成 {D} 点伤害,抽 1 张牌。',
    up: { dmg: 12, desc: '造成 {D} 点伤害,抽 1 张牌。' },
    play(A) { A.attack(); A.draw(1); }
  });
  def({
    id: 'backstab', cls: 'ranger', type: 'attack', rarity: 'uncommon', cost: 0, dmg: 11, innate: true, target: 'enemy',
    name: '背刺', desc: '固有:在开局手牌中。造成 {D} 点伤害。',
    up: { dmg: 15, desc: '固有:在开局手牌中。造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'fumes', cls: 'ranger', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    name: '剧毒烟雾', desc: '每当你打出一张攻击牌,对其目标施加 2 层中毒。',
    up: { desc: '每当你打出一张攻击牌,对其目标施加 3 层中毒。' },
    play(A, inst) { A.applySelf('fumes', inst.up ? 3 : 2); }
  });
  def({
    id: 'acrobatics', cls: 'ranger', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '游走', desc: '抽 3 张牌,弃置 1 张牌。',
    up: { desc: '抽 4 张牌,弃置 1 张牌。' },
    play(A, inst) { A.draw(inst.up ? 4 : 3); A.chooseDiscard(1); }
  });
  def({
    id: 'prepared', cls: 'ranger', type: 'skill', rarity: 'common', cost: 0, target: 'none',
    name: '预备', desc: '抽 1 张牌,弃置 1 张牌。',
    up: { desc: '抽 2 张牌,弃置 2 张牌。' },
    play(A, inst) { const n = inst.up ? 2 : 1; A.draw(n); A.chooseDiscard(n); }
  });
  def({
    id: 'caltrops', cls: 'ranger', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    name: '尖刺陷阱', desc: '每当有敌人攻击你时,对该敌人造成 3 点伤害。',
    up: { desc: '每当有敌人攻击你时,对该敌人造成 5 点伤害。' },
    play(A, inst) { A.applySelf('thorns', inst.up ? 5 : 3); }
  });
  def({
    id: 'trip', cls: 'ranger', type: 'skill', rarity: 'common', cost: 0, target: 'enemy',
    name: '突袭', desc: '施加 2 层虚弱。',
    up: { desc: '施加 3 层虚弱。' },
    play(A, inst, t) { A.applyTo(t, 'weak', inst.up ? 3 : 2); }
  });
  def({
    id: 'deadlypoison', cls: 'ranger', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    name: '致命毒药', desc: '施加 5 层中毒。',
    up: { desc: '施加 8 层中毒。' },
    play(A, inst, t) { A.applyTo(t, 'poison', inst.up ? 8 : 5); }
  });
  def({
    id: 'predator', cls: 'ranger', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 15, target: 'enemy',
    name: '掠食者', desc: '造成 {D} 点伤害。下回合多抽 2 张牌。',
    up: { dmg: 20, desc: '造成 {D} 点伤害。下回合多抽 2 张牌。' },
    play(A) { A.attack(); A.applySelf('drawNext', 2); }
  });
  def({
    id: 'afterimage', cls: 'ranger', type: 'power', rarity: 'rare', cost: 1, target: 'none',
    name: '残影', desc: '每当你打出一张牌,获得 2 点格挡。',
    up: { desc: '每当你打出一张牌,获得 3 点格挡。' },
    play(A, inst) { A.applySelf('afterimage', inst.up ? 3 : 2); }
  });
  def({
    id: 'adrenaline', cls: 'ranger', type: 'skill', rarity: 'rare', cost: 0, exhaust: true, target: 'none',
    name: '极限反应', desc: '获得 1 点能量,抽 2 张牌。消耗。',
    up: { desc: '获得 2 点能量,抽 2 张牌。消耗。' },
    play(A, inst) { A.gainEnergy(inst.up ? 2 : 1); A.draw(2); }
  });
  def({
    id: 'catalyst', cls: 'ranger', type: 'skill', rarity: 'rare', cost: 1, exhaust: true, target: 'enemy',
    name: '催化', desc: '使目标的中毒层数翻倍。消耗。',
    up: { desc: '使目标的中毒层数变为三倍。消耗。' },
    play(A, inst, t) { A.multiplyPoison(t, inst.up ? 3 : 2); }
  });
  def({
    id: 'corpseexp', cls: 'ranger', type: 'skill', rarity: 'rare', cost: 2, target: 'enemy',
    name: '尸爆', desc: '施加「尸爆」:该敌人死亡时,对所有其他敌人造成等同其最大生命值的伤害。',
    up: { cost: 1, desc: '施加「尸爆」:该敌人死亡时,对所有其他敌人造成等同其最大生命值的伤害。' },
    play(A, inst, t) { A.applyTo(t, 'corpseExp', 1); }
  });
  def({
    id: 'stormsteel', cls: 'ranger', type: 'skill', rarity: 'rare', cost: 1, target: 'none',
    name: '钢铁风暴', desc: '弃置所有手牌,每弃置 1 张便将 1 张「刃」加入手牌。',
    up: { desc: '弃置所有手牌,每弃置 1 张便将 1 张「刃」加入手牌(本场「刃」伤害 +1)。' },
    play(A, inst) {
      if (inst.up) A.bonusShiv(1);
      const n = A.handSize();
      A.discardHand();
      A.addToken('shiv', n);
    }
  });
  def({
    id: 'thousandcuts', cls: 'ranger', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '千刀万剐', desc: '每当你打出一张牌,对所有敌人造成 1 点伤害。',
    up: { desc: '每当你打出一张牌,对所有敌人造成 2 点伤害。' },
    play(A, inst) { A.applySelf('cuts', inst.up ? 2 : 1); }
  });
  def({
    id: 'tactician', cls: 'ranger', type: 'skill', rarity: 'uncommon', cost: 0, unplayable: true, target: 'none',
    name: '战术家', desc: '无法打出。被弃置时,获得 1 点能量。',
    up: { desc: '无法打出。被弃置时,获得 2 点能量。' },
    onDiscard(A, inst) { A.gainEnergy(inst.up ? 2 : 1); }
  });
  def({
    id: 'venomstrike', cls: 'ranger', type: 'attack', rarity: 'common', cost: 1, dmg: 8, target: 'enemy',
    name: '蛇击', desc: '造成 {D} 点伤害。若目标带有中毒,伤害翻倍。',
    up: { dmg: 11, desc: '造成 {D} 点伤害。若目标带有中毒,伤害翻倍。' },
    play(A, inst, t) {
      if (A.poisonOf(t) > 0) A.attackBonus(CARDS.view({ id: inst.id, up: inst.up ? 1 : 0 }).dmg);
      A.attack();
    }
  });

  /* ============ 术士 ============ */
  def({
    id: 'soulfire', cls: 'warlock', type: 'attack', rarity: 'basic', cost: 1, dmg: 9, target: 'enemy',
    name: '灵魂之火', desc: '造成 {D} 点伤害,失去 2 点生命。',
    up: { dmg: 13, desc: '造成 {D} 点伤害,失去 2 点生命。' },
    play(A) { A.attack(); A.loseHp(2); }
  });
  def({
    id: 'siphon', cls: 'warlock', type: 'attack', rarity: 'basic', cost: 1, dmg: 4, target: 'enemy',
    name: '虹吸', desc: '造成 {D} 点伤害,回复 3 点生命。',
    up: { dmg: 6, desc: '造成 {D} 点伤害,回复 5 点生命。' },
    play(A, inst) { A.attack(); A.heal(inst.up ? 5 : 3); }
  });
  def({
    id: 'drain', cls: 'warlock', type: 'attack', rarity: 'common', cost: 1, dmg: 6, target: 'enemy',
    name: '生命虹吸', desc: '造成 {D} 点伤害,回复 3 点生命。',
    up: { dmg: 9, desc: '造成 {D} 点伤害,回复 5 点生命。' },
    play(A, inst) { A.attack(); A.heal(inst.up ? 5 : 3); }
  });
  def({
    id: 'fear', cls: 'warlock', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    name: '恐惧术', desc: '施加 2 层易伤。',
    up: { desc: '施加 3 层易伤。' },
    play(A, inst, t) { A.applyTo(t, 'vuln', inst.up ? 3 : 2); }
  });
  def({
    id: 'boneshield', cls: 'warlock', type: 'skill', rarity: 'common', cost: 1, block: 7, target: 'none',
    name: '骨盾', desc: '获得 {B} 点格挡。',
    up: { block: 10, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'impswarm', cls: 'warlock', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    name: '小鬼群', desc: '将 2 张「小鬼」加入手牌。',
    up: { desc: '将 3 张「小鬼」加入手牌。' },
    play(A, inst) { A.addToken('imp', inst.up ? 3 : 2); }
  });
  def({
    id: 'darkpact', cls: 'warlock', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    name: '契约', desc: '失去 5 点生命,抽 3 张牌。',
    up: { desc: '失去 5 点生命,抽 4 张牌。' },
    play(A, inst) { A.loseHp(5); A.draw(inst.up ? 4 : 3); }
  });
  def({
    id: 'abyssgaze', cls: 'warlock', type: 'skill', rarity: 'uncommon', cost: 1, target: 'all',
    name: '深渊凝视', desc: '对所有敌人施加 2 层易伤和 2 层虚弱。',
    up: { desc: '对所有敌人施加 3 层易伤和 3 层虚弱。' },
    play(A, inst) { const n = inst.up ? 3 : 2; A.applyAll('vuln', n); A.applyAll('weak', n); }
  });
  def({
    id: 'shadowbolt', cls: 'warlock', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 16, target: 'enemy',
    name: '暗影箭', desc: '造成 {D} 点伤害。',
    up: { dmg: 22, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'sacrifice', cls: 'warlock', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    name: '献灵', desc: '失去 4 点生命,获得 2 点能量。',
    up: { desc: '失去 2 点生命,获得 2 点能量。' },
    play(A, inst) { A.loseHp(inst.up ? 2 : 4); A.gainEnergy(2); }
  });
  def({
    id: 'soulburst', cls: 'warlock', type: 'attack', rarity: 'rare', cost: 2, dmg: 20, exhaust: true, target: 'enemy',
    name: '灵魂爆发', desc: '造成 {D} 点伤害。消耗。',
    up: { dmg: 26, desc: '造成 {D} 点伤害。消耗。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'echoform', cls: 'warlock', type: 'power', rarity: 'rare', cost: 3, target: 'none',
    name: '回响形态', desc: '每回合你打出的第一张牌会被打出两次。',
    up: { cost: 2, desc: '每回合你打出的第一张牌会被打出两次。' },
    play(A) { A.applySelf('echo', 1); }
  });
  def({
    id: 'bloodmagic', cls: 'warlock', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 15, target: 'enemy',
    name: '血魔法', desc: '失去 3 点生命,造成 {D} 点伤害。',
    up: { dmg: 20, desc: '失去 3 点生命,造成 {D} 点伤害。' },
    play(A) { A.loseHp(3); A.attack(); }
  });
  def({
    id: 'immolate', cls: 'warlock', type: 'attack', rarity: 'rare', cost: 2, dmg: 10, target: 'all', exhaust: true,
    name: '燃烧世界', desc: '对所有敌人造成 {D} 点伤害,将 1 张「灼伤」置入弃牌堆。消耗。',
    up: { dmg: 14, desc: '对所有敌人造成 {D} 点伤害,将 1 张「灼伤」置入弃牌堆。消耗。' },
    play(A) { A.attackAll(); A.addStatusToDiscard('burn', 1); }
  });
  def({
    id: 'harvest', cls: 'warlock', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 10, target: 'enemy',
    name: '灵魂收割', desc: '造成 {D} 点伤害。若此伤害击杀敌人,获得 1 点能量。',
    up: { dmg: 14, desc: '造成 {D} 点伤害。若此伤害击杀敌人,获得 1 点能量。' },
    play(A, inst, t) { const killed = A.attack(); if (killed) A.gainEnergy(1); }
  });
  def({
    id: 'arcanestorm', cls: 'warlock', type: 'attack', rarity: 'rare', cost: 'X', dmg: 7, target: 'random',
    name: '奥术风暴', desc: '消耗所有能量。随机敌人造成 {D} 点伤害,每消耗 1 点能量攻击一次。',
    up: { dmg: 10, desc: '消耗所有能量。随机敌人造成 {D} 点伤害,每消耗 1 点能量攻击一次。' },
    play(A) { const x = A.spendAllEnergy(); if (x > 0) A.attackRandom({ times: x }); }
  });
  def({
    id: 'timeripple', cls: 'warlock', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    name: '时之涟漪', desc: '抽 2 张牌。',
    up: { desc: '抽 3 张牌。' },
    play(A, inst) { A.draw(inst.up ? 3 : 2); }
  });
  def({
    id: 'bloodrage', cls: 'warlock', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '血怒', desc: '每回合开始时获得 2 点力量,并失去 2 点生命。',
    up: { desc: '每回合开始时获得 3 点力量,并失去 2 点生命。' },
    play(A, inst) { A.applySelf('bloodRage', inst.up ? 3 : 2); }
  });
  def({
    id: 'apocalypse', cls: 'warlock', type: 'attack', rarity: 'rare', cost: 3, dmg: 26, target: 'enemy',
    name: '末日审判', desc: '本回合每失去 1 点生命,便额外造成 1 点伤害。造成 {D} 点伤害。',
    up: { dmg: 32, desc: '本回合每失去 1 点生命,便额外造成 1 点伤害。造成 {D} 点伤害。' },
    play(A) { A.attackBonus(A.hpLostThisTurn()); A.attack(); }
  });

  def({
    id: 'bloodpact', cls: 'warlock', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '献祭契约', desc: '每当你因卡牌失去生命,对所有敌人造成等量伤害。',
    up: { cost: 1, desc: '每当你因卡牌失去生命,对所有敌人造成等量伤害。' },
    play(A) { A.applySelf('bloodPact', 1); }
  });
  def({
    id: 'soulrip', cls: 'warlock', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 6, target: 'enemy',
    name: '灵魂撕裂', desc: '造成 {D} 点伤害。若本回合你失去过生命,再造成一次。',
    up: { dmg: 8, desc: '造成 {D} 点伤害。若本回合你失去过生命,再造成一次。' },
    play(A, inst, t) { A.attack(t, { times: A.hpLostThisTurn() > 0 ? 2 : 1 }); }
  });

  /* ============ 无色牌(商店/事件) ============ */
  def({
    id: 'swiftcut', cls: 'colorless', type: 'attack', rarity: 'uncommon', cost: 0, dmg: 6, target: 'enemy',
    name: '疾风斩', desc: '造成 {D} 点伤害。', up: { dmg: 9, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'bulwark', cls: 'colorless', type: 'skill', rarity: 'uncommon', cost: 0, block: 8, target: 'none',
    name: '壁垒', desc: '获得 {B} 点格挡。', up: { block: 11, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'dismay', cls: 'colorless', type: 'skill', rarity: 'uncommon', cost: 0, target: 'all',
    name: '恐慌', desc: '对所有敌人施加 2 层虚弱。', up: { desc: '对所有敌人施加 3 层虚弱。' },
    play(A, inst) { A.applyAll('weak', inst.up ? 3 : 2); }
  });
  def({
    id: 'insight', cls: 'colorless', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    name: '洞察', desc: '抽 2 张牌。', up: { desc: '抽 3 张牌。' },
    play(A, inst) { A.draw(inst.up ? 3 : 2); }
  });
  def({
    id: 'lifefount', cls: 'colorless', type: 'skill', rarity: 'rare', cost: 1, exhaust: true, target: 'none',
    name: '生命之泉', desc: '回复 12 点生命。消耗。', up: { desc: '回复 18 点生命。消耗。' },
    play(A, inst) { A.heal(inst.up ? 18 : 12); }
  });
  def({
    id: 'criticalhit', cls: 'colorless', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 12, target: 'enemy',
    name: '致命一击', desc: '造成 {D} 点伤害。', up: { dmg: 16, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'bloodinstinct', cls: 'colorless', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    name: '血性本能', desc: '失去 3 点生命,抽 2 张牌。',
    up: { desc: '失去 2 点生命,抽 2 张牌。' },
    play(A, inst) { A.loseHp(inst.up ? 2 : 3); A.draw(2); }
  });

  /* ============ 诅咒 ============ */
  def({
    id: 'wound', cls: 'curse', type: 'curse', rarity: 'special', cost: 0, unplayable: true, target: 'none',
    name: '伤口', desc: '无法打出。', up: {}
  });
  def({
    id: 'decay', cls: 'curse', type: 'curse', rarity: 'special', cost: 0, unplayable: true, target: 'none',
    name: '衰亡', desc: '无法打出。回合结束时,若在手牌中,失去 3 点生命。', up: {}
  });
  def({
    id: 'pain', cls: 'curse', type: 'curse', rarity: 'special', cost: 0, unplayable: true, target: 'none',
    name: '剧痛', desc: '无法打出。当你打出其他牌时,每有一张「剧痛」在手牌中便失去 1 点生命。', up: {}
  });

  /* ============ 状态牌(敌人施加) ============ */
  def({
    id: 'burn', cls: 'status', type: 'status', rarity: 'special', cost: 0, unplayable: true, target: 'none',
    name: '灼伤', desc: '无法打出。回合结束时,若在手牌中,失去 2 点生命。', up: {}
  });
  def({
    id: 'dazed', cls: 'status', type: 'status', rarity: 'special', cost: 0, unplayable: true, ethereal: true, target: 'none',
    name: '眩晕', desc: '无法打出。虚无:回合结束时若在手牌中则消耗。', up: {}
  });
  def({
    id: 'slimed', cls: 'status', type: 'status', rarity: 'special', cost: 1, target: 'none', exhaust: true,
    name: '黏液', desc: '消耗。', up: {}
  });

  /* ============ 衍生牌 ============ */
  def({
    id: 'shiv', cls: 'special', type: 'attack', rarity: 'special', cost: 0, dmg: 4, exhaust: true, target: 'enemy',
    name: '刃', desc: '造成 {D} 点伤害。消耗。', up: {}
  });
  def({
    id: 'imp', cls: 'special', type: 'attack', rarity: 'special', cost: 0, dmg: 3, exhaust: true, target: 'enemy',
    name: '小鬼', desc: '造成 {D} 点伤害。消耗。', up: {}
  });

  /* ============ 查询接口 ============ */
  const CARDS = {
    defs: C,
    get(id) { return C[id]; },
    // 合并升级补丁,返回计算后的定义快照
    view(inst) {
      const d = C[inst.id];
      if (!d) throw new Error('未知卡牌: ' + inst.id);
      if (!inst.up || !d.up) return d;
      return Object.assign({}, d, d.up);
    },
    upgradeable(id) {
      const d = C[id];
      return d && d.up && Object.keys(d.up).length > 0;
    },
    // 职业奖励池
    pool(cls, rarity) {
      const out = [];
      for (const id in C) {
        const d = C[id];
        if (d.rarity === rarity && (d.cls === cls || d.cls === 'none') && d.rarity !== 'basic') out.push(id);
      }
      return out;
    },
    colorlessPool(rarity) {
      const out = [];
      for (const id in C) { if (C[id].cls === 'colorless' && C[id].rarity === rarity) out.push(id); }
      return out;
    },
    starterDeck(cls) {
      const deck = [];
      for (let i = 0; i < 5; i++) deck.push({ id: 'strike', up: 0 });
      for (let i = 0; i < 4; i++) deck.push({ id: 'defend', up: 0 });
      if (cls === 'warrior') deck.push({ id: 'bash', up: 0 });
      if (cls === 'ranger') deck.push({ id: 'neutralize', up: 0 });
      if (cls === 'warlock') deck.push({ id: 'soulfire', up: 0 });
      return deck;
    },
    STATUS_TEXT: {
      str: '力量', tempStr: '力量(临时)', dex: '敏捷', vuln: '易伤', weak: '虚弱', frail: '脆弱',
      poison: '中毒', metal: '金属化', thorns: '荆棘', ritual: '仪式', artifact: '护盾术',
      barricade: '路障', echo: '回响', corpseExp: '尸爆', fumes: '剧毒烟雾', cuts: '千刀万剐',
      afterimage: '残影', feelNoPain: '麻痹痛楚', drawNext: '抽牌', bloodRage: '血怒', regen: '再生',
      soulCatch: '灵魂收割', bloodPact: '献祭契约'
    }
  };

  global.GS.CARDS = CARDS;
})(typeof window !== 'undefined' ? window : globalThis);
