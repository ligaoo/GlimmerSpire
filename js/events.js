/* 微光尖塔 - 事件数据库
   choice.fx(A) 返回结果文本;A 为事件上下文接口 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};

  const V = [];

  function def(d) { V.push(d); }

  // 遗物全收集时的兜底文案
  function relicGain(A, prefix, suffix) {
    const r = A.randomRelic();
    if (!r) { A.gainGold(50); return (prefix || '') + '遗迹早已被搜刮一空,你只捡到 50 金币。' + (suffix || ''); }
    return (prefix || '') + '获得了遗物「' + A.relicName(r) + '」!' + (suffix || '');
  }

  def({
    id: 'statue', name: '神秘雕像', art: '🗿',
    text: '一尊沉默的石像伫立在路口,基座上刻着古老的献祭槽。它似乎在等待什么。',
    choices: [
      { label: '献上 100 金币', hint: '获得一件随机遗物',
        can(g) { return g.gold() >= 100; },
        fx(A) { A.loseGold(100); return relicGain(A, '雕像的眼睛亮起微光……'); } },
      { label: '献上 15% 当前生命', hint: '获得 2 瓶随机药水',
        fx(A) { const n = Math.max(3, Math.floor(A.hp() * 0.15)); A.loseHp(n); A.gainPotion(); A.gainPotion(); return '你感到一阵虚弱,但雕像递来了两瓶药水。'; } },
      { label: '离开', fx() { return '你绕过了雕像。'; } }
    ]
  });
  def({
    id: 'altar', name: '古老祭坛', art: '⛩️',
    text: '褪色的祭坛上悬浮着一团光。如果献上血液,它愿帮你抹去一段过去。',
    choices: [
      { label: '献祭 10% 生命,移除 1 张牌', hint: '净化卡组',
        fx(A) { const n = Math.max(3, Math.floor(A.maxHp() * 0.1)); A.loseHp(n); A.removeCard(); return '痛苦流过指尖,一张牌化为灰烬。'; } },
      { label: '祈祷', hint: '回复 20% 生命',
        fx(A) { A.heal(Math.floor(A.maxHp() * 0.2)); return '温暖的光芒包裹了你。'; } },
      { label: '离开', fx() { return '你选择不打扰这里的宁静。'; } }
    ]
  });
  def({
    id: 'wheel', name: '命运之轮', art: '🎡',
    text: '一位戴着面具的旅人推出一台巨大的转盘:"赌一把吗,朋友?运气青睐勇敢者。"',
    choices: [
      { label: '押上所有金币', hint: '50%:翻倍 / 50%:失去一半',
        can(g) { return g.gold() > 0; },
        fx(A) {
          if (A.chance(0.5)) { const w = A.gold(); A.gainGold(w); return '转盘停在金色!"你的金币翻倍了,朋友。"'; }
          const l = Math.floor(A.gold() / 2); A.loseGold(l); return '转盘缓缓停下……你失去了 ' + l + ' 金币。'; } },
      { label: '看着转盘空转', fx() { return '你婉拒了。面具人的目光令你不安。'; } }
    ]
  });
  def({
    id: 'adventurer', name: '受伤的冒险者', art: '🧝',
    text: '一名冒险者倒在路边,身上背着鼓鼓的行囊。他向你伸出颤抖的手。',
    choices: [
      { label: '给予 50 金币治疗', hint: '获得一件随机遗物',
        can(g) { return g.gold() >= 50; },
        fx(A) { A.loseGold(50); return relicGain(A, '冒险者康复后,'); } },
      { label: '抢走行囊', hint: '获得 90 金币和 1 张诅咒',
        fx(A) { A.gainGold(90); A.curse('decay'); return '你夺走了行囊,但一道阴影缠上了你。'; } },
      { label: '离开', fx() { return '你假装没有看见。'; } }
    ]
  });
  def({
    id: 'forbidden', name: '禁忌之书', art: '📖',
    text: '一本散发着腥甜气息的古书。翻开的书页上,力量在流动。',
    choices: [
      { label: '阅读', hint: '获得 1 张稀有牌和 1 张诅咒',
        fx(A) { A.gainRareCard(); A.curse('pain'); return '禁忌的知识涌入脑海,代价随之而来。'; } },
      { label: '烧掉它', hint: '回复 12 点生命',
        fx(A) { A.heal(12); return '火焰中的低语渐渐平息,你感到一丝暖意。'; } }
    ]
  });
  def({
    id: 'forge', name: '路边冶炼炉', art: '⚒️',
    text: '一座仍有余温的冶炼炉。铁锤就放在旁边,仿佛主人刚刚离开。',
    choices: [
      { label: '忍受灼热锻造', hint: '升级 1 张牌,失去 8 点生命',
        fx(A) { A.loseHp(8); A.upgradeChoose(); return '汗水滴落在铁砧上,你的牌焕然一新。'; } },
      { label: '搜刮炉边的废料', hint: '获得 40~80 金币',
        fx(A) { const g = A.randInt(40, 80); A.gainGold(g); return '你在废料堆里翻出了 ' + g + ' 金币。'; } }
    ]
  });
  def({
    id: 'spring', name: '精灵之泉', art: '⛲',
    text: '月光下的泉水泛着银辉。水面倒映出的你,看起来比实际更疲惫。',
    choices: [
      { label: '饮用泉水', hint: '回复 30% 生命',
        fx(A) { A.heal(Math.floor(A.maxHp() * 0.3)); return '清冽的泉水流过全身,伤痛消退了。'; } },
      { label: '装瓶带走', hint: '获得治疗药水,最大生命 +3',
        fx(A) { A.gainPotion('healpotion'); A.addMaxHp(3); return '你把泉水小心装好,指尖残留的灵气让你更坚韧了。'; } }
    ]
  });
  def({
    id: 'mirror', name: '镜子迷宫', art: '🪞',
    text: '无数面镜子折射出无数个你。某一面镜子里,你的卡牌泛着不一样的光。',
    choices: [
      { label: '触碰镜像', hint: '将 1 张牌变为随机同职业牌',
        fx(A) { A.transform(); return '镜面泛起涟漪,你手中的一张牌改变了形态。'; } },
      { label: '复制镜像', hint: '复制 1 张牌,失去 10% 当前生命',
        fx(A) { A.loseHp(Math.max(3, Math.floor(A.hp() * 0.1))); A.duplicate(); return '镜子里的手伸出,递给你一张一模一样的牌。'; } },
      { label: '离开', fx() { return '你不敢直视那些倒影。'; } }
    ]
  });
  def({
    id: 'library', name: '废弃图书馆', art: '📚',
    text: '尖塔某层的藏书室,大部分书已化为灰烬,但无色的典籍似乎不会燃尽。',
    choices: [
      { label: '研读无色典籍', hint: '从 3 张无色牌中选择 1 张',
        fx(A) { A.chooseColorless(); return '你从书架上取下了一卷典籍。'; } },
      { label: '整理书架', hint: '获得 30 金币',
        fx(A) { A.gainGold(30); return '书页间夹着别人遗忘的 30 金币。'; } }
    ]
  });
  def({
    id: 'webchest', name: '蛛网宝箱', art: '🕸️',
    text: '厚重的蛛网后隐约可见宝箱的轮廓。有什么东西在网中缓缓移动。',
    choices: [
      { label: '伸手去拿', hint: '获得遗物,但得到 1 张诅咒',
        fx(A) { const pre = relicGain(A, '', ''); A.curse('wound'); return '你拿到了战利品,伤口也一同留下。' + (pre.includes('金币') ? '(' + pre + ')' : ''); } },
      { label: '谨慎地割开蛛网', hint: '60%:干净地获得遗物 / 40%:空手而归',
        fx(A) {
          if (A.chance(0.6)) { return relicGain(A, '蛛网无声裂开,'); }
          return '蛛网突然坍缩,宝箱坠入深渊。'; } },
      { label: '离开', fx() { return '不值得冒险。'; } }
    ]
  });
  def({
    id: 'bones', name: '骸骨堆', art: '🦴',
    text: '许多攀登者的遗骸堆叠在一起。他们的装备还挂在骨头上。',
    choices: [
      { label: '搜刮', hint: '获得 35~65 金币',
        fx(A) { const g = A.randInt(35, 65); A.gainGold(g); return '逝者已矣。你收获了 ' + g + ' 金币。'; } },
      { label: '妥善安葬', hint: '最大生命 +6',
        fx(A) { A.addMaxHp(6); return '你安葬了遗骸。一股暖流涌入胸口。'; } },
      { label: '离开', fx() { return '让他们安息吧。'; } }
    ]
  });
  def({
    id: 'creature', name: '神秘生物', art: '🧚',
    text: '一只发光的小生物停在你面前,身后的摊子上摆着三瓶药水。',
    choices: [
      { label: '用 5% 最大生命换 3 瓶药水', hint: '失去 5% 最大生命,获得 3 瓶随机药水',
        fx(A) { const n = Math.max(2, Math.floor(A.maxHp() * 0.05)); A.loseHp(n); A.gainPotion(); A.gainPotion(); A.gainPotion(); return '小生物咯咯笑着收下了报酬。'; } },
      { label: '摇摇头走开', fx() { return '小生物失望地飞走了。'; } }
    ]
  });
  def({
    id: 'rift', name: '时空裂隙', art: '🌀',
    text: '空气撕开一道裂口,里面流出的不是黑暗,而是无数闪烁的卡牌。',
    choices: [
      { label: '伸入裂隙', hint: '随机升级 3 张牌,最大生命 -4',
        fx(A) { A.addMaxHp(-4); const n = A.upgradeRandom(3); return n + ' 张牌在时空乱流中得到了强化。'; } },
      { label: '透过裂隙观察', hint: '获得 25 金币(裂隙中掉落)',
        fx(A) { A.gainGold(25); return '几个硬币从裂隙中掉了出来。'; } }
    ]
  });
  def({
    id: 'shrine', name: '贪金神龛', art: '🪙',
    text: '神龛的雕像张着嘴,牙齿是纯金的。底座刻着:"喂养我,或者成为我。"',
    choices: [
      { label: '投入 30 金币', hint: '75%:获得随机遗物 / 25%:打水漂',
        can(g) { return g.gold() >= 30; },
        fx(A) {
          A.loseGold(30);
          if (A.chance(0.75)) { return relicGain(A, '神龛吞下金币,'); }
          return '金币消失了,什么也没有发生。'; } },
      { label: '离开', fx() { return '你不想喂养任何东西。'; } }
    ]
  });
  def({
    id: 'ghostmerchant', name: '幽灵商人', art: '👻',
    text: '一位半透明的商人拦住你:"实物?不,我只交易……记忆。"',
    choices: [
      { label: '卖掉一段记忆', hint: '移除 1 张牌,获得 60 金币',
        fx(A) { A.removeCard(); A.gainGold(60); return '你忘记了什么,口袋却沉了起来。'; } },
      { label: '购买记忆', hint: '花费 55 金币,获得 1 张稀有牌',
        can(g) { return g.gold() >= 55; },
        fx(A) { A.loseGold(55); A.gainRareCard(); return '不属于你的记忆,成了你手中的力量。'; } },
      { label: '离开', fx() { return '和幽灵讨价还价?还是算了。'; } }
    ]
  });

  def({
    id: 'purifyspring', name: '净化之泉', art: '🌊',
    text: '泛着幽蓝微光的泉水从石缝中涌出。水底沉着许多褪色的卡牌——那是前人洗去的东西。',
    choices: [
      { label: '以血净身', hint: '失去 8% 最大生命,移除卡组中所有诅咒牌和状态牌',
        fx(A) {
          const bad = A.countCards(v => v.cls === 'curse' || v.cls === 'status');
          const n = Math.max(3, Math.floor(A.maxHp() * 0.08));
          A.loseHp(n);
          if (bad > 0) { A.removeWhere(v => v.cls === 'curse' || v.cls === 'status'); return `泉水带走血与杂质——洗去了 ${bad} 张污秽之牌。`; }
          return '泉水带走了疲惫,但你的卡组本就纯净。';
        } },
      { label: '离开', fx() { return '你不想惊扰这汪静水。'; } }
    ]
  });
  def({
    id: 'armory', name: '地下军械库', art: '🗡️',
    text: '错层的地窖里挂满了前人留下的兵刃。有些仍在锋利地反光,有些已经认不出原本的模样。',
    choices: [
      { label: '磨砺你的兵刃', hint: '随机升级 2 张攻击牌',
        fx(A) { const n = A.upgradeRandomWhere(v => v.type === 'attack', 2); return n > 0 ? `炉火重燃,${n} 张攻击牌锋芒再现。` : '你翻遍兵刃,却没找到适合卡组的武器。'; } },
      { label: '搜刮武器换钱', hint: '获得 55~85 金币',
        fx(A) { const g = A.randInt(55, 85); A.gainGold(g); return '你搬走了一批闲置兵刃,换了 ' + g + ' 金币。'; } },
      { label: '离开', fx() { return '这些兵刃属于它们旧日的主人。'; } }
    ]
  });

  global.GS.EVENTS = {
    all: V,
    random(run) { return GS.RNG.pick(run, V); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
