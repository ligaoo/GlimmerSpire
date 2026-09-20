/* 微光尖塔 - 敌人数据库
   move: {name, intent, dmg?, hits?, exec(A, self)}
   intent: attack|attackDebuff|attackDefend|defend|buff|debuff|strong|sleep|unknown
   ai(self, ctx) 返回要执行的 move key;ctx.turn 为战斗回合数 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};

  const E = {};

  function def(d) { E[d.id] = d; }

  /* ================= 第一幕:普通 ================= */
  def({
    id: 'jawworm', name: '颚虫', art: '🪱', maxHp: [40, 44],
    moves: {
      chomp: { name: '啃咬', intent: 'attack', dmg: 11, exec(A) { A.attack(); } },
      thrash: { name: '挥击', intent: 'attackDefend', dmg: 7, exec(A) { A.attack(); A.gainSelfBlock(6); } },
      bellow: { name: '咆哮', intent: 'buff', exec(A) { A.gainSelfBlock(6); A.buffSelf('str', 3); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'chomp';
      const pick = GS.RNG.weighted(ctx.run, ['chomp', 'thrash', 'bellow'], [3, 4, 3]);
      if (pick === self._last && pick === 'bellow') return 'thrash';
      return pick;
    }
  });
  def({
    id: 'cultist', name: '邪教徒', art: '🧙', maxHp: [46, 50],
    moves: {
      ritual: { name: '黑暗仪式', intent: 'buff', exec(A) { A.buffSelf('ritual', 3); } },
      attack: { name: '暗击', intent: 'attack', dmg: 6, exec(A) { A.attack(); } }
    },
    ai(self, ctx) { return ctx.turn === 1 ? 'ritual' : 'attack'; }
  });
  def({
    id: 'acidslimeM', name: '酸液史莱姆', art: '🟢', maxHp: [30, 34],
    moves: {
      tackle: { name: '撞击', intent: 'attack', dmg: 10, exec(A) { A.attack(); } },
      corrode: { name: '腐蚀', intent: 'debuff', exec(A) { A.debuffPlayer('frail', 2); A.debuffPlayer('weak', 1); } },
      lick: { name: '舔舐', intent: 'debuff', exec(A) { A.debuffPlayer('weak', 2); } }
    },
    ai(self, ctx) {
      const pick = GS.RNG.pick(ctx.run, ['tackle', 'corrode', 'lick']);
      if (pick === self._last) return pick === 'tackle' ? 'lick' : 'tackle';
      return pick;
    }
  });
  def({
    id: 'spikyslime', name: '尖刺史莱姆', art: '🟩', maxHp: [26, 30],
    moves: {
      tackle: { name: '撞击', intent: 'attack', dmg: 7, exec(A) { A.attack(); } },
      spikes: { name: '竖刺', intent: 'buff', exec(A) { A.buffSelf('thorns', 3); } }
    },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'tackle';
      return GS.RNG.pick(ctx.run, ['tackle', 'tackle', 'spikes']);
    }
  });
  def({
    id: 'acidslimeS', name: '小酸液史莱姆', art: '🟢', maxHp: [12, 15],
    moves: {
      tackle: { name: '撞击', intent: 'attack', dmg: 6, exec(A) { A.attack(); } },
      corrode: { name: '腐蚀', intent: 'debuff', exec(A) { A.debuffPlayer('frail', 1); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.6) ? 'tackle' : 'corrode'; }
  });
  def({
    id: 'fungibeast', name: '蘑菇兽', art: '🍄', maxHp: [22, 26],
    moves: {
      bite: { name: '啃咬', intent: 'attack', dmg: 6, exec(A) { A.attack(); } },
      grow: { name: '生长', intent: 'buff', exec(A) { A.buffSelf('str', 3); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.7) ? 'bite' : 'grow'; },
    onDeath(A) { A.debuffPlayer('weak', 1); }
  });
  def({
    id: 'louse', name: '掠夺者', art: '🐞', maxHp: [10, 14],
    moves: {
      bite: { name: '啃咬', intent: 'attack', dmg: 4, exec(A) { A.attack(); } },
      curl: { name: '蜷缩', intent: 'defend', exec(A) { A.gainSelfBlock(5); } }
    },
    init(self, run) { self.statuses.str = GS.RNG.int(run, 0, 2); },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.75) ? 'bite' : 'curl'; }
  });

  /* ================= 第一幕:精英 ================= */
  def({
    id: 'lagavulin', name: '沉睡魔虫', art: '🐛', maxHp: [86, 90], elite: true,
    moves: {
      sleep: { name: '沉睡', intent: 'sleep', exec(A) { A.gainSelfBlock(8); } },
      sapped: { name: '精力衰竭', intent: 'debuff', exec(A) { A.debuffPlayer('str', -1); A.debuffPlayer('dex', -1); } },
      attack: { name: '重击', intent: 'strong', dmg: 18, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      if (ctx.turn <= 2) return 'sleep';
      const c = (ctx.turn - 2) % 3;
      if (c === 0) return 'sapped';
      return 'attack';
    }
  });
  def({
    id: 'sentry', name: '石像守卫', art: '🗿', maxHp: [38, 42], elite: true,
    moves: {
      beam: { name: '光束', intent: 'attack', dmg: 9, exec(A) { A.attack(); } },
      charge: { name: '注能', intent: 'debuff', exec(A) { A.addStatusToDiscard('dazed', 2); } }
    },
    ai(self, ctx) { return ctx.turn % 2 === 1 ? 'beam' : 'charge'; }
  });
  def({
    id: 'beastking', name: '血斧兽王', art: '🐗', maxHp: [84, 88], elite: true,
    moves: {
      bash: { name: '颅骨粉碎', intent: 'attackDebuff', dmg: 8, exec(A) { A.attack(); A.debuffPlayer('vuln', 1); } },
      rush: { name: '蛮冲', intent: 'attack', dmg: 11, exec(A) { A.attack(); } }
    },
    // 每当玩家打出技能牌获得力量。总量封顶 +10:第一幕玩家的唯一防御手段就是技能牌(防御),
    // 无限叠会让"越防御它越强"滚成无解死局(实测曾占第一幕全部死亡的 42%)
    onPlayerSkill(A, self) { const s = self.statuses.str || 0; if (s < 10) A.buffSelf('str', Math.min(2, 10 - s)); },
    ai(self, ctx) {
      if (ctx.turn === 1) return 'bash';
      return GS.RNG.pick(ctx.run, ['rush', 'rush', 'bash']);
    }
  });

  /* ================= 第一幕:BOSS ================= */
  def({
    id: 'stonegolem', name: '石魔像', art: '⛰️', maxHp: [118, 118], boss: true,
    moves: {
      fists: { name: '双拳连击', intent: 'attack', dmg: 8, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      charge: { name: '蓄力', intent: 'buff', exec(A) { A.gainSelfBlock(6); A.buffSelf('str', 2); } },
      quake: { name: '大地震颤', intent: 'strong', dmg: 18, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const m = (ctx.turn - 1) % 3;
      return ['fists', 'charge', 'quake'][m];
    }
  });

  /* ================= 第二幕:普通 ================= */
  def({
    id: 'bat', name: '穴居蝠', art: '🦇', maxHp: [22, 26],
    moves: {
      bite: { name: '撕咬', intent: 'attack', dmg: 7, exec(A) { A.attack(); } },
      screech: { name: '尖啸', intent: 'debuff', exec(A) { A.debuffPlayer('weak', 1); A.debuffPlayer('frail', 1); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.7) ? 'bite' : 'screech'; }
  });
  def({
    id: 'snakevine', name: '石化藤', art: '🌿', maxHp: [48, 54],
    moves: {
      lash: { name: '鞭打', intent: 'attack', dmg: 12, exec(A) { A.attack(); } },
      harden: { name: '硬化藤蔓', intent: 'attackDefend', dmg: 7, exec(A) { A.attack(); A.gainSelfBlock(9); } }
    },
    ai(self, ctx) { return GS.RNG.chance(ctx.run, 0.65) ? 'lash' : 'harden'; }
  });
  def({
    id: 'madman', name: '狂徒', art: '🤪', maxHp: [56, 62],
    moves: {
      slash: { name: '乱斩', intent: 'attack', dmg: 15, exec(A) { A.attack(); } },
      rave: { name: '狂舞', intent: 'buff', exec(A) { A.buffSelf('str', 3); A.gainSelfBlock(5); } }
    },
    ai(self, ctx) { return ctx.turn === 1 ? 'rave' : 'slash'; }
  });
  def({
    id: 'puppeteer', name: '傀儡师', art: '🎭', maxHp: [40, 44],
    moves: {
      pull: { name: '提线', intent: 'buff', exec(A) { A.buffAllies('str', 2); } },
      stab: { name: '暗刺', intent: 'attack', dmg: 9, exec(A) { A.attack(); } },
      shield: { name: '傀儡护壁', intent: 'defend', exec(A) { A.gainSelfBlock(10); A.gainAlliesBlock(6); } }
    },
    ai(self, ctx) {
      const m = (ctx.turn - 1) % 3;
      return ['pull', 'stab', 'shield'][m];
    }
  });
  def({
    id: 'puppet', name: '木偶', art: '🪆', maxHp: [10, 13],
    moves: {
      pierce: { name: '穿刺', intent: 'attack', dmg: 8, exec(A) { A.attack(); } }
    },
    ai() { return 'pierce'; }
  });
  def({
    id: 'shieldbearer', name: '重盾兵', art: '🛡️', maxHp: [38, 44],
    moves: {
      shieldwall: { name: '盾墙', intent: 'defend', exec(A) { A.gainSelfBlock(12); } },
      bash: { name: '盾击', intent: 'attackDefend', dmg: 8, exec(A) { A.attack(); A.gainSelfBlock(6); } }
    },
    ai(self, ctx) { return ctx.turn % 2 === 1 ? 'bash' : 'shieldwall'; }
  });

  /* ================= 第二幕:精英 ================= */
  def({
    id: 'stabbook', name: '刺客之书', art: '📕', maxHp: [96, 100], elite: true,
    moves: {
      stab: { name: '连刺', intent: 'attack', dmg: 8, hits: 3, exec(A) { A.attack({ times: 3 }); } }
    },
    ai() { return 'stab'; }
  });
  def({
    id: 'lizardking', name: '铜鳞蜥王', art: '🦎', maxHp: [108, 112], elite: true,
    moves: {
      bite: { name: '撕咬', intent: 'attack', dmg: 9, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      molt: { name: '蜕鳞', intent: 'attackDefend', dmg: 6, exec(A) { A.attack(); A.gainSelfBlock(9); A.buffSelf('str', 2); } }
    },
    ai(self, ctx) { return ctx.turn % 3 === 0 ? 'molt' : 'bite'; }
  });
  def({
    id: 'soulcaller', name: '唤魂师', art: '👁️', maxHp: [76, 80], elite: true,
    moves: {
      summon: { name: '亡者归来', intent: 'buff', exec(A) { A.summon('ghost'); A.buffAllies('str', 1); } },
      drain: { name: '灵魂汲取', intent: 'attack', dmg: 12, exec(A) { A.attack(); A.healSelf(6); } }
    },
    ai(self, ctx) { return ctx.turn % 3 === 1 ? 'drain' : 'summon'; }
  });
  def({
    id: 'ghost', name: '幽魂', art: '👻', maxHp: [12, 15],
    moves: {
      chill: { name: '寒袭', intent: 'attack', dmg: 6, exec(A) { A.attack(); } }
    },
    ai() { return 'chill'; }
  });

  /* ================= 第二幕:BOSS ================= */
  def({
    id: 'reaper', name: '收割者', art: '💀', maxHp: [170, 170], boss: true,
    moves: {
      scythe: { name: '横扫镰刀', intent: 'attack', dmg: 8, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      cursewave: { name: '诅咒挥洒', intent: 'debuff', exec(A) { A.addStatusToDiscard('wound', 2); A.debuffPlayer('weak', 2); } },
      harvest: { name: '大收割', intent: 'strong', dmg: 26, exec(A) { A.attack(); } },
      feast: { name: '血宴', intent: 'buff', exec(A) { A.healSelf(30); A.buffSelf('str', 3); } }
    },
    ai(self, ctx) {
      if (!self._feasted && self.hp < self.maxHp * 0.35) { self._feasted = true; return 'feast'; }
      const m = (ctx.turn - 1) % 3;
      return ['scythe', 'cursewave', 'harvest'][m];
    }
  });

  /* ================= 第三幕:普通 ================= */
  def({
    id: 'weaver', name: '灵魂编织者', art: '🕷️', maxHp: [60, 66],
    moves: {
      bite: { name: '蚀骨之咬', intent: 'attack', dmg: 12, exec(A) { A.attack(); } },
      weave: { name: '编织', intent: 'defend', exec(A) { A.gainSelfBlock(12); A.buffSelf('thorns', 3); } }
    },
    ai(self, ctx) { return ctx.turn % 2 === 1 ? 'bite' : 'weave'; }
  });
  def({
    id: 'gargoyle', name: '石像鬼', art: '👹', maxHp: [68, 74],
    moves: {
      pounce: { name: '猛扑', intent: 'attack', dmg: 16, exec(A) { A.attack(); } },
      stoneskin: { name: '石肤', intent: 'defend', exec(A) { A.gainSelfBlock(16); } }
    },
    ai(self, ctx) { return ctx.turn % 3 === 0 ? 'stoneskin' : 'pounce'; }
  });
  def({
    id: 'shade', name: '暗影', art: '🌫️', maxHp: [20, 24],
    moves: {
      erode: { name: '侵蚀', intent: 'attackDebuff', dmg: 5, exec(A) { A.attack(); A.debuffPlayer('weak', 1); } }
    },
    ai() { return 'erode'; }
  });
  def({
    id: 'skullreaper', name: '头骨收割者', art: '☠️', maxHp: [84, 90],
    moves: {
      cleave: { name: '劈砍', intent: 'attack', dmg: 20, exec(A) { A.attack(); } },
      brace: { name: '蓄势', intent: 'defend', exec(A) { A.gainSelfBlock(8); A.buffSelf('str', 2); } }
    },
    ai(self, ctx) { return ctx.turn % 3 === 0 ? 'brace' : 'cleave'; }
  });
  def({
    id: 'eyetyrant', name: '巨眼暴君', art: '🧿', maxHp: [54, 58],
    moves: {
      psychic: { name: '精神冲击', intent: 'attackDebuff', dmg: 13, exec(A) { A.attack(); A.debuffPlayer('frail', 2); } },
      glare: { name: '威压凝视', intent: 'debuff', exec(A) { A.debuffPlayer('weak', 2); A.debuffPlayer('vuln', 2); } }
    },
    ai(self, ctx) { return ctx.turn % 2 === 1 ? 'psychic' : 'glare'; }
  });

  /* ================= 第三幕:精英 ================= */
  def({
    id: 'gianthead', name: '巨型头颅', art: '🗿', maxHp: [120, 120], elite: true,
    moves: {
      count: { name: '凝视计数', intent: 'defend', exec(A) { A.gainSelfBlock(10); A.buffSelf('str', 2); } },
      glare: { name: '毁灭凝视', intent: 'strong', dmg: 28, exec(A) { A.attack(); } }
    },
    ai(self, ctx) { return ctx.turn % 2 === 1 ? 'count' : 'glare'; }
  });
  def({
    id: 'twinguard', name: '双子守卫', art: '⚔️', maxHp: [95, 95], elite: true,
    moves: {
      strike: { name: '合击', intent: 'attack', dmg: 13, exec(A) { A.attack(); } },
      protect: { name: '协防', intent: 'defend', exec(A) { A.gainSelfBlock(14); A.buffSelf('str', 2); } }
    },
    ai(self, ctx) { return ctx.turn % 2 === 1 ? 'strike' : 'protect'; }
  });
  def({
    id: 'abyssshadow', name: '深渊之影', art: '🌑', maxHp: [128, 128], elite: true,
    moves: {
      rend: { name: '裂影爪', intent: 'attack', dmg: 9, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      enfeeble: { name: '衰弱之云', intent: 'debuff', exec(A) { A.debuffPlayer('weak', 2); A.debuffPlayer('frail', 2); } },
      feast: { name: '吞噬暗影', intent: 'buff', exec(A) { A.buffSelf('str', 4); A.gainSelfBlock(8); } }
    },
    ai(self, ctx) { return ['rend', 'rend', 'enfeeble', 'feast'][(ctx.turn - 1) % 4]; }
  });

  /* ================= 第三幕:BOSS ================= */
  def({
    id: 'devourer', name: '微光吞噬者', art: '🌌', maxHp: [240, 240], boss: true,
    moves: {
      swipe: { name: '挥击', intent: 'attack', dmg: 10, hits: 2, exec(A) { A.attack({ times: 2 }); } },
      aura: { name: '虚弱光环', intent: 'debuff', exec(A) { A.debuffPlayer('weak', 2); A.debuffPlayer('frail', 2); A.addStatusToDiscard('dazed', 1); } },
      devour: { name: '吞噬', intent: 'strong', dmg: 21, exec(A) { A.attack(); A.healSelf(15); } },
      annihilate: { name: '湮灭', intent: 'strong', dmg: 34, exec(A) { A.attack(); } }
    },
    ai(self, ctx) {
      const phase2 = self.hp < self.maxHp * 0.5;
      if (phase2 && !self._p2) {
        self._p2 = true;
        return 'aura';
      }
      if (!phase2) {
        return ['swipe', 'aura', 'devour'][(ctx.turn - 1) % 3];
      }
      // 二阶段:狂暴循环
      const t = ctx.turn - 1;
      const seq = ['swipe', 'devour', 'swipe', 'annihilate'];
      return seq[t % 4];
    }
  });

  /* ================= 遭遇表 ================= */
  // 编队池:每个 act 的普通遭遇至少 12 组,且尽量"混编"(1 强 + 小怪)而不是同种克隆 ——
  // 克隆包解法单一(永远集火最脆的),混编包才会逼玩家做取舍。
  const ENCOUNTERS = {
    1: {
      normal: [
        ['jawworm'],
        ['cultist'],
        ['acidslimeS', 'acidslimeS'],
        ['spikyslime', 'acidslimeS'],
        ['fungibeast', 'fungibeast'],
        ['louse', 'louse', 'louse'],
        // 以下为扩充(复用第一幕既有敌人,总血量压在既有区间 24-56 内)
        ['acidslimeM', 'louse'],
        ['spikyslime', 'fungibeast'],
        ['fungibeast', 'louse', 'louse'],
        ['acidslimeM', 'acidslimeS'],
        ['spikyslime', 'louse'],
        ['acidslimeM', 'fungibeast'],
        ['spikyslime', 'acidslimeS', 'louse'],
        ['jawworm', 'louse']
      ],
      elite: [['lagavulin'], ['sentry', 'sentry'], ['beastking'], ['sentry', 'sentry', 'acidslimeS']],
      boss: [['stonegolem']]
    },
    2: {
      normal: [
        ['bat', 'bat', 'bat'],
        ['snakevine'],
        ['madman'],
        ['puppeteer', 'puppet', 'puppet'],
        ['shieldbearer', 'shieldbearer'],
        ['snakevine', 'bat', 'bat'],
        // 以下为扩充(复用第二幕既有敌人,总血量与既有包同档 58-106)
        ['madman', 'puppet'],
        ['shieldbearer', 'puppet', 'puppet'],
        ['bat', 'bat', 'puppet'],
        ['snakevine', 'shieldbearer'],
        ['puppeteer', 'puppet'],
        ['madman', 'bat'],
        ['shieldbearer', 'bat', 'bat']
      ],
      elite: [['stabbook'], ['lizardking'], ['soulcaller'], ['soulcaller', 'puppet']],
      boss: [['reaper']]
    },
    3: {
      normal: [
        ['weaver'],
        ['gargoyle'],
        ['shade', 'shade', 'shade'],
        ['skullreaper'],
        ['eyetyrant', 'shade', 'shade'],
        ['weaver', 'shade'],
        // 以下为扩充(复用第三幕既有敌人,总血量压在既有区间 60-114 内)
        ['gargoyle', 'shade'],
        ['eyetyrant', 'shade'],
        ['skullreaper', 'ghost'],
        ['eyetyrant', 'ghost', 'ghost'],
        ['weaver', 'shade', 'shade'],
        ['gargoyle', 'ghost'],
        ['skullreaper', 'shade']
      ],
      elite: [['gianthead'], ['twinguard'], ['abyssshadow'], ['twinguard', 'shade']],
      boss: [['devourer']]
    }
  };

  global.GS.ENEMIES = {
    defs: E,
    get(id) { return E[id]; },
    encounters(act) { return ENCOUNTERS[Math.min(act, 3)] || ENCOUNTERS[3]; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
