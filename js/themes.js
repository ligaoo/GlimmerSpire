/* 微光尖塔 - 联动主题(特殊卡组)数据库
   每个主题 = 一套专属职业卡池 + 专属初始卡组/遗物 + 专属敌人与 BOSS + 独立闯关模式(镜域)
   主题卡牌同样注册进 GS.CARDS,通过 CARDS.pool() 按 cls 取用 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};
  const CARDS = global.GS.CARDS;
  if (!CARDS) throw new Error('themes.js 必须在 cards.js 之后加载');

  function def(d) { CARDS.defs[d.id] = d; }
  const E = {};   // 主题敌人定义(由引擎合并进 GS.ENEMIES)
  function edef(d) { E[d.id] = d; }

  const THEMES = [];

  /* ================================================================
     主题一 · 神秘复苏
     关键词:鬼(随从状态,打出牌时触发)、魂火(可叠加层数)、
             阴阳眼(开眼层数,满层爆发)、诡气(全局污染,影响镜域)
     ================================================================ */
  const MYST = {
    id: 'mystery',
    cls: 'mystery',
    name: '神秘复苏',
    art: '🕯️',
    tag: '鬼物 · 复苏',
    desc: '鬼潮复苏的年代。<br>驭鬼者以魂火镇压厉鬼,把鬼养在自己身上。',
    relic: '镇魂铃:每场战斗开始时,随机获得一只「鬼」',
    tip: '鬼会持续触发;魂火层数决定鬼的威力;阴阳眼满 10 层会自行开眼并爆发。',
    fieldLabel: '镜域',
    fieldMax: 10,
    curseDmg: 2,
    curseHp: 0.05,
    startHp: 75,
    starterDeck: ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'soulfire'],
    starterRelic: 'mystbell',
    basic: ['mn_strike', 'mn_defend'],
    pool: [
      'mn_strike', 'mn_defend', 'mn_candle', 'mn_soulfire', 'mn_mirror',
      'mn_ghostcall', 'mn_paperdoll', 'mn_nether', 'mn_talisman', 'mn_lamp',
      'mn_mirrorghost', 'mn_hangghost', 'mn_bloodghost', 'mn_ghostking',
      'mn_hellflower', 'mn_coffinhill', 'mn_eye', 'mn_carrycoffin',
      'mn_livingdead', 'mn_lifegive', 'mn_hundredghosts', 'mn_returnlife'
    ],
    tokens: ['mn_burnghost', 'mn_soulflame'],
    relics: ['mystbell', 'mystmirror', 'mysteye', 'mystpagoda', 'mystcoffin', 'mystwood', 'mystreverse'],
    allyDefs: [
      { id: 'mn_a_dog', name: '忠犬厉鬼', art: '🐕', cost: 150, starter: true,
        desc: '每回合开始时,对随机敌人造成 4 点伤害。',
        synergy: { ids: ['mn_mirrorghost', 'mn_hangghost', 'mn_bloodghost', 'mn_ghostking'], name: '人鬼同猎',
          note: '打出「鬼」牌时,忠犬扑咬:对随机敌人造成 3 点伤害',
          fx(A) { A.attackRandom({ dmg: 3, times: 1 }); } },
        turnStart(A) { A.dmgRandom(4); } },
      { id: 'mn_a_dream', name: '鬼梦', art: '🌙', cost: 140, starter: true,
        desc: '每回合开始时,获得 4 点格挡。',
        synergy: { ids: ['mn_eye'], name: '梦中开眼',
          note: '打出「阴阳眼」时,额外累积 2 层阴阳眼',
          fx(A) { A.addEye(2); } },
        turnStart(A) { A.block(4); } },
      { id: 'mn_a_headless', name: '无头鬼影', art: '👥', cost: 130, starter: true,
        desc: '每回合开始时,随机敌人获得 1 层易伤。',
        synergy: { ids: ['mn_nether', 'mn_talisman'], name: '鬼影缠身',
          note: '打出「镇魂」或「驱邪符」时,额外对所有敌人施加 1 层易伤',
          fx(A) { A.applyAll('vuln', 1); } },
        turnStart(A) { A.vulnRandom(1); } },
      { id: 'mn_a_jiang', name: '江艳', art: '🍚', cost: 120,
        desc: '每回合开始时,回复 3 点生命。',
        synergy: { ids: ['mn_lifegive'], name: '生活伴侣',
          note: '打出「续命」时,额外回复 6 点生命',
          fx(A) { A.heal(6); } },
        turnStart(A) { A.heal(3); } },
      { id: 'mn_a_zhang', name: '张伟', art: '💰', cost: 160,
        desc: '每场战斗胜利后,获得 35 金币。',
        onVictory(A) { A.gold(35); } }
    ],
    relicDefs: [
      { id: 'mystbell', name: '镇魂铃', art: '🔔', rarity: 'starter', theme: 'mystery',
        desc: '每场战斗开始时,随机获得一只「鬼」。' },
      { id: 'mystmirror', name: '照魂镜', art: '🪞', rarity: 'common', theme: 'mystery',
        desc: '每场战斗开始时,施加 3 层魂火。' },
      { id: 'mysteye', name: '鬼眼玉', art: '👁️', rarity: 'common', theme: 'mystery',
        desc: '阴阳眼累积速度 +50%。' },
      { id: 'mystpagoda', name: '镇魔塔', art: '🗼', rarity: 'uncommon', theme: 'mystery',
        desc: '战斗开始时为所有敌人施加 1 层「镇压」(造成的伤害 -25%)。' },
      { id: 'mystcoffin', name: '养鬼棺', art: '⚰️', rarity: 'uncommon', theme: 'mystery',
        desc: '每场战斗的第一次「鬼」触发额外触发一次。' },
      { id: 'mystwood', name: '鬼烛', art: '🕯️', rarity: 'common', theme: 'mystery',
        desc: '战斗胜利后回复 3 点生命。', healOnWin: 3 },
      { id: 'mystreverse', name: '阴阳逆转', art: '☯️', rarity: 'rare', theme: 'mystery',
        desc: '阴阳眼不会转化为生命流失,而是在开眼时额外对所有敌人造成 15 点伤害。' }
    ],
    acts: [
      {
        name: '鬼域·荒村',
        rows: 10,
        intro: '荒村夜雨。纸人立在巷口,等待着替死的人。',
        normal: [['mn_paperman'], ['mn_paperman', 'mn_paperman'], ['mn_talisman'], ['mn_mirror'], ['mn_mirror', 'mn_paperman']],
        elite: [['mn_redbride'], ['mn_mirror', 'mn_mirror', 'mn_paperman']],
        boss: [['mn_ghostface']]
      },
      {
        name: '鬼域·阴阳临界',
        rows: 12,
        intro: '生与死的界线开始模糊,镜中有第二个你在微笑。',
        normal: [['mn_mirror', 'mn_talisman'], ['mn_chosen'], ['mn_bride'], ['mn_paperknife', 'mn_paperman'], ['mn_skindealer']],
        elite: [['mn_bride', 'mn_mirror'], ['mn_skindealer', 'mn_paperknife']],
        boss: [['mn_knife']]
      },
      {
        name: '鬼域·鬼潮之城',
        rows: 14,
        intro: '整座城市都在复苏。街道上的每一张脸都不属于活人。',
        normal: [['mn_ghostking'], ['mn_mirror', 'mn_mirror', 'mn_mirror'], ['mn_bride', 'mn_skindealer'], ['mn_chosen', 'mn_chosen'], ['mn_skindealer', 'mn_paperknife', 'mn_talisman']],
        elite: [['mn_ghostking', 'mn_mirror'], ['mn_bride', 'mn_skindealer', 'mn_mirror']],
        boss: [['mn_yinyang']]
      }
    ],
    npcs: [
      { type: 'curse', name: '鬼物祭坛', art: '🩸', text: '祭坛上摆着未熄的香。有人在等你留下什么。' },
      { type: 'curse', name: '镜中低语', art: '🪞', text: '镜子里的人比你先一步开口。' },
      { type: 'ward', name: '镇魂结界', art: '🛡️', text: '老道士的结界还残存着力量。' }
    ]
  };

  /* ---- 神秘复苏:卡牌 ---- */
  def({
    id: 'mn_strike', cls: 'mystery', type: 'attack', rarity: 'basic', cost: 1, dmg: 6, target: 'enemy',
    name: '驱鬼击', desc: '造成 {D} 点伤害。',
    up: { dmg: 9, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'mn_defend', cls: 'mystery', type: 'skill', rarity: 'basic', cost: 1, block: 5, target: 'none',
    name: '护魂', desc: '获得 {B} 点格挡。',
    up: { block: 8, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'mn_candle', cls: 'mystery', type: 'attack', rarity: 'common', cost: 1, dmg: 7, ce: 3, target: 'enemy',
    name: '魂火焚身', desc: '消耗 {C} 点魂火,造成 {D} 点伤害。若魂火不足则无法使用此牌的火力。',
    up: { dmg: 10, desc: '消耗 {C} 点魂火,造成 {D} 点伤害。' },
    play(A, inst, t) { const n = A.spendSoulfire(inst.up ? 3 : 2); A.attackBonus(n * 3); A.attack(t); }
  });
  def({
    id: 'mn_soulfire', cls: 'mystery', type: 'skill', rarity: 'basic', cost: 0, target: 'none',
    name: '引火', desc: '获得 2 层魂火。',
    up: { desc: '获得 3 层魂火。' },
    play(A, inst) { A.addSoulfire(inst.up ? 3 : 2); }
  });
  def({
    id: 'mn_mirror', cls: 'mystery', type: 'attack', rarity: 'common', cost: 1, dmg: 8, target: 'enemy',
    name: '鬼镜', desc: '造成 {D} 点伤害,获得 1 层魂火。',
    up: { dmg: 11, desc: '造成 {D} 点伤害,获得 2 层魂火。' },
    play(A, inst, t) { A.attack(t); A.addSoulfire(inst.up ? 2 : 1); }
  });
  def({
    id: 'mn_ghostcall', cls: 'mystery', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '唤魂', desc: '随机获得一只「鬼」(已有鬼则替换),然后获得 1 层魂火。',
    up: { desc: '随机获得一只「鬼」,获得 3 层魂火并抽 1 张牌。' },
    play(A, inst) {
      A.setGhost(A.randomGhost(), 1);
      if (inst.up) { A.addSoulfire(3); A.draw(1); }
      else A.addSoulfire(1);
    }
  });
  def({
    id: 'mn_paperdoll', cls: 'mystery', type: 'skill', rarity: 'common', cost: 1, block: 8, ethereal: true, target: 'none',
    name: '纸人替身', desc: '虚无。获得 {B} 点格挡,抽 1 张牌。',
    up: { block: 11, desc: '虚无。获得 {B} 点格挡,抽 2 张牌。' },
    play(A, inst) { A.gainBlock(); A.draw(inst.up ? 2 : 1); }
  });
  def({
    id: 'mn_nether', cls: 'mystery', type: 'skill', rarity: 'common', cost: 1, target: 'all',
    name: '镇魂', desc: '为所有敌人施加 2 层「镇压」(其造成的伤害 -25%)。镜域之值 -1。',
    up: { desc: '为所有敌人施加 3 层「镇压」。镜域之值 -2。' },
    play(A, inst) { A.applyAll('seal', inst.up ? 3 : 2); A.modifyField(inst.up ? -2 : -1); }
  });
  def({
    id: 'mn_talisman', cls: 'mystery', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    name: '驱邪符', desc: '施加 3 层易伤,并使鬼立即触发一次。',
    up: { desc: '施加 4 层易伤,并使鬼立即触发一次。' },
    play(A, inst, t) { A.applyTo(t, 'vuln', inst.up ? 4 : 3); A.triggerGhost(); }
  });
  def({
    id: 'mn_lamp', cls: 'mystery', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    name: '引魂灯', desc: '抽 3 张牌,失去 3 点生命。',
    up: { cost: 0, desc: '抽 3 张牌,失去 3 点生命。' },
    play(A) { A.draw(3); A.loseHp(3); }
  });
  def({
    id: 'mn_mirrorghost', cls: 'mystery', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '鬼·镜中人', desc: '获得「镜中人」:每当你打出一张牌,获得 6 点格挡。消耗。',
    up: { desc: '获得「镜中人」:每当你打出一张牌,获得 8 点格挡。消耗。' },
    play(A, inst) { A.setGhost('mn_mirrorghost', inst.up ? 8 : 6); }
  });
  def({
    id: 'mn_hangghost', cls: 'mystery', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '鬼·吊死鬼', desc: '获得「吊死鬼」:每当你打出一张牌,对随机敌人造成 3 点伤害。消耗。',
    up: { desc: '获得「吊死鬼」:每当你打出一张牌,对随机敌人造成 4 点伤害。消耗。' },
    play(A, inst) { A.setGhost('mn_hangghost', inst.up ? 4 : 3); }
  });
  def({
    id: 'mn_bloodghost', cls: 'mystery', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '鬼·血鬼', desc: '获得「血鬼」:每当你打出一张牌,回复 1 点生命。消耗。',
    up: { desc: '获得「血鬼」:每当你打出一张牌,回复 2 点生命。消耗。' },
    play(A, inst) { A.setGhost('mn_bloodghost', inst.up ? 2 : 1); }
  });
  def({
    id: 'mn_ghostking', cls: 'mystery', type: 'skill', rarity: 'uncommon', cost: 2, exhaust: true, target: 'none',
    name: '鬼·鬼王', desc: '获得「鬼王」:每当你打出一张牌,造成 5 点伤害。消耗。',
    up: { cost: 1, desc: '获得「鬼王」:每当你打出一张牌,造成 5 点伤害。消耗。' },
    play(A) { A.setGhost('mn_ghostking', 5); }
  });
  def({
    id: 'mn_hellflower', cls: 'mystery', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '彼岸花', desc: '获得 2 点力量;每当你打出一张牌,获得 1 层魂火。',
    up: { desc: '获得 3 点力量;每当你打出一张牌,获得 1 层魂火。' },
    play(A, inst) { A.applySelf('str', inst.up ? 3 : 2); A.applySelf('mystBloom', 1); }
  });
  def({
    id: 'mn_coffinhill', cls: 'mystery', type: 'skill', rarity: 'rare', cost: 2, block: 22, target: 'none',
    name: '棺山', desc: '获得 {B} 点格挡,失去 3 点生命。',
    up: { block: 28, desc: '获得 {B} 点格挡,失去 3 点生命。' },
    play(A) { A.gainBlock(); A.loseHp(3); }
  });
  def({
    id: 'mn_eye', cls: 'mystery', type: 'power', rarity: 'rare', cost: 1, target: 'none',
    name: '阴阳眼', desc: '每当你获得格挡,额外获得 3 点格挡,并累积 1 层阴阳眼。',
    up: { desc: '每当你获得格挡,额外获得 4 点格挡,并累积 1 层阴阳眼。' },
    play(A, inst) { A.applySelf('yinyang', inst.up ? 4 : 3); }
  });
  def({
    id: 'mn_carrycoffin', cls: 'mystery', type: 'attack', rarity: 'rare', cost: 2, dmg: 12, target: 'enemy',
    name: '背棺人', desc: '造成 {D} 点伤害,获得 12 点格挡,累积 2 层阴阳眼。',
    up: { dmg: 16, block: 16, desc: '造成 {D} 点伤害,获得 16 点格挡,累积 2 层阴阳眼。' },
    play(A, inst, t) { A.attack(t); A.gainBlock(inst.up ? 16 : 12); A.addEye(2); }
  });
  def({
    id: 'mn_livingdead', cls: 'mystery', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '活尸', desc: '本场战斗中,首次受到致命伤害时不死,并回复 40% 生命(每场战斗一次)。',
    up: { cost: 1, desc: '本场战斗中,首次受到致命伤害时不死,并回复 40% 生命(每场战斗一次)。' },
    play(A) { A.applySelf('undying', 1); }
  });
  def({
    id: 'mn_lifegive', cls: 'mystery', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '续命', desc: '回复 14 点生命。消耗。',
    up: { desc: '回复 20 点生命。消耗。' },
    play(A, inst) { A.heal(inst.up ? 20 : 14); }
  });
  /* 衍生牌 */
  def({
    id: 'mn_burnghost', cls: 'special', type: 'attack', rarity: 'special', cost: 0, dmg: 6, exhaust: true, target: 'enemy',
    name: '灼魂', desc: '造成 {D} 点伤害。消耗。', up: {},
    play(A) { A.attack(); }
  });
  def({
    id: 'mn_soulflame', cls: 'special', type: 'skill', rarity: 'special', cost: 0, exhaust: true, target: 'none',
    name: '魂火', desc: '获得 1 层魂火。消耗。', up: {},
    play(A) { A.addSoulfire(1); }
  });

  /* ---- 神秘复苏:遗物已在上方 relicDefs / relics 中声明 ---- */

  /* ---- 神秘复苏:敌人 ---- */
  edef({
    id: 'mn_paperman', name: '纸人', art: '📄', maxHp: [26, 30],
    moves: {
      cut: { name: '纸刃', intent: 'attack', dmg: 7, exec(A) { A.attack(); } },
      stack: { name: '重叠', intent: 'defend', exec(A) { A.gainSelfBlock(6); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.7) ? 'cut' : 'stack'; }
  });
  edef({
    id: 'mn_talisman', name: '符鬼', art: '🧿', maxHp: [30, 34],
    moves: {
      burn: { name: '符火', intent: 'attack', dmg: 8, exec(A) { A.attack(); } },
      curse: { name: '咒印', intent: 'debuff', exec(A) { A.debuffPlayer('weak', 2); A.debuffPlayer('frail', 1); } }
    },
    ai(self, ctx) { return ctx.turn % 2 === 1 ? 'burn' : 'curse'; }
  });
  edef({
    id: 'mn_mirror', name: '镜鬼', art: '🪞', maxHp: [34, 38],
    moves: {
      reflect: { name: '映照', intent: 'attackDefend', dmg: 8, exec(A) { A.attack(); A.gainSelfBlock(5); } },
      mirror: { name: '镜面', intent: 'buff', exec(A) { A.buffSelf('thorns', 3); } },
      crack: { name: '碎裂', intent: 'attack', dmg: 11, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'reflect';
      return GS.RNG.weighted(ctx.run, ['reflect', 'mirror', 'crack'], [3, 2, 3]);
    }
  });
  edef({
    id: 'mn_redbride', name: '红衣新娘', art: '👰', maxHp: [76, 82], elite: true,
    moves: {
      veil: { name: '血纱', intent: 'attackDebuff', dmg: 10, exec(A) { A.attack(); A.debuffPlayer('vuln', 2); } },
      wail: { name: '哭嫁', intent: 'buff', exec(A) { A.buffSelf('str', 3); A.gainSelfBlock(8); } },
      drain: { name: '摄魂', intent: 'strong', dmg: 13, exec(A) { A.attack(); A.healSelf(6); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'wail';
      return GS.RNG.weighted(ctx.run, ['veil', 'wail', 'drain'], [4, 2, 3]);
    }
  });
  edef({
    id: 'mn_ghostface', name: '鬼面人', art: '👹', maxHp: [122, 132], boss: true,
    moves: {
      claw: { name: '鬼爪', intent: 'attack', dmg: 12, exec(A) { A.attack(); } },
      mask: { name: '千面', intent: 'buff', exec(A) { A.buffSelf('str', 3); A.gainSelfBlock(10); } },
      night: { name: '鬼夜', intent: 'attackDebuff', dmg: 8, exec(A) { A.attack(); A.addStatusToDiscard('mn_burnghost', 1); A.debuffPlayer('weak', 2); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (ctx.turn === 1) return 'mask';
      if (phase2 && !self._p2) { self._p2 = true; return 'night'; }
      return phase2
        ? ['claw', 'night', 'claw', 'mask'][(ctx.turn - 1) % 4]
        : ['claw', 'claw', 'mask'][(ctx.turn - 1) % 3];
    }
  });
  edef({
    id: 'mn_chosen', name: '被选者', art: '🧟', maxHp: [52, 58],
    moves: {
      slam: { name: '尸击', intent: 'attack', dmg: 12, exec(A) { A.attack(); } },
      feast: { name: '吞食', intent: 'attack', dmg: 8, exec(A) { A.attack(); A.healSelf(8); } },
      eye: { name: '开眼', intent: 'buff', exec(A) { A.buffSelf('str', 2); A.gainSelfBlock(6); A.revealWeakness(); } }
    },
    init(self, run) { self.statuses.str = GS.RNG.int(run, 0, 2); },
    ai(self, ctx) { return GS.RNG.weighted(ctx.run, ['slam', 'feast', 'eye'], [4, 3, 2]); }
  });
  edef({
    id: 'mn_bride', name: '鬼新娘', art: '🎎', maxHp: [60, 66],
    moves: {
      grasp: { name: '索命', intent: 'attack', dmg: 14, exec(A) { A.attack(); } },
      curse: { name: '冥婚', intent: 'debuff', exec(A) { A.debuffPlayer('vuln', 2); A.debuffPlayer('weak', 2); } },
      shroud: { name: '披麻', intent: 'defend', exec(A) { A.gainSelfBlock(12); } }
    },
    ai(self, ctx) { return GS.RNG.weighted(ctx.run, ['grasp', 'curse', 'shroud'], [4, 3, 2]); }
  });
  edef({
    id: 'mn_paperknife', name: '纸人刺客', art: '🔪', maxHp: [40, 44],
    moves: {
      stab: { name: '刺纸', intent: 'attack', dmg: 9, exec(A) { A.attack(); A.attack(); } },
      hide: { name: '潜藏', intent: 'defend', exec(A) { A.gainSelfBlock(8); A.buffSelf('str', 2); } }
    },
    ai(self, ctx) { return ctx.turn % 3 === 0 ? 'hide' : 'stab'; }
  });
  edef({
    id: 'mn_skindealer', name: '画皮鬼', art: '🎭', maxHp: [76, 84],
    moves: {
      peel: { name: '剥皮', intent: 'attackDebuff', dmg: 13, exec(A) { A.attack(); A.debuffPlayer('frail', 3); } },
      wear: { name: '披皮', intent: 'buff', exec(A) { A.buffSelfMaxHp(8); A.gainSelfBlock(10); } },
      mimic: { name: '拟形', intent: 'strong', dmg: 17, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'peel';
      return GS.RNG.weighted(ctx.run, ['peel', 'wear', 'mimic'], [4, 2, 3]);
    }
  });
  edef({
    id: 'mn_knife', name: '刀鬼', art: '🗡️', maxHp: [165, 175], boss: true,
    moves: {
      slash: { name: '鬼刀', intent: 'attack', dmg: 18, exec(A) { A.attack(); } },
      storm: { name: '刀狱', intent: 'attack', dmg: 9, hits: 3, exec(A) { A.attack({ times: 3 }); } },
      sharpen: { name: '磨刀', intent: 'buff', exec(A) { A.buffSelf('str', 3); A.gainSelfBlock(12); } },
      guillotine: { name: '断头台', intent: 'strong', dmg: 34, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (ctx.turn === 1) return 'sharpen';
      if (phase2 && !self._p2) { self._p2 = true; return 'guillotine'; }
      return phase2
        ? ['slash', 'storm', 'guillotine', 'sharpen'][(ctx.turn - 1) % 4]
        : ['slash', 'slash', 'storm', 'sharpen'][(ctx.turn - 1) % 4];
    }
  });
  edef({
    id: 'mn_ghostking', name: '鬼王', art: '😈', maxHp: [72, 78],
    moves: {
      crush: { name: '镇压', intent: 'attack', dmg: 15, exec(A) { A.attack(); } },
      domain: { name: '鬼域', intent: 'buff', exec(A) { A.buffSelf('str', 3); A.gainAlliesBlock(6); A.revealWeakness(); } },
      roar: { name: '鬼啸', intent: 'attackDebuff', dmg: 9, exec(A) { A.attack(); A.modifyField(1); } }
    },
    ai(self, ctx) { return GS.RNG.weighted(ctx.run, ['crush', 'domain', 'roar'], [4, 2, 3]); }
  });
  edef({
    id: 'mn_yinyang', name: '阴阳鬼王', art: '🕯️', maxHp: [285, 300], boss: true,
    moves: {
      yin: { name: '阴司', intent: 'attackDebuff', dmg: 21, exec(A) { A.attack(); A.debuffPlayer('vuln', 2); } },
      yang: { name: '阳世', intent: 'buff', exec(A) { A.buffSelf('str', 4); A.gainSelfBlock(16); } },
      absorb: { name: '吞火', intent: 'strong', dmg: 27, exec(A) { A.attack(); A.healSelf(14); } },
      revive: { name: '复苏', intent: 'buff', exec(A) { A.summon('mn_mirror'); A.buffSelfMaxHp(10); A.gainSelfBlock(8); } }
    },
    ai(self, ctx) {
      const phase = self.hp < self.maxHp * 0.45;
      if (ctx.turn === 1) return 'yang';
      if (phase && !self._p2) { self._p2 = true; return 'revive'; }
      return ['yin', 'yang', 'absorb'][(ctx.turn - 1) % 3];
    }
  });

  MYST.enemyIds = Object.keys(E).filter(k => k.startsWith('mn_'));
  THEMES.push(MYST);

  /* ================================================================
     主题二 · 咒术回战
     关键词:咒力(战斗内资源,可支付与强化)、咒术(每回合首次免费)、
             领域(战场之值,满值会恶化)、黑闪(暴击,双倍伤害并积攒咒力)
     ================================================================ */
  const JJK = {
    id: 'jjk',
    cls: 'jjk',
    name: '咒术回战',
    art: '👐',
    tag: '咒术 · 领域',
    desc: '诅咒由人心而生,咒术师以咒力祓除诅咒。<br>以领域为赌注,一决胜负。',
    relic: '咒力核心:每场战斗开始时获得 3 点咒力,并累积 2 层领域',
    tip: '咒力是战斗内的燃料;每回合第一张咒术牌免费;黑闪有 25% 几率暴击;领域积满会反噬,也会解锁「领域展开」。',
    fieldLabel: '领域',
    fieldMax: 12,
    curseHp: 0.05,
    startHp: 80,
    starterDeck: ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'jj_ce'],
    starterRelic: 'jjkcore',
    basic: ['jj_strike', 'jj_defend', 'jj_ce'],
    pool: [
      'jj_strike', 'jj_defend', 'jj_ce', 'jj_dismantle', 'jj_blue', 'jj_limitless',
      'jj_domainless', 'jj_red', 'jj_weave', 'jj_swap', 'jj_seal', 'jj_divergent',
      'jj_reverse', 'jj_sixeyes', 'jj_shadow', 'jj_domain', 'jj_blackflash',
      'jj_purple', 'jj_empty', 'jj_malevolent', 'jj_fuga', 'jj_yun', 'jj_manevolent'
    ],
    tokens: ['jj_dog', 'jj_bird', 'jj_cut'],
    relics: ['jjkcore', 'jjkglass', 'jjkfinger', 'jjkmask', 'jjkfragment', 'jjkteach', 'jjkexpansion'],
    allyDefs: [
      { id: 'jj_a_itadori', name: '虎杖悠仁', art: '🧡', cost: 140, starter: true,
        desc: '超人般的体能:每回合开始时,获得 2 点格挡并对随机敌人造成 2 点伤害。',
        synergy: { ids: ['jj_blackflash'], name: '黑闪连击',
          note: '打出「黑闪」时,额外获得 2 点咒力',
          fx(A) { A.gainCe(2); } },
        turnStart(A) { A.block(2); A.dmgRandom(2); } },
      { id: 'jj_a_megumi', name: '伏黑惠', art: '🐺', cost: 150, starter: true,
        desc: '十种影法术:每回合开始时,将 1 张「玉犬」加入手牌。',
        synergy: { ids: ['jj_dog', 'jj_shadow'], name: '影法术同调',
          note: '打出「玉犬」或「十种影法术」时,抽 1 张牌',
          fx(A) { A.draw(1); } },
        turnStart(A) { A.token('jj_dog', 1); } },
      { id: 'jj_a_nobara', name: '钉崎野蔷薇', art: '🔨', cost: 140, starter: true,
        desc: '芻灵咒言:每回合开始时,对随机敌人造成 3 点伤害并施加 1 层易伤。',
        synergy: { ids: ['jj_dismantle'], name: '钉锤合击',
          note: '打出「咒术·解」时,额外施加 1 层易伤',
          fx(A, inst, t) { A.applyTo(t, 'vuln', 1); } },
        turnStart(A) { A.dmgRandom(3); A.vulnRandom(1); } },
      { id: 'jj_a_nanami', name: '七海建人', art: '🧷', cost: 170,
        desc: '社畜的效率:每回合开始时,获得 3 点格挡与 1 点咒力。',
        synergy: { ids: ['jj_yun'], name: '爱刀·游云',
          note: '打出「游云」时,伤害 +4',
          fx(A) { A.attackBonus(4); } },
        turnStart(A) { A.block(3); A.ce(1); } },
      { id: 'jj_a_panda', name: '熊猫', art: '🐼', cost: 120,
        desc: '熊猫的皮糙肉厚:每回合开始时,回复 3 点生命。',
        turnStart(A) { A.heal(3); } }
    ],
    relicDefs: [
      { id: 'jjkcore', name: '咒力核心', art: '💠', rarity: 'starter', theme: 'jjk',
        desc: '每场战斗开始时获得 3 点咒力,并累积 2 层领域。' },
      { id: 'jjkglass', name: '咒言墨镜', art: '🕶️', rarity: 'common', theme: 'jjk',
        desc: '每场战斗开始时获得 1 点咒力。' },
      { id: 'jjkfinger', name: '宿傩手指', art: '🖐️', rarity: 'uncommon', theme: 'jjk',
        desc: '咒力上限 +5,且每场战斗开始时额外获得 2 点咒力。' },
      { id: 'jjkmask', name: '咒具面具', art: '🎭', rarity: 'uncommon', theme: 'jjk',
        desc: '每场战斗开始时获得 1 层「咒术屏障」(抵挡一次伤害)。' },
      { id: 'jjkfragment', name: '术式碎片', art: '🔮', rarity: 'common', theme: 'jjk',
        desc: '每回合开始获得 1 点咒力。' },
      { id: 'jjkteach', name: '十种影法术', art: '🐺', rarity: 'uncommon', theme: 'jjk',
        desc: '每场战斗开始时,将 1 张「玉犬」加入手牌。' },
      { id: 'jjkexpansion', name: '领域结晶', art: '🧊', rarity: 'rare', theme: 'jjk',
        desc: '领域之值达到上限时不再反噬(直接重置为 0)。' }
    ],
    acts: [
      {
        name: '咒域·涩谷残秽',
        rows: 10,
        intro: '残秽在街道上聚成形状。那是人类怨念的残骸。',
        normal: [['jj_grade4'], ['jj_grade4', 'jj_grade4'], ['jj_wing'], ['jj_finger'], ['jj_wing', 'jj_grade4']],
        elite: [['jj_volcano'], ['jj_curseuser', 'jj_wing']],
        boss: [['jj_specialgrade']]
      },
      {
        name: '咒域·死灭回游',
        rows: 12,
        intro: '结界落下,规则成为诅咒本身。',
        normal: [['jj_curseuser'], ['jj_wing', 'jj_finger'], ['jj_grade4', 'jj_grade4', 'jj_wing'], ['jj_volcano'], ['jj_curseuser', 'jj_grade4']],
        elite: [['jj_stitchface'], ['jj_volcano', 'jj_wing', 'jj_wing']],
        boss: [['jj_patchface']]
      },
      {
        name: '咒域·新宿决战',
        rows: 14,
        intro: '最强的两人在此相遇。空气本身都在被诅咒。',
        normal: [['jj_specialgrade'], ['jj_volcano', 'jj_volcano'], ['jj_curseuser', 'jj_stitchface'], ['jj_wing', 'jj_wing', 'jj_finger'], ['jj_specialgrade', 'jj_grade4']],
        elite: [['jj_patchface'], ['jj_stitchface', 'jj_volcano']],
        boss: [['jj_kingofcurses']]
      }
    ],
    npcs: [
      { type: 'curse', name: '咒胎残留', art: '🥚', text: '半成形的咒胎还在蠕动,吞噬它可以获得力量。' },
      { type: 'curse', name: '咒物封印', art: '📦', text: '封印松动了一角。你听见里面有人在笑。' },
      { type: 'ward', name: '简易领域', art: '🛡️', text: '残破的帐还撑着一小块安全区。' }
    ]
  };

  /* ---- 咒术回战:卡牌 ---- */
  def({
    id: 'jj_strike', cls: 'jjk', type: 'attack', rarity: 'basic', cost: 1, dmg: 6, target: 'enemy',
    name: '打击', desc: '造成 {D} 点伤害。',
    up: { dmg: 9, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'jj_defend', cls: 'jjk', type: 'skill', rarity: 'basic', cost: 1, block: 5, target: 'none',
    name: '防御', desc: '获得 {B} 点格挡。',
    up: { block: 8, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'jj_ce', cls: 'jjk', type: 'skill', rarity: 'basic', cost: 0, target: 'none',
    name: '咒力蓄积', desc: '获得 2 点咒力。',
    up: { desc: '获得 3 点咒力,抽 1 张牌。' },
    play(A, inst) { A.gainCe(inst.up ? 3 : 2); if (inst.up) A.draw(1); }
  });
  def({
    id: 'jj_dismantle', cls: 'jjk', type: 'attack', rarity: 'common', cost: 1, dmg: 8, ceScale: true, tech: true, target: 'enemy',
    name: '咒术·解', desc: '造成 {D} 点伤害,每点咒力使其伤害 +2(每回合第一张咒术牌免费)。',
    up: { dmg: 11, desc: '造成 {D} 点伤害,每点咒力使其伤害 +2(每回合第一张咒术牌免费)。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'jj_blue', cls: 'jjk', type: 'attack', rarity: 'common', cost: 1, dmg: 7, target: 'all', tech: true,
    name: '咒术·苍', desc: '对所有敌人造成 {D} 点伤害,获得 1 点咒力。',
    up: { dmg: 10, desc: '对所有敌人造成 {D} 点伤害,获得 2 点咒力。' },
    play(A, inst) { A.attackAll(); A.gainCe(inst.up ? 2 : 1); }
  });
  def({
    id: 'jj_limitless', cls: 'jjk', type: 'skill', rarity: 'common', cost: 1, block: 9, tech: true, target: 'none',
    name: '无下限', desc: '获得 {B} 点格挡,累积 1 层领域。',
    up: { block: 13, desc: '获得 {B} 点格挡,累积 1 层领域。' },
    play(A) { A.gainBlock(); A.addField(1); }
  });
  def({
    id: 'jj_domainless', cls: 'jjk', type: 'skill', rarity: 'common', cost: 1, block: 12, tech: true, target: 'none',
    name: '简易领域', desc: '获得 {B} 点格挡,镜域之值 -1。',
    up: { block: 16, desc: '获得 {B} 点格挡,镜域之值 -2。' },
    play(A, inst) { A.gainBlock(); A.modifyField(inst.up ? -2 : -1); }
  });
  def({
    id: 'jj_red', cls: 'jjk', type: 'attack', rarity: 'common', cost: 1, dmg: 11, target: 'enemy', tech: true,
    name: '咒术·赫', desc: '造成 {D} 点伤害。若本回合打出过「苍」,施加 2 层易伤。',
    up: { dmg: 15, desc: '造成 {D} 点伤害。若本回合打出过「苍」,施加 3 层易伤。' },
    play(A, inst, t) {
      A.attack(t);
      if (A.playedThisTurn('jj_blue')) A.applyTo(t, 'vuln', inst.up ? 3 : 2);
    }
  });
  def({
    id: 'jj_weave', cls: 'jjk', type: 'attack', rarity: 'common', cost: 1, dmg: 5, hits: 3, target: 'enemy', tech: true,
    name: '咒术·织', desc: '造成 3 次 {D} 点伤害。每命中一次获得 1 点咒力。',
    up: { dmg: 7, desc: '造成 3 次 {D} 点伤害。每命中一次获得 1 点咒力。' },
    play(A) {
      for (let i = 0; i < 3; i++) { A.attack(); A.gainCe(1); }
    }
  });
  def({
    id: 'jj_swap', cls: 'jjk', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '术式顺转', desc: '抽 2 张牌。下一张咒术牌费用 -1。',
    up: { desc: '抽 3 张牌。下一张咒术牌费用 -1。' },
    play(A, inst) { A.draw(inst.up ? 3 : 2); A.setCostDelta(-1, 1); }
  });
  def({
    id: 'jj_seal', cls: 'jjk', type: 'skill', rarity: 'uncommon', cost: 1, target: 'all',
    name: '咒术·封', desc: '对所有敌人施加 1 层「封锁」(其下回合无法行动),累积 1 层领域。',
    up: { cost: 0, desc: '对所有敌人施加 1 层「封锁」,累积 1 层领域。' },
    play(A) { A.applyAll('sealAction', 1); A.addField(1); }
  });
  def({
    id: 'jj_divergent', cls: 'jjk', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 9, target: 'enemy', tech: true,
    name: '逕庭拳', desc: '造成 {D} 点伤害。若目标带有减益,伤害翻倍。',
    up: { dmg: 12, desc: '造成 {D} 点伤害。若目标带有减益,伤害翻倍。' },
    play(A, inst, t) {
      const v = CARDS.view({ id: inst.id, up: inst.up ? 1 : 0 });
      if (A.targetHasDebuff(t)) A.attackBonus(v.dmg);
      A.attack(t);
    }
  });
  def({
    id: 'jj_reverse', cls: 'jjk', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '反转术式', desc: '回复 12 点生命。消耗。',
    up: { desc: '回复 18 点生命。消耗。' },
    play(A, inst) { A.heal(inst.up ? 18 : 12); }
  });
  def({
    id: 'jj_sixeyes', cls: 'jjk', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    name: '六眼', desc: '每回合开始时获得 2 点咒力;你的黑闪几率 +15%。',
    up: { desc: '每回合开始时获得 3 点咒力;你的黑闪几率 +25%。' },
    play(A, inst) { A.gainCe(1); A.applySelf('sixEyes', inst.up ? 25 : 15); }
  });
  def({
    id: 'jj_shadow', cls: 'jjk', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '十种影法术', desc: '将 1 张「玉犬」和 1 张「鵺」加入手牌。消耗。',
    up: { desc: '将 2 张「玉犬」和 1 张「鵺」加入手牌。消耗。' },
    play(A, inst) {
      A.addToken('jj_dog', inst.up ? 2 : 1);
      A.addToken('jj_bird', 1);
    }
  });
  def({
    id: 'jj_domain', cls: 'jjk', type: 'power', rarity: 'rare', cost: 2, tech: true, target: 'none',
    name: '领域展开', desc: '咒力翻倍,累积 2 层领域,并立即对所有敌人造成等同咒力的伤害。',
    up: { cost: 1, desc: '咒力翻倍,累积 2 层领域,并立即对所有敌人造成等同咒力的伤害。' },
    play(A) {
      const ce = A.ce();
      A.gainCe(ce);
      A.addField(2);
      if (ce > 0) { A.attackBonus(ce); A.attackAll(); }
    }
  });
  def({
    id: 'jj_blackflash', cls: 'jjk', type: 'attack', rarity: 'rare', cost: 2, dmg: 19, target: 'enemy', tech: true,
    name: '黑闪', desc: '造成 {D} 点伤害。若触发黑闪,改为四倍伤害并获得 3 点咒力。',
    up: { dmg: 24, desc: '造成 {D} 点伤害。若触发黑闪,改为四倍伤害并获得 3 点咒力。' },
    play(A, inst, t) {
      const v = CARDS.view({ id: inst.id, up: inst.up ? 1 : 0 });
      A.attackBonus(v.dmg * (inst.up ? 3 : 3));
      A.attack(t);
    }
  });
  def({
    id: 'jj_purple', cls: 'jjk', type: 'attack', rarity: 'rare', cost: 2, dmg: 34, target: 'enemy', tech: true,
    name: '咒术·茈', desc: '造成 {D} 点伤害,消耗所有咒力,每点咒力使其伤害 +3。',
    up: { dmg: 42, desc: '造成 {D} 点伤害,消耗所有咒力,每点咒力使其伤害 +3。' },
    play(A) { const ce = A.spendCeAll(); A.attackBonus(ce * 3); A.attack(); }
  });
  def({
    id: 'jj_empty', cls: 'jjk', type: 'skill', rarity: 'rare', cost: 2, tech: true, target: 'all',
    name: '虚式·茈', desc: '对所有敌人造成 20 点伤害,并使镜域之值 -2。',
    up: { desc: '对所有敌人造成 28 点伤害,并使镜域之值 -2。' },
    play(A, inst) { A.dealMagicAll(inst.up ? 28 : 20); A.modifyField(-2); }
  });
  def({
    id: 'jj_malevolent', cls: 'jjk', type: 'power', rarity: 'rare', cost: 3, tech: true, target: 'none',
    name: '伏魔御厨子', desc: '每回合结束时对所有敌人造成 8 点伤害。镜域之值每回合额外 +1。',
    up: { cost: 2, desc: '每回合结束时对所有敌人造成 12 点伤害。镜域之值每回合额外 +1。' },
    play(A, inst) { A.applySelf('kitchen', inst.up ? 12 : 8); A.applySelf('fieldBoost', 1); }
  });
  def({
    id: 'jj_fuga', cls: 'jjk', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 10, target: 'enemy',
    name: '开', desc: '造成 {D} 点伤害,施加 3 层「灼伤」。',
    up: { dmg: 14, desc: '造成 {D} 点伤害,施加 4 层「灼伤」。' },
    play(A, inst, t) { A.attack(t); A.applyTo(t, 'scorch', inst.up ? 4 : 3); }
  });
  /* 衍生牌 */
  def({
    id: 'jj_dog', cls: 'special', type: 'attack', rarity: 'special', cost: 0, dmg: 5, target: 'enemy',
    name: '玉犬', desc: '造成 {D} 点伤害,获得 1 点咒力。', up: {},
    play(A) { A.attack(); A.gainCe(1); }
  });
  def({
    id: 'jj_bird', cls: 'special', type: 'skill', rarity: 'special', cost: 0, exhaust: true, target: 'enemy',
    name: '鵺', desc: '施加 1 层易伤。消耗。', up: {},
    play(A, inst, t) { A.applyTo(t, 'vuln', 1); }
  });
  def({
    id: 'jj_cut', cls: 'special', type: 'attack', rarity: 'special', cost: 0, dmg: 8, exhaust: true, target: 'enemy',
    name: '捌', desc: '造成 {D} 点伤害。消耗。', up: {},
    play(A) { A.attack(); }
  });

  /* ---- 咒术回战:敌人 ---- */
  edef({
    id: 'jj_grade4', name: '四级咒灵', art: '👻', maxHp: [22, 26],
    moves: {
      bite: { name: '啃咬', intent: 'attack', dmg: 6, exec(A) { A.attack(); } },
      grow: { name: '咒胎', intent: 'buff', exec(A) { A.buffSelf('str', 2); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.7) ? 'bite' : 'grow'; }
  });
  edef({
    id: 'jj_wing', name: '羽咒灵', art: '🦇', maxHp: [20, 24],
    moves: {
      dive: { name: '俯冲', intent: 'attack', dmg: 5, exec(A) { A.attack(); } },
      gust: { name: '振翅', intent: 'debuff', exec(A) { A.debuffPlayer('weak', 1); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.75) ? 'dive' : 'gust'; }
  });
  edef({
    id: 'jj_finger', name: '咒胎残骸', art: '🥚', maxHp: [28, 32],
    moves: {
      burst: { name: '爆散', intent: 'attack', dmg: 9, exec(A) { A.attack(); } },
      miasma: { name: '瘴气', intent: 'debuff', exec(A) { A.addStatusToDiscard('burn', 1); } }
    },
    ai(self, ctx) { return ctx.turn % 2 === 1 ? 'burst' : 'miasma'; }
  });
  edef({
    id: 'jj_volcano', name: '火山咒灵', art: '🌋', maxHp: [70, 78], elite: true,
    moves: {
      lava: { name: '熔岩', intent: 'attack', dmg: 12, exec(A) { A.attack(); } },
      ash: { name: '降灰', intent: 'debuff', exec(A) { A.addStatusToDiscard('burn', 2); A.debuffPlayer('frail', 2); } },
      eruption: { name: '喷发', intent: 'strong', dmg: 20, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'ash';
      return GS.RNG.weighted(ctx.run, ['lava', 'ash', 'eruption'], [4, 2, 3]);
    }
  });
  edef({
    id: 'jj_specialgrade', name: '特级咒灵', art: '🕯️', maxHp: [125, 135], boss: true,
    moves: {
      slashC: { name: '咒斩', intent: 'attack', dmg: 14, exec(A) { A.attack(); } },
      domain: { name: '领域侵蚀', intent: 'attackDebuff', dmg: 9, exec(A) { A.attack(); A.modifyField(2); A.debuffPlayer('frail', 2); } },
      heal: { name: '咒力循环', intent: 'buff', exec(A) { A.healSelf(18); A.buffSelf('str', 3); } },
      crush: { name: '压杀', intent: 'strong', dmg: 26, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (ctx.turn === 1) return 'domain';
      if (phase2 && !self._p2) { self._p2 = true; return 'crush'; }
      return phase2
        ? ['slashC', 'crush', 'domain', 'heal'][(ctx.turn - 1) % 4]
        : ['slashC', 'slashC', 'heal', 'domain'][(ctx.turn - 1) % 4];
    }
  });
  edef({
    id: 'jj_curseuser', name: '诅咒师', art: '🧛', maxHp: [48, 54],
    moves: {
      strikeC: { name: '术式打击', intent: 'attack', dmg: 10, exec(A) { A.attack(); } },
      trap: { name: '咒具陷阱', intent: 'debuff', exec(A) { A.debuffPlayer('vuln', 2); A.addStatusToDiscard('dazed', 1); } },
      craft: { name: '改造', intent: 'buff', exec(A) { A.buffSelf('str', 3); } }
    },
    ai(self, ctx) { return GS.RNG.weighted(ctx.run, ['strikeC', 'trap', 'craft'], [4, 3, 2]); }
  });
  edef({
    id: 'jj_stitchface', name: '缝合脸', art: '🧵', maxHp: [88, 96], elite: true,
    moves: {
      stitch: { name: '缝合', intent: 'attackDefend', dmg: 11, exec(A) { A.attack(); A.gainSelfBlock(12); } },
      idle: { name: '无为转变', intent: 'debuff', exec(A) { A.debuffPlayer('weak', 3); A.debuffPlayer('vuln', 2); } },
      idle2: { name: '灵魂触碰', intent: 'strong', dmg: 16, exec(A) { A.attack(); A.attack(); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'idle';
      return GS.RNG.weighted(ctx.run, ['stitch', 'idle2'], [4, 3]);
    }
  });
  edef({
    id: 'jj_patchface', name: '真人', art: '🪡', maxHp: [180, 190], boss: true,
    moves: {
      touch: { name: '无为转变', intent: 'attackDebuff', dmg: 15, exec(A) { A.attack(); A.debuffPlayer('weak', 2); } },
      shapeshift: { name: '变形', intent: 'buff', exec(A) { A.buffSelfMaxHp(12); A.gainSelfBlock(14); } },
      selfshape: { name: '自我改造', intent: 'buff', exec(A) { A.buffSelf('str', 4); } },
      idle3: { name: '无为·极', intent: 'strong', dmg: 30, exec(A) { A.attack(); A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.45;
      if (ctx.turn === 1) return 'shapeshift';
      if (phase2 && !self._p2) { self._p2 = true; return 'idle3'; }
      return phase2
        ? ['touch', 'idle3', 'selfshape', 'touch'][(ctx.turn - 1) % 4]
        : ['touch', 'touch', 'selfshape', 'shapeshift'][(ctx.turn - 1) % 4];
    }
  });
  edef({
    id: 'jj_kingofcurses', name: '诅咒之王·两面宿傩', art: '👹', maxHp: [420, 440], boss: true,
    moves: {
      dismantle: { name: '解', intent: 'attack', dmg: 20, exec(A) { A.attack(); } },
      cleave: { name: '捌', intent: 'attack', dmg: 13, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      fuga: { name: '开', intent: 'attackDebuff', dmg: 17, exec(A) { A.attack(); A.addStatusToDiscard('burn', 2); } },
      shrine: { name: '伏魔御厨子', intent: 'strong', dmg: 15, hits: 3, exec(A) { A.attack({ times: 3 }); A.buffSelf('str', 2); } },
      restore: { name: '反转术式', intent: 'buff', exec(A) { A.healSelf(30); A.buffSelf('str', 3); } },
      summon: { name: '召唤', intent: 'buff', exec(A) { A.summon('jj_grade4'); } }
    },
    ai(self, ctx) {
      if (self.hp < self.maxHp * 0.5 && !self._p2) { self._p2 = true; return 'shrine'; }
      if (ctx.turn === 1) return 'dismantle';
      return GS.RNG.weighted(ctx.run, ['dismantle', 'cleave', 'fuga', 'summon', 'restore'], [4, 3, 3, 1, 1]);
    }
  });

  JJK.enemyIds = Object.keys(E).filter(k => k.startsWith('jj_'));
  THEMES.push(JJK);

  /* ================================================================
     主题三 · 从零开始的异世界
     关键词:精灵(缔约后,打出技能牌触发)、死亡回归(致命伤倒回存档点)、
             魔女之香(灾祸与眷顾并存的全局标记)
     ================================================================ */
  const RZ = {
    id: 'rezero',
    cls: 'rezero',
    name: '从零开始的异世界',
    art: '💙',
    tag: '死亡回归 · 精灵术',
    desc: '死亡时,时间会倒回「存档点」。<br>以死亡为筹码,改写必死的命运。',
    relic: '贝蒂的福音书:每场战斗开始时,随机缔结一只「精灵」',
    tip: '精灵会在你打出技能牌时触发;「死亡回归」每场战斗可抵挡一次致命伤害,并把生命倒回战斗开始时的数值;魔女之香会引来灾祸(敌人变强),也会被部分卡牌转化为力量。',
    fieldLabel: '嫉妒',
    fieldMax: 10,
    curseDmg: 2,
    curseHp: 0.05,
    startHp: 78,
    deathRewind: true,
    starterDeck: ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'rz_contract'],
    starterRelic: 'rz_gospel',
    basic: ['rz_strike', 'rz_defend', 'rz_contract'],
    pool: [
      'rz_strike', 'rz_defend', 'rz_contract', 'rz_icebrand', 'rz_heal', 'rz_aid',
      'rz_witchbless', 'rz_tempest', 'rz_shadow', 'rz_sp_ice', 'rz_sp_shield',
      'rz_sp_heal', 'rz_sp_wind', 'rz_return', 'rz_whipcombo', 'rz_sanity',
      'rz_dimension', 'rz_dragonsword', 'rz_unseen', 'rz_gluttony', 'rz_oniblood',
      'rz_snowstorm', 'rz_ring'
    ],
    tokens: ['rz_hand', 'rz_mana'],
    relics: ['rz_gospel', 'rz_whip', 'rz_amulet', 'rz_crystal', 'rz_crest', 'rz_teacup', 'rz_stele'],
    allyDefs: [
      { id: 'rz_a_emilia', name: '爱蜜莉雅', art: '🧝‍♀️', cost: 150, starter: true,
        desc: '帕克的冰之加护:每回合开始时,获得 4 点格挡。',
        synergy: { ids: ['rz_icebrand', 'rz_snowstorm'], name: '冰精灵术同调',
          note: '打出「冰枪术」或「暴风雪」时,伤害 +4',
          fx(A) { A.attackBonus(4); } },
        turnStart(A) { A.block(4); } },
      { id: 'rz_a_rem', name: '蕾姆', art: '🔵', cost: 160, starter: true,
        desc: '鬼族的怪力:每回合开始时,挥出流星锤,对随机敌人造成 4 点伤害。',
        synergy: { ids: ['rz_oniblood', 'rz_tempest'], name: '鬼角觉醒',
          note: '打出「鬼族之血」或「鬼族·暴风」时,额外获得 1 层力量',
          fx(A) { A.applySelf('str', 1); } },
        turnStart(A) { A.dmgRandom(4); } },
      { id: 'rz_a_ram', name: '拉姆', art: '🌀', cost: 130, starter: true,
        desc: '微精灵的风术:每回合开始时,随机敌人获得 1 层易伤。',
        synergy: { ids: ['rz_shadow'], name: '姐姐的声援',
          note: '打出「影之潜行」时,额外抽 1 张牌',
          fx(A) { A.draw(1); } },
        turnStart(A) { A.vulnRandom(1); } },
      { id: 'rz_a_beatrice', name: '碧翠丝', art: '📖', cost: 170,
        desc: '禁书库的契约:每场战斗开始时,若你尚未缔结精灵,随机缔结一只「精灵」。',
        synergy: { ids: ['rz_contract', 'rz_sp_ice', 'rz_sp_shield', 'rz_sp_heal', 'rz_sp_wind'], name: '贝蒂的加护',
          note: '打出「精灵缔约」或精灵牌时,额外获得 3 点格挡',
          fx(A) { A.gainBlock(3); } },
        combatStart(A) { A.contractSpirit(); } },
      { id: 'rz_a_otto', name: '奥托', art: '🛒', cost: 130,
        desc: '倾听万物的声音:每回合开始时,镜域之值 -1。',
        turnStart(A) { A.field(-1); } }
    ],
    relicDefs: [
      { id: 'rz_gospel', name: '贝蒂的福音书', art: '📖', rarity: 'starter', theme: 'rezero',
        desc: '每场战斗开始时,随机缔结一只「精灵」。' },
      { id: 'rz_whip', name: '破魔之鞭', art: '🪢', rarity: 'common', theme: 'rezero',
        desc: '每场战斗开始时获得 1 点力量。', strStart: 1 },
      { id: 'rz_amulet', name: '避矢的护符', art: '🧿', rarity: 'common', theme: 'rezero',
        desc: '每场战斗开始时获得 4 点格挡。', blockStart: 4 },
      { id: 'rz_crystal', name: '魔力结晶', art: '💎', rarity: 'common', theme: 'rezero',
        desc: '每场战斗的第一回合额外抽 2 张牌。', drawFirstTurn: 2 },
      { id: 'rz_crest', name: '罗兹瓦尔的家徽', art: '🏰', rarity: 'uncommon', theme: 'rezero',
        desc: '对精英与 BOSS 的伤害 +10%。', eliteDmgMult: 0.1, bossDmgMult: 0.1 },
      { id: 'rz_teacup', name: '艾米莉亚的茶会', art: '🍵', rarity: 'common', theme: 'rezero',
        desc: '每场战斗胜利后回复 6 点生命。', healOnWin: 6 },
      { id: 'rz_stele', name: '命运的石碑', art: '🗿', rarity: 'rare', theme: 'rezero',
        desc: '「死亡回归」每场战斗可发动 2 次。', rbdCharges: 1 }
    ],
    acts: [
      {
        name: '异世界·王都阴影',
        rows: 10,
        intro: '醒来就是异世界。巷子深处,魔兽的气味与魔女之香混在一起。',
        normal: [['rz_dog'], ['rz_dog', 'rz_dog'], ['rz_rabbit', 'rz_rabbit'], ['rz_cultist'], ['rz_wolgar']],
        elite: [['rz_rabbitking'], ['rz_cultist', 'rz_wolgar']],
        boss: [['rz_sloth']]
      },
      {
        name: '异世界·白鲸讨伐',
        rows: 12,
        intro: '雾中的巨影缓缓靠近——讨伐白鲸的战场开始了。',
        normal: [['rz_wolgar', 'rz_wolgar'], ['rz_rabbitking'], ['rz_wrath'], ['rz_cultist', 'rz_cultist'], ['rz_dog', 'rz_rabbit', 'rz_rabbit']],
        elite: [['rz_wrath', 'rz_dog'], ['rz_rabbitking', 'rz_rabbit', 'rz_rabbit']],
        boss: [['rz_whale']]
      },
      {
        name: '异世界·大罪之战',
        rows: 14,
        intro: '魔女教的大罪司教们齐聚。这是赌上世界命运的战役。',
        normal: [['rz_wrath'], ['rz_rabbitking', 'rz_cultist'], ['rz_hand', 'rz_hand', 'rz_hand'], ['rz_wrath', 'rz_cultist'], ['rz_wolgar', 'rz_wolgar', 'rz_dog']],
        elite: [['rz_wrath', 'rz_wolgar'], ['rz_rabbitking', 'rz_cultist', 'rz_rabbit']],
        boss: [['rz_greed']]
      }
    ],
    npcs: [
      { type: 'curse', name: '魔女的残响', art: '🖤', text: '空气变得粘稠。有什么东西,正从影子里盯着你。' },
      { type: 'curse', name: '福音书的空白页', art: '📕', text: '书页自己翻动了。贝蒂似乎在暗示什么。' },
      { type: 'ward', name: '圣域的结界', art: '🛡️', text: '试炼之森的结界还在运作,可以稍作喘息。' }
    ]
  };

  /* ---- 从零开始的异世界:卡牌 ---- */
  def({
    id: 'rz_strike', cls: 'rezero', type: 'attack', rarity: 'basic', cost: 1, dmg: 6, target: 'enemy',
    name: '鞭击', desc: '造成 {D} 点伤害。',
    up: { dmg: 9, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'rz_defend', cls: 'rezero', type: 'skill', rarity: 'basic', cost: 1, block: 5, target: 'none',
    name: '蹲伏', desc: '获得 {B} 点格挡。',
    up: { block: 8, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'rz_contract', cls: 'rezero', type: 'skill', rarity: 'basic', cost: 0, target: 'none',
    name: '精灵缔约', desc: '随机缔结一只「精灵」(已有则替换),回复 2 点生命。',
    up: { desc: '随机缔结一只「精灵」(已有则替换),回复 2 点生命,抽 1 张牌。' },
    play(A, inst) { A.setGhost(A.randomSpirit(), 1); A.heal(2); if (inst.up) A.draw(1); }
  });
  def({
    id: 'rz_icebrand', cls: 'rezero', type: 'attack', rarity: 'common', cost: 1, dmg: 8, target: 'enemy',
    name: '冰枪术', desc: '造成 {D} 点伤害。若你带有「魔女之香」,额外 +4。',
    up: { dmg: 11, desc: '造成 {D} 点伤害。若你带有「魔女之香」,额外 +4。' },
    play(A, inst, t) { if (A.selfStatus('witchscent') > 0) A.attackBonus(4); A.attack(t); }
  });
  def({
    id: 'rz_heal', cls: 'rezero', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '库露的手当', desc: '回复 9 点生命。',
    up: { desc: '回复 14 点生命。' },
    play(A, inst) { A.heal(inst.up ? 14 : 9); }
  });
  def({
    id: 'rz_aid', cls: 'rezero', type: 'skill', rarity: 'common', cost: 1, block: 9, target: 'none',
    name: '避矢的加护', desc: '获得 {B} 点格挡。',
    up: { block: 12, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'rz_witchbless', cls: 'rezero', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '魔女的眷顾', desc: '每有 1 层「魔女之香」,获得 1 点力量与 3 点格挡,然后移除全部「魔女之香」。',
    up: { desc: '每有 1 层「魔女之香」,获得 1 点力量与 4 点格挡,然后移除全部「魔女之香」。' },
    play(A, inst) {
      const n = A.selfStatus('witchscent');
      A.applySelf('str', n);
      A.gainBlock(n * (inst.up ? 4 : 3));
      if (n > 0) A.applySelf('witchscent', -n);
    }
  });
  def({
    id: 'rz_tempest', cls: 'rezero', type: 'attack', rarity: 'common', cost: 1, dmg: 10, target: 'enemy',
    name: '鬼族·暴风', desc: '造成 {D} 点伤害,获得 1 层「魔女之香」。',
    up: { dmg: 14, desc: '造成 {D} 点伤害,获得 1 层「魔女之香」。' },
    play(A, inst, t) { A.attack(t); A.applySelf('witchscent', 1); }
  });
  def({
    id: 'rz_shadow', cls: 'rezero', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '影之潜行', desc: '抽 2 张牌,获得 1 层「魔女之香」。',
    up: { desc: '抽 3 张牌,获得 1 层「魔女之香」。' },
    play(A, inst) { A.draw(inst.up ? 3 : 2); A.applySelf('witchscent', 1); }
  });
  def({
    id: 'rz_sp_ice', cls: 'rezero', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '精灵·帕克', desc: '缔结「帕克」:每当你打出一张技能牌,对随机敌人造成 4 点伤害。消耗。',
    up: { desc: '缔结「帕克」:每当你打出一张技能牌,对随机敌人造成 5 点伤害。消耗。' },
    play(A, inst) { A.setGhost('rz_sp_ice', inst.up ? 5 : 4); }
  });
  def({
    id: 'rz_sp_shield', cls: 'rezero', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '精灵·库', desc: '缔结「库」:每当你打出一张技能牌,获得 5 点格挡。消耗。',
    up: { desc: '缔结「库」:每当你打出一张技能牌,获得 7 点格挡。消耗。' },
    play(A, inst) { A.setGhost('rz_sp_shield', inst.up ? 7 : 5); }
  });
  def({
    id: 'rz_sp_heal', cls: 'rezero', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '精灵·米莉娅', desc: '缔结「米莉娅」:每当你打出一张技能牌,回复 2 点生命。消耗。',
    up: { desc: '缔结「米莉娅」:每当你打出一张技能牌,回复 3 点生命。消耗。' },
    play(A, inst) { A.setGhost('rz_sp_heal', inst.up ? 3 : 2); }
  });
  def({
    id: 'rz_sp_wind', cls: 'rezero', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '精灵·风', desc: '缔结「风精灵」:每当你打出一张技能牌,对所有敌人造成 2 点伤害。消耗。',
    up: { desc: '缔结「风精灵」:每当你打出一张技能牌,对所有敌人造成 3 点伤害。消耗。' },
    play(A, inst) { A.setGhost('rz_sp_wind', inst.up ? 3 : 2); }
  });
  def({
    id: 'rz_return', cls: 'rezero', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
    name: '死亡回归', desc: '获得额外的 1 次「死亡回归」:死亡时倒回至战斗开始时的生命。',
    up: { cost: 1, desc: '获得额外的 1 次「死亡回归」:死亡时倒回至战斗开始时的生命。' },
    play(A) { A.applySelf('rewind', 1); }
  });
  def({
    id: 'rz_whipcombo', cls: 'rezero', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 5, hits: 2, target: 'enemy',
    name: '百裂鞭击', desc: '造成 2 次 {D} 点伤害。',
    up: { dmg: 7, desc: '造成 2 次 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'rz_sanity', cls: 'rezero', type: 'skill', rarity: 'uncommon', cost: 1, block: 6, target: 'none',
    name: '心意坚定', desc: '移除你所有的减益,获得 {B} 点格挡。',
    up: { block: 9, desc: '移除你所有的减益,获得 {B} 点格挡。' },
    play(A) { A.cleanseDebuffs(); A.gainBlock(); }
  });
  def({
    id: 'rz_dimension', cls: 'rezero', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '异界的缝隙', desc: '将 1 张「不可视之手」和 1 张「玛娜结晶」加入手牌。消耗。',
    up: { desc: '将 2 张「不可视之手」和 1 张「玛娜结晶」加入手牌。消耗。' },
    play(A, inst) {
      A.addToken('rz_hand', inst.up ? 2 : 1);
      A.addToken('rz_mana', 1);
    }
  });
  def({
    id: 'rz_dragonsword', cls: 'rezero', type: 'attack', rarity: 'rare', cost: 2, dmg: 18, target: 'enemy',
    name: '龙剑星薙', desc: '造成 {D} 点伤害,获得 1 层「魔女之香」。',
    up: { dmg: 24, desc: '造成 {D} 点伤害,获得 1 层「魔女之香」。' },
    play(A, inst, t) { A.attack(t); A.applySelf('witchscent', 1); }
  });
  def({
    id: 'rz_unseen', cls: 'rezero', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '看不见的存在', desc: '每回合开始时,对随机敌人造成 6 点伤害(可叠加)。',
    up: { cost: 1, desc: '每回合开始时,对随机敌人造成 6 点伤害(可叠加)。' },
    play(A) { A.applySelf('unseen', 6); }
  });
  def({
    id: 'rz_gluttony', cls: 'rezero', type: 'power', rarity: 'rare', cost: 1, target: 'none',
    name: '暴食的权能', desc: '每当有敌人死亡,你回复 5 点生命并获得 1 点力量。',
    up: { desc: '每当有敌人死亡,你回复 7 点生命并获得 1 点力量。' },
    play(A, inst) { A.applySelf('gluttony', inst.up ? 7 : 5); }
  });
  def({
    id: 'rz_oniblood', cls: 'rezero', type: 'power', rarity: 'rare', cost: 1, target: 'none',
    name: '鬼族之血', desc: '获得 2 点力量与 1 点敏捷;每回合结束失去 1 点生命。',
    up: { desc: '获得 3 点力量与 1 点敏捷;每回合结束失去 1 点生命。' },
    play(A, inst) { A.applySelf('str', inst.up ? 3 : 2); A.applySelf('dex', 1); A.applySelf('burnlife', 1); }
  });
  /* 衍生牌 */
  def({
    id: 'rz_hand', cls: 'special', type: 'attack', rarity: 'special', cost: 0, dmg: 4, exhaust: true, target: 'enemy',
    name: '不可视之手', desc: '造成 {D} 点伤害。消耗。', up: {},
    play(A) { A.attack(); }
  });
  def({
    id: 'rz_mana', cls: 'special', type: 'skill', rarity: 'special', cost: 0, block: 4, exhaust: true, target: 'none',
    name: '玛娜结晶', desc: '获得 {B} 点格挡。消耗。', up: {},
    play(A) { A.gainBlock(); }
  });

  /* ---- 从零开始的异世界:敌人 ---- */
  edef({
    id: 'rz_dog', name: '魔兽犬', art: '🐕', maxHp: [24, 28],
    moves: {
      bite: { name: '噬咬', intent: 'attack', dmg: 7, exec(A) { A.attack(); } },
      howl: { name: '嚎叫', intent: 'buff', exec(A) { A.buffSelf('str', 2); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.75) ? 'bite' : 'howl'; }
  });
  edef({
    id: 'rz_rabbit', name: '大兔', art: '🐇', maxHp: [18, 22],
    moves: {
      chew: { name: '啃食', intent: 'attack', dmg: 4, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      hop: { name: '跳跃', intent: 'defend', exec(A) { A.gainSelfBlock(5); } }
    },
    ai(self, ctx) { return ctx.turn % 3 === 0 ? 'hop' : 'chew'; }
  });
  edef({
    id: 'rz_wolgar', name: '乌尔加鲁姆', art: '🐺', maxHp: [30, 34],
    moves: {
      pounce: { name: '扑杀', intent: 'attack', dmg: 9, exec(A) { A.attack(); } },
      packhowl: { name: '群啸', intent: 'buff', exec(A) { A.buffSelf('str', 2); A.gainAlliesBlock(3); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.7) ? 'pounce' : 'packhowl'; }
  });
  edef({
    id: 'rz_cultist', name: '魔女教信者', art: '🕯️', maxHp: [28, 32],
    moves: {
      stab: { name: '疯狂的刺击', intent: 'attack', dmg: 8, exec(A) { A.attack(); } },
      fanatic: { name: '狂信的呓语', intent: 'debuff', exec(A) { A.debuffPlayer('weak', 2); } },
      chant: { name: '咏唱', intent: 'buff', exec(A) { A.buffSelf('str', 2); A.gainSelfBlock(5); } }
    },
    ai(self, ctx) { return GS.RNG.weighted(ctx.run, ['stab', 'fanatic', 'chant'], [4, 3, 2]); }
  });
  edef({
    id: 'rz_hand', name: '不可视之手', art: '🖐️', maxHp: [16, 20],
    moves: {
      grab: { name: '抓取', intent: 'attack', dmg: 5, exec(A) { A.attack(); } },
      coil: { name: '缠绕', intent: 'defend', exec(A) { A.gainSelfBlock(4); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.8) ? 'grab' : 'coil'; }
  });
  edef({
    id: 'rz_rabbitking', name: '大兔之王', art: '🐰', maxHp: [68, 76], elite: true,
    moves: {
      devour: { name: '吞噬', intent: 'attack', dmg: 11, exec(A) { A.attack(); A.healSelf(4); } },
      stampede: { name: '兔潮', intent: 'attack', dmg: 5, hits: 3, exec(A) { A.attack({ times: 3 }); } },
      gluttony: { name: '空腹', intent: 'buff', exec(A) { A.buffSelf('str', 2); A.healSelf(8); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'stampede';
      return GS.RNG.weighted(ctx.run, ['devour', 'stampede', 'gluttony'], [4, 3, 2]);
    }
  });
  edef({
    id: 'rz_wrath', name: '愤怒之司教', art: '💢', maxHp: [74, 82], elite: true,
    moves: {
      ragebolt: { name: '愤怒的雷', intent: 'attackDebuff', dmg: 12, exec(A) { A.attack(); A.debuffPlayer('vuln', 2); } },
      scream: { name: '歇斯底里', intent: 'debuff', exec(A) { A.debuffPlayer('weak', 2); A.debuffPlayer('frail', 2); } },
      wrathful: { name: '激怒', intent: 'buff', exec(A) { A.buffSelf('str', 3); A.gainSelfBlock(8); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'wrathful';
      return GS.RNG.weighted(ctx.run, ['ragebolt', 'scream', 'wrathful'], [4, 2, 3]);
    }
  });
  edef({
    id: 'rz_sloth', name: '怠惰大罪司教·培提其乌斯', art: '🤪', maxHp: [125, 135], boss: true,
    moves: {
      unseen: { name: '看不见的手', intent: 'attack', dmg: 8, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      finger: { name: '手指诡计', intent: 'buff', exec(A) { A.buffSelf('str', 3); A.gainSelfBlock(8); } },
      callhands: { name: '召唤', intent: 'buff', exec(A) { A.summon('rz_hand'); } },
      madman: { name: '疯狂', intent: 'attackDebuff', dmg: 10, exec(A) { A.attack(); A.debuffPlayer('weak', 2); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (ctx.turn === 1) return 'finger';
      if (phase2 && !self._p2) { self._p2 = true; return 'callhands'; }
      return phase2
        ? ['unseen', 'madman', 'callhands', 'finger'][(ctx.turn - 1) % 4]
        : ['unseen', 'unseen', 'madman', 'finger'][(ctx.turn - 1) % 4];
    }
  });
  edef({
    id: 'rz_whale', name: '白鲸', art: '🐋', maxHp: [175, 190], boss: true,
    moves: {
      fogbreath: { name: '浓雾吐息', intent: 'attackDebuff', dmg: 14, exec(A) { A.attack(); A.debuffPlayer('weak', 2); } },
      tail: { name: '巨尾拍击', intent: 'attack', dmg: 20, exec(A) { A.attack(); } },
      mist: { name: '雾之再生', intent: 'buff', exec(A) { A.healSelf(15); A.debuffPlayer('frail', 3); } },
      migration: { name: '迁移', intent: 'buff', exec(A) { A.buffSelf('str', 4); A.gainSelfBlock(14); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (ctx.turn === 1) return 'fogbreath';
      if (phase2 && !self._p2) { self._p2 = true; return 'migration'; }
      return phase2
        ? ['tail', 'mist', 'fogbreath', 'migration'][(ctx.turn - 1) % 4]
        : ['tail', 'fogbreath', 'tail', 'mist'][(ctx.turn - 1) % 4];
    }
  });
  edef({
    id: 'rz_greed', name: '强欲大罪司教·罗格曼', art: '👑', maxHp: [300, 320], boss: true,
    moves: {
      stillness: { name: '静止的拳', intent: 'attack', dmg: 24, exec(A) { A.attack(); } },
      divinity: { name: '强欲的加护', intent: 'buff', exec(A) { A.buffSelf('str', 4); A.gainSelfBlock(16); } },
      wind: { name: '死亡飓风', intent: 'attack', dmg: 12, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      hunger: { name: '饥渴的飓风', intent: 'strong', dmg: 40, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.45;
      if (ctx.turn === 1) return 'divinity';
      if (phase2 && !self._p2) { self._p2 = true; return 'hunger'; }
      return phase2
        ? ['stillness', 'hunger', 'wind', 'divinity'][(ctx.turn - 1) % 4]
        : ['stillness', 'stillness', 'wind', 'divinity'][(ctx.turn - 1) % 4];
    }
  });

  RZ.enemyIds = Object.keys(E).filter(k => k.startsWith('rz_'));
  THEMES.push(RZ);

  /* ================================================================
     主题四 · 奥特曼
     关键词:光能(战斗内资源,随回合消耗)、红色警戒(光能告急时攻击大增)、
             光线必杀(消耗光能的爆发)、能量枯竭(光能归零的反噬)
     ================================================================ */
  const UL = {
    id: 'ultraman',
    cls: 'ultraman',
    name: '奥特曼',
    art: '🔴',
    tag: '光之巨人 · 三分钟',
    desc: '光之巨人与地球共存。<br>在彩色计时器熄灭之前,解决战斗。',
    relic: '贝塔胶囊:每场战斗开始时,光能上限 +2',
    tip: '光能随回合消耗;光能 ≤3 时进入「红色警戒」,你的攻击大幅提升;光能归零后每回合受到能量枯竭伤害;光线必杀消耗全部光能,一击定胜负。',
    fieldLabel: '负荷',
    fieldMax: 12,
    curseDmg: 2,
    curseHp: 0.05,
    startHp: 85,
    light: { start: 10, max: 10 },
    redline: 3,
    redlineBonus: 4,
    starterDeck: ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'ul_charge'],
    starterRelic: 'ul_capsule',
    basic: ['ul_strike', 'ul_defend', 'ul_charge'],
    pool: [
      'ul_strike', 'ul_defend', 'ul_charge', 'ul_slash', 'ul_kick', 'ul_catch',
      'ul_mind', 'ul_eye', 'ul_posture', 'ul_wall', 'ul_timer', 'ul_specium',
      'ul_form', 'ul_slice', 'ul_twin', 'ul_zeperion', 'ul_eternal',
      'ul_spark', 'ul_recharge', 'ul_wideshot', 'ul_dome'
    ],
    tokens: ['ul_shard'],
    relics: ['ul_capsule', 'ul_factor', 'ul_meter', 'ul_tech', 'ul_brooch', 'ul_pigmon', 'ul_tower'],
    allyDefs: [
      { id: 'ul_a_seven', name: '赛文', art: '🟢', cost: 150, starter: true,
        desc: '奥特警备队队长:每回合开始时,头镖出击,对随机敌人造成 4 点伤害。',
        synergy: { ids: ['ul_shard', 'ul_slice'], name: '头镖齐飞',
          note: '打出「光子刃」或「奥特念力刃」时,伤害 +3',
          fx(A) { A.attackBonus(3); } },
        turnStart(A) { A.dmgRandom(4); } },
      { id: 'ul_a_jack', name: '杰克', art: '⌚', cost: 130, starter: true,
        desc: '奥特手镯:每回合开始时,获得 3 点格挡。',
        synergy: { ids: ['ul_dome'], name: '手镯变盾',
          note: '打出「奥特护罩」时,额外获得 4 点格挡',
          fx(A) { A.gainBlock(4); } },
        turnStart(A) { A.block(3); } },
      { id: 'ul_a_kotest', name: '科特队', art: '🚀', cost: 120, starter: true,
        desc: '科学特搜队的支援:每回合开始时,随机敌人获得 1 层易伤。',
        turnStart(A) { A.vulnRandom(1); } },
      { id: 'ul_a_zoffy', name: '佐菲', art: '🥇', cost: 170,
        desc: '宇宙警备队大队长的驰援:每场战斗开始时,获得 1 层「领域屏障」。',
        synergy: { ids: ['ul_specium'], name: 'M87 光线',
          note: '打出「斯派修姆光线」时,伤害 +5',
          fx(A) { A.attackBonus(5); } },
        combatStart(A) { A.barrier(1); } },
      { id: 'ul_a_taro', name: '泰罗', art: '🔆', cost: 140,
        desc: '奥特之父之子:每回合开始时,获得 1 点光能。',
        synergy: { ids: ['ul_charge', 'ul_timer'], name: '斯特利姆充能',
          note: '打出「太阳充能」或「计时器闪光」时,额外获得 2 点光能',
          fx(A) { A.gainLight(2); } },
        turnStart(A) { A.light(1); } }
    ],
    relicDefs: [
      { id: 'ul_capsule', name: '贝塔胶囊', art: '🔵', rarity: 'starter', theme: 'ultraman',
        desc: '每场战斗开始时,光能上限 +2。', lightMaxBonus: 2 },
      { id: 'ul_factor', name: '斯派修姆因子', art: '✨', rarity: 'common', theme: 'ultraman',
        desc: '每场战斗开始时获得 1 点力量。', strStart: 1 },
      { id: 'ul_meter', name: '彩色计时器', art: '🔴', rarity: 'common', theme: 'ultraman',
        desc: '红色警戒的阈值 +1(更早进入爆发状态)。', redlinePlus: 1 },
      { id: 'ul_tech', name: '光之国的科技', art: '🛡️', rarity: 'uncommon', theme: 'ultraman',
        desc: '每场战斗开始时获得 5 点格挡。', blockStart: 5 },
      { id: 'ul_brooch', name: '奥特兄弟之证', art: '⭐', rarity: 'uncommon', theme: 'ultraman',
        desc: '对 BOSS 的伤害 +15%。', bossDmgMult: 0.15 },
      { id: 'ul_pigmon', name: '皮古蒙的友谊', art: '🤝', rarity: 'common', theme: 'ultraman',
        desc: '每场战斗胜利后回复 8 点生命。', healOnWin: 8 },
      { id: 'ul_tower', name: '等离子火花塔', art: '🗼', rarity: 'rare', theme: 'ultraman',
        desc: '你的光能不再随回合消耗。' }
    ],
    acts: [
      {
        name: '光之国·初降地球',
        rows: 10,
        intro: '红色的光划破大气层。三分钟的战斗,现在开始。',
        normal: [['ul_bemstar'], ['ul_eleking'], ['ul_dada'], ['ul_eleking', 'ul_bemstar'], ['ul_antlar']],
        elite: [['ul_redking'], ['ul_dada', 'ul_dada']],
        boss: [['ul_baltan']]
      },
      {
        name: '光之国·怪兽群袭',
        rows: 12,
        intro: '怪兽从地底与深海苏醒。城市在你身后燃烧。',
        normal: [['ul_antlar'], ['ul_redking'], ['ul_bemstar', 'ul_eleking'], ['ul_dada', 'ul_eleking'], ['ul_antlar', 'ul_bemstar']],
        elite: [['ul_kingjoe'], ['ul_redking', 'ul_eleking']],
        boss: [['ul_gomora']]
      },
      {
        name: '光之国·宇宙恐兽',
        rows: 14,
        intro: '宇宙恐龙现身。传说中,它杀死过光之巨人。',
        normal: [['ul_kingjoe'], ['ul_redking', 'ul_redking'], ['ul_bemstar', 'ul_bemstar', 'ul_eleking'], ['ul_kingjoe', 'ul_dada'], ['ul_antlar', 'ul_antlar']],
        elite: [['ul_kingjoe', 'ul_bemstar'], ['ul_redking', 'ul_dada']],
        boss: [['ul_zetton']]
      }
    ],
    npcs: [
      { type: 'curse', name: '光之因子的残骸', art: '💠', text: '坠落的星光还残留着温度,触碰它可能会得到力量。' },
      { type: 'curse', name: '怪兽细胞样本', art: '🧪', text: '密封容器里的东西还在蠕动。科学特搜队的封条已经破损。' },
      { type: 'ward', name: '光之国前哨站', art: '🛡️', text: '银十字军的治愈光芒笼罩着这片安全区。' }
    ]
  };

  /* ---- 奥特曼:卡牌 ---- */
  def({
    id: 'ul_strike', cls: 'ultraman', type: 'attack', rarity: 'basic', cost: 1, dmg: 6, target: 'enemy',
    name: '手刀', desc: '造成 {D} 点伤害。',
    up: { dmg: 9, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'ul_defend', cls: 'ultraman', type: 'skill', rarity: 'basic', cost: 1, block: 5, target: 'none',
    name: '光之壁垒', desc: '获得 {B} 点格挡。',
    up: { block: 8, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'ul_charge', cls: 'ultraman', type: 'skill', rarity: 'basic', cost: 0, target: 'none',
    name: '太阳充能', desc: '获得 3 点光能。',
    up: { desc: '获得 4 点光能,抽 1 张牌。' },
    play(A, inst) { A.gainLight(inst.up ? 4 : 3); if (inst.up) A.draw(1); }
  });
  def({
    id: 'ul_slash', cls: 'ultraman', type: 'attack', rarity: 'common', cost: 1, dmg: 8, target: 'enemy',
    name: '八分光轮', desc: '造成 {D} 点伤害,获得 1 点光能。',
    up: { dmg: 11, desc: '造成 {D} 点伤害,获得 2 点光能。' },
    play(A, inst, t) { A.attack(t); A.gainLight(inst.up ? 2 : 1); }
  });
  def({
    id: 'ul_kick', cls: 'ultraman', type: 'attack', rarity: 'common', cost: 1, dmg: 9, target: 'enemy',
    name: '奥特飞踢', desc: '造成 {D} 点伤害。红色警戒时,额外 +4。',
    up: { dmg: 12, desc: '造成 {D} 点伤害。红色警戒时,额外 +6。' },
    play(A, inst, t) {
      if (A.light() <= A.redline()) A.attackBonus(inst.up ? 6 : 4);
      A.attack(t);
    }
  });
  def({
    id: 'ul_catch', cls: 'ultraman', type: 'attack', rarity: 'common', cost: 1, dmg: 7, target: 'enemy',
    name: '摔投技', desc: '造成 {D} 点伤害,施加 1 层虚弱。',
    up: { dmg: 9, desc: '造成 {D} 点伤害,施加 2 层虚弱。' },
    play(A, inst, t) { A.attack(t); A.applyTo(t, 'weak', inst.up ? 2 : 1); }
  });
  def({
    id: 'ul_mind', cls: 'ultraman', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '奥特念力', desc: '抽 2 张牌,获得 1 点光能。',
    up: { desc: '抽 3 张牌,获得 1 点光能。' },
    play(A, inst) { A.draw(inst.up ? 3 : 2); A.gainLight(1); }
  });
  def({
    id: 'ul_eye', cls: 'ultraman', type: 'skill', rarity: 'common', cost: 1, target: 'all',
    name: '斯派修姆之眼', desc: '对所有敌人施加 2 层易伤。',
    up: { desc: '对所有敌人施加 3 层易伤。' },
    play(A, inst) { A.applyAll('vuln', inst.up ? 3 : 2); }
  });
  def({
    id: 'ul_posture', cls: 'ultraman', type: 'skill', rarity: 'common', cost: 1, block: 9, target: 'none',
    name: '防御姿态', desc: '获得 {B} 点格挡。',
    up: { block: 12, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'ul_wall', cls: 'ultraman', type: 'skill', rarity: 'uncommon', cost: 1, block: 13, target: 'none',
    name: '光之壁', desc: '获得 {B} 点格挡。',
    up: { block: 17, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'ul_timer', cls: 'ultraman', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    name: '计时器闪光', desc: '获得 4 点光能,抽 1 张牌。',
    up: { desc: '获得 5 点光能,抽 1 张牌。' },
    play(A, inst) { A.gainLight(inst.up ? 5 : 4); A.draw(1); }
  });
  def({
    id: 'ul_specium', cls: 'ultraman', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 8, target: 'enemy',
    name: '斯派修姆光线', desc: '造成 {D} 点伤害,消耗至多 3 点光能,每点 +3。',
    up: { dmg: 11, desc: '造成 {D} 点伤害,消耗至多 3 点光能,每点 +4。' },
    play(A, inst, t) {
      const n = A.spendLight(3);
      A.attackBonus(n * (inst.up ? 4 : 3));
      A.attack(t);
    }
  });
  def({
    id: 'ul_form', cls: 'ultraman', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '形态切换', desc: '获得 2 点力量与 2 点敏捷,失去 2 点光能。消耗。',
    up: { desc: '获得 3 点力量与 3 点敏捷,失去 2 点光能。消耗。' },
    play(A, inst) {
      A.applySelf('str', inst.up ? 3 : 2);
      A.applySelf('dex', inst.up ? 3 : 2);
      A.spendLight(2);
    }
  });
  def({
    id: 'ul_slice', cls: 'ultraman', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 5, hits: 3, target: 'enemy',
    name: '奥特念力刃', desc: '造成 3 次 {D} 点伤害,获得 1 点光能。',
    up: { dmg: 7, desc: '造成 3 次 {D} 点伤害,获得 1 点光能。' },
    play(A, inst) { A.attack(); A.gainLight(1); }
  });
  def({
    id: 'ul_twin', cls: 'ultraman', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '光之分身', desc: '将 2 张「光子刃」加入手牌。消耗。',
    up: { desc: '将 3 张「光子刃」加入手牌。消耗。' },
    play(A, inst) { A.addToken('ul_shard', inst.up ? 3 : 2); }
  });
  def({
    id: 'ul_zeperion', cls: 'ultraman', type: 'attack', rarity: 'rare', cost: 2, dmg: 20, target: 'enemy',
    name: '泽佩里敖光线', desc: '造成 {D} 点伤害,消耗全部光能,每点 +2。',
    up: { dmg: 26, desc: '造成 {D} 点伤害,消耗全部光能,每点 +3。' },
    play(A, inst, t) {
      const n = A.spendLightAll();
      A.attackBonus(n * (inst.up ? 3 : 2));
      A.attack(t);
    }
  });
  def({
    id: 'ul_eternal', cls: 'ultraman', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '永恒之辉', desc: '你的光能不再随回合消耗。',
    up: { desc: '你的光能不再随回合消耗,且每回合开始时获得 1 点光能。' },
    play(A, inst) { A.applySelf('eternal', inst.up ? 2 : 1); }
  });
  def({
    id: 'ul_spark', cls: 'ultraman', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '等离子火花', desc: '每当你消耗光能,对所有敌人造成等同消耗量的伤害。',
    up: { cost: 1, desc: '每当你消耗光能,对所有敌人造成等同消耗量的伤害。' },
    play(A) { A.applySelf('plasmaspark', 1); }
  });
  def({
    id: 'ul_recharge', cls: 'ultraman', type: 'skill', rarity: 'rare', cost: 1, exhaust: true, target: 'none',
    name: '星光回归', desc: '光能回满,回复 6 点生命。消耗。',
    up: { desc: '光能回满,回复 10 点生命。消耗。' },
    play(A, inst) { A.gainLight(99); A.heal(inst.up ? 10 : 6); }
  });
  /* 衍生牌 */
  def({
    id: 'ul_shard', cls: 'special', type: 'attack', rarity: 'special', cost: 0, dmg: 6, exhaust: true, target: 'enemy',
    name: '光子刃', desc: '造成 {D} 点伤害。消耗。', up: {},
    play(A) { A.attack(); }
  });

  /* ---- 奥特曼:敌人 ---- */
  edef({
    id: 'ul_bemstar', name: '贝蒙斯坦', art: '🌟', maxHp: [26, 30],
    moves: {
      swallow: { name: '吞噬', intent: 'attack', dmg: 8, exec(A) { A.attack(); A.healSelf(4); } },
      quasar: { name: '类星体光', intent: 'attackDebuff', dmg: 6, exec(A) { A.attack(); A.debuffPlayer('weak', 1); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.65) ? 'swallow' : 'quasar'; }
  });
  edef({
    id: 'ul_eleking', name: '艾雷王', art: '⚡', maxHp: [24, 28],
    moves: {
      tailwhip: { name: '电击尾', intent: 'attack', dmg: 8, exec(A) { A.attack(); } },
      discharge: { name: '放电', intent: 'attack', dmg: 5, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      chargeup: { name: '蓄电', intent: 'buff', exec(A) { A.buffSelf('str', 2); } }
    },
    ai(self, ctx) { return GS.RNG.weighted(ctx.run, ['tailwhip', 'discharge', 'chargeup'], [4, 3, 2]); }
  });
  edef({
    id: 'ul_antlar', name: '安特拉', art: '🪲', maxHp: [30, 34],
    moves: {
      horn: { name: '巨角突刺', intent: 'attack', dmg: 9, exec(A) { A.attack(); } },
      magnetic: { name: '磁力护盾', intent: 'defend', exec(A) { A.gainSelfBlock(10); } },
      beam: { name: '破坏光线', intent: 'strong', dmg: 16, exec(A) { A.attack(); } }
    },
    ai(self, ctx) { return GS.RNG.weighted(ctx.run, ['horn', 'magnetic', 'beam'], [4, 2, 2]); }
  });
  edef({
    id: 'ul_dada', name: '达达', art: '⚫', maxHp: [26, 30],
    moves: {
      trident: { name: '三叉戟', intent: 'attack', dmg: 7, exec(A) { A.attack(); } },
      shrinkray: { name: '缩小光线', intent: 'debuff', exec(A) { A.debuffPlayer('frail', 2); } },
      swap: { name: '变换', intent: 'buff', exec(A) { A.buffSelf('str', 2); A.gainSelfBlock(6); } }
    },
    ai(self, ctx) { return GS.RNG.weighted(ctx.run, ['trident', 'shrinkray', 'swap'], [4, 3, 2]); }
  });
  edef({
    id: 'ul_redking', name: '雷德王', art: '🦍', maxHp: [70, 78], elite: true,
    moves: {
      boulder: { name: '巨岩投掷', intent: 'attack', dmg: 12, exec(A) { A.attack(); } },
      rampage: { name: '狂暴乱击', intent: 'attack', dmg: 6, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      roar: { name: '咆哮', intent: 'buff', exec(A) { A.buffSelf('str', 3); A.gainSelfBlock(6); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'roar';
      return GS.RNG.weighted(ctx.run, ['boulder', 'rampage', 'roar'], [4, 3, 2]);
    }
  });
  edef({
    id: 'ul_kingjoe', name: '金古乔', art: '🤖', maxHp: [78, 86], elite: true,
    moves: {
      separator: { name: '分离攻击', intent: 'attack', dmg: 9, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      beam: { name: '毁灭光线', intent: 'strong', dmg: 18, exec(A) { A.attack(); } },
      anchor: { name: '锚链', intent: 'attackDebuff', dmg: 8, exec(A) { A.attack(); A.debuffPlayer('vuln', 2); } },
      repair: { name: '装甲再生', intent: 'defend', exec(A) { A.gainSelfBlock(14); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'anchor';
      return GS.RNG.weighted(ctx.run, ['separator', 'beam', 'anchor', 'repair'], [4, 2, 3, 2]);
    }
  });
  edef({
    id: 'ul_baltan', name: '巴尔坦星人', art: '🦐', maxHp: [125, 140], boss: true,
    moves: {
      scythe: { name: '镰刀臂', intent: 'attack', dmg: 13, exec(A) { A.attack(); } },
      clone: { name: '分身', intent: 'buff', exec(A) { A.summon('ul_drone'); } },
      ray: { name: '殒命光线', intent: 'attackDebuff', dmg: 10, exec(A) { A.attack(); A.debuffPlayer('weak', 2); } },
      photon: { name: '光子爆弾', intent: 'strong', dmg: 26, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (ctx.turn === 1) return 'ray';
      if (phase2 && !self._p2) { self._p2 = true; return 'clone'; }
      return phase2
        ? ['scythe', 'photon', 'ray', 'clone'][(ctx.turn - 1) % 4]
        : ['scythe', 'scythe', 'ray', 'clone'][(ctx.turn - 1) % 4];
    }
  });
  edef({
    id: 'ul_drone', name: '巴尔坦分身', art: '🦐', maxHp: [16, 20],
    moves: {
      jab: { name: '小镰刀', intent: 'attack', dmg: 6, exec(A) { A.attack(); } },
      hide: { name: '残像', intent: 'defend', exec(A) { A.gainSelfBlock(5); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.8) ? 'jab' : 'hide'; }
  });
  edef({
    id: 'ul_gomora', name: '哥莫拉', art: '🦖', maxHp: [180, 195], boss: true,
    moves: {
      hornswing: { name: '超振动波', intent: 'attack', dmg: 16, exec(A) { A.attack(); } },
      tailattack: { name: '尾鞭', intent: 'attack', dmg: 10, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      enraged: { name: '狂暴化', intent: 'buff', exec(A) { A.buffSelf('str', 4); A.gainSelfBlock(10); } },
      ultracharge: { name: '冲角突进', intent: 'strong', dmg: 32, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (ctx.turn === 1) return 'enraged';
      if (phase2 && !self._p2) { self._p2 = true; return 'ultracharge'; }
      return phase2
        ? ['hornswing', 'ultracharge', 'tailattack', 'enraged'][(ctx.turn - 1) % 4]
        : ['hornswing', 'tailattack', 'hornswing', 'enraged'][(ctx.turn - 1) % 4];
    }
  });
  edef({
    id: 'ul_zetton', name: '宇宙恐龙·杰顿', art: '☄️', maxHp: [320, 340], boss: true,
    moves: {
      meteor: { name: '陨石拳', intent: 'attack', dmg: 22, exec(A) { A.attack(); } },
      fireball: { name: '火球连弹', intent: 'attack', dmg: 12, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      barrier: { name: '杰顿屏障', intent: 'defend', exec(A) { A.gainSelfBlock(18); A.buffSelf('str', 2); } },
      absorb: { name: '吸收光线', intent: 'buff', exec(A) { A.healSelf(25); } },
      zettonbeam: { name: '杰顿光线', intent: 'strong', dmg: 42, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.45;
      if (ctx.turn === 1) return 'barrier';
      if (phase2 && !self._p2) { self._p2 = true; return 'zettonbeam'; }
      return phase2
        ? ['meteor', 'zettonbeam', 'fireball', 'absorb'][(ctx.turn - 1) % 4]
        : ['meteor', 'meteor', 'fireball', 'barrier'][(ctx.turn - 1) % 4];
    }
  });

  UL.enemyIds = Object.keys(E).filter(k => k.startsWith('ul_'));
  THEMES.push(UL);

  /* ================================================================
     主题五 · 西游记
     关键词:棍势(攻击积攒、重棍消耗的连击资源)、七十二变(千变万化)、
             分身(毫毛变化的猴子猴孙)
     ================================================================ */
  const XY = {
    id: 'journey',
    cls: 'wukong',
    name: '西游记',
    art: '🐒',
    tag: '七十二变 · 金箍棒',
    desc: '八十一难,步步凶险。<br>一根金箍棒,搅得天翻地覆。',
    relic: '如意金箍棒:每场战斗开始时获得 3 层「棍势」',
    tip: '「棍势」随攻击积攒,被重棍一次性消耗,打出爆发伤害;「七十二变」每次都不相同;拔一根毫毛,召唤猴子猴孙一起上阵。',
    fieldLabel: '心魔',
    fieldMax: 11,
    curseDmg: 2,
    curseHp: 0.05,
    startHp: 82,
    starterDeck: ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'xy_hair'],
    starterRelic: 'xy_cudgel',
    basic: ['xy_strike', 'xy_defend', 'xy_hair'],
    pool: [
      'xy_strike', 'xy_defend', 'xy_hair', 'xy_heavy', 'xy_combo', 'xy_guard',
      'xy_transform', 'xy_eyes', 'xy_stretch', 'xy_smash', 'xy_storm',
      'xy_freeze', 'xy_peach', 'xy_ride', 'xy_giant', 'xy_majesty',
      'xy_seastack', 'xy_havoc', 'xy_sixarms', 'xy_fan', 'xy_monkeys'
    ],
    tokens: ['xy_clone', 'xy_cloud'],
    relics: ['xy_cudgel', 'xy_belt', 'xy_basket', 'xy_cloud', 'xy_gourd', 'xy_hairbox', 'xy_goldhoop'],
    allyDefs: [
      { id: 'xy_a_sanzang', name: '唐僧', art: '📿', cost: 150, starter: true,
        desc: '慈悲诵经:每回合开始时,回复 3 点生命。',
        synergy: { ids: ['xy_peach'], name: '化缘斋饭',
          note: '打出「蟠桃」时,额外回复 6 点生命',
          fx(A) { A.heal(6); } },
        turnStart(A) { A.heal(3); } },
      { id: 'xy_a_bajie', name: '猪八戒', art: '🐷', cost: 150, starter: true,
        desc: '九齿钉耙:每回合开始时,获得 3 点格挡并对随机敌人造成 2 点伤害。',
        synergy: { ids: ['xy_heavy'], name: '钉耙重击',
          note: '打出「重劈」时,伤害 +2',
          fx(A) { A.attackBonus(2); } },
        turnStart(A) { A.block(3); A.dmgRandom(2); } },
      { id: 'xy_a_wujing', name: '沙悟净', art: '🪨', cost: 130, starter: true,
        desc: '降妖宝杖:每回合开始时,获得 1 层「棍势」。',
        synergy: { ids: ['xy_smash'], name: '宝杖同源',
          note: '打出「千钧重棍」时,伤害 +3',
          fx(A) { A.attackBonus(3); } },
        turnStart(A) { A.cudgel(1); } },
      { id: 'xy_a_horse', name: '白龙马', art: '🐴', cost: 140,
        desc: '龙马负履:每场战斗开始时,获得 1 层「领域屏障」。',
        synergy: { ids: ['xy_ride'], name: '龙马奔腾',
          note: '打出「驾云」时,额外获得 1 层「棍势」',
          fx(A) { A.applySelf('cudgel', 1); } },
        combatStart(A) { A.barrier(1); } },
      { id: 'xy_a_guanyin', name: '观音菩萨', art: '🪷', cost: 240,
        desc: '慈悲法力:每回合开始时,获得 4 点格挡并回复 2 点生命。',
        turnStart(A) { A.block(4); A.heal(2); } }
    ],
    relicDefs: [
      { id: 'xy_cudgel', name: '如意金箍棒', art: '🥢', rarity: 'starter', theme: 'journey',
        desc: '每场战斗开始时获得 3 层「棍势」。' },
      { id: 'xy_belt', name: '行者腰带', art: '🥋', rarity: 'common', theme: 'journey',
        desc: '每场战斗开始时获得 4 点格挡。', blockStart: 4 },
      { id: 'xy_basket', name: '蟠桃园土', art: '🍑', rarity: 'common', theme: 'journey',
        desc: '每场战斗胜利后回复 5 点生命。', healOnWin: 5 },
      { id: 'xy_cloud', name: '筋斗云', art: '☁️', rarity: 'uncommon', theme: 'journey',
        desc: '每场战斗的第一回合额外抽 2 张牌。', drawFirstTurn: 2 },
      { id: 'xy_gourd', name: '紫金葫芦', art: '🏺', rarity: 'uncommon', theme: 'journey',
        desc: '对精英敌人的伤害 +15%。', eliteDmgMult: 0.15 },
      { id: 'xy_hairbox', name: '毫毛宝匣', art: '🧹', rarity: 'uncommon', theme: 'journey',
        desc: '每场战斗开始时,将 1 张「猴子猴孙」加入手牌。' },
      { id: 'xy_goldhoop', name: '紧箍儿', art: '⭕', rarity: 'rare', theme: 'journey',
        desc: '每回合开始时获得 1 层「棍势」。' }
    ],
    acts: [
      {
        name: '西游·双叉岭',
        rows: 10,
        intro: '虎狼盘踞,妖魔当道。取经路的第一步。',
        normal: [['xy_imp'], ['xy_imp', 'xy_imp'], ['xy_spider'], ['xy_ghost'], ['xy_weasel']],
        elite: [['xy_blackbear'], ['xy_spider', 'xy_spider']],
        boss: [['xy_whitebone']]
      },
      {
        name: '西游·盘丝洞',
        rows: 12,
        intro: '丝线缠山,妖气蔽日。洞中传来了笑声。',
        normal: [['xy_spider', 'xy_spider'], ['xy_yellowwind'], ['xy_blackbear'], ['xy_weasel', 'xy_weasel'], ['xy_ghost', 'xy_ghost', 'xy_imp']],
        elite: [['xy_yellowwind', 'xy_imp'], ['xy_blackbear', 'xy_spider']],
        boss: [['xy_bull']]
      },
      {
        name: '西游·真假美猴王',
        rows: 14,
        intro: '两个美猴王,打上了凌霄宝殿。谛听无语,如来难辨。',
        normal: [['xy_yellowwind'], ['xy_blackbear', 'xy_weasel'], ['xy_ghost', 'xy_ghost', 'xy_spider'], ['xy_yellowwind', 'xy_weasel'], ['xy_imp', 'xy_imp', 'xy_ghost']],
        elite: [['xy_blackbear', 'xy_yellowwind'], ['xy_yellowwind', 'xy_spider', 'xy_spider']],
        boss: [['xy_sixears']]
      }
    ],
    npcs: [
      { type: 'curse', name: '八卦炉的余烬', art: '🔥', text: '炉火未熄。当年炼出火眼金睛的地方,如今仍烫得惊人。' },
      { type: 'curse', name: '蟠桃核', art: '🌰', text: '仙桃只剩一枚桃核,散发着微弱的灵气。' },
      { type: 'ward', name: '土地庙', art: '🛕', text: '土地公的小庙虽破,倒也能遮风挡雨。' }
    ]
  };

  /* ---- 西游记:卡牌 ---- */
  def({
    id: 'xy_strike', cls: 'wukong', type: 'attack', rarity: 'basic', cost: 1, dmg: 6, target: 'enemy',
    name: '棒击', desc: '造成 {D} 点伤害。',
    up: { dmg: 9, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'xy_defend', cls: 'wukong', type: 'skill', rarity: 'basic', cost: 1, block: 5, target: 'none',
    name: '扎马式', desc: '获得 {B} 点格挡。',
    up: { block: 8, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'xy_hair', cls: 'wukong', type: 'skill', rarity: 'basic', cost: 0, target: 'none',
    name: '拔毛·分身', desc: '将 1 张「猴子猴孙」加入手牌。',
    up: { desc: '将 2 张「猴子猴孙」加入手牌。' },
    play(A, inst) { A.addToken('xy_clone', inst.up ? 2 : 1); }
  });
  def({
    id: 'xy_heavy', cls: 'wukong', type: 'attack', rarity: 'common', cost: 1, dmg: 9, target: 'enemy',
    name: '重劈', desc: '造成 {D} 点伤害,获得 1 层「棍势」。',
    up: { dmg: 12, desc: '造成 {D} 点伤害,获得 1 层「棍势」。' },
    play(A, inst, t) { A.attack(t); A.applySelf('cudgel', 1); }
  });
  def({
    id: 'xy_combo', cls: 'wukong', type: 'attack', rarity: 'common', cost: 1, dmg: 4, hits: 2, target: 'enemy',
    name: '连环棒', desc: '造成 2 次 {D} 点伤害,每命中一次获得 1 层「棍势」。',
    up: { dmg: 5, desc: '造成 2 次 {D} 点伤害,每命中一次获得 1 层「棍势」。' },
    play(A, inst) { for (let i = 0; i < 2; i++) { A.attack(); A.applySelf('cudgel', 1); } }
  });
  def({
    id: 'xy_guard', cls: 'wukong', type: 'skill', rarity: 'common', cost: 1, block: 8, target: 'none',
    name: '铜头铁臂', desc: '获得 {B} 点格挡,获得 1 层「棍势」。',
    up: { block: 11, desc: '获得 {B} 点格挡,获得 1 层「棍势」。' },
    play(A, inst) { A.gainBlock(); A.applySelf('cudgel', 1); }
  });
  def({
    id: 'xy_transform', cls: 'wukong', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '七十二变', desc: '随机变化:获得 2 点力量 / 抽 2 张牌 / 获得 10 点格挡与 1 层「棍势」。',
    up: { desc: '随机变化:获得 3 点力量 / 抽 3 张牌 / 获得 14 点格挡与 1 层「棍势」。' },
    play(A, inst) {
      const u = inst.up;
      const r = A.roll();
      if (r < 0.34) A.applySelf('str', u ? 3 : 2);
      else if (r < 0.67) A.draw(u ? 3 : 2);
      else { A.gainBlock(u ? 14 : 10); A.applySelf('cudgel', 1); }
    }
  });
  def({
    id: 'xy_eyes', cls: 'wukong', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    name: '火眼金睛', desc: '施加 2 层易伤,获得 1 层「棍势」。',
    up: { desc: '施加 3 层易伤,获得 1 层「棍势」。' },
    play(A, inst, t) { A.applyTo(t, 'vuln', inst.up ? 3 : 2); A.applySelf('cudgel', 1); }
  });
  def({
    id: 'xy_stretch', cls: 'wukong', type: 'attack', rarity: 'common', cost: 1, dmg: 6, target: 'all',
    name: '如意伸缩', desc: '金箍棒变大,对所有敌人造成 {D} 点伤害。',
    up: { dmg: 8, desc: '金箍棒变大,对所有敌人造成 {D} 点伤害。' },
    play(A) { A.attackAll(); }
  });
  def({
    id: 'xy_smash', cls: 'wukong', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 6, target: 'enemy',
    name: '千钧重棍', desc: '消耗全部「棍势」,每层使其伤害 +7。',
    up: { dmg: 8, desc: '消耗全部「棍势」,每层使其伤害 +8。' },
    play(A, inst, t) {
      const n = A.selfStatus('cudgel');
      if (n > 0) A.applySelf('cudgel', -n);
      A.attackBonus(n * (inst.up ? 8 : 7));
      A.attack(t);
    }
  });
  def({
    id: 'xy_storm', cls: 'wukong', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 5, target: 'all',
    name: '席卷乾坤', desc: '对所有敌人造成 {D} 点伤害,消耗至多 3 层「棍势」,每层 +4。',
    up: { dmg: 7, desc: '对所有敌人造成 {D} 点伤害,消耗至多 3 层「棍势」,每层 +6。' },
    play(A, inst) {
      const n = Math.min(3, A.selfStatus('cudgel'));
      if (n > 0) A.applySelf('cudgel', -n);
      A.attackBonus(n * (inst.up ? 6 : 4));
      A.attackAll();
    }
  });
  def({
    id: 'xy_freeze', cls: 'wukong', type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy',
    name: '定身法', desc: '施加 1 层「封锁」(其下回合无法行动),镜域之值 -1。',
    up: { cost: 0, desc: '施加 1 层「封锁」(其下回合无法行动),镜域之值 -1。' },
    play(A, inst, t) { A.applyTo(t, 'sealAction', 1); A.modifyField(-1); }
  });
  def({
    id: 'xy_peach', cls: 'wukong', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    name: '蟠桃', desc: '回复 10 点生命。',
    up: { desc: '回复 15 点生命。' },
    play(A, inst) { A.heal(inst.up ? 15 : 10); }
  });
  def({
    id: 'xy_ride', cls: 'wukong', type: 'skill', rarity: 'uncommon', cost: 1, block: 6, target: 'none',
    name: '驾云', desc: '获得 {B} 点格挡,将 1 张「筋斗云」加入手牌。',
    up: { block: 8, desc: '获得 {B} 点格挡,将 1 张「筋斗云」加入手牌。' },
    play(A, inst) { A.gainBlock(); A.addToken('xy_cloud', 1); }
  });
  def({
    id: 'xy_giant', cls: 'wukong', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
    name: '法天象地', desc: '每当你打出一张攻击牌,获得 1 层「棍势」。',
    up: { desc: '每当你打出一张攻击牌,获得 1 层「棍势」,并获得 2 层「棍势」。' },
    play(A, inst) { A.applySelf('growstaff', 1); if (inst.up) A.applySelf('cudgel', 2); }
  });
  def({
    id: 'xy_majesty', cls: 'wukong', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '大圣威仪', desc: '获得 2 点力量;每回合开始时获得 2 层「棍势」。',
    up: { cost: 1, desc: '获得 2 点力量;每回合开始时获得 2 层「棍势」。' },
    play(A) { A.applySelf('str', 2); A.applySelf('majesty', 1); }
  });
  def({
    id: 'xy_seastack', cls: 'wukong', type: 'attack', rarity: 'rare', cost: 2, dmg: 16, exhaust: true, target: 'enemy',
    name: '定海神针', desc: '造成 {D} 点伤害,获得 2 层「棍势」。消耗。',
    up: { dmg: 22, desc: '造成 {D} 点伤害,获得 2 层「棍势」。消耗。' },
    play(A, inst, t) { A.attack(t); A.applySelf('cudgel', 2); }
  });
  def({
    id: 'xy_havoc', cls: 'wukong', type: 'power', rarity: 'rare', cost: 3, target: 'none',
    name: '大闹天宫', desc: '每回合结束时,对所有敌人造成 6 点伤害。',
    up: { cost: 2, desc: '每回合结束时,对所有敌人造成 9 点伤害。' },
    play(A, inst) { A.applySelf('havoc', inst.up ? 9 : 6); }
  });
  def({
    id: 'xy_sixarms', cls: 'wukong', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '三头六臂', desc: '你的攻击牌伤害 +4。',
    up: { desc: '你的攻击牌伤害 +6。' },
    play(A, inst) { A.applySelf('sixarms', inst.up ? 3 : 2); }
  });
  /* 衍生牌 */
  def({
    id: 'xy_clone', cls: 'special', type: 'attack', rarity: 'special', cost: 0, dmg: 4, target: 'enemy',
    name: '猴子猴孙', desc: '造成 {D} 点伤害。', up: {},
    play(A) { A.attack(); }
  });
  def({
    id: 'xy_cloud', cls: 'special', type: 'skill', rarity: 'special', cost: 0, block: 5, exhaust: true, target: 'none',
    name: '筋斗云', desc: '获得 {B} 点格挡。消耗。', up: {},
    play(A) { A.gainBlock(); }
  });

  /* ---- 西游记:敌人 ---- */
  edef({
    id: 'xy_imp', name: '巡山小妖', art: '👺', maxHp: [24, 28],
    moves: {
      spear: { name: '长矛', intent: 'attack', dmg: 7, exec(A) { A.attack(); } },
      stumble: { name: '缩头', intent: 'defend', exec(A) { A.gainSelfBlock(6); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.75) ? 'spear' : 'stumble'; }
  });
  edef({
    id: 'xy_spider', name: '盘丝小妖', art: '🕷️', maxHp: [26, 30],
    moves: {
      silk: { name: '缠丝', intent: 'attackDebuff', dmg: 6, exec(A) { A.attack(); A.debuffPlayer('weak', 1); } },
      bite: { name: '毒牙', intent: 'attack', dmg: 8, exec(A) { A.attack(); } },
      web: { name: '结网', intent: 'debuff', exec(A) { A.debuffPlayer('frail', 2); } }
    },
    ai(self, ctx) { return GS.RNG.weighted(ctx.run, ['silk', 'bite', 'web'], [3, 4, 2]); }
  });
  edef({
    id: 'xy_weasel', name: '黄风小妖', art: '🦡', maxHp: [28, 32],
    moves: {
      sandstrike: { name: '沙击', intent: 'attack', dmg: 8, exec(A) { A.attack(); } },
      sandstorm: { name: '妖风', intent: 'debuff', exec(A) { A.debuffPlayer('vuln', 2); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.7) ? 'sandstrike' : 'sandstorm'; }
  });
  edef({
    id: 'xy_ghost', name: '白骨幻影', art: '💀', maxHp: [22, 26],
    moves: {
      wail: { name: '鬼哭', intent: 'attack', dmg: 7, exec(A) { A.attack(); } },
      fade: { name: '消散', intent: 'defend', exec(A) { A.gainSelfBlock(8); A.buffSelf('str', 1); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.7) ? 'wail' : 'fade'; }
  });
  edef({
    id: 'xy_blackbear', name: '黑熊精', art: '🐻', maxHp: [74, 82], elite: true,
    moves: {
      claws: { name: '熊掌', intent: 'attack', dmg: 12, exec(A) { A.attack(); } },
      pounce: { name: '扑击', intent: 'attackDefend', dmg: 9, exec(A) { A.attack(); A.gainSelfBlock(8); } },
      fierce: { name: '凶性大发', intent: 'buff', exec(A) { A.buffSelf('str', 3); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'fierce';
      return GS.RNG.weighted(ctx.run, ['claws', 'pounce', 'fierce'], [4, 3, 2]);
    }
  });
  edef({
    id: 'xy_yellowwind', name: '黄风怪', art: '🌪️', maxHp: [70, 78], elite: true,
    moves: {
      goldenwind: { name: '三昧神风', intent: 'attackDebuff', dmg: 10, exec(A) { A.attack(); A.debuffPlayer('weak', 2); } },
      sandtornado: { name: '风卷沙', intent: 'attack', dmg: 6, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      hidestorm: { name: '风遁', intent: 'defend', exec(A) { A.gainSelfBlock(12); } }
    },
    ai(self, ctx) { return GS.RNG.weighted(ctx.run, ['goldenwind', 'sandtornado', 'hidestorm'], [4, 3, 2]); }
  });
  edef({
    id: 'xy_whitebone', name: '白骨夫人', art: '🦴', maxHp: [128, 138], boss: true,
    moves: {
      boneclaw: { name: '白骨爪', intent: 'attack', dmg: 13, exec(A) { A.attack(); } },
      transform: { name: '变化', intent: 'buff', exec(A) { A.buffSelf('str', 3); A.gainSelfBlock(10); } },
      phantom: { name: '幻影', intent: 'buff', exec(A) { A.summon('xy_ghost'); } },
      fatalbite: { name: '夺命咬', intent: 'strong', dmg: 26, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (ctx.turn === 1) return 'transform';
      if (phase2 && !self._p2) { self._p2 = true; return 'fatalbite'; }
      return phase2
        ? ['boneclaw', 'fatalbite', 'phantom', 'transform'][(ctx.turn - 1) % 4]
        : ['boneclaw', 'boneclaw', 'phantom', 'transform'][(ctx.turn - 1) % 4];
    }
  });
  edef({
    id: 'xy_bull', name: '牛魔王', art: '🐂', maxHp: [185, 200], boss: true,
    moves: {
      axe: { name: '混铁棍', intent: 'attack', dmg: 17, exec(A) { A.attack(); } },
      bullrush: { name: '蛮牛冲撞', intent: 'attack', dmg: 11, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      roar: { name: '魔王怒吼', intent: 'buff', exec(A) { A.buffSelf('str', 4); } },
      trueform: { name: '本相现世', intent: 'strong', dmg: 33, exec(A) { A.attack(); A.buffSelf('str', 2); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (ctx.turn === 1) return 'roar';
      if (phase2 && !self._p2) { self._p2 = true; return 'trueform'; }
      return phase2
        ? ['axe', 'trueform', 'bullrush', 'roar'][(ctx.turn - 1) % 4]
        : ['axe', 'axe', 'bullrush', 'roar'][(ctx.turn - 1) % 4];
    }
  });
  edef({
    id: 'xy_sixears', name: '六耳猕猴', art: '🐵', maxHp: [330, 350], boss: true,
    moves: {
      earblade: { name: '随心铁杆兵', intent: 'attack', dmg: 20, exec(A) { A.attack(); } },
      mimicry: { name: '真假难辨', intent: 'defend', exec(A) { A.gainSelfBlock(16); A.buffSelf('str', 3); } },
      mindread: { name: '窃听心声', intent: 'attackDebuff', dmg: 14, exec(A) { A.attack(); A.debuffPlayer('frail', 3); } },
      sageknock: { name: '一棒定音', intent: 'strong', dmg: 38, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.45;
      if (ctx.turn === 1) return 'mimicry';
      if (phase2 && !self._p2) { self._p2 = true; return 'sageknock'; }
      return phase2
        ? ['earblade', 'sageknock', 'mindread', 'mimicry'][(ctx.turn - 1) % 4]
        : ['earblade', 'earblade', 'mindread', 'mimicry'][(ctx.turn - 1) % 4];
    }
  });

  XY.enemyIds = Object.keys(E).filter(k => k.startsWith('xy_'));
  THEMES.push(XY);

  /* ================================================================
     主题六 · 妖精的尾巴
     关键词:羁绊(本场打出的牌数,强化灭龙魔法)、龙之意志(衰减的攻击增幅)、
             灭龙奥义(随羁绊爆发的终结技)
     ================================================================ */
  const FT = {
    id: 'fairytail',
    cls: 'fairytail',
    name: '妖精的尾巴',
    art: '🧚',
    tag: '灭龙魔法 · 伙伴',
    desc: '公会是最强的魔法。<br>伙伴的羁绊,就是燃烧不尽的魔力。',
    relic: '公会纹章:每场战斗开始时获得 2 层「龙之意志」',
    tip: '「羁绊」等于本场战斗中你打出的牌数,灭龙魔法会随羁绊不断增强;「龙之意志」直接提升攻击但每回合衰减;打出的牌越多,灭龙奥义越恐怖。',
    fieldLabel: '魔障',
    fieldMax: 12,
    curseDmg: 2,
    curseHp: 0.05,
    startHp: 80,
    starterDeck: ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'ft_feast'],
    starterRelic: 'ft_emblem',
    basic: ['ft_strike', 'ft_defend', 'ft_feast'],
    pool: [
      'ft_strike', 'ft_defend', 'ft_feast', 'ft_claw', 'ft_wing', 'ft_hook',
      'ft_flame', 'ft_guard', 'ft_drain', 'ft_wendy', 'ft_iron', 'ft_bit',
      'ft_scales', 'ft_ice', 'ft_summon', 'ft_dragonforce', 'ft_thunder',
      'ft_unison', 'ft_law', 'ft_nakama', 'ft_warm', 'ft_skyroar'
    ],
    tokens: ['ft_ember'],
    relics: ['ft_emblem', 'ft_scarf', 'ft_lacrima', 'ft_armor', 'ft_banner', 'ft_nakama', 'ft_eternal'],
    allyDefs: [
      { id: 'ft_a_lucy', name: '露西', art: '🔑', cost: 160, starter: true,
        desc: '星灵魔导士:每回合开始时,将 1 张「星火」加入手牌。',
        synergy: { ids: ['ft_ember'], name: '星灵之力',
          note: '打出「星火」时,伤害 +3',
          fx(A) { A.attackBonus(3); } },
        turnStart(A) { A.token('ft_ember', 1); } },
      { id: 'ft_a_gray', name: '格雷', art: '❄️', cost: 150, starter: true,
        desc: '冰之造型魔导士:每回合开始时,获得 4 点格挡。',
        synergy: { ids: ['ft_ice'], name: '冰造同调',
          note: '打出「冰之造型·盾」时,额外获得 4 点格挡',
          fx(A) { A.gainBlock(4); } },
        turnStart(A) { A.block(4); } },
      { id: 'ft_a_happy', name: '哈比', art: '🐱', cost: 120, starter: true,
        desc: '会飞的猫:每回合开始时,获得 2 点格挡并对随机敌人造成 2 点伤害。',
        turnStart(A) { A.block(2); A.dmgRandom(2); } },
      { id: 'ft_a_erza', name: '艾尔莎', art: '🗡️', cost: 170,
        desc: '妖精女王,S 级魔导士:每场战斗开始时,获得 2 点力量。',
        synergy: { ids: ['ft_bit'], name: '女王压阵',
          note: '打出「灭龙奥义·咆哮」时,伤害 +4',
          fx(A) { A.attackBonus(4); } },
        combatStart(A) { A.str(2); } },
      { id: 'ft_a_wendy', name: '温蒂', art: '💚', cost: 130,
        desc: '天龙·天空之灭龙魔导士:每回合开始时,回复 3 点生命。',
        synergy: { ids: ['ft_wendy', 'ft_skyroar'], name: '天之灭龙',
          note: '打出「天龙的抚慰」额外回复 6 点;「天龙·咆哮」伤害 +3',
          fx(A, inst) { if (inst && inst.id === 'ft_wendy') A.heal(6); else A.attackBonus(3); } },
        turnStart(A) { A.heal(3); } }
    ],
    relicDefs: [
      { id: 'ft_emblem', name: '公会纹章', art: '🧚', rarity: 'starter', theme: 'fairytail',
        desc: '每场战斗开始时获得 2 层「龙之意志」。' },
      { id: 'ft_scarf', name: '伊古尼鲁的围巾', art: '🧣', rarity: 'common', theme: 'fairytail',
        desc: '每场战斗开始时获得 1 点力量。', strStart: 1 },
      { id: 'ft_lacrima', name: '魔导水晶', art: '💠', rarity: 'common', theme: 'fairytail',
        desc: '每场战斗的第一回合额外抽 2 张牌。', drawFirstTurn: 2 },
      { id: 'ft_armor', name: '妖精女王的铠甲', art: '🛡️', rarity: 'uncommon', theme: 'fairytail',
        desc: '每场战斗开始时获得 6 点格挡。', blockStart: 6 },
      { id: 'ft_banner', name: '公会的旗帜', art: '🚩', rarity: 'uncommon', theme: 'fairytail',
        desc: '对精英与 BOSS 的伤害 +12%。', eliteDmgMult: 0.12, bossDmgMult: 0.12 },
      { id: 'ft_nakama', name: '伙伴的羁绊', art: '🤝', rarity: 'rare', theme: 'fairytail',
        desc: '每场战斗胜利后回复 12 点生命。', healOnWin: 12 },
      { id: 'ft_eternal', name: '龙之力', art: '🐲', rarity: 'rare', theme: 'fairytail',
        desc: '你的「龙之意志」不再随回合减少。' }
    ],
    acts: [
      {
        name: '妖尾·公会纷争',
        rows: 10,
        intro: '铁龙找上门来。公会的招牌,不能丢。',
        normal: [['ft_vulcan'], ['ft_shade'], ['ft_golem'], ['ft_wasp', 'ft_wasp'], ['ft_vulcan', 'ft_shade']],
        elite: [['ft_juvia'], ['ft_golem', 'ft_wasp']],
        boss: [['ft_gazille']]
      },
      {
        name: '妖尾·魔导公会战',
        rows: 12,
        intro: '幻影领主的阴影笼罩港口,四元素来袭。',
        normal: [['ft_golem'], ['ft_juvia'], ['ft_aria'], ['ft_shade', 'ft_shade'], ['ft_wasp', 'ft_vulcan']],
        elite: [['ft_aria', 'ft_shade'], ['ft_juvia', 'ft_wasp']],
        boss: [['ft_deliora']]
      },
      {
        name: '妖尾·灭龙之战',
        rows: 14,
        intro: '黑龙降临。那是吞噬了龙的黑暗之影。',
        normal: [['ft_aria'], ['ft_juvia', 'ft_golem'], ['ft_shade', 'ft_shade', 'ft_wasp'], ['ft_golem', 'ft_vulcan', 'ft_shade'], ['ft_aria', 'ft_wasp']],
        elite: [['ft_aria', 'ft_juvia'], ['ft_juvia', 'ft_golem', 'ft_wasp']],
        boss: [['ft_acnologia']]
      }
    ],
    npcs: [
      { type: 'curse', name: '魔水晶残片', art: '🔮', text: '碎片里的魔力还在流动,吸收它可能会变强。' },
      { type: 'curse', name: '黑魔导书', art: '📓', text: '封皮上的文字在蠕动。阅读它需要付出代价。' },
      { type: 'ward', name: '妖尾的酒场', art: '🍺', text: '公会的酒场永远为你留着一个位置。' }
    ]
  };

  /* ---- 妖精的尾巴:卡牌 ---- */
  def({
    id: 'ft_strike', cls: 'fairytail', type: 'attack', rarity: 'basic', cost: 1, dmg: 6, target: 'enemy',
    name: '灭龙铁拳', desc: '造成 {D} 点伤害。',
    up: { dmg: 9, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'ft_defend', cls: 'fairytail', type: 'skill', rarity: 'basic', cost: 1, block: 5, target: 'none',
    name: '闪避步法', desc: '获得 {B} 点格挡。',
    up: { block: 8, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'ft_feast', cls: 'fairytail', type: 'skill', rarity: 'basic', cost: 0, target: 'none',
    name: '火之摄食', desc: '回复 3 点生命,获得 1 层「龙之意志」。',
    up: { desc: '回复 5 点生命,获得 1 层「龙之意志」。' },
    play(A, inst) { A.heal(inst.up ? 5 : 3); A.applySelf('dragonforce', 1); }
  });
  def({
    id: 'ft_claw', cls: 'fairytail', type: 'attack', rarity: 'common', cost: 1, dmg: 8, target: 'enemy',
    name: '灭龙爪', desc: '造成 {D} 点伤害。',
    up: { dmg: 11, desc: '造成 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'ft_wing', cls: 'fairytail', type: 'attack', rarity: 'common', cost: 1, dmg: 5, hits: 2, target: 'enemy',
    name: '火龙之翼', desc: '造成 2 次 {D} 点伤害。',
    up: { dmg: 7, desc: '造成 2 次 {D} 点伤害。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'ft_hook', cls: 'fairytail', type: 'attack', rarity: 'common', cost: 1, dmg: 6, target: 'enemy',
    name: '羁绊勾拳', desc: '造成 {D} 点伤害,本场每打出过 2 张牌伤害 +1。',
    up: { dmg: 8, desc: '造成 {D} 点伤害,本场每打出过 2 张牌伤害 +1。' },
    play(A, inst, t) { A.attackBonus(Math.floor(A.cardsPlayed() / 2)); A.attack(t); }
  });
  def({
    id: 'ft_flame', cls: 'fairytail', type: 'attack', rarity: 'common', cost: 1, dmg: 7, target: 'enemy',
    name: '火龙炎', desc: '造成 {D} 点伤害,施加 2 层「灼伤」。',
    up: { dmg: 9, desc: '造成 {D} 点伤害,施加 3 层「灼伤」。' },
    play(A, inst, t) { A.attack(t); A.applyTo(t, 'scorch', inst.up ? 3 : 2); }
  });
  def({
    id: 'ft_guard', cls: 'fairytail', type: 'skill', rarity: 'common', cost: 1, block: 9, target: 'none',
    name: '公会之盾', desc: '获得 {B} 点格挡。',
    up: { block: 12, desc: '获得 {B} 点格挡。' },
    play(A) { A.gainBlock(); }
  });
  def({
    id: 'ft_drain', cls: 'fairytail', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    name: '魔力掠夺', desc: '目标力量 -2,并施加 1 层易伤。',
    up: { desc: '目标力量 -3,并施加 2 层易伤。' },
    play(A, inst, t) {
      A.applyTo(t, 'str', inst.up ? -3 : -2);
      A.applyTo(t, 'vuln', inst.up ? 2 : 1);
    }
  });
  def({
    id: 'ft_wendy', cls: 'fairytail', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    name: '天龙的抚慰', desc: '回复 9 点生命。',
    up: { desc: '回复 14 点生命。' },
    play(A, inst) { A.heal(inst.up ? 14 : 9); }
  });
  def({
    id: 'ft_iron', cls: 'fairytail', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 10, block: 3, target: 'enemy',
    name: '铁龙之杖', desc: '造成 {D} 点伤害,获得 3 点格挡。',
    up: { dmg: 13, block: 5, desc: '造成 {D} 点伤害,获得 {B} 点格挡。' },
    play(A, inst, t) { A.attack(t); A.gainBlock(); }
  });
  def({
    id: 'ft_bit', cls: 'fairytail', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 8, target: 'enemy',
    name: '灭龙奥义·咆哮', desc: '造成 {D} 点伤害,本场每打出过 1 张牌伤害 +1。',
    up: { dmg: 10, desc: '造成 {D} 点伤害,本场每打出过 1 张牌伤害 +1。' },
    play(A, inst, t) { A.attackBonus(A.cardsPlayed()); A.attack(t); }
  });
  def({
    id: 'ft_scales', cls: 'fairytail', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    name: '灭龙之鳞', desc: '每回合开始时获得 4 点格挡。',
    up: { desc: '每回合开始时获得 6 点格挡。' },
    play(A, inst) { A.applySelf('scales', inst.up ? 6 : 4); }
  });
  def({
    id: 'ft_ice', cls: 'fairytail', type: 'skill', rarity: 'uncommon', cost: 1, block: 11, target: 'none',
    name: '冰之造型·盾', desc: '获得 {B} 点格挡,获得 1 层「龙之意志」。',
    up: { block: 15, desc: '获得 {B} 点格挡,获得 1 层「龙之意志」。' },
    play(A, inst) { A.gainBlock(); A.applySelf('dragonforce', 1); }
  });
  def({
    id: 'ft_summon', cls: 'fairytail', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '星灵召唤', desc: '将 2 张「星火」加入手牌,抽 1 张牌。消耗。',
    up: { desc: '将 3 张「星火」加入手牌,抽 1 张牌。消耗。' },
    play(A, inst) { A.addToken('ft_ember', inst.up ? 3 : 2); A.draw(1); }
  });
  def({
    id: 'ft_dragonforce', cls: 'fairytail', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '龙之意志', desc: '获得 2 层「龙之意志」:每层使你的攻击 +15%(每回合 -1 层)。',
    up: { cost: 1, desc: '获得 3 层「龙之意志」:每层使你的攻击 +15%(每回合 -1 层)。' },
    play(A, inst) { A.applySelf('dragonforce', inst.up ? 3 : 2); }
  });
  def({
    id: 'ft_thunder', cls: 'fairytail', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '雷炎模式', desc: '获得 2 点力量与 2 点敏捷;每回合结束失去 2 点生命。',
    up: { desc: '获得 3 点力量与 3 点敏捷;每回合结束失去 2 点生命。' },
    play(A, inst) {
      A.applySelf('str', inst.up ? 3 : 2);
      A.applySelf('dex', inst.up ? 3 : 2);
      A.applySelf('burnlife', 2);
    }
  });
  def({
    id: 'ft_unison', cls: 'fairytail', type: 'skill', rarity: 'rare', cost: 2, block: 8, target: 'all',
    name: '合体魔法', desc: '对所有敌人造成 14 点伤害,获得 {B} 点格挡。',
    up: { desc: '对所有敌人造成 20 点伤害,获得 {B} 点格挡。' },
    play(A, inst) { A.dealMagicAll(inst.up ? 20 : 14); A.gainBlock(); }
  });
  def({
    id: 'ft_law', cls: 'fairytail', type: 'power', rarity: 'rare', cost: 3, target: 'none',
    name: '妖精法律', desc: '每回合结束时,对所有敌人造成 7 点伤害。',
    up: { cost: 2, desc: '每回合结束时,对所有敌人造成 10 点伤害。' },
    play(A, inst) { A.applySelf('law', inst.up ? 10 : 7); }
  });
  def({
    id: 'ft_nakama', cls: 'fairytail', type: 'skill', rarity: 'rare', cost: 2, target: 'all',
    name: '这就是·妖精的尾巴', desc: '对所有敌人造成等同「羁绊」×2 的伤害(羁绊=本场打出的牌数)。',
    up: { desc: '对所有敌人造成等同「羁绊」×3 的伤害(羁绊=本场打出的牌数)。' },
    play(A, inst) { A.dealMagicAll(A.cardsPlayed() * (inst.up ? 3 : 2)); }
  });
  /* 衍生牌 */
  def({
    id: 'ft_ember', cls: 'special', type: 'attack', rarity: 'special', cost: 0, dmg: 4, target: 'enemy',
    name: '星火', desc: '造成 {D} 点伤害,回复 1 点生命。', up: {},
    play(A) { A.attack(); A.heal(1); }
  });

  /* ---- 妖精的尾巴:敌人 ---- */
  edef({
    id: 'ft_vulcan', name: '武尔坎', art: '🦧', maxHp: [26, 30],
    moves: {
      punch: { name: '重拳', intent: 'attack', dmg: 8, exec(A) { A.attack(); } },
      taunt: { name: '挑衅', intent: 'buff', exec(A) { A.buffSelf('str', 2); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.75) ? 'punch' : 'taunt'; }
  });
  edef({
    id: 'ft_golem', name: '石魔像', art: '🗿', maxHp: [32, 36],
    moves: {
      smash: { name: '巨岩砸击', intent: 'attack', dmg: 9, exec(A) { A.attack(); } },
      harden: { name: '石化', intent: 'defend', exec(A) { A.gainSelfBlock(12); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.65) ? 'smash' : 'harden'; }
  });
  edef({
    id: 'ft_shade', name: '阴影兽', art: '👤', maxHp: [24, 28],
    moves: {
      shadeclaw: { name: '暗影爪', intent: 'attack', dmg: 7, exec(A) { A.attack(); } },
      dissipate: { name: '雾散', intent: 'defend', exec(A) { A.gainSelfBlock(8); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.72) ? 'shadeclaw' : 'dissipate'; }
  });
  edef({
    id: 'ft_wasp', name: '毒蜂群', art: '🐝', maxHp: [20, 24],
    moves: {
      sting: { name: '蜂针', intent: 'attack', dmg: 4, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      venom: { name: '毒雾', intent: 'debuff', exec(A) { A.addStatusToDiscard('burn', 1); A.debuffPlayer('frail', 1); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.7) ? 'sting' : 'venom'; }
  });
  edef({
    id: 'ft_juvia', name: '水之朱比亚', art: '🌊', maxHp: [72, 80], elite: true,
    moves: {
      watercutter: { name: '水斩', intent: 'attackDebuff', dmg: 11, exec(A) { A.attack(); A.debuffPlayer('weak', 2); } },
      waterlock: { name: '水之锁', intent: 'defend', exec(A) { A.gainSelfBlock(12); } },
      melting: { name: '激流', intent: 'strong', dmg: 17, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'waterlock';
      return GS.RNG.weighted(ctx.run, ['watercutter', 'melting', 'waterlock'], [4, 3, 2]);
    }
  });
  edef({
    id: 'ft_aria', name: '风之阿里亚', art: '🌬️', maxHp: [76, 84], elite: true,
    moves: {
      airwave: { name: '气波', intent: 'attack', dmg: 12, exec(A) { A.attack(); } },
      silence: { name: '消音', intent: 'debuff', exec(A) { A.debuffPlayer('weak', 3); } },
      zephyr: { name: '疾风', intent: 'buff', exec(A) { A.buffSelf('str', 3); A.gainSelfBlock(8); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'zephyr';
      return GS.RNG.weighted(ctx.run, ['airwave', 'silence', 'zephyr'], [4, 2, 3]);
    }
  });
  edef({
    id: 'ft_gazille', name: '铁龙·伽吉鲁', art: '⚙️', maxHp: [130, 145], boss: true,
    moves: {
      ironsword: { name: '铁龙剑', intent: 'attack', dmg: 14, exec(A) { A.attack(); } },
      ironscale: { name: '铁龙鳞', intent: 'buff', exec(A) { A.gainSelfBlock(14); A.buffSelf('str', 2); } },
      shadowroar: { name: '铁影龙吼', intent: 'attackDebuff', dmg: 11, exec(A) { A.attack(); A.debuffPlayer('frail', 2); } },
      karma: { name: '业魔铁拳', intent: 'strong', dmg: 28, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (ctx.turn === 1) return 'ironscale';
      if (phase2 && !self._p2) { self._p2 = true; return 'karma'; }
      return phase2
        ? ['ironsword', 'karma', 'shadowroar', 'ironscale'][(ctx.turn - 1) % 4]
        : ['ironsword', 'ironsword', 'shadowroar', 'ironscale'][(ctx.turn - 1) % 4];
    }
  });
  edef({
    id: 'ft_deliora', name: '德里欧拉', art: '🧊', maxHp: [185, 200], boss: true,
    moves: {
      frostclaw: { name: '冰魔爪', intent: 'attack', dmg: 16, exec(A) { A.attack(); } },
      icecurse: { name: '冰之诅咒', intent: 'attackDebuff', dmg: 12, exec(A) { A.attack(); A.debuffPlayer('vuln', 2); } },
      moonlight: { name: '月光仪式', intent: 'buff', exec(A) { A.healSelf(20); A.buffSelf('str', 3); } },
      roar: { name: '冰魔咆哮', intent: 'attack', dmg: 8, hits: 3, exec(A) { A.attack({ times: 3 }); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (ctx.turn === 1) return 'frostclaw';
      if (phase2 && !self._p2) { self._p2 = true; return 'roar'; }
      return phase2
        ? ['frostclaw', 'roar', 'icecurse', 'moonlight'][(ctx.turn - 1) % 4]
        : ['frostclaw', 'icecurse', 'frostclaw', 'moonlight'][(ctx.turn - 1) % 4];
    }
  });
  edef({
    id: 'ft_acnologia', name: '黑龙·亚克诺罗基亚', art: '🐉', maxHp: [380, 400], boss: true,
    moves: {
      dragonclaw: { name: '龙爪', intent: 'attack', dmg: 24, exec(A) { A.attack(); } },
      dragonscale: { name: '龙鳞', intent: 'defend', exec(A) { A.gainSelfBlock(20); } },
      roar: { name: '龙之咆哮', intent: 'attack', dmg: 14, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      devoursmagic: { name: '吞噬魔法', intent: 'buff', exec(A) { A.healSelf(30); A.buffSelf('str', 4); } },
      annihilation: { name: '灭世之炎', intent: 'strong', dmg: 45, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.45;
      if (ctx.turn === 1) return 'dragonscale';
      if (phase2 && !self._p2) { self._p2 = true; return 'annihilation'; }
      return phase2
        ? ['dragonclaw', 'annihilation', 'roar', 'devoursmagic'][(ctx.turn - 1) % 4]
        : ['dragonclaw', 'dragonclaw', 'roar', 'dragonscale'][(ctx.turn - 1) % 4];
    }
  });

  FT.enemyIds = Object.keys(E).filter(k => k.startsWith('ft_'));
  THEMES.push(FT);

  /* ================================================================
     丰富卡组:六主题各补充 2 张专属卡
     ================================================================ */
  /* 神秘复苏 */
  def({
    id: 'mn_hundredghosts', cls: 'mystery', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 4, target: 'none',
    name: '百鬼夜行', desc: '对随机敌人造成 4 次 {D} 点伤害。',
    up: { dmg: 5, desc: '对随机敌人造成 4 次 {D} 点伤害。' },
    play(A) { A.attackRandom({ times: 4 }); }
  });
  def({
    id: 'mn_returnlife', cls: 'mystery', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '还阳术', desc: '移除你所有的减益,回复 6 点生命。',
    up: { desc: '移除你所有的减益,回复 10 点生命。' },
    play(A, inst) { A.cleanseDebuffs(); A.heal(inst.up ? 10 : 6); }
  });
  /* 咒术回战 */
  def({
    id: 'jj_yun', cls: 'jjk', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 8, target: 'enemy',
    name: '游云', desc: '造成 {D} 点伤害;消耗 1 点咒力,使其伤害 +6。',
    up: { dmg: 10, desc: '造成 {D} 点伤害;消耗 1 点咒力,使其伤害 +8。' },
    play(A, inst, t) {
      if (A.ce() > 0) { A.spendCe(1); A.attackBonus(inst.up ? 8 : 6); }
      A.attack(t);
    }
  });
  def({
    id: 'jj_manevolent', cls: 'jjk', type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, target: 'none',
    name: '十种影法术·满象', desc: '将 2 张「鵺」和 1 张「玉犬」加入手牌。消耗。',
    up: { desc: '将 3 张「鵺」和 1 张「玉犬」加入手牌。消耗。' },
    play(A, inst) {
      A.addToken('jj_bird', inst.up ? 3 : 2);
      A.addToken('jj_dog', 1);
    }
  });
  /* 从零开始的异世界 */
  def({
    id: 'rz_snowstorm', cls: 'rezero', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 8, target: 'all',
    name: '暴风雪', desc: '对所有敌人造成 {D} 点伤害,并施加 1 层虚弱。',
    up: { dmg: 11, desc: '对所有敌人造成 {D} 点伤害,并施加 2 层虚弱。' },
    play(A, inst) { A.attackAll(); A.applyAll('weak', inst.up ? 2 : 1); }
  });
  def({
    id: 'rz_ring', cls: 'rezero', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    name: '约定的戒指', desc: '消耗全部「魔女之香」,每层获得 5 点格挡并回复 2 点生命。',
    up: { desc: '消耗全部「魔女之香」,每层获得 6 点格挡并回复 3 点生命。' },
    play(A, inst) {
      const n = A.selfStatus('witchscent');
      if (n > 0) A.applySelf('witchscent', -n);
      A.gainBlock(n * (inst.up ? 6 : 5));
      A.heal(n * (inst.up ? 3 : 2));
    }
  });
  /* 奥特曼 */
  def({
    id: 'ul_wideshot', cls: 'ultraman', type: 'attack', rarity: 'common', cost: 1, dmg: 5, target: 'all',
    name: '广域光线', desc: '对所有敌人造成 {D} 点伤害,获得 1 点光能。',
    up: { dmg: 7, desc: '对所有敌人造成 {D} 点伤害,获得 1 点光能。' },
    play(A) { A.attackAll(); A.gainLight(1); }
  });
  def({
    id: 'ul_dome', cls: 'ultraman', type: 'skill', rarity: 'uncommon', cost: 1, block: 3, target: 'none',
    name: '奥特护罩', desc: '获得 1 层「领域屏障」与 {B} 点格挡,并回复 1 点光能。',
    up: { block: 6, desc: '获得 1 层「领域屏障」与 {B} 点格挡,并回复 1 点光能。' },
    play(A, inst) { A.applySelf('barrier', 1); A.gainBlock(); A.gainLight(1); }
  });
  /* 西游记 */
  def({
    id: 'xy_fan', cls: 'wukong', type: 'skill', rarity: 'uncommon', cost: 1, target: 'all',
    name: '芭蕉扇', desc: '对所有敌人施加 2 层虚弱,镜域之值 -2。',
    up: { desc: '对所有敌人施加 3 层虚弱,镜域之值 -2。' },
    play(A, inst) { A.applyAll('weak', inst.up ? 3 : 2); A.modifyField(-2); }
  });
  def({
    id: 'xy_monkeys', cls: 'wukong', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
    name: '身外身法', desc: '每回合开始时,将 1 张「猴子猴孙」加入手牌。',
    up: { cost: 1, desc: '每回合开始时,将 1 张「猴子猴孙」加入手牌。' },
    play(A) { A.applySelf('monkeys', 1); }
  });
  /* 妖精的尾巴 */
  def({
    id: 'ft_warm', cls: 'fairytail', type: 'skill', rarity: 'common', cost: 1, block: 4, target: 'none',
    name: '公会的温情', desc: '获得 {B} 点格挡;每有 1 名伙伴,额外 +2 格挡并回复 1 点生命。',
    up: { block: 5, desc: '获得 {B} 点格挡;每有 1 名伙伴,额外 +2 格挡并回复 1 点生命。' },
    play(A, inst) {
      A.gainBlock();
      const n = A.allies();
      if (n > 0) { A.gainBlock(n * 2); A.heal(n); }
    }
  });
  def({
    id: 'ft_skyroar', cls: 'fairytail', type: 'attack', rarity: 'common', cost: 1, dmg: 7, target: 'enemy',
    name: '天龙·咆哮', desc: '造成 {D} 点伤害,回复 2 点生命。',
    up: { dmg: 10, desc: '造成 {D} 点伤害,回复 3 点生命。' },
    play(A, inst, t) { A.attack(t); A.heal(inst.up ? 3 : 2); }
  });

  /* ============ 查询接口 ============ */
  const THEME_MAP = {};
  for (const t of THEMES) THEME_MAP[t.id] = t;

  /* 联动伙伴:全部主题的原著角色(商店可购买,伴随整局) */
  const ALLY_LIST = [];
  const ALLY_MAP = {};
  for (const t of THEMES) {
    for (const a of (t.allyDefs || [])) { ALLY_LIST.push(a); ALLY_MAP[a.id] = a; }
  }
  const ALLY_CAP = 4;

  /* ================================================================
     v5 内容扩展:新卡牌(扩池至 ~35) / up2 双升级分支 /
     主题专属事件 / 伙伴主动技能与双人羁绊
     ================================================================ */

  /* ---------------- 神秘复苏:新卡 ×13 ---------------- */
  def({
    id: 'mn_shadeshield', cls: 'mystery', type: 'skill', rarity: 'common', cost: 1, block: 8, target: 'none',
    name: '鬼影庇护', desc: '获得 {B} 点格挡,魂火 +1。',
    up: { block: 11, desc: '获得 {B} 点格挡,魂火 +1。' },
    up2: { cost: 0, block: 5, name: '鬼影庇护·轻', desc: '获得 {B} 点格挡,魂火 +1。' },
    play(A) { A.gainBlock(); A.addSoulfire(1); }
  });
  def({
    id: 'mn_ghostclaw', cls: 'mystery', type: 'attack', rarity: 'common', cost: 1, dmg: 8, target: 'enemy',
    name: '鬼爪', desc: '造成 {D} 点伤害;若魂火 ≥3,伤害 +3。',
    up: { dmg: 11, desc: '造成 {D} 点伤害;若魂火 ≥3,伤害 +3。' },
    up2: { dmg: 5, hits: 2, name: '鬼爪·连', desc: '造成 2 次 {D} 点伤害;若魂火 ≥3,每次伤害 +3。', play(A) { if (A.soulfire() >= 3) A.attackBonus(3); A.attack(null, { times: 2 }); } },
    play(A) { if (A.soulfire() >= 3) A.attackBonus(3); A.attack(); }
  });
  def({
    id: 'mn_fireeye', cls: 'mystery', type: 'skill', rarity: 'common', cost: 0, target: 'none',
    name: '燃目', desc: '阴阳眼 +2,获得 4 点格挡。',
    up: { desc: '阴阳眼 +3,获得 4 点格挡。' },
    play(A, inst) { A.addEye(inst.up && inst.path !== 2 ? 3 : 2); A.gainBlock(4); }
  });
  def({
    id: 'mn_wraithwall', cls: 'mystery', type: 'skill', rarity: 'common', cost: 1, block: 5, target: 'none',
    name: '亡者之壁', desc: '获得 {B} 点格挡,每层魂火额外 +1 格挡。',
    up: { block: 7, desc: '获得 {B} 点格挡,每层魂火额外 +1 格挡。' },
    up2: { block: 4, name: '亡者之壁·厚', desc: '获得 {B} 点格挡,每层魂火额外 +2 格挡。', play(A) { A.gainBlock(); A.gainBlock(A.soulfire() * 2); } },
    play(A) { A.gainBlock(); A.gainBlock(A.soulfire()); }
  });
  def({
    id: 'mn_ghostfire', cls: 'mystery', type: 'attack', rarity: 'common', cost: 2, dmg: 12, target: 'enemy',
    name: '鬼火焚身', desc: '造成 {D} 点伤害,消耗所有魂火,每层 +2 伤害。',
    up: { dmg: 14, desc: '造成 {D} 点伤害,消耗所有魂火,每层 +3 伤害。' },
    up2: { dmg: 8, target: 'all', name: '鬼火焚身·燎原', desc: '对所有敌人造成 {D} 点伤害,消耗所有魂火,每层 +2 伤害。', play(A, inst) { A.attackBonus(A.spendSoulfire(99) * 2); A.attackAll(); } },
    play(A, inst) { A.attackBonus(A.spendSoulfire(99) * (inst.up ? 3 : 2)); A.attack(); }
  });
  def({
    id: 'mn_grudge', cls: 'mystery', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 6, hits: 2, target: 'enemy',
    name: '怨念双袭', desc: '造成 2 次 {D} 点伤害。',
    up: { dmg: 8, desc: '造成 2 次 {D} 点伤害。' },
    play(A) { A.attack(null, { times: 2 }); }
  });
  def({
    id: 'mn_soulchain', cls: 'mystery', type: 'skill', rarity: 'uncommon', cost: 1, target: 'all',
    name: '锁魂链', desc: '所有敌人获得 2 层易伤,魂火 +2。',
    up: { desc: '所有敌人获得 3 层易伤,魂火 +2。' },
    play(A, inst) { A.applyAll('vuln', inst.up ? 3 : 2); A.addSoulfire(2); }
  });
  def({
    id: 'mn_seethrough', cls: 'mystery', type: 'skill', rarity: 'uncommon', cost: 0, exhaust: true, target: 'none',
    name: '天眼通', desc: '抽 2 张牌,阴阳眼 +1。消耗。',
    up: { desc: '抽 3 张牌,阴阳眼 +1。消耗。' },
    play(A, inst) { A.draw(inst.up ? 3 : 2); A.addEye(1); }
  });
  def({
    id: 'mn_soulmirror', cls: 'mystery', type: 'skill', rarity: 'uncommon', cost: 2, block: 10, target: 'none',
    name: '照魂镜壁', desc: '获得 {B} 点格挡,每层魂火额外 +2 格挡。',
    up: { block: 14, desc: '获得 {B} 点格挡,每层魂火额外 +2 格挡。' },
    play(A) { A.gainBlock(); A.gainBlock(A.soulfire() * 2); }
  });
  def({
    id: 'mn_hungryghost', cls: 'mystery', type: 'attack', rarity: 'rare', cost: 2, dmg: 10, target: 'enemy',
    name: '饿鬼吞魂', desc: '造成 {D} 点伤害;若击杀敌人,魂火 +3。',
    up: { dmg: 14, desc: '造成 {D} 点伤害;若击杀敌人,魂火 +3。' },
    play(A) { const killed = A.attack(); if (killed) { A.addSoulfire(3); } }
  });
  def({
    id: 'mn_yinyangmaster', cls: 'mystery', type: 'power', rarity: 'rare', cost: 3, target: 'none',
    name: '阴阳师', desc: '每回合开始时,魂火 +2。',
    up: { cost: 2, desc: '每回合开始时,魂火 +2。' },
    up2: { cost: 2, name: '阴阳师·觉醒', desc: '每回合开始时,魂火 +1、阴阳眼 +1。', play(A) { A.applySelf('soulgain', 1); A.applySelf('eyeritual', 1); } },
    play(A) { A.applySelf('soulgain', 2); }
  });
  def({
    id: 'mn_requiem', cls: 'mystery', type: 'skill', rarity: 'rare', cost: 1, target: 'none',
    name: '安魂曲', desc: '触发两次鬼物效果。',
    up: { cost: 0, desc: '触发两次鬼物效果。' },
    up2: { name: '安魂曲·镇', desc: '触发三次鬼物效果,魂火 +2。', play(A) { A.addSoulfire(2); A.triggerGhost(); A.triggerGhost(); A.triggerGhost(); } },
    play(A) { A.triggerGhost(); A.triggerGhost(); }
  });
  def({
    id: 'mn_windride', cls: 'mystery', type: 'skill', rarity: 'common', cost: 0, exhaust: true, target: 'none',
    name: '阴风步', desc: '抽 1 张牌,魂火 +1。消耗。',
    up: { desc: '抽 2 张牌,魂火 +1。消耗。' },
    play(A, inst) { A.draw(inst.up ? 2 : 1); A.addSoulfire(1); }
  });

  MYST.pool.push('mn_shadeshield', 'mn_ghostclaw', 'mn_fireeye', 'mn_wraithwall', 'mn_ghostfire',
    'mn_windride', 'mn_grudge', 'mn_soulchain', 'mn_seethrough', 'mn_soulmirror',
    'mn_hungryghost', 'mn_yinyangmaster', 'mn_requiem');

  MYST.events = [
    {
      id: 'mn_ev_midnight', name: '午夜凶铃', art: '📞',
      text: '荒村的电话亭自己响了。铃声拖得很长,像有人贴着听筒呼吸。',
      choices: [
        { label: '接听', hint: '魂火指引:获得 1 张主题稀有牌,失去 8 点生命',
          fx(A) { A.loseHp(8); A.gainThemeCard('rare'); return '电话那头传来湿漉漉的低语,一张牌从听筒里滑了出来。'; } },
        { label: '砸毁电话亭', hint: '获得 40~60 金币',
          fx(A) { const g = A.randInt(40, 60); A.gainGold(g); return '碎片里散落着前任机主藏下的 ' + g + ' 金币。'; } },
        { label: '挂断离开', fx() { return '铃声在你背后又响了三声,然后停了。'; } }
      ]
    },
    {
      id: 'mn_ev_paperwedding', name: '纸新娘的花轿', art: '🏮',
      text: '花轿停在村口,轿帘里伸出一只纸糊的手,掌心写着「替」字。',
      choices: [
        { label: '掀开轿帘', hint: '获得遗物,污染 +2',
          fx(A) { A.addCurse(2); const r = A.randomRelic(); return r ? '轿中的东西认了你为主,污染却缠上了你。' : '轿子里空空如也,只有怨气。'; } },
        { label: '替她烧一炷香', hint: '污染 -3,回复 25% 生命',
          fx(A) { A.reduceCurse(3); A.heal(Math.floor(A.maxHp() * 0.25)); return '纸手安静地缩了回去。你感到久违的暖意。'; } },
        { label: '绕开走', fx() { return '花轿在你身后无声地消失了。'; } }
      ]
    },
    {
      id: 'mn_ev_ghostmarket', name: '鬼市', art: '🏮',
      text: '子时的集市灯火通明,摊主们都没有影子。他们只收「阳气」。',
      choices: [
        { label: '卖出一缕阳气', hint: '失去 10 点生命,获得 110 金币',
          fx(A) { A.loseHp(10); A.gainGold(110); return '铜钱冰冷刺骨,但你的钱包鼓了。'; } },
        { label: '买一份鬼物手记', hint: '花费 60 金币,升级 2 张随机牌',
          can(g) { return g.gold() >= 60; },
          fx(A) { A.loseGold(60); const n = A.upgradeRandom(2); return n + ' 张牌在手记的怨气中开光了。'; } },
        { label: '闭眼走过去', fx() { return '你数着自己的脚步声走完了整条街。'; } }
      ]
    },
    {
      id: 'mn_ev_undertaker', name: '守棺人', art: '⚰️',
      text: '老守棺人坐在棺材铺门口打盹。「想借一口?」他没睁眼,「拿东西换。」',
      choices: [
        { label: '用生命换棺', hint: '失去 12 点生命,获得最大生命 +10',
          fx(A) { A.loseHp(12); A.addMaxHp(10); return '躺过棺材的人,命会变得很硬。'; } },
        { label: '帮他守一夜', hint: '回复 30% 生命,获得 2 瓶药水',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.3)); A.gainPotion(); A.gainPotion(); return '一夜无事。临走时老人塞给你两瓶药。'; } },
        { label: '离开', fx() { return '「不借也好,」他翻了个身,「棺材借出去,回来的都不太对。」'; } }
      ]
    },
    {
      id: 'mn_ev_soulfirewell', name: '魂火古井', art: '🕳️',
      text: '井底浮着点点蓝火。俯身看去,火焰里映出你自己的脸——在对你笑。',
      choices: [
        { label: '饮下井水', hint: '获得 3 张主题普通牌',
          fx(A) { A.gainThemeCard('common'); A.gainThemeCard('common'); A.gainThemeCard('common'); return '井水又冷又甜,三个陌生的名字浮上你的掌心。'; } },
        { label: '以魂火引路', hint: '50%:获得主题稀有牌 / 50%:得到 1 张诅咒',
          fx(A) { if (A.chance(0.5)) { A.gainThemeCard('rare'); return '魂火顺从地凝成了一张牌。'; } A.curse('decay'); return '井里的东西咬了你一口。'; } },
        { label: '盖回井盖', fx() { return '有些东西,不看为妙。'; } }
      ]
    },
    {
      id: 'mn_ev_ghostschool', name: '深夜教室', art: '🏫',
      text: '黑板上用粉笔写着你的名字,后面跟着一道没写完的题:「活着的理由是——」',
      choices: [
        { label: '写下答案', hint: '最大生命 +12,失去 8 点生命',
          fx(A) { A.loseHp(8); A.addMaxHp(12); return '粉笔自己写下了「还想再活」。教室的门开了。'; } },
        { label: '擦掉名字', hint: '移除 1 张牌',
          fx(A) { A.removeCard(); return '名字消失的瞬间,有什么东西从卡组里被带走了。'; } },
        { label: '转身逃走', hint: '回复 15 点生命',
          fx(A) { A.heal(15); return '你狂奔出校门,心跳如鼓——至少你还活着。'; } }
      ]
    }
  ];

  MYST.duos = [
    { ids: ['mn_a_dog', 'mn_a_dream'], name: '人鬼同心', note: '战斗开始时,魂火 +3',
      combatStart(A) { A.soulfire(3); } },
    { ids: ['mn_a_headless', 'mn_a_jiang'], name: '阴阳相济', note: '每场战斗胜利后,回复 8 点生命',
      onVictory(A) { A.heal(8); } }
  ];

  ALLY_MAP.mn_a_dog.active = { name: '忠犬扑杀', desc: '对随机敌人造成 6 点伤害', fx(A) { A.dmgRandom(6); } };
  ALLY_MAP.mn_a_dream.active = { name: '鬼梦庇护', desc: '获得 8 点格挡', fx(A) { A.block(8); } };
  ALLY_MAP.mn_a_headless.active = { name: '无头索命', desc: '随机敌人 2 层易伤并造成 3 点伤害', fx(A) { A.vulnRandom(2); A.dmgRandom(3); } };
  ALLY_MAP.mn_a_jiang.active = { name: '江艳的晚餐', desc: '回复 8 点生命', fx(A) { A.heal(8); } };
  ALLY_MAP.mn_a_zhang.active = { name: '讨债电话', desc: '获得 25 金币,对所有敌人造成 3 点伤害', fx(A) { A.gold(25); A.dmgAll(3); } };

  /* ---------------- 咒术回战:新卡 ×13 ---------------- */
  def({
    id: 'jj_quickchant', cls: 'jjk', type: 'skill', rarity: 'common', cost: 0, target: 'none',
    name: '瞬发咒词', desc: '咒力 +2,抽 1 张牌。',
    up: { desc: '咒力 +3,抽 1 张牌。' },
    up2: { desc: '咒力 +2,抽 2 张牌。', play(A) { A.gainCe(2); A.draw(2); } },
    play(A, inst) { A.gainCe(inst.up && inst.path !== 2 ? 3 : 2); A.draw(1); }
  });
  def({
    id: 'jj_stray', cls: 'jjk', type: 'attack', rarity: 'common', cost: 1, dmg: 7, target: 'enemy',
    name: '杂鱼清扫', desc: '造成 {D} 点伤害,咒力 +1。',
    up: { dmg: 10, desc: '造成 {D} 点伤害,咒力 +1。' },
    play(A) { A.attack(); A.gainCe(1); }
  });
  def({
    id: 'jj_barrier', cls: 'jjk', type: 'skill', rarity: 'common', cost: 1, block: 8, target: 'none',
    name: '咒力屏障', desc: '获得 {B} 点格挡,咒力 +1。',
    up: { block: 11, desc: '获得 {B} 点格挡,咒力 +1。' },
    play(A) { A.gainBlock(); A.gainCe(1); }
  });
  def({
    id: 'jj_palm', cls: 'jjk', type: 'attack', rarity: 'common', cost: 2, dmg: 14, tech: true, target: 'enemy',
    name: '咒拳·冲', desc: '造成 {D} 点伤害(咒术,可触发黑闪)。',
    up: { dmg: 18, desc: '造成 {D} 点伤害(咒术,可触发黑闪)。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'jj_blitz', cls: 'jjk', type: 'attack', rarity: 'common', cost: 0, dmg: 4, tech: true, target: 'enemy',
    name: '疾走咒拳', desc: '造成 {D} 点伤害(咒术,可触发黑闪)。',
    up: { dmg: 7, desc: '造成 {D} 点伤害(咒术,可触发黑闪)。' },
    play(A) { A.attack(); }
  });
  def({
    id: 'jj_reversal', cls: 'jjk', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    name: '简易领域·疗', desc: '回复 8 点生命,领域 -2。',
    up: { desc: '回复 12 点生命,领域 -2。' },
    up2: { name: '简易领域·极', desc: '回复 20 点生命,领域 -2。', play(A) { A.heal(20); A.field(-2); } },
    play(A, inst) { A.heal(inst.up ? 12 : 8); A.field(-2); }
  });
  def({
    id: 'jj_chainfist', cls: 'jjk', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 5, hits: 2, tech: true, target: 'enemy',
    name: '连环咒拳', desc: '造成 2 次 {D} 点伤害(咒术,可触发黑闪)。',
    up: { dmg: 7, desc: '造成 2 次 {D} 点伤害(咒术,可触发黑闪)。' },
    play(A) { A.attack(null, { times: 2 }); }
  });
  def({
    id: 'jj_domaintrap', cls: 'jjk', type: 'skill', rarity: 'uncommon', cost: 2, target: 'all',
    name: '束缚结界', desc: '所有敌人弱点被看穿(2 层),领域 +2。',
    up: { desc: '所有敌人弱点被看穿(3 层),领域 +2。' },
    play(A, inst, t) { A.applyAll('weakness', inst.up ? 3 : 2); A.field(2); }
  });
  def({
    id: 'jj_ceflow', cls: 'jjk', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
    name: '咒力流转', desc: '每回合开始时,咒力 +1。',
    up: { desc: '每回合开始时,咒力 +2。' },
    play(A, inst) { A.applySelf('cegen', inst.up ? 2 : 1); }
  });
  def({
    id: 'jj_maxoutput', cls: 'jjk', type: 'attack', rarity: 'rare', cost: 2, dmg: 6, target: 'enemy',
    name: '咒力满输出', desc: '造成 {D} 点伤害,消耗所有咒力,每点 +4 伤害。',
    up: { desc: '造成 {D} 点伤害,消耗所有咒力,每点 +6 伤害。' },
    up2: { dmg: 4, target: 'all', name: '咒力满输出·界', desc: '对所有敌人造成 {D} 点伤害,消耗所有咒力,每点 +4 伤害。', play(A) { A.attackBonus(A.spendCeAll() * 4); A.attackAll(); } },
    play(A, inst) { A.attackBonus(A.spendCeAll() * (inst.up ? 6 : 4)); A.attack(); }
  });
  def({
    id: 'jj_sixeyespower', cls: 'jjk', type: 'power', rarity: 'rare', cost: 3, target: 'none',
    name: '六眼', desc: '获得 3 层六眼(每回合咒力 +2,25 层以上 +3)。',
    up: { cost: 2, desc: '获得 3 层六眼(每回合咒力 +2,25 层以上 +3)。' },
    play(A) { A.applySelf('sixEyes', 3); }
  });
  def({
    id: 'jj_bind', cls: 'jjk', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    name: '缚咒禁锢', desc: '敌人被封锁 1 回合。',
    up: { cost: 0, desc: '敌人被封锁 1 回合。' },
    play(A, inst, t) { A.applyTo(t, 'sealAction', 1); }
  });
  def({
    id: 'jj_territory', cls: 'jjk', type: 'skill', rarity: 'rare', cost: 1, target: 'none',
    name: '领域压制', desc: '领域 -3,咒力 +4。',
    up: { desc: '领域 -5,咒力 +4。' },
    play(A, inst) { A.field(inst.up ? -5 : -3); A.gainCe(4); }
  });

  JJK.pool.push('jj_quickchant', 'jj_stray', 'jj_barrier', 'jj_palm', 'jj_blitz', 'jj_bind',
    'jj_reversal', 'jj_chainfist', 'jj_domaintrap', 'jj_ceflow',
    'jj_maxoutput', 'jj_sixeyespower', 'jj_territory');

  JJK.events = [
    {
      id: 'jj_ev_cursewomb', name: '咒胎九相图', art: '🥚',
      text: '仓库角落封着一枚咒胎,隔着结界都能听见它孵化前的胎动。',
      choices: [
        { label: '吞下咒胎', hint: '失去 8 点生命,获得 1 张主题稀有牌',
          can(g) { return g.hp() > 8; },
          fx(A) { A.loseHp(8); A.gainThemeCard('rare'); return '咒力顺着喉咙烧进四肢,你得到了不属于人的力量。'; } },
        { label: '加固封印', hint: '领域值下降:本场探索污染 -3',
          fx(A) { A.reduceCurse(3); return '你重画了封印。至少这个晚上,它出不来。'; } },
        { label: '上报高专', hint: '获得 55 金币(悬赏金)',
          fx(A) { A.gainGold(55); return '窗外的乌鸦衔来了信封,里面有定额悬赏金。'; } }
      ]
    },
    {
      id: 'jj_ev_vendormachine', name: '高专贩卖机', art: '🥤',
      text: '深夜的贩卖机还在运作。屏幕上滚动着一行字:「今天的运气值多少钱?」',
      choices: [
        { label: '投 30 金币', hint: '70%:获得随机遗物 / 30%:获得 2 瓶药水',
          can(g) { return g.gold() >= 30; },
          fx(A) { A.loseGold(30); if (A.chance(0.7)) { const r = A.randomRelic(); return r ? '掉出来一件带着咒力残温的遗物。' : '什么也没掉出来。'; } A.gainPotion(); A.gainPotion(); return '两瓶药水咣当落下。也算走运。'; } },
        { label: '踹一脚', hint: '50%:获得 50 金币 / 50%:失去 6 点生命',
          fx(A) { if (A.chance(0.5)) { A.gainGold(50); return '零钱哗啦啦掉了出来。'; } A.loseHp(6); return '机器漏出的咒力电了你一下。'; } },
        { label: '无视', fx() { return '你选择相信「深夜贩卖机杀人事件」的都市传说。'; } }
      ]
    },
    {
      id: 'jj_ev_domainduel', name: '领域对峙', art: '⚫',
      text: '特级咒灵拦住去路,空气像玻璃一样开始弯曲。「领域展开——」',
      choices: [
        { label: '以领域对轰', hint: '失去 10 点生命,获得 2 张主题罕见牌',
          can(g) { return g.hp() > 10; },
          fx(A) { A.loseHp(10); A.gainThemeCard('uncommon'); A.gainThemeCard('uncommon'); return '必中必杀对轰之后,你捡回了两式咒术。'; } },
        { label: '强行突围', hint: '75%:无事通过 / 25%:失去 20 点生命',
          fx(A) { if (A.chance(0.75)) return '你在领域闭合前的一瞬滑了出去。'; A.loseHp(20); return '闭合的边界从你身上碾了过去。'; } },
        { label: '原地静坐', hint: '回复 20% 生命',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.2)); return '对方似乎被你的坦然搞得不知所措,领域自己散了。'; } }
      ]
    },
    {
      id: 'jj_ev_blackflash_class', name: '黑闪特训', art: '⚫',
      text: '训练场中央摆着特制咒骸。东堂教练抱着手臂:「来,感受那个 2.5 次方的平方!」',
      choices: [
        { label: '特训到吐', hint: '失去 8 点生命,升级 2 张随机牌',
          fx(A) { A.loseHp(8); const n = A.upgradeRandom(2); return n + ' 张牌在无数次挥拳中掌握了「拍击」的误差为零!'; } },
        { label: '摸鱼', hint: '回复 15 点生命',
          fx(A) { A.heal(15); return '你在场边喝了整瓶运动饮料。教练假装没看见。'; } }
      ]
    },
    {
      id: 'jj_ev_fingerbearer', name: '指粹持有者', art: '🖕',
      text: '一只特级咒灵正在吞噬「宿傩之指」。它看你的眼神,像看下一顿饭。',
      choices: [
        { label: '祓除它,夺取手指', hint: '失去 10% 当前生命,获得遗物',
          fx(A) { A.loseHp(Math.max(3, Math.floor(A.hp() * 0.10))); const r = A.randomRelic(); return r ? '祓除完成。手指在你掌心发烫。' : '祓除完成,但手指化为飞灰。'; } },
        { label: '放它离开', hint: '污染 -2,回复 20 点生命',
          fx(A) { A.reduceCurse(2); A.heal(20); return '有时候,「不做」也是一种咒术。你的身体轻松了不少。'; } }
      ]
    },
    {
      id: 'jj_ev_shibuya_station', name: '涩谷站台', art: '🚇',
      text: '末班车的站台上空无一人,只有一张海报:「今夜,涩谷封锁。」',
      choices: [
        { label: '进入封锁区', hint: '获得 90~130 金币,污染 +2',
          fx(A) { const g = A.randInt(90, 130); A.gainGold(g); A.addCurse(2); return '你在混乱的战场缝隙里捡到了 ' + g + ' 金币。'; } },
        { label: '疏散平民', hint: '回复 25% 生命,最大生命 +5',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.25)); A.addMaxHp(5); return '人们感谢你。这份心意让你更坚韧。'; } },
        { label: '坐末班车离开', fx() { return '车门关闭。玻璃上倒映出你的脸,还有身后一闪而过的东西。'; } }
      ]
    }
  ];

  JJK.duos = [
    { ids: ['jj_a_itadori', 'jj_a_megumi'], name: '师兄弟', note: '战斗开始时,咒力 +3',
      combatStart(A) { A.ce(3); } },
    { ids: ['jj_a_nobara', 'jj_a_nanami'], name: '猎场清扫', note: '战斗开始时,所有敌人弱点被看穿(1 层)',
      combatStart(A) { A.weaknessAll(1); } }
  ];

  ALLY_MAP.jj_a_itadori.active = { name: '黑闪锤击', desc: '对随机敌人造成 9 点伤害,咒力 +2', fx(A) { A.dmgRandom(9); A.ce(2); } };
  ALLY_MAP.jj_a_megumi.active = { name: '玉犬突袭', desc: '对所有敌人造成 5 点伤害', fx(A) { A.dmgAll(5); } };
  ALLY_MAP.jj_a_nobara.active = { name: '芻灵钉刺', desc: '随机敌人 3 层易伤并造成 4 点伤害', fx(A) { A.vulnRandom(3); A.dmgRandom(4); } };
  ALLY_MAP.jj_a_nanami.active = { name: '七海的效率', desc: '获得 10 点格挡', fx(A) { A.block(10); } };
  ALLY_MAP.jj_a_panda.active = { name: '熊猫铁壁', desc: '获得 8 点格挡并回复 4 点生命', fx(A) { A.block(8); A.heal(4); } };

  /* ---------------- 从零开始的异世界:新卡 ×13 ---------------- */
  def({
    id: 'rz_icelance', cls: 'rezero', type: 'attack', rarity: 'common', cost: 1, dmg: 7, target: 'enemy',
    name: '冰枪术', desc: '造成 {D} 点伤害;若已缔结精灵,伤害 +3。',
    up: { dmg: 10, desc: '造成 {D} 点伤害;若已缔结精灵,伤害 +3。' },
    play(A) { if (A.ghostName()) A.attackBonus(3); A.attack(); }
  });
  def({
    id: 'rz_elishield', cls: 'rezero', type: 'skill', rarity: 'common', cost: 1, block: 8, target: 'none',
    name: '精灵护盾', desc: '获得 {B} 点格挡;若已缔结精灵,额外 +3。',
    up: { block: 11, desc: '获得 {B} 点格挡;若已缔结精灵,额外 +3。' },
    play(A) { A.gainBlock(); if (A.ghostName()) A.gainBlock(3); }
  });
  def({
    id: 'rz_manadraw', cls: 'rezero', type: 'skill', rarity: 'common', cost: 0, exhaust: true, target: 'none',
    name: '玛那汲取', desc: '抽 2 张牌。消耗。',
    up: { desc: '抽 3 张牌。消耗。' },
    play(A, inst) { A.draw(inst.up ? 3 : 2); }
  });
  def({
    id: 'rz_bollist', cls: 'rezero', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 6, hits: 2, target: 'enemy',
    name: '精灵魔法·双奏', desc: '造成 2 次 {D} 点伤害。',
    up: { dmg: 8, desc: '造成 2 次 {D} 点伤害。' },
    play(A) { A.attack(null, { times: 2 }); }
  });
  def({
    id: 'rz_aroma', cls: 'rezero', type: 'skill', rarity: 'uncommon', cost: 0, target: 'all',
    name: '魔女之香', desc: '对所有敌人造成 5 点魔法伤害,自身魔女之香 +2(敌人更凶暴)。',
    up: { desc: '对所有敌人造成 8 点魔法伤害,自身魔女之香 +2。' },
    play(A, inst) { A.dealMagicAll(inst.up ? 8 : 5); A.applySelf('witchscent', 2); }
  });
  def({
    id: 'rz_handpower', cls: 'rezero', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
    name: '看不见的手', desc: '每回合开始时,对随机敌人造成 2 点伤害。',
    up: { desc: '每回合开始时,对随机敌人造成 3 点伤害。' },
    play(A, inst) { A.applySelf('unseen', inst.up ? 3 : 2); }
  });
  def({
    id: 'rz_fruit', cls: 'rezero', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    name: '阿佩斯的果实', desc: '回复 8 点生命,并净化自身减益。',
    up: { desc: '回复 12 点生命,并净化自身减益。' },
    play(A, inst) { A.cleanseDebuffs(); A.heal(inst.up ? 12 : 8); }
  });
  def({
    id: 'rz_remflail', cls: 'rezero', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 10, target: 'enemy',
    name: '鬼化的晨星锤', desc: '造成 {D} 点伤害,并看穿敌人弱点(2 层)。',
    up: { dmg: 14, desc: '造成 {D} 点伤害,并看穿敌人弱点(2 层)。' },
    play(A, inst, t) { A.attack(); A.addWeakness(t, 2); }
  });
  def({
    id: 'rz_ramwind', cls: 'rezero', type: 'skill', rarity: 'common', cost: 1, block: 5, target: 'none',
    name: '风之加护', desc: '获得 {B} 点格挡,抽 1 张牌。',
    up: { desc: '获得 {B} 点格挡,抽 2 张牌。' },
    play(A, inst) { A.gainBlock(); A.draw(inst.up ? 2 : 1); }
  });
  def({
    id: 'rz_emiliaice', cls: 'rezero', type: 'attack', rarity: 'rare', cost: 2, dmg: 10, target: 'all',
    name: '冰霜领域', desc: '对所有敌人造成 {D} 点伤害并施加 1 层易伤。',
    up: { dmg: 14, desc: '对所有敌人造成 {D} 点伤害并施加 1 层易伤。' },
    play(A) { A.attackAll(); A.applyAll('vuln', 1); }
  });
  def({
    id: 'rz_beako', cls: 'rezero', type: 'skill', rarity: 'rare', cost: 1, target: 'none',
    name: '贝蒂的福音', desc: '缔结随机精灵,且精灵强度 +2。',
    up: { desc: '缔结随机精灵,且精灵强度 +4。' },
    up2: { cost: 0, name: '贝蒂的福音·禁书', desc: '缔结随机精灵(强度 +2),抽 2 张牌。', play(A) { const s = A.randomSpirit(); if (s) A.setGhost(s, (A.selfStatus('ghostPower') || 1) + 2); A.draw(2); } },
    play(A, inst) { const s = A.randomSpirit(); if (s) A.setGhost(s, (A.selfStatus('ghostPower') || 1) + (inst.up ? 4 : 2)); }
  });
  def({
    id: 'rz_deathcheck', cls: 'rezero', type: 'skill', rarity: 'rare', cost: 1, target: 'none',
    name: '死亡回归·察知', desc: '获得 1 层死亡回归(受到致命伤害时抵消并回复 20% 生命)。',
    up: { desc: '获得 2 层死亡回归。' },
    play(A, inst) { A.applySelf('rewind', inst.up ? 2 : 1); }
  });

  RZ.pool.push('rz_icelance', 'rz_elishield', 'rz_manadraw', 'rz_ramwind',
    'rz_bollist', 'rz_aroma', 'rz_handpower', 'rz_fruit', 'rz_remflail',
    'rz_emiliaice', 'rz_beako', 'rz_deathcheck');

  RZ.events = [
    {
      id: 'rz_ev_royal_selection', name: '王选演说', art: '🏰',
      text: '王都广场人山人海。爱蜜莉雅站在高台上,深吸一口气,向人群张开双手。',
      choices: [
        { label: '上台声援', hint: '失去 10 点生命,最大生命 +10,获得 40 金币',
          fx(A) { A.loseHp(8); A.addMaxHp(6); A.gainGold(30); return '石块和鲜花一起飞来。你挡在前面,银发少女的眼泪落在你手背。'; } },
        { label: '台下维持秩序', hint: '回复 20% 生命,获得 1 瓶药水',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.2)); A.gainPotion(); return '混乱平息后,一位骑士向你敬礼,递来一瓶伤药。'; } },
        { label: '默默离开', fx() { return '历史的车轮,今天不需要你推。'; } }
      ]
    },
    {
      id: 'rz_ev_returnpoint', name: '存档点', art: '💠',
      text: '熟悉的场景让你胃部收紧——这个位置,你曾经死过。空气里有淡淡血腥味。',
      choices: [
        { label: '直面死亡记忆', hint: '失去 10 点生命,升级 2 张随机牌',
          fx(A) { A.loseHp(10); const n = A.upgradeRandom(2); return n + ' 张牌在死亡的回放中找到了新的用法。'; } },
        { label: '改写一个小细节', hint: '回复 20% 生命',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.2)); return '你扶正了一块即将绊倒路人的石头。世界线轻微地抖了一下。'; } }
      ]
    },
    {
      id: 'rz_ev_beatrice_library', name: '禁书图书馆', art: '📚',
      text: '贝蒂悬浮在书架间,抱着膝。「无聊的人类,想看哪本书?只有一次机会哦。」',
      choices: [
        { label: '借走福音书', hint: '获得 1 张主题罕见牌',
          fx(A) { A.gainThemeCard('rare'); return '「那本书,不许弄脏。」她别过脸去。'; } },
        { label: '陪她聊天', hint: '回复 18% 生命',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.18)); return '四百年的孤独,被一个下午的闲聊冲淡了一点。'; } },
        { label: '放回书', fx() { return '「哼,识相。」她把脸埋回膝盖。'; } }
      ]
    },
    {
      id: 'rz_ev_witchcult', name: '魔女教徒', art: '🎭',
      text: '黑袍人围成半圆,嘶声吟诵着「怠惰」「暴食」「愤怒」。指环上刻着不明纹章。',
      choices: [
        { label: '斩杀首领', hint: '失去 20% 当前生命,获得遗物',
          fx(A) { A.loseHp(Math.max(3, Math.floor(A.hp() * 0.2))); const r = A.randomRelic(); return r ? '「不可原谅……」首领化为黑雾,留下了指环。' : '黑袍下空无一物。'; } },
        { label: '收集情报后撤退', hint: '获得 70 金币,抽到明日情报(随机升级 1 张牌)',
          fx(A) { A.gainGold(70); A.upgradeRandom(1); return '大罪司教的调动表能卖个好价钱,你也学到了一招。'; } }
      ]
    },
    {
      id: 'rz_ev_dragon_carriage', name: '龙车驿站', art: '🛷',
      text: '地龙车队的商人正在招募护卫:「去下一座城,报酬丰厚——当然,路上有魔兽。」',
      choices: [
        { label: '接下护卫', hint: '获得 80~120 金币,失去 8 点生命',
          fx(A) { const g = A.randInt(80, 120); A.gainGold(g); A.loseHp(8); return '一路有惊无险(除了一头不长眼的亚人)。报酬 ' + g + ' 金币。'; } },
        { label: '搭顺风车', hint: '回复 20 点生命',
          fx(A) { A.heal(20); return '你在车厢里睡了个难得的安稳觉。'; } }
      ]
    },
    {
      id: 'rz_ev_emilia_lesson', name: '帕克的魔法课', art: '🐈',
      text: '灰猫悬浮在半空,尾巴一圈圈绕着:「想学精灵术?那可要交学费的哟,小子。」',
      choices: [
        { label: '学习精灵术', hint: '获得 1 张主题普通牌,失去 8 点生命',
          fx(A) { A.loseHp(8); A.gainThemeCard('common'); return '冰锥擦着你的头皮飞了一下午。但你学会了。'; } },
        { label: '请教减伤技巧', hint: '最大生命 +8',
          fx(A) { A.addMaxHp(8); return '「护住要害,笨蛋。」——这句话救了你以后的很多次。'; } },
        { label: '撸猫', fx() { return '帕克舒服地眯起眼:「算你过关。」'; } }
      ]
    }
  ];

  RZ.duos = [
    { ids: ['rz_a_emilia', 'rz_a_rem'], name: '冰蓝女仆', note: '战斗开始时,获得 6 点格挡',
      combatStart(A) { A.block(6); } },
    { ids: ['rz_a_rem', 'rz_a_ram'], name: '姐妹同心', note: '战斗开始时,获得 1 点力量',
      combatStart(A) { A.str(1); } }
  ];

  ALLY_MAP.rz_a_emilia.active = { name: '帕克冰结', desc: '对所有敌人造成 5 点伤害并获得 5 点格挡', fx(A) { A.dmgAll(5); A.block(5); } };
  ALLY_MAP.rz_a_rem.active = { name: '鬼化觉醒', desc: '获得 2 点力量', fx(A) { A.str(2); } };
  ALLY_MAP.rz_a_ram.active = { name: '风刃连吹', desc: '对随机敌人造成 7 点伤害', fx(A) { A.dmgRandom(7); } };
  ALLY_MAP.rz_a_beatrice.active = { name: '纵横无尽的图书馆', desc: '缔结一只随机精灵', fx(A) { A.contractSpirit(); } };
  ALLY_MAP.rz_a_otto.active = { name: '情报支援', desc: '抽 2 张牌', fx(A) { A.draw(2); } };

  /* ---------------- 奥特曼:新卡 ×13 ---------------- */
  def({
    id: 'ul_flash', cls: 'ultraman', type: 'skill', rarity: 'common', cost: 0, target: 'none',
    name: '闪光信号', desc: '光能 +2。',
    up: { desc: '光能 +3。' },
    play(A, inst) { A.gainLight(inst.up ? 3 : 2); }
  });
  def({
    id: 'ul_chop', cls: 'ultraman', type: 'attack', rarity: 'common', cost: 1, dmg: 8, target: 'enemy',
    name: '奥特手刀', desc: '造成 {D} 点伤害;彩色计时器告急(红色警戒)时伤害 +4。',
    up: { dmg: 11, desc: '造成 {D} 点伤害;红色警戒时伤害 +4。' },
    play(A) { if (A.light() <= A.redline()) A.attackBonus(4); A.attack(); }
  });
  def({
    id: 'ul_guard', cls: 'ultraman', type: 'skill', rarity: 'common', cost: 1, block: 8, target: 'none',
    name: '奥特屏障', desc: '获得 {B} 点格挡,光能 +1。',
    up: { block: 11, desc: '获得 {B} 点格挡,光能 +1。' },
    play(A) { A.gainBlock(); A.gainLight(1); }
  });
  def({
    id: 'ul_crossbeam', cls: 'ultraman', type: 'attack', rarity: 'common', cost: 2, dmg: 14, target: 'enemy',
    name: '十字光线', desc: '造成 {D} 点伤害。',
    up: { dmg: 19, desc: '造成 {D} 点伤害。' },
    up2: { dmg: 10, hits: 2, name: '十字光线·双', desc: '造成 2 次 {D} 点伤害。', play(A) { A.attack(null, { times: 2 }); } },
    play(A) { A.attack(); }
  });
  def({
    id: 'ul_merge', cls: 'ultraman', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '一心同体', desc: '光能 +3,抽 1 张牌。',
    up: { desc: '光能 +4,抽 1 张牌。' },
    up2: { desc: '光能 +2,抽 3 张牌。', play(A) { A.gainLight(2); A.draw(3); } },
    play(A, inst) { A.gainLight(inst.up ? 4 : 3); A.draw(1); }
  });
  def({
    id: 'ul_sparklight', cls: 'ultraman', type: 'attack', rarity: 'common', cost: 0, dmg: 4, target: 'enemy',
    name: '八分光弹', desc: '造成 {D} 点伤害,光能 +1。',
    up: { dmg: 7, desc: '造成 {D} 点伤害,光能 +1。' },
    play(A) { A.attack(); A.gainLight(1); }
  });
  def({
    id: 'ul_timerguard', cls: 'ultraman', type: 'skill', rarity: 'uncommon', cost: 1, block: 12, target: 'none',
    name: '计时器护壁', desc: '获得 {B} 点格挡,光能 -2。',
    up: { block: 16, desc: '获得 {B} 点格挡,光能 -2。' },
    play(A) { A.gainBlock(); A.spendLight(2); }
  });
  def({
    id: 'ul_counter', cls: 'ultraman', type: 'skill', rarity: 'uncommon', cost: 1, block: 6, target: 'none',
    name: '奥特反击', desc: '获得 {B} 点格挡和 4 点荆棘。',
    up: { block: 9, desc: '获得 {B} 点格挡和 6 点荆棘。' },
    play(A, inst) { A.gainBlock(); A.applySelf('thorns', inst.up ? 6 : 4); }
  });
  def({
    id: 'ul_raybeam', cls: 'ultraman', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 6, target: 'enemy',
    name: '集束射线', desc: '造成 {D} 点伤害,消耗所有光能,每点 +3 伤害。',
    up: { desc: '造成 {D} 点伤害,消耗所有光能,每点 +4 伤害。' },
    play(A, inst) { A.attackBonus(A.spendLightAll() * (inst.up ? 4 : 3)); A.attack(); }
  });
  def({
    id: 'ul_traveler', cls: 'ultraman', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
    name: '旅行的勇者', desc: '每回合开始时,光能 +1。',
    up: { desc: '每回合开始时,光能 +2。' },
    play(A, inst) { A.applySelf('lightritual', inst.up ? 2 : 1); }
  });
  def({
    id: 'ul_zepellion', cls: 'ultraman', type: 'attack', rarity: 'rare', cost: 2, dmg: 10, hits: 2, target: 'enemy',
    name: '泽佩利敖光线', desc: '造成 2 次 {D} 点伤害。',
    up: { dmg: 13, desc: '造成 2 次 {D} 点伤害。' },
    play(A) { A.attack(null, { times: 2 }); }
  });
  def({
    id: 'ul_finalwave', cls: 'ultraman', type: 'skill', rarity: 'rare', cost: 2, target: 'all',
    name: '终极奥特光线', desc: '消耗所有光能,对全体敌人造成 光能×5 点魔法伤害。',
    up: { desc: '消耗所有光能,对全体敌人造成 光能×7 点魔法伤害。' },
    play(A, inst) { const n = A.spendLightAll(); A.dealMagicAll(n * (inst.up ? 7 : 5)); }
  });
  def({
    id: 'ul_giantform', cls: 'ultraman', type: 'power', rarity: 'rare', cost: 1, target: 'none',
    name: '等离子火花', desc: '每当你消耗光能,对全体敌人造成等量魔法伤害。',
    up: { desc: '等离子火花效果翻倍(每点光能 2 点伤害)。' },
    play(A, inst) { A.applySelf('plasmaspark', inst.up ? 2 : 1); }
  });

  def({
    id: 'ul_meteor', cls: 'ultraman', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 8, target: 'all',
    name: '流星弹', desc: '对所有敌人造成 {D} 点伤害。',
    up: { dmg: 11, desc: '对所有敌人造成 {D} 点伤害。' },
    play(A) { A.attackAll(); }
  });

  UL.pool.push('ul_flash', 'ul_chop', 'ul_guard', 'ul_crossbeam', 'ul_merge', 'ul_sparklight',
    'ul_timerguard', 'ul_counter', 'ul_raybeam', 'ul_traveler',
    'ul_zepellion', 'ul_finalwave', 'ul_giantform', 'ul_meteor');

  UL.events = [
    {
      id: 'ul_ev_sciencepatrol', name: '科特队出击', art: '🚁',
      text: '喷气式 VTOL 悬停在头顶,队长在无线电里喊:「怪兽正在逼近市区,需要你的支援!」',
      choices: [
        { label: '协同作战', hint: '获得 1 张主题罕见牌,失去 8 点生命',
          fx(A) { A.loseHp(8); A.gainThemeCard('uncommon'); return '三角战术奏效,你从配合中领悟了新的光线用法。'; } },
        { label: '优先疏散平民', hint: '回复 25% 生命,最大生命 +5',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.25)); A.addMaxHp(5); return '最后一个孩子被抱上飞机时,朝你用力挥手。'; } },
        { label: '独自应战', hint: '获得 60 金币(感谢金)',
          fx(A) { A.gainGold(60); return '战斗结束后,市民在你的脚边放满了感谢的篮子。'; } }
      ]
    },
    {
      id: 'ul_ev_three_minutes', name: '三分钟倒计时', art: '⏱️',
      text: '彩色计时器开始闪烁。红光映在废弃大楼的玻璃上,像一颗跳到嗓子眼的心脏。',
      choices: [
        { label: '压上全部光能', hint: '失去 12 点生命,升级 2 张随机牌',
          fx(A) { A.loseHp(12); const n = A.upgradeRandom(2); return n + ' 张牌在最后三秒内超越了极限。'; } },
        { label: '撤退充能', hint: '回复 30% 生命',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.3)); return '你退到平流层,让太阳风灌满全身。'; } }
      ]
    },
    {
      id: 'ul_ev_monster_graveyard', name: '怪兽墓场', art: '🪐',
      text: '漂浮着无数沉睡怪兽的虚空。它们曾经也是地球的孩子。',
      choices: [
        { label: '唤醒一只做伙伴', hint: '获得遗物,失去 15 点生命',
          fx(A) { A.loseHp(15); const r = A.randomRelic(); return r ? '一只小怪兽蹭了蹭你的手心,跟你走了。' : '墓场一片死寂。'; } },
        { label: '超度亡魂', hint: '回复 20% 生命,获得 30 金币',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.2)); A.gainGold(30); return '光之力量温柔地包裹了墓场。宇宙奖励了你的慈悲。'; } },
        { label: '静静离开', fx() { return '不该打扰的,就不要打扰。'; } }
      ]
    },
    {
      id: 'ul_ev_beta_capsule', name: '贝塔胶囊', art: '💊',
      text: ' capsules 的微光在废墟中闪烁。持有者已不见踪影,只有一行字:「托付给相信光的人。」',
      choices: [
        { label: '接受托付', hint: '获得 1 张主题稀有牌',
          fx(A) { A.gainThemeCard('rare'); return '光在体内苏醒。新的力量属于你了。'; } },
        { label: '上交科特队保管', hint: '获得 90 金币',
          fx(A) { A.gainGold(90); return '科特队付给了你一笔可观的研究报酬。'; } }
      ]
    },
    {
      id: 'ul_ev_city_evacuation', name: '疏散警报', art: '🚨',
      text: '防空警报撕裂天空。避难所门口,一位老奶奶还在往回跑——她家阳台上有一盆开了十年的花。',
      choices: [
        { label: '帮她抢救花盆', hint: '最大生命 +8,回复 15 点生命',
          fx(A) { A.addMaxHp(8); A.heal(15); return '花盆完好无损。老奶奶说你会得到祝福的。'; } },
        { label: '强制带离', hint: '获得 2 瓶药水',
          fx(A) { A.gainPotion(); A.gainPotion(); return '避难所的医护人员塞给你两瓶能量剂。'; } }
      ]
    },
    {
      id: 'ul_ev_land_of_light', name: '光之国的回响', art: '✨',
      text: '梦中,M78 星云的光芒落在你肩上。「奥特兄弟在注视着你。」',
      choices: [
        { label: '请求特训', hint: '失去 10 点生命,升级 3 张随机牌',
          fx(A) { A.loseHp(10); const n = A.upgradeRandom(3); return n + ' 张牌在师父们的指点下脱胎换骨。'; } },
        { label: '请求祝福', hint: '回复 35% 生命',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.35)); return '温暖的光流过全身,伤痕愈合了。'; } }
      ]
    }
  ];

  UL.duos = [
    { ids: ['ul_a_seven', 'ul_a_jack'], name: '归来的光线', note: '战斗开始时,光能 +3',
      combatStart(A) { A.light(3); } },
    { ids: ['ul_a_zoffy', 'ul_a_taro'], name: '兄弟奥义', note: '战斗开始时,获得 6 点格挡、光能 +2',
      combatStart(A) { A.block(6); A.light(2); } }
  ];

  ALLY_MAP.ul_a_seven.active = { name: '头镖·艾梅利姆', desc: '对随机敌人造成 8 点伤害', fx(A) { A.dmgRandom(8); } };
  ALLY_MAP.ul_a_jack.active = { name: '奥特切割', desc: '对所有敌人造成 6 点伤害', fx(A) { A.dmgAll(6); } };
  ALLY_MAP.ul_a_zoffy.active = { name: '兄弟之光', desc: '光能 +3 并回复 5 点生命', fx(A) { A.light(3); A.heal(5); } };
  ALLY_MAP.ul_a_taro.active = { name: '斯特里姆光线', desc: '对随机敌人造成 10 点伤害', fx(A) { A.dmgRandom(10); } };
  ALLY_MAP.ul_a_kotest.active = { name: '科特队支援炮火', desc: '对所有敌人造成 4 点伤害并施加 1 层易伤', fx(A) { A.dmgAll(4); A.vulnRandom(1); } };

  /* ---------------- 西游记:新卡 ×13 ---------------- */
  def({
    id: 'xy_swing', cls: 'wukong', type: 'attack', rarity: 'common', cost: 1, dmg: 8, target: 'enemy',
    name: '横扫千军', desc: '造成 {D} 点伤害,棍势 +1。',
    up: { dmg: 11, desc: '造成 {D} 点伤害,棍势 +1。' },
    play(A) { A.attack(); A.cudgel(1); }
  });
  def({
    id: 'xy_stance', cls: 'wukong', type: 'skill', rarity: 'common', cost: 1, block: 5, target: 'none',
    name: '持棍之势', desc: '获得 {B} 点格挡,棍势 +2。',
    up: { desc: '获得 {B} 点格挡,棍势 +3。' },
    play(A, inst) { A.gainBlock(); A.cudgel(inst.up ? 3 : 2); }
  });
  def({
    id: 'xy_bonk', cls: 'wukong', type: 'attack', rarity: 'common', cost: 2, dmg: 13, target: 'enemy',
    name: '当头一棒', desc: '造成 {D} 点伤害,消耗所有棍势,每层 +2 伤害。',
    up: { dmg: 16, desc: '造成 {D} 点伤害,消耗所有棍势,每层 +3 伤害。' },
    play(A, inst) { A.attackBonus(A.spendCudgel(99) * (inst.up ? 3 : 2)); A.attack(); }
  });
  def({
    id: 'xy_windride', cls: 'wukong', type: 'skill', rarity: 'common', cost: 0, exhaust: true, target: 'none',
    name: '筋斗云', desc: '抽 1 张牌,棍势 +1。消耗。',
    up: { desc: '抽 2 张牌,棍势 +1。消耗。' },
    up2: { desc: '抽 1 张牌,棍势 +2。消耗。', play(A) { A.draw(1); A.cudgel(2); } },
    play(A, inst) { A.draw(inst.up ? 2 : 1); A.cudgel(1); }
  });
  def({
    id: 'xy_72form', cls: 'wukong', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    name: '七十二变', desc: '抽 2 张牌,棍势 +1。',
    up: { desc: '抽 3 张牌,棍势 +1。' },
    play(A, inst) { A.draw(inst.up ? 3 : 2); A.cudgel(1); }
  });
  def({
    id: 'xy_goldglow', cls: 'wukong', type: 'skill', rarity: 'uncommon', cost: 1, block: 10, target: 'none',
    name: '金光护体', desc: '获得 {B} 点格挡,棍势 +1。',
    up: { block: 14, desc: '获得 {B} 点格挡,棍势 +1。' },
    play(A) { A.gainBlock(); A.cudgel(1); }
  });
  def({
    id: 'xy_clones', cls: 'wukong', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
    name: '身外身法', desc: '每回合开始时,获得 1 张「猴毛」(攻击 4 点的小分身)。',
    up: { desc: '每回合开始时,获得 2 张「猴毛」。' },
    play(A, inst) { A.applySelf('monkeys', inst.up ? 2 : 1); }
  });
  def({
    id: 'xy_grow', cls: 'wukong', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
    name: '法天象地', desc: '每当你打出攻击牌,棍势 +2。',
    up: { desc: '每当你打出攻击牌,棍势 +3。' },
    play(A, inst) { A.applySelf('growstaff', inst.up ? 3 : 2); }
  });
  def({
    id: 'xy_monkeyfury', cls: 'wukong', type: 'attack', rarity: 'uncommon', cost: 1, dmg: 6, target: 'enemy',
    name: '怒猿击', desc: '造成 {D} 点伤害,每层棍势额外 +2 伤害(不消耗)。',
    up: { dmg: 8, desc: '造成 {D} 点伤害,每层棍势额外 +2 伤害(不消耗)。' },
    play(A) { A.attackBonus(A.cudgelCount() * 2); A.attack(); }
  });
  def({
    id: 'xy_sealblock', cls: 'wukong', type: 'skill', rarity: 'uncommon', cost: 1, block: 12, target: 'none',
    name: '六字真言', desc: '获得 {B} 点格挡,所有敌人「镇压」1 层(伤害 -25%)。',
    up: { block: 16, desc: '获得 {B} 点格挡,所有敌人「镇压」1 层。' },
    play(A) { A.gainBlock(); A.applyAll('seal', 1); }
  });
  def({
    id: 'xy_skyfall', cls: 'wukong', type: 'attack', rarity: 'rare', cost: 2, dmg: 8, hits: 3, target: 'enemy',
    name: '乱棒如雨', desc: '造成 3 次 {D} 点伤害。',
    up: { dmg: 10, desc: '造成 3 次 {D} 点伤害。' },
    play(A) { A.attack(null, { times: 3 }); }
  });
  def({
    id: 'xy_dignity', cls: 'wukong', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '大圣威仪', desc: '获得 1 层威仪(每回合棍势 +2)和 1 点力量。',
    up: { desc: '获得 2 层威仪(每回合棍势 +4)和 1 点力量。' },
    play(A, inst) { A.applySelf('majesty', inst.up ? 2 : 1); A.applySelf('str', 1); }
  });
  def({
    id: 'xy_oceanwave', cls: 'wukong', type: 'skill', rarity: 'rare', cost: 1, target: 'none',
    name: '定海神针', desc: '消耗所有棍势,每层抽 1 张牌。',
    up: { desc: '消耗所有棍势,每层抽 1 张牌,并获得 8 点格挡。' },
    play(A, inst) { const n = A.spendCudgel(99); if (inst.up) A.gainBlock(8); A.draw(n); }
  });

  def({
    id: 'xy_cloudstep', cls: 'wukong', type: 'skill', rarity: 'common', cost: 1, block: 6, target: 'none',
    name: '腾云驾雾', desc: '获得 {B} 点格挡,抽 1 张牌。',
    up: { block: 9, desc: '获得 {B} 点格挡,抽 1 张牌。' },
    play(A) { A.gainBlock(); A.draw(1); }
  });

  XY.pool.push('xy_swing', 'xy_stance', 'xy_bonk', 'xy_windride',
    'xy_72form', 'xy_goldglow', 'xy_clones', 'xy_grow', 'xy_monkeyfury', 'xy_sealblock',
    'xy_skyfall', 'xy_dignity', 'xy_oceanwave', 'xy_cloudstep');

  XY.events = [
    {
      id: 'xy_ev_ginsengfruit', name: '五庄观的人参果', art: '🍐',
      text: '清风明月捧出九千年一熟的果子。「吃一个吧,延寿四万七千年——但镇元大仙的规矩,你懂的。」',
      choices: [
        { label: '偷吃一个', hint: '最大生命 +15,污染 +2',
          fx(A) { A.addMaxHp(15); A.addCurse(2); return '果香入口的一瞬,树梢传来一声冷笑。'; } },
        { label: '帮果园除虫', hint: '回复 30% 生命,获得 1 张主题牌',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.3)); A.gainThemeCard('common'); return '两位童子送了你一枚小果子,和一式仙法。'; } },
        { label: '婉拒离开', fx() { return '你不想重蹈五百年前那场大闹的覆辙。'; } }
      ]
    },
    {
      id: 'xy_ev_flamingmountain', name: '火焰山', art: '🌋',
      text: '八百里火焰挡路。铁扇公主的芭蕉扇,借还是不借?',
      choices: [
        { label: '三借芭蕉扇', hint: '失去 12 点生命,获得遗物',
          fx(A) { A.loseHp(12); const r = A.randomRelic(); return r ? '第三次,扇子终于到手。风起,火灭。' : '真假扇子搅成一团,火更大了。'; } },
        { label: '硬闯火海', hint: '失去 8 点生命,升级 2 张随机牌',
          fx(A) { A.loseHp(8); const n = A.upgradeRandom(2); return n + ' 张牌在烈火中淬炼出了真意。'; } },
        { label: '绕路十万八千里', hint: '回复 20 点生命',
          fx(A) { A.heal(20); return '多走的路也是修行。你调息了整整一个月。'; } }
      ]
    },
    {
      id: 'xy_ev_bai_gu_jing', name: '白骨夫人', art: '💀',
      text: '村姑、老妪、老翁——三具白骨都倒在你面前。师父的脸色很难看。',
      choices: [
        { label: '打死不放', hint: '获得 1 张主题稀有牌,失去 10 点生命',
          fx(A) { A.loseHp(10); A.gainThemeCard('rare'); return '火眼金睛没有看错。妖气散尽处,留下一式神通。'; } },
        { label: '手下留情', hint: '回复 25% 生命,但获得 1 张诅咒',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.25)); A.curse('wound'); return '妖怪笑着遁走,在你身上留了一道抓痕。'; } }
      ]
    },
    {
      id: 'xy_ev_taoist_temple', name: '车迟国斗法', art: '🀄',
      text: '虎力、鹿力、羊力三位大仙摆下赌局:「求雨、坐禅、隔板猜物,敢不敢来?」',
      choices: [
        { label: '赌大的', hint: '50%:获得 150 金币 / 50%:失去 15 点生命',
          fx(A) { if (A.chance(0.5)) { A.gainGold(150); return '砍头剖腹下油锅,样样你赢。国库大开。'; } A.loseHp(15); return '阴沟里翻了船。三位大仙笑得前仰后合。'; } },
        { label: '只比坐禅', hint: '获得 1 张主题罕见牌',
          fx(A) { A.gainThemeCard('uncommon'); return '禅定之间,你悟出了一式不动如山的功夫。'; } },
        { label: '认输走人', fx() { return '「不赌不赌。」你拉着师父连夜过了国界。'; } }
      ]
    },
    {
      id: 'xy_ev_dragon_palace', name: '东海龙宫', art: '🐉',
      text: '老龙王抚着胡须:「定海神针已是你的了。不过——库房里还有件东西,看你有没有缘分。」',
      choices: [
        { label: '再讨一件宝', hint: '获得随机遗物,污染 +1',
          fx(A) { A.addCurse(1); const r = A.randomRelic(); return r ? '龙王肉疼地取出一件宝贝。海图上,你的因果债又厚了一页。' : '龙王两手一摊:「真没了。」'; } },
        { label: '谢过离去', hint: '回复 25% 生命',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.25)); return '知足者,龙宫赠甘露一盏。'; } }
      ]
    },
    {
      id: 'xy_ev_buddhist_scripture', name: '无字真经', art: '📜',
      text: '雷音寺的经书雪白一片,无一字。「白经者,乃无字真经,倒也是好的。——然尔等东土众生,迷雾愚蒙,只可传有字的。」',
      choices: [
        { label: '回头换取有字真经', hint: '花费 50 金币,升级 3 张随机牌',
          can(g) { return g.gold() >= 50; },
          fx(A) { A.loseGold(50); const n = A.upgradeRandom(3); return '"人事"交讫,' + n + ' 卷真经金光灿灿。'; } },
        { label: '参悟无字之经', hint: '最大生命 +10',
          fx(A) { A.addMaxHp(10); return '你盯着空白看了整整一夜,胸口忽然一热。'; } },
        { label: '都不要', fx() { return '真经在心中,不在纸上。你转身下山西去。'; } }
      ]
    }
  ];

  XY.duos = [
    { ids: ['xy_a_sanzang', 'xy_a_bajie'], name: '师徒同心', note: '战斗开始时,棍势 +2、回复 5 点生命',
      combatStart(A) { A.cudgel(2); A.heal(5); } },
    { ids: ['xy_a_bajie', 'xy_a_wujing'], name: '挑担兄弟', note: '战斗开始时,获得 8 点格挡',
      combatStart(A) { A.block(8); } }
  ];

  ALLY_MAP.xy_a_sanzang.active = { name: '紧箍咒', desc: '对随机敌人造成 5 点伤害并施加 2 层易伤', fx(A) { A.dmgRandom(5); A.vulnRandom(2); } };
  ALLY_MAP.xy_a_bajie.active = { name: '九齿钉耙', desc: '对所有敌人造成 6 点伤害', fx(A) { A.dmgAll(6); } };
  ALLY_MAP.xy_a_wujing.active = { name: '降妖宝杖', desc: '对随机敌人造成 8 点伤害', fx(A) { A.dmgRandom(8); } };
  ALLY_MAP.xy_a_horse.active = { name: '白龙突袭', desc: '对随机敌人造成 6 点伤害并获得 4 点格挡', fx(A) { A.dmgRandom(6); A.block(4); } };
  ALLY_MAP.xy_a_guanyin.active = { name: '杨柳甘露', desc: '回复 10 点生命', fx(A) { A.heal(10); } };

  /* ---------------- 妖精的尾巴:新卡 ×13 ---------------- */
  def({
    id: 'ft_punch', cls: 'fairytail', type: 'attack', rarity: 'common', cost: 1, dmg: 8, target: 'enemy',
    name: '铁拳一击', desc: '造成 {D} 点伤害,龙之意志 +1。',
    up: { dmg: 11, desc: '造成 {D} 点伤害,龙之意志 +1。' },
    play(A) { A.attack(); A.dragonforce(1); }
  });
  def({
    id: 'ft_roar', cls: 'fairytail', type: 'attack', rarity: 'common', cost: 2, dmg: 8, target: 'all',
    name: '火龙的咆哮', desc: '对所有敌人造成 {D} 点伤害。',
    up: { dmg: 11, desc: '对所有敌人造成 {D} 点伤害。' },
    play(A) { A.attackAll(); }
  });
  def({
    id: 'ft_scale', cls: 'fairytail', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '灭龙之鳞', desc: '每回合开始时,获得 2 点格挡(本场战斗)。',
    up: { desc: '每回合开始时,获得 3 点格挡(本场战斗)。' },
    play(A, inst) { A.applySelf('scales', inst.up ? 3 : 2); }
  });
  def({
    id: 'ft_lucykick', cls: 'fairytail', type: 'attack', rarity: 'common', cost: 1, dmg: 6, target: 'enemy',
    name: '露西飞踢', desc: '造成 {D} 点伤害,抽 1 张牌。',
    up: { dmg: 9, desc: '造成 {D} 点伤害,抽 1 张牌。' },
    play(A) { A.attack(); A.draw(1); }
  });
  def({
    id: 'ft_wendycure', cls: 'fairytail', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    name: '天龙的加护', desc: '回复 8 点生命,并净化自身减益。',
    up: { desc: '回复 12 点生命,并净化自身减益。' },
    play(A, inst) { A.cleanseDebuffs(); A.heal(inst.up ? 12 : 8); }
  });
  def({
    id: 'ft_icehammer', cls: 'fairytail', type: 'attack', rarity: 'uncommon', cost: 2, dmg: 14, target: 'enemy',
    name: '冰灭·战锤', desc: '造成 {D} 点伤害,敌人脆弱 2 层。',
    up: { dmg: 18, desc: '造成 {D} 点伤害,敌人脆弱 3 层。' },
    play(A, inst, t) { A.attack(); A.applyTo(t, 'frail', inst.up ? 3 : 2); }
  });
  def({
    id: 'ft_flight', cls: 'fairytail', type: 'skill', rarity: 'uncommon', cost: 1, block: 4, target: 'none',
    name: '哈比的翅膀', desc: '获得 {B} 点格挡,抽 2 张牌。',
    up: { desc: '获得 {B} 点格挡,抽 3 张牌。' },
    play(A, inst) { A.gainBlock(); A.draw(inst.up ? 3 : 2); }
  });
  def({
    id: 'ft_bindings', cls: 'fairytail', type: 'skill', rarity: 'uncommon', cost: 1, target: 'all',
    name: '束缚之线', desc: '所有敌人虚弱 2 层。',
    up: { desc: '所有敌人虚弱 3 层。' },
    play(A, inst) { A.applyAll('weak', inst.up ? 3 : 2); }
  });
  def({
    id: 'ft_burnlife', cls: 'fairytail', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    name: '燃烧生命', desc: '每回合结束时,获得 1 点力量并失去 2 点生命。',
    up: { desc: '每回合结束时,获得 1 点力量并失去 1 点生命。' },
    play(A) { A.applySelf('burnlife', 1); }
  });
  def({
    id: 'ft_ironwall', cls: 'fairytail', type: 'skill', rarity: 'uncommon', cost: 1, block: 10, target: 'none',
    name: '铁之壁', desc: '获得 {B} 点格挡和 3 点荆棘。',
    up: { block: 14, desc: '获得 {B} 点格挡和 5 点荆棘。' },
    play(A, inst) { A.gainBlock(); A.applySelf('thorns', inst.up ? 5 : 3); }
  });
  def({
    id: 'ft_dragonclaw', cls: 'fairytail', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    name: '龙之力', desc: '获得 2 层龙之意志(每层攻击 +15%)。',
    up: { cost: 1, desc: '获得 2 层龙之意志(每层攻击 +15%)。' },
    up2: { cost: 2, name: '龙之力·觉醒', desc: '获得 2 层龙之意志和 2 点力量。', play(A) { A.applySelf('dragonforce', 2); A.applySelf('str', 2); } },
    play(A) { A.applySelf('dragonforce', 2); }
  });
  def({
    id: 'ft_unionraid', cls: 'fairytail', type: 'attack', rarity: 'rare', cost: 2, dmg: 10, target: 'enemy',
    name: '合体魔法', desc: '造成 {D} 点伤害,每名伙伴额外 +3 伤害。',
    up: { dmg: 13, desc: '造成 {D} 点伤害,每名伙伴额外 +3 伤害。' },
    play(A) { A.attackBonus(A.allies() * 3); A.attack(); }
  });
  def({
    id: 'ft_fairylaw', cls: 'fairytail', type: 'attack', rarity: 'rare', cost: 3, dmg: 18, target: 'all',
    name: '妖精的法律', desc: '对所有敌人造成 {D} 点伤害。',
    up: { dmg: 24, desc: '对所有敌人造成 {D} 点伤害。' },
    up2: { cost: 2, dmg: 12, name: '妖精的法律·制裁', desc: '对所有敌人造成 {D} 点伤害并施加 2 层易伤。', play(A) { A.attackAll(); A.applyAll('vuln', 2); } },
    play(A) { A.attackAll(); }
  });

  FT.pool.push('ft_punch', 'ft_roar', 'ft_scale', 'ft_lucykick', 'ft_wendycure',
    'ft_icehammer', 'ft_flight', 'ft_bindings', 'ft_burnlife', 'ft_ironwall',
    'ft_dragonclaw', 'ft_unionraid', 'ft_fairylaw');

  FT.events = [
    {
      id: 'ft_ev_guild_master', name: '会长的工作台', art: '📋',
      text: '马卡罗夫会长把一叠委托单拍在桌上:「S 级的太危险,但这份 D 级的……报酬意外地不错哦。」',
      choices: [
        { label: '接 D 级委托(找猫)', hint: '获得 70 金币,回复 15 点生命',
          fx(A) { A.gainGold(70); A.heal(15); return '猫找到了,还顺带端了一个盗贼窝。轻松愉快。'; } },
        { label: '偷接 S 级委托', hint: '失去 15 点生命,获得 1 张主题稀有牌',
          can(g) { return g.hp() > 15; },
          fx(A) { A.loseHp(15); A.gainThemeCard('rare'); return '半死不活地回来了——但你的魔力成长了一大截。'; } },
        { label: '在公会喝酒', hint: '回复 25% 生命',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.25)); return '「今天就不收你酒钱了!」公会永远是最暖的地方。'; } }
      ]
    },
    {
      id: 'ft_ev_dragon_slayer', name: '灭龙魔导士的试炼', art: '🐲',
      text: '高塔上栖息着一条真正的龙。「想要超越我吗,小鬼?那就先接住我一成的怒火。」',
      choices: [
        { label: '硬接龙息', hint: '失去 20 点生命,获得 2 层龙之意志效果(随机升级 3 张攻击牌)',
          fx(A) { A.loseHp(20); A.upgradeRandomWhere(v => v.type === 'attack', 3); return '火焰没有烧死你,反而成了你的养料。'; } },
        { label: '请教龙语', hint: '最大生命 +12',
          fx(A) { A.addMaxHp(12); return '古龙的语言里藏着魔力的真髓。'; } },
        { label: '礼貌告辞', fx() { return '「明智。」龙的笑声震落了塔顶的积雪。'; } }
      ]
    },
    {
      id: 'ft_ev_celestial_spirit', name: '星灵界的门扉', art: '🚪',
      text: '金色的钥匙插在虚空中旋转。门后传来清脆的声音:「契约者,今天想和哪位星灵签约定?」',
      choices: [
        { label: '签订新契约', hint: '获得 1 张主题罕见牌',
          fx(A) { A.gainThemeCard('uncommon'); return '一道新的星光加入了你的卡组。'; } },
        { label: '修复旧契约', hint: '花费 40 金币,升级 2 张随机牌',
          can(g) { return g.gold() >= 40; },
          fx(A) { A.loseGold(40); const n = A.upgradeRandom(2); return n + ' 张星灵牌恢复了巅峰之力。'; } },
        { label: '关上门', fx() { return '「那,下次见。」钥匙安静了下来。'; } }
      ]
    },
    {
      id: 'ft_ev_magnolia_festival', name: '哈鲁蒂翁祭', art: '🎆',
      text: '马格诺利亚的庆典之夜。露天的长桌上摆满了烤肉,米拉珍在吧台后面朝你招手。',
      choices: [
        { label: '大吃一顿', hint: '回复 35% 生命',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.35)); return '「再来一份!」你连吃了八盘,伤全好了。'; } },
        { label: '参加幻想大游行', hint: '获得 90~120 金币',
          fx(A) { const g = A.randInt(90, 120); A.gainGold(g); return '你们的花车拿了第一名,奖金 ' + g + ' 金币。'; } },
        { label: '屋顶看烟花', hint: '最大生命 +6,回复 10 点生命',
          fx(A) { A.addMaxHp(6); A.heal(10); return '有人在旁边吵吵闹闹,但此刻很安心。'; } }
      ]
    },
    {
      id: 'ft_ev_s_class_trial', name: 'S 级晋升试炼', art: '🏝️',
      text: '天狼岛上,古老的石碑亮起纹路。「想成为 S 级魔导士吗?证明你的魔力吧。」',
      choices: [
        { label: '挑战石碑', hint: '失去 15 点生命,获得遗物',
          fx(A) { A.loseHp(15); const r = A.randomRelic(); return r ? '石碑认可了你,圣光凝成遗物落入掌心。' : '石碑沉默着,你的魔力还不够。'; } },
        { label: '与同伴切磋', hint: '升级 2 张随机牌',
          fx(A) { const n = A.upgradeRandom(2); return n + ' 张魔法在实战中进化了。'; } }
      ]
    },
    {
      id: 'ft_ev_heartfilia_estate', name: '哈特菲利亚宅邸', art: '🏰',
      text: '露西家的老宅安静得能听见灰尘落地。管家躬身:「小姐的朋友,就是贵客。」',
      choices: [
        { label: '接受家宴款待', hint: '回复 30% 生命,获得 1 瓶药水',
          fx(A) { A.heal(Math.floor(A.maxHp() * 0.3)); A.gainPotion(); return '一顿正经的晚宴,久违的安宁。'; } },
        { label: '借阅藏书', hint: '获得 2 张主题普通牌',
          fx(A) { A.gainThemeCard('common'); A.gainThemeCard('common'); return '魔法典籍里藏着两式好用的魔法。'; } }
      ]
    }
  ];

  FT.duos = [
    { ids: ['ft_a_lucy', 'ft_a_gray'], name: '双人小队', note: '战斗开始时,抽 1 张牌',
      combatStart(A) { A.draw(1); } },
    { ids: ['ft_a_erza', 'ft_a_wendy'], name: '女王与天空', note: '战斗开始时,获得 1 点力量、5 点格挡',
      combatStart(A) { A.str(1); A.block(5); } }
  ];

  ALLY_MAP.ft_a_lucy.active = { name: '星灵召唤', desc: '对随机敌人造成 6 点伤害并获得 4 点格挡', fx(A) { A.dmgRandom(6); A.block(4); } };
  ALLY_MAP.ft_a_gray.active = { name: '冰造·战锤', desc: '对随机敌人造成 9 点伤害', fx(A) { A.dmgRandom(9); } };
  ALLY_MAP.ft_a_happy.active = { name: '翔翼支援', desc: '抽 2 张牌', fx(A) { A.draw(2); } };
  ALLY_MAP.ft_a_erza.active = { name: '换装·天轮之铠', desc: '获得 8 点格挡和 1 点力量', fx(A) { A.block(8); A.str(1); } };
  ALLY_MAP.ft_a_wendy.active = { name: '天龙的咆哮·天', desc: '回复 8 点生命并抽 1 张牌', fx(A) { A.heal(8); A.draw(1); } };

  global.GS.THEMES = {
    all: THEMES,
    map: THEME_MAP,
    get(id) { return id ? THEME_MAP[id] || null : null; },
    byClass(cls) { return THEMES.find(t => t.cls === cls) || null; },
    enemyDefs: E,
    allies: ALLY_LIST,
    allyMap: ALLY_MAP,
    allyCap: ALLY_CAP,
    // 主题战斗内的「鬼 / 精灵」说明(供 UI 显示)
    ghosts: {
      mn_mirrorghost: ['镜中人', '每当你打出一张牌,获得等同层数的格挡'],
      mn_hangghost: ['吊死鬼', '每当你打出一张牌,对随机敌人造成等同层数的伤害'],
      mn_bloodghost: ['血鬼', '每当你打出一张牌,回复等同层数的生命'],
      mn_ghostking: ['鬼王', '每当你打出一张牌,造成等同层数的伤害'],
      rz_sp_ice: ['帕克', '每当你打出一张技能牌,对随机敌人造成等同层数的伤害'],
      rz_sp_shield: ['库', '每当你打出一张技能牌,获得等同层数的格挡'],
      rz_sp_heal: ['米莉娅', '每当你打出一张技能牌,回复等同层数的生命'],
      rz_sp_wind: ['风精灵', '每当你打出一张技能牌,对所有敌人造成等同层数的伤害']
    },
    // 每只鬼的默认强度(供 镇魂铃 / 唤魂 随机抽取)
    ghostPool: ['mn_mirrorghost', 'mn_hangghost', 'mn_bloodghost', 'mn_ghostking'],
    ghostPower: { mn_mirrorghost: 6, mn_hangghost: 3, mn_bloodghost: 1, mn_ghostking: 5 },
    // 每只精灵的默认强度(供 福音书 / 缔约 随机抽取)
    spiritPool: ['rz_sp_ice', 'rz_sp_shield', 'rz_sp_heal', 'rz_sp_wind'],
    spiritPower: { rz_sp_ice: 4, rz_sp_shield: 5, rz_sp_heal: 2, rz_sp_wind: 2 }
  };
})(typeof window !== 'undefined' ? window : globalThis);
