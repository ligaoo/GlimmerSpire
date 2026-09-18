/* 微光尖塔 - 遗物数据库
   引擎会根据字段/钩子调用对应效果 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};

  const R = {};

  function def(d) { R[d.id] = d; }

  /* ---- 职业初始遗物 ---- */
  def({ id: 'burningblood', name: '燃烧之血', art: '🩸', rarity: 'starter',
    desc: '每场战斗胜利后回复 6 点生命。', healOnWin: 6 });
  def({ id: 'snaking', name: '蛇形之戒', art: '🐍', rarity: 'starter',
    desc: '每场战斗的第一回合额外抽 2 张牌。', drawFirstTurn: 2 });
  def({ id: 'etchedskull', name: '蚀刻颅骨', art: '💀', rarity: 'starter',
    desc: '每场战斗开始时获得 5 点格挡。', blockStart: 5 });

  /* ---- 普通 ---- */
  def({ id: 'whetstone', name: '磨刀石', art: '🪨', rarity: 'common',
    desc: '每场战斗开始时获得 1 点力量。', strStart: 1 });
  def({ id: 'ironwood', name: '铁木盾', art: '🪵', rarity: 'common',
    desc: '每场战斗开始时获得 1 点敏捷。', dexStart: 1 });
  def({ id: 'coinpurse', name: '钱袋', art: '👝', rarity: 'common',
    desc: '每场战斗的奖励金币额外 +15。', goldCombatBonus: 15 });
  def({ id: 'healpouch', name: '治疗药囊', art: '🌿', rarity: 'common',
    desc: '篝火休息时的回复量额外 +15。', restHealBonus: 15 });
  def({ id: 'potionbelt', name: '药水腰带', art: '🎽', rarity: 'common',
    desc: '药水槽 +1。', potionSlots: 1 });
  def({ id: 'forgehammer', name: '锻造之锤', art: '🔨', rarity: 'common',
    desc: '在篝火锻造时,可以额外升级 1 张牌。', smithBonus: 1 });
  def({ id: 'ancientcoin', name: '古代钱币', art: '🪙', rarity: 'common',
    desc: '商店的所有价格降低 20%。', shopDiscount: 0.2 });
  def({ id: 'gamblerdice', name: '赌徒骰子', art: '🎲', rarity: 'common',
    desc: '每场战斗开始时,50% 几率能量上限 +1(本场战斗)。' });
  def({ id: 'heartvessel', name: '心之容器', art: '🫀', rarity: 'common',
    desc: '最大生命 +10。', maxHp: 10,
    onAcquire(g) { g.addMaxHp(10); } });
  def({ id: 'treasureglass', name: '寻宝放大镜', art: '🔍', rarity: 'common',
    desc: '卡牌奖励额外显示 1 张牌。', cardRewardBonus: 1 });
  def({ id: 'luckycharm', name: '幸运符', art: '🍀', rarity: 'common',
    desc: '事件中获得金币的效果翻倍。', eventGoldMult: 2 });
  def({ id: 'ninjascroll', name: '忍者卷轴', art: '📜', rarity: 'common',
    desc: '每场战斗开始时,将 1 张「刃」加入手牌。' });

  /* ---- 稀有度:罕见(蓝色品质之上的橙/蓝分类沿用 STS 习惯:uncommon=蓝,rare=橙) ---- */
  def({ id: 'warhammer', name: '破军之锤', art: '⚒️', rarity: 'uncommon',
    desc: '对精英敌人的伤害 +15%。', eliteDmgMult: 0.15 });
  def({ id: 'hunterblade', name: '猎首者之刃', art: '🔪', rarity: 'uncommon',
    desc: '对 BOSS 的伤害 +10%。', bossDmgMult: 0.1 });
  def({ id: 'silkthread', name: '巧手丝线', art: '🧵', rarity: 'uncommon',
    desc: '每场战斗中你打出的第一张技能牌费用 -1。' });
  def({ id: 'glassvial', name: '玻璃小瓶', art: '🧫', rarity: 'uncommon',
    desc: '每次进入商店时获得 1 瓶随机药水。' });
  def({ id: 'courageemblem', name: '勇气纹章', art: '🎖️', rarity: 'uncommon',
    desc: '生命低于 50% 时,攻击伤害计算 +2 力量。', lowHpStr: 2 });
  def({ id: 'huntbadge', name: '猎首徽记', art: '🏅', rarity: 'uncommon',
    desc: '击败精英后回复 12 点生命。', healAfterElite: 12 });
  def({ id: 'censer', name: '净化香炉', art: '⛩️', rarity: 'uncommon',
    desc: '在篝火时可以额外选择「净化」(移除 1 张牌)。', purifyAtRest: true });
  def({ id: 'hourglass', name: '时之沙漏', art: '⏳', rarity: 'uncommon',
    desc: '每场战斗的第 3 回合开始时获得 1 点能量。' });
  def({ id: 'lantern', name: '灯笼', art: '🏮', rarity: 'uncommon',
    desc: '每打开一个宝箱额外获得 25 金币。', chestGold: 25 });

  /* ---- 稀有 ---- */
  def({ id: 'manapearl', name: '魔力珍珠', art: '🔮', rarity: 'rare',
    desc: '能量上限 +1。', energyBonus: 1 });
  def({ id: 'deathbook', name: '死灵之书', art: '📕', rarity: 'rare',
    desc: '每场战斗开始时,随机升级开局手牌中的 1 张牌(本场有效)。' });
  def({ id: 'sacredidol', name: '塑形圣像', art: '🗿', rarity: 'rare',
    desc: '每场战斗开始时获得 1 点力量和 1 点敏捷。' });
  def({ id: 'phoenixfeather', name: '凤凰羽', art: '🪶', rarity: 'rare',
    desc: '首次受到致命伤害时,复活并回复 30% 生命(之后失去效果)。', revive: true });
  def({ id: 'membercard', name: '会员卡', art: '💳', rarity: 'rare',
    desc: '商店的所有价格减半。', shopDiscount: 0.5 });
  def({ id: 'luckylens', name: '透视镜', art: '🔭', rarity: 'rare',
    desc: '卡牌奖励中出现稀有牌的概率大幅提升。', rareLuck: true });
  def({ id: 'thornscrown', name: '荆棘冠冕', art: '👑', rarity: 'rare',
    desc: '每场战斗开始时获得 3 点荆棘。', thornsStart: 3 });
  def({ id: 'giantbelt', name: '巨人腰带', art: '🥋', rarity: 'rare',
    desc: '最大生命 +20。', maxHp: 20,
    onAcquire(g) { g.addMaxHp(20); } });
  def({ id: 'cornucopia', name: '聚宝盆', art: '🧺', rarity: 'rare',
    desc: '每进入一个新的楼层获得 10 金币。', floorGold: 10 });
  def({ id: 'duelistglove', name: '决斗者手套', art: '🧤', rarity: 'rare',
    desc: '每场战斗中你打出的第一张攻击牌伤害 +6。', firstAttackBonus: 6 });

  const ALL_IDS = Object.keys(R);

  global.GS.RELICS = {
    defs: R,
    get(id) { return R[id]; },
    all: ALL_IDS,
    byRarity(rar) { return ALL_IDS.filter(id => R[id].rarity === rar); },
    starter(cls) {
      if (cls === 'warrior') return 'burningblood';
      if (cls === 'ranger') return 'snaking';
      return 'etchedskull';
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
