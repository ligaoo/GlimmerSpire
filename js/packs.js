/* 微光尖塔 - 技能包系统
   每局结算的积分累积在战绩里,用于解锁职业技能包;
   解锁后包内卡牌进入该职业的奖励/商店池 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};

  const UNLOCK_KEY = 'glimmerSpireUnlocks';

  const PACKS = [
    {
      id: 'bloodfury', cls: 'warrior', name: '狂怒之血', cost: 500,
      desc: '狂战士之道:牌消耗得越多,力量与生命越汹涌。',
      cards: ['bloodslash', 'bloodritual', 'laststand']
    },
    {
      id: 'ironwall', cls: 'warrior', name: '铁壁', cost: 800,
      desc: '让格挡成为武器:盾墙翻倍、铁山靠按力量输出、针甲反伤。',
      cards: ['spikedarmor', 'shieldwall', 'ironslam']
    },
    {
      id: 'breakthrough', cls: 'warrior', name: '破阵', cost: 1200,
      desc: '战场的掌控者:削碎敌人格挡,用战吼瓦解一切防线。',
      cards: ['warcry', 'rally', 'armorbreak']
    },
    {
      id: 'shadowblade', cls: 'ranger', name: '影刃', cost: 500,
      desc: '飞刃风暴:锐化你的刃,让每一张「刃」都变成致命的雨。',
      cards: ['sharpen', 'quickthrow', 'shadowflurry']
    },
    {
      id: 'plague', cls: 'ranger', name: '瘟疫', cost: 800,
      desc: '瘟疫使者:毒素会蔓延、会转移、更会瞬间引爆。',
      cards: ['corrode', 'spreadplague', 'detonate']
    },
    {
      id: 'hunter', cls: 'ranger', name: '猎手', cost: 1200,
      desc: '顶级猎食者:标记弱点,在猎物松懈的一瞬将其处决。',
      cards: ['huntmark', 'trapmaster', 'executioner']
    },
    {
      id: 'demon', cls: 'warlock', name: '恶魔', cost: 500,
      desc: '与恶魔同行:小鬼成群,以血肉饲养力量,死亡滋养盛宴。',
      cards: ['imparable', 'demonpower', 'soulfeast']
    },
    {
      id: 'abyss', cls: 'warlock', name: '深渊', cost: 800,
      desc: '深渊的低语:敌人始终易伤,而你从虚空汲取生命。',
      cards: ['lifetap', 'abysswatcher', 'annihilate']
    },
    {
      id: 'bloodmagic', cls: 'warlock', name: '血魔法', cost: 1200,
      desc: '禁术的极致:生命化为能量,而死亡也无法带走你。',
      cards: ['bloodblade', 'lifetransform', 'phoenixblood']
    }
  ];

  function loadUnlocks() {
    try {
      const raw = localStorage.getItem(UNLOCK_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { }
    return [];
  }
  function saveUnlocks(list) {
    try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(list)); } catch (e) { }
  }

  const Unlocks = {
    all: PACKS,
    list() { return loadUnlocks(); },
    owned(packId) { return loadUnlocks().includes(packId); },
    unlock(packId) {
      const l = loadUnlocks();
      if (!l.includes(packId)) { l.push(packId); saveUnlocks(l); }
    },
    // 测试用:全部解锁/重置
    unlockAll() { saveUnlocks(PACKS.map(p => p.id)); },
    reset() { saveUnlocks([]); }
  };

  global.GS.Unlocks = Unlocks;
})(typeof window !== 'undefined' ? window : globalThis);
