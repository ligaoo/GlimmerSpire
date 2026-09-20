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

  /* ============ 咒术回战融合卡 ============ */
  // 咒术·苍 + 咒术·赫 → 虚式·茈(原作合体技)
  def({
    id: 'fu_hollowpurple', cls: 'jjk', type: 'attack', rarity: 'special', cost: 2, dmg: 8, target: 'all', tech: true,
    name: '虚式·茈', desc: '对所有敌人造成 {D} 点伤害;消耗所有咒力,每点使伤害 +2。',
    up: { dmg: 10, desc: '对所有敌人造成 {D} 点伤害;消耗所有咒力,每点使伤害 +3。' },
    play(A, inst) { A.attackBonus(A.spendCeAll() * (inst.up ? 3 : 2)); A.attackAll(); }
  });
  // 咒拳·冲 + 疾走咒拳 → 咒拳·连闪
  def({
    id: 'fu_flurryfist', cls: 'jjk', type: 'attack', rarity: 'special', cost: 1, dmg: 7, hits: 2, target: 'enemy', tech: true,
    name: '咒拳·连闪', desc: '造成 2 次 {D} 点伤害,咒力 +2(咒术,可触发黑闪)。',
    up: { dmg: 9, desc: '造成 2 次 {D} 点伤害,咒力 +2(咒术,可触发黑闪)。' },
    play(A) { A.attack(null, { times: 2 }); A.gainCe(2); }
  });
  // 六眼 + 领域展开 → 无量空处(终局配方,材料含稀有卡)
  def({
    id: 'fu_unlimitedvoid', cls: 'jjk', type: 'power', rarity: 'special', cost: 3, target: 'none',
    name: '无量空处', desc: '每回合开始时咒力 +2、领域 +1;你的黑闪几率 +20%。',
    up: { cost: 2, desc: '每回合开始时咒力 +2、领域 +1;你的黑闪几率 +20%。' },
    play(A) { A.applySelf('sixEyes', 20); A.applySelf('fieldBoost', 1); }
  });

  /* ============ 从零开始的异世界融合卡 ============ */
  // 冰枪术 + 精灵·帕克 → 冰枪·极光乱舞
  def({
    id: 'fu_icebarrage', cls: 'rezero', type: 'attack', rarity: 'special', cost: 1, dmg: 4, hits: 3, target: 'enemy',
    name: '冰枪·极光乱舞', desc: '造成 3 次 {D} 点伤害;若已缔结精灵,每次伤害 +2。',
    up: { dmg: 5, desc: '造成 3 次 {D} 点伤害;若已缔结精灵,每次伤害 +2。' },
    play(A) { if (A.ghostName()) A.attackBonus(2); A.attack(null, { times: 3 }); }
  });
  // 魔女之香 + 约定的戒指 → 魔女的秘仪
  def({
    id: 'fu_witchrite', cls: 'rezero', type: 'skill', rarity: 'special', cost: 1, exhaust: true, target: 'none',
    name: '魔女的秘仪', desc: '获得 2 层魔女之香并立即引爆:每层造成 7 点魔法伤害、获得 5 点格挡并回复 3 点生命。',
    up: { desc: '获得 2 层魔女之香并立即引爆:每层造成 9 点魔法伤害、获得 7 点格挡并回复 4 点生命。' },
    play(A, inst) {
      A.applySelf('witchscent', 2);
      const n = A.selfStatus('witchscent');
      if (n > 0) A.applySelf('witchscent', -n);
      const d = inst.up ? 9 : 7, b = inst.up ? 7 : 5, h = inst.up ? 4 : 3;
      if (n > 0) { A.dealMagicAll(d * n); A.gainBlock(b * n); A.heal(h * n); }
    }
  });
  // 避矢的加护 + 精灵护盾 → 精灵的绝对加护
  def({
    id: 'fu_spiritward', cls: 'rezero', type: 'skill', rarity: 'special', cost: 1, block: 11, target: 'none',
    name: '精灵的绝对加护', desc: '获得 {B} 点格挡;若已缔结精灵,额外获得 6 点格挡并抽 1 张牌。',
    up: { block: 14, desc: '获得 {B} 点格挡;若已缔结精灵,额外获得 8 点格挡并抽 1 张牌。' },
    play(A, inst) { A.gainBlock(); if (A.ghostName()) { A.gainBlock(inst.up ? 8 : 6); A.draw(1); } }
  });

  /* ============ 奥特曼融合卡 ============ */
  // 八分光轮 + 斯派修姆光线 → 新斯派修姆光线
  def({
    id: 'fu_neospecium', cls: 'ultraman', type: 'attack', rarity: 'special', cost: 1, dmg: 10, target: 'enemy',
    name: '新斯派修姆光线', desc: '造成 {D} 点伤害,消耗至多 5 点光能,每点 +4;红色警戒时每点 +6。',
    up: { dmg: 13, desc: '造成 {D} 点伤害,消耗至多 5 点光能,每点 +5;红色警戒时每点 +7。' },
    play(A, inst) {
      const n = A.spendLight(5);
      const per = A.light() <= A.redline() ? (inst.up ? 7 : 6) : (inst.up ? 5 : 4);
      if (n > 0) A.attackBonus(n * per);
      A.attack();
    }
  });
  // 奥特飞踢 + 奥特手刀 → 流星连打
  def({
    id: 'fu_meteorcombo', cls: 'ultraman', type: 'attack', rarity: 'special', cost: 1, dmg: 5, hits: 3, target: 'enemy',
    name: '流星连打', desc: '造成 3 次 {D} 点伤害;红色警戒时,每次伤害 +4。',
    up: { dmg: 6, desc: '造成 3 次 {D} 点伤害;红色警戒时,每次伤害 +5。' },
    play(A, inst) { if (A.light() <= A.redline()) A.attackBonus(inst.up ? 5 : 4); A.attack(null, { times: 3 }); }
  });
  // 光之壁 + 奥特护罩 → 光之国壁垒
  def({
    id: 'fu_landoflight', cls: 'ultraman', type: 'skill', rarity: 'special', cost: 1, block: 12, target: 'none',
    name: '光之国壁垒', desc: '获得 {B} 点格挡和 4 点荆棘,回复 2 点光能。',
    up: { block: 15, desc: '获得 {B} 点格挡和 6 点荆棘,回复 3 点光能。' },
    play(A, inst) { A.gainBlock(); A.applySelf('thorns', inst.up ? 6 : 4); A.gainLight(inst.up ? 3 : 2); }
  });

  /* ============ 西游记融合卡 ============ */
  // 火眼金睛 + 当头一棒 → 当头棒喝
  def({
    id: 'fu_headbonk', cls: 'wukong', type: 'attack', rarity: 'special', cost: 1, dmg: 8, target: 'enemy',
    name: '当头棒喝', desc: '施加 2 层易伤,造成 {D} 点伤害;消耗所有棍势,每层 +4;若击杀敌人,获得 2 层棍势。',
    up: { dmg: 10, desc: '施加 3 层易伤,造成 {D} 点伤害;消耗所有棍势,每层 +5;若击杀敌人,获得 2 层棍势。' },
    play(A, inst, t) {
      A.applyTo(t, 'vuln', inst.up ? 3 : 2);
      const n = A.spendCudgel(A.selfStatus('cudgel'));
      if (n > 0) A.attackBonus(n * (inst.up ? 5 : 4));
      if (A.attack(t)) A.cudgel(2);
    }
  });
  // 重劈 + 千钧重棍 → 千钧·崩岳
  def({
    id: 'fu_smashmountain', cls: 'wukong', type: 'attack', rarity: 'special', cost: 2, dmg: 8, target: 'enemy',
    name: '千钧·崩岳', desc: '造成 {D} 点伤害;消耗全部棍势,每层 +8,且每层对随机敌人追加 3 点伤害。',
    up: { dmg: 10, desc: '造成 {D} 点伤害;消耗全部棍势,每层 +10,且每层对随机敌人追加 4 点伤害。' },
    play(A, inst) {
      const n = A.spendCudgel(A.selfStatus('cudgel'));
      if (n > 0) {
        A.attackBonus(n * (inst.up ? 10 : 8));
        A.attack();
        for (let i = 0; i < n; i++) A.attackRandom({ dmg: inst.up ? 4 : 3, times: 1 });
      } else A.attack();
    }
  });
  // 拔毛·分身 + 身外身法 → 十万猴军
  def({
    id: 'fu_myriadmonkeys', cls: 'wukong', type: 'power', rarity: 'special', cost: 2, target: 'none',
    name: '十万猴军', desc: '每回合开始时,将 1 张「猴子猴孙」加入手牌,并获得 2 层棍势。',
    up: { desc: '每回合开始时,将 1 张「猴子猴孙」加入手牌,并获得 4 层棍势。' },
    play(A, inst) { A.applySelf('monkeys', 1); A.applySelf('majesty', inst.up ? 2 : 1); }
  });

  /* ============ 妖精的尾巴融合卡 ============ */
  // 火龙的咆哮 + 天龙·咆哮 → 灭龙咆哮·连奏
  def({
    id: 'fu_tripleroar', cls: 'fairytail', type: 'attack', rarity: 'special', cost: 2, dmg: 8, target: 'all',
    name: '灭龙咆哮·连奏', desc: '对所有敌人造成 {D} 点伤害;每名伙伴使伤害 +3,并回复 3 点生命。',
    up: { dmg: 10, desc: '对所有敌人造成 {D} 点伤害;每名伙伴使伤害 +4,并回复 4 点生命。' },
    play(A, inst) {
      const n = A.allies();
      if (n > 0) { A.attackBonus(n * (inst.up ? 4 : 3)); A.heal((inst.up ? 4 : 3) * n); }
      A.attackAll();
    }
  });
  // 灭龙爪 + 火龙之翼 → 灭龙奥义·龙爪炎翼
  def({
    id: 'fu_dragonclawflare', cls: 'fairytail', type: 'attack', rarity: 'special', cost: 1, dmg: 6, hits: 2, target: 'enemy',
    name: '灭龙奥义·龙爪炎翼', desc: '造成 2 次 {D} 点伤害;本场每打出过 3 张牌,追加 1 段伤害(至多 4 段)。',
    up: { dmg: 8, desc: '造成 2 次 {D} 点伤害;本场每打出过 3 张牌,追加 1 段伤害(至多 4 段)。' },
    play(A, inst) {
      const extra = Math.min(4, Math.floor(A.cardsPlayed() / 3));
      A.attack(null, { times: 2 + extra });
    }
  });
  // 公会之盾 + 天龙的抚慰 → 妖精的庇护
  def({
    id: 'fu_fairyshelter', cls: 'fairytail', type: 'skill', rarity: 'special', cost: 1, block: 10, target: 'none',
    name: '妖精的庇护', desc: '获得 {B} 点格挡并回复 5 点生命;每名伙伴额外 +3 格挡。',
    up: { block: 13, desc: '获得 {B} 点格挡并回复 7 点生命;每名伙伴额外 +4 格挡。' },
    play(A, inst) { A.gainBlock(); A.heal(inst.up ? 7 : 5); const n = A.allies(); if (n > 0) A.gainBlock((inst.up ? 4 : 3) * n); }
  });

  /* ============ 配方表 ============ */
  // theme:配方所属的运行职业/主题 id(供 UI 分组排序与测试构造对局)
  const FUSIONS = [
    { id: 'f_eeriespear', name: '诡异长枪', tag: '神秘复苏', theme: 'mystery', note: '柴刃饮魂,钉封棺椁。',
      materials: ['mn_chaiknife', 'mn_coffinnail'], result: 'fu_eeriespear' },
    { id: 'f_ghostblaze', name: '鬼焰狂澜', tag: '神秘复苏', theme: 'mystery', note: '爪携鬼火,焚尽生魂。',
      materials: ['mn_ghostclaw', 'mn_ghostfire'], result: 'fu_ghostblaze' },
    { id: 'f_truepupil', name: '洞玄真瞳', tag: '神秘复苏', theme: 'mystery', note: '燃目窥镜,天眼始成。',
      materials: ['mn_fireeye', 'mn_seethrough'], result: 'fu_truepupil' },
    { id: 'f_warhammer', name: '崩山巨锤', tag: '战士', theme: 'warrior', note: '重刃顺势,一锤崩山。',
      materials: ['heavy', 'clothesline'], result: 'fu_warhammer' },
    { id: 'f_venomfang', name: '蚀骨毒牙', tag: '游侠', theme: 'ranger', note: '蛇吻喂毒,蚀骨销魂。',
      materials: ['venomstrike', 'deadlypoison'], result: 'fu_venomfang' },
    { id: 'f_soulleech', name: '噬魂魔焰', tag: '术士', theme: 'warlock', note: '灵火噬命,虹吸成魔。',
      materials: ['soulfire', 'drain'], result: 'fu_soulleech' },
    { id: 'f_hollowpurple', name: '虚式·茈', tag: '咒术回战', theme: 'jjk', note: '苍赫相冲,假想成茈。',
      materials: ['jj_blue', 'jj_red'], result: 'fu_hollowpurple' },
    { id: 'f_flurryfist', name: '咒拳·连闪', tag: '咒术回战', theme: 'jjk', note: '双拳连段,黑闪可期。',
      materials: ['jj_palm', 'jj_blitz'], result: 'fu_flurryfist' },
    { id: 'f_unlimitedvoid', name: '无量空处', tag: '咒术回战', theme: 'jjk', note: '六眼窥域,信息永劫。',
      materials: ['jj_sixeyes', 'jj_domain'], result: 'fu_unlimitedvoid' },
    { id: 'f_icebarrage', name: '冰枪·极光乱舞', tag: '从零开始的异世界', theme: 'rezero', note: '冰精同调,漫天极光。',
      materials: ['rz_icelance', 'rz_sp_ice'], result: 'fu_icebarrage' },
    { id: 'f_witchrite', name: '魔女的秘仪', tag: '从零开始的异世界', theme: 'rezero', note: '以香为契,愿赌服输。',
      materials: ['rz_aroma', 'rz_ring'], result: 'fu_witchrite' },
    { id: 'f_spiritward', name: '精灵的绝对加护', tag: '从零开始的异世界', theme: 'rezero', note: '双盾合一,加护至极。',
      materials: ['rz_aid', 'rz_elishield'], result: 'fu_spiritward' },
    { id: 'f_neospecium', name: '新斯派修姆光线', tag: '奥特曼', theme: 'ultraman', note: '双技同调,光线增幅。',
      materials: ['ul_slash', 'ul_specium'], result: 'fu_neospecium' },
    { id: 'f_meteorcombo', name: '流星连打', tag: '奥特曼', theme: 'ultraman', note: '三分钟内,分秒必争。',
      materials: ['ul_kick', 'ul_chop'], result: 'fu_meteorcombo' },
    { id: 'f_landoflight', name: '光之国壁垒', tag: '奥特曼', theme: 'ultraman', note: '双壁合围,光能不灭。',
      materials: ['ul_wall', 'ul_dome'], result: 'fu_landoflight' },
    { id: 'f_headbonk', name: '当头棒喝', tag: '西游记', theme: 'journey', note: '眼明手快,一棒顿悟。',
      materials: ['xy_eyes', 'xy_bonk'], result: 'fu_headbonk' },
    { id: 'f_smashmountain', name: '千钧·崩岳', tag: '西游记', theme: 'journey', note: '势大力沉,一棍崩山。',
      materials: ['xy_heavy', 'xy_smash'], result: 'fu_smashmountain' },
    { id: 'f_myriadmonkeys', name: '十万猴军', tag: '西游记', theme: 'journey', note: '毫毛化军,棍势不休。',
      materials: ['xy_hair', 'xy_monkeys'], result: 'fu_myriadmonkeys' },
    { id: 'f_tripleroar', name: '灭龙咆哮·连奏', tag: '妖精的尾巴', theme: 'fairytail', note: '双龙齐吼,羁绊共燃。',
      materials: ['ft_roar', 'ft_skyroar'], result: 'fu_tripleroar' },
    { id: 'f_dragonclawflare', name: '灭龙奥义·龙爪炎翼', tag: '妖精的尾巴', theme: 'fairytail', note: '爪翼连击,愈战愈勇。',
      materials: ['ft_claw', 'ft_wing'], result: 'fu_dragonclawflare' },
    { id: 'f_fairyshelter', name: '妖精的庇护', tag: '妖精的尾巴', theme: 'fairytail', note: '公会在后,妖精不倒。',
      materials: ['ft_guard', 'ft_wendy'], result: 'fu_fairyshelter' }
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
