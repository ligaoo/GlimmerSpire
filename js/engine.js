/* 微光尖塔 - 核心引擎(纯逻辑,无 DOM)
   所有状态可 JSON 序列化;UI 通过 Engine.actions 驱动 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};
  const { RNG, CARDS, ENEMIES, RELICS, POTIONS, EVENTS } = GS;
  const THEMES = GS.THEMES || { all: [], map: {}, get() { return null; }, byClass() { return null; }, enemyDefs: {}, allyMap: {} };

  let uidCounter = 1;
  function uid() { return uidCounter++; }

  /* ================= 联动主题支持 ================= */
  // 主题敌人直接注册进遗物/敌人数据库,复用既有 AI 与结算流程
  for (const id in THEMES.enemyDefs) ENEMIES.defs[id] = THEMES.enemyDefs[id];
  for (const t of THEMES.all) {
    for (const rd of (t.relicDefs || [])) if (!RELICS.defs[rd.id]) RELICS.defs[rd.id] = rd;
  }
  if (!RELICS.all.includes('mystbell')) {
    RELICS.all.push(...THEMES.all.flatMap(t => t.relics || []).filter(id => !RELICS.all.includes(id)));
  }

  function themeOf(run) { return run && run.theme ? THEMES.get(run.theme) : null; }
  // 主题局的「幕」= 镜域段;返回该段的定义
  function themeActOf(run) {
    const t = themeOf(run);
    if (!t) return null;
    return t.acts[Math.min(run.act - 1, t.acts.length - 1)] || null;
  }
  // 主题局的敌人遭遇表(超出主题幕数则沿用最后一幕,配合无尽缩放)
  function themeEncounterTable(run) {
    const t = themeOf(run);
    if (!t) return null;
    const idx = Math.min(Math.max(0, run.act - 1), t.acts.length - 1);
    return t.acts[idx];
  }
  // 遗物抽取池:主题局以主题遗物为主,少量通用遗物作为补充
  const GENERIC_RELIC_IDS = ['whetstone', 'ironwood', 'coinpurse', 'healpouch', 'potionbelt',
    'forgehammer', 'ancientcoin', 'gamblerdice', 'heartvessel', 'glassvial', 'hunterblade',
    'warhammer', 'huntbadge', 'lantern', 'hourglass', 'duelistglove'];
  function relicPoolFor(run) {
    const t = themeOf(run);
    return RELICS.all.filter(id => {
      const d = RELICS.get(id);
      if (!d || d.rarity === 'starter') return false;
      if (owned(run, id)) return false;
      if (!t) return !d.theme;
      return d.theme === t.id || GENERIC_RELIC_IDS.includes(id);
    });
  }
  // 主题卡池(rarity 为 null 时返回全部)
  function themedCardPool(run, rarity) {
    const t = themeOf(run);
    if (!t) return [];
    const ids = (rarity === 'basic' ? t.basic : t.pool) || [];
    return ids.filter(id => {
      const d = CARDS.get(id);
      if (!d) return false;
      if (rarity && rarity !== 'basic' && d.rarity !== rarity) return false;
      return true;
    });
  }

  const SAVE_KEY = 'glimmerSpireSave';
  const STATS_KEY = 'glimmerSpireStats';

  /* ================= 工具 ================= */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function owned(run, id) { return run.player.relics.includes(id); }

  // 卡牌视图(含临时升级标记)
  function cardView(run, inst) {
    if (!inst) return CARDS.get('strike');
    return CARDS.view({ id: inst.id, up: (inst.up || inst._tempUp) ? 1 : 0 });
  }
  function relicVal(run, key) {
    let v = 0;
    for (const id of run.player.relics) { const d = RELICS.get(id); if (d && d[key]) v += d[key]; }
    return v;
  }
  function relicHas(run, key) {
    for (const id of run.player.relics) { const d = RELICS.get(id); if (d && d[key]) return true; }
    return false;
  }

  /* ================= 地图生成 ================= */
  const NODE_TYPES = ['combat', 'event', 'elite', 'rest', 'shop', 'treasure', 'boss'];
  const ROWS = 15;

  // 镜域地图:结构固定(每 3 层一个「咒物/祭坛」,第 5 层结界,倒数第 2 层营地),行数随段位增长
  function genDomainMap(run) {
    const theme = themeOf(run);
    const act = themeActOf(run);
    const rows = (act && act.rows) || 12;
    const map = [];
    const rowCounts = [3];
    for (let r = 1; r < rows - 1; r++) rowCounts.push(RNG.int(run, 3, 4));
    rowCounts.push(1);
    for (let r = 0; r < rows; r++) {
      const count = rowCounts[r];
      const row = [];
      for (let i = 0; i < count; i++) {
        row.push({ x: count === 1 ? 0.5 : i / (count - 1), type: 'combat', edges: [] });
      }
      map.push(row);
    }
    const wardRow = Math.min(rows - 2, 4);
    map[rows - 1][0].type = 'boss';
    map[wardRow].forEach(n => { n.type = 'ward'; });
    map[rows - 2].forEach(n => { n.type = 'rest'; });
    for (let r = 1; r < rows - 1; r++) {
      if (r === wardRow || r === rows - 2) continue;
      for (const n of map[r]) {
        const roll = RNG.float(run);
        // 每日「精英猎人」/进阶等级会提高精英出现率
        const eliteP = 0.22 + (run.daily === 'elitehunter' ? 0.26 : 0) + 0.008 * (run.ascension || 0);
        if (r >= 3 && roll < eliteP) n.type = 'elite';
        else if (r % 3 === 2 && roll < 0.55) n.type = 'curse';
        else if (roll < 0.68) n.type = 'combat';
        else if (roll < 0.80) n.type = 'event';
        else if (roll < 0.88) n.type = 'rest';
        else if (roll < 0.95) n.type = 'shop';
        else n.type = 'treasure';
      }
    }
    linkMapRows(map, run, rows);
    return map;
  }

  // 连边:自上而下,每节点连接下一行 x 距离最近的 1-3 个节点
  function linkMapRows(map, run, rows) {
    for (let r = 0; r < rows - 1; r++) {
      const cur = map[r], nxt = map[r + 1];
      cur.forEach((n) => {
        const links = r === rows - 2 ? 1 : RNG.int(run, 1, Math.min(3, nxt.length));
        const sorted = nxt.map((m, j) => ({ j, d: Math.abs(m.x - n.x) + RNG.float(run) * 0.02 })).sort((a, b) => a.d - b.d);
        const chosen = new Set();
        for (let k = 0; k < links && k < sorted.length; k++) chosen.add(sorted[k].j);
        n.edges = [...chosen];
      });
      nxt.forEach((m, j) => {
        const hasIn = cur.some(n => n.edges.includes(j));
        if (!hasIn) {
          let best = 0, bd = 9;
          cur.forEach((n, i) => { const d = Math.abs(n.x - m.x); if (d < bd) { bd = d; best = i; } });
          cur[best].edges.push(j);
        }
      });
    }
  }

  function genMap(run) {
    if (themeOf(run)) return genDomainMap(run);
    const map = [];
    // 每行节点数
    const rowCounts = [3];
    for (let r = 1; r < ROWS - 1; r++) rowCounts.push(RNG.int(run, 2, 5));
    rowCounts.push(1);

    for (let r = 0; r < ROWS; r++) {
      const count = rowCounts[r];
      const row = [];
      for (let i = 0; i < count; i++) {
        const x = count === 1 ? 0.5 : i / (count - 1);
        row.push({ x, type: 'combat', edges: [] });
      }
      map.push(row);
    }
    // 节点类型
    map[0].forEach(n => { n.type = 'combat'; });
    map[ROWS - 1][0].type = 'boss';
    map[5].forEach(n => { n.type = 'treasure'; });
    map[ROWS - 2].forEach(n => { n.type = 'rest'; });
    for (let r = 1; r < ROWS - 1; r++) {
      if (r === 5 || r === ROWS - 2) continue;
      for (const n of map[r]) {
        let t;
        const roll = RNG.float(run);
        if (r >= 4 && roll < 0.18) t = 'elite';
        else if (roll < 0.40) t = 'event';
        else if (roll < 0.47) t = 'rest';
        else if (roll < 0.54) t = 'shop';
        else t = 'combat';
        n.type = t;
      }
    }
    // 连边:自上而下,每节点连接下一行 x 距离最近的 1-3 个节点
    linkMapRows(map, run, ROWS);
    return map;
  }

  /* ================= 战斗 ================= */
  function spawnEnemy(run, id, scale) {
    const d = ENEMIES.get(id);
    if (!d) throw new Error('未知敌人: ' + id);
    const [a, b] = d.maxHp;
    let hp = RNG.int(run, a, b);
    if (scale > 1) hp = Math.floor(hp * (1 + 0.35 * (scale - 1)));
    // 主题:污染越深,敌人越强(与玩家伤害加成形成取舍,有上限)
    const t = themeOf(run);
    if (t && t.curseHp) hp = Math.floor(hp * (1 + Math.min(0.3, t.curseHp * (run.player.curse || 0))));
    // 难度/进阶/每日:全局敌人生命倍率
    if (run.enemyHpMult) hp = Math.floor(hp * run.enemyHpMult);
    const e = {
      uid: uid(), id, name: d.name, art: d.art,
      hp, maxHp: hp, block: 0, statuses: {}, dead: false,
      isElite: !!d.elite, isBoss: !!d.boss,
      move: null, _last: null, _feasted: false, _p2: false
    };
    // 词缀:普通敌人从第 2 段起有概率携带(无尽继续提升)
    if (!d.elite && !d.boss && run.act >= 2) {
      const p = Math.min(0.40, 0.12 + 0.07 * (run.act - 1));
      if (RNG.chance(run, p)) {
        const key = RNG.pick(run, AFFIX_KEYS);
        const af = AFFIXES[key];
        e.affix = key;
        e.affixName = af.name;
        if (af.hpMult !== 1) { e.hp = Math.max(1, Math.floor(e.hp * af.hpMult)); e.maxHp = e.hp; }
        if (key === 'thorny') addStatus(run, e, 'thorns', 3);
        if (key === 'shielded') { e.block += 5 + run.act * 2; }
      }
    }
    if (d.init) d.init(e, run);
    if (GS.Codex) GS.Codex.record('enemies', id);
    return e;
  }

  function enemyDef(e) { return ENEMIES.get(e.id); }

  function statusOf(ent, key) { return (ent.statuses[key] || 0); }

  function addStatus(run, ent, key, n, isPlayer) {
    // 玩家方的减益可被护盾术(artifact)抵挡
    if (isPlayer && n < 0 && statusOf(ent, 'artifact') > 0 && ['vuln', 'weak', 'frail'].includes(key)) {
      ent.statuses.artifact--;
      pushEv(run, { t: 'status', who: 'player', key: 'artifact', v: ent.statuses.artifact });
      return;
    }
    ent.statuses[key] = statusOf(ent, key) + n;
    if (ent.statuses[key] === 0) delete ent.statuses[key];
    pushEv(run, { t: 'status', who: isPlayer ? 'player' : 'enemy', uid: ent.uid, key, v: ent.statuses[key] ?? 0 });
  }

  function pushEv(run, ev) {
    if (!run.evts) run.evts = [];
    run.evts.push(ev);
  }

  /* ---------- 伤害计算 ---------- */
  function calcPlayerAttack(run, base, target, opts) {
    const st = run.combat.player.statuses;
    let atk = base + (st.str || 0) + (st.tempStr || 0) + (run.combat.mutateBonus || 0);
    if (owned(run, 'courageemblem') && run.player.hp < run.player.maxHp * 0.5) atk += 2;
    if (opts && opts.bonus) atk += opts.bonus;
    // 「咒力」强化:部分卡牌按当前咒力提升伤害
    if (opts && opts.ce) atk += (run.combat.ce || 0) * (opts.ceRate || 1);
    // 主题:污染使所有伤害提高
    if (opts && opts.curseDmg) atk += opts.curseDmg;
    // 主题:光之巨人「红色警戒」——彩色计时器告急时全力输出
    const th = themeOf(run);
    if (th && th.redline && run.combat.light && run.combat.light.val <= th.redline + relicVal(run, 'redlinePlus')) {
      atk += th.redlineBonus || 0;
    }
    // 主题:「龙之意志」——每层攻击 +15%(最多按 2 层计)
    const df = run.combat.player.statuses.dragonforce || 0;
    if (df > 0) atk = Math.floor(atk * (1 + 0.15 * Math.min(2, df)));
    // 主题:「三头六臂」——攻击牌伤害提升(每层 +2)
    if ((run.combat.player.statuses.sixarms || 0) > 0) atk += run.combat.player.statuses.sixarms * 2;
    if (statusOf(run.combat.player, 'weak') > 0) atk = Math.floor(atk * 0.75);
    if (opts && opts.firstAttack) atk += relicVal(run, 'firstAttackBonus');
    if (target) {
      if (target.isElite) atk = Math.floor(atk * (1 + relicSumDiscount(run, 'eliteDmgMult')));
      if (target.isBoss) atk = Math.floor(atk * (1 + relicSumDiscount(run, 'bossDmgMult')));
      // 每日「巨人杀手」:对 BOSS 伤害 +50%
      if (target.isBoss && run.daily === 'giantslayer') atk = Math.floor(atk * 1.5);
      if (statusOf(target, 'vuln') > 0) atk = Math.floor(atk * 1.5);
      // 主题:弱点(阴阳眼等效果揭示)
      if (statusOf(target, 'weakness') > 0) atk = Math.floor(atk * 1.5);
      // 主题:咒力护甲(减伤)
      if (statusOf(target, 'wei') > 0) atk = Math.floor(atk * 0.65);
    }
    return Math.max(0, atk);
  }
  // 主题:污染层数带来的额外伤害(设上限,避免数值失控)
  function curseDamageBonus(run) {
    const t = themeOf(run);
    if (!t || !t.curseDmg) return 0;
    return Math.min(t.curseDmg * 6, (run.player.curse || 0) * t.curseDmg);
  }
  function relicSumDiscount(run, key) {
    let v = 0;
    for (const id of run.player.relics) { const d = RELICS.get(id); if (d && d[key]) v += d[key]; }
    return v;
  }

  function calcEnemyAttack(run, e, base) {
    let atk = base + statusOf(e, 'str');
    if (statusOf(e, 'weak') > 0) atk = Math.floor(atk * 0.75);
    // 主题:「镇压」使敌人造成的伤害降低
    if (statusOf(e, 'seal') > 0) atk = Math.floor(atk * 0.75);
    // 主题:玩家的弱点被看穿
    if (statusOf(run.combat.player, 'weakness') > 0) atk = Math.floor(atk * 1.35);
    // 主题:魔女之香——灾祸闻香而来,敌人的攻击更加凶暴
    if (statusOf(run.combat.player, 'witchscent') > 0) atk = Math.floor(atk * 1.25);
    if (statusOf(run.combat.player, 'vuln') > 0) atk = Math.floor(atk * 1.5);
    // 词缀:迅捷敌人伤害提高
    if (e.affix === 'swift') atk = Math.floor(atk * 1.25);
    // 难度/进阶/每日:全局敌人伤害倍率
    if (run.enemyDmgMult) atk = Math.floor(atk * run.enemyDmgMult);
    return Math.max(0, atk);
  }

  // 玩家对敌人造成攻击伤害(单次),返回实际扣除的生命
  function hitEnemy(run, e, amount, opts) {
    if (e.dead || amount <= 0) return 0;
    let rem = amount;
    if (e.block > 0) {
      const absorbed = Math.min(e.block, rem);
      e.block -= absorbed;
      rem -= absorbed;
      pushEv(run, { t: 'block', who: 'enemy', uid: e.uid, v: e.block });
    }
    if (rem > 0) {
      e.hp -= rem;
      pushEv(run, { t: 'dmg', who: 'enemy', uid: e.uid, v: rem });
      if (e.hp <= 0) { e.hp = 0; }
    }
    // 敌方荆棘反伤(走玩家格挡)
    const thorns = statusOf(e, 'thorns');
    if (thorns > 0 && !(opts && opts.noRetaliate)) damagePlayer(run, thorns, true);
    return rem;
  }

  function damagePlayer(run, amount, useBlock) {
    const p = run.combat ? run.combat.player : null;
    let rem = amount;
    // 主题:领域屏障抵挡一次伤害
    if (p && (p.statuses.barrier || 0) > 0 && rem > 0) {
      addStatus(run, p, 'barrier', -1, true);
      pushEv(run, { t: 'fx', fx: 'shield' });
      pushEv(run, { t: 'text', msg: '领域屏障抵消了这次伤害' });
      return 0;
    }
    if (useBlock && p && p.block > 0) {
      const absorbed = Math.min(p.block, rem);
      p.block -= absorbed;
      rem -= absorbed;
      pushEv(run, { t: 'block', who: 'player', v: p.block });
    }
    if (rem > 0) {
      run.player.hp -= rem;
      pushEv(run, { t: 'dmg', who: 'player', v: rem });
      checkPlayerDeath(run);
    }
    return rem;
  }

  function checkPlayerDeath(run) {
    if (run.player.hp > 0) return;
    // 主题:死亡回归——倒回至战斗开始时的生命(基础 1 次,遗物/卡牌可增加)
    if (run.combat && run.combat.rbdHp !== undefined) {
      const cb = run.combat;
      const maxUse = 1 + relicVal(run, 'rbdCharges');
      let used = false;
      if ((cb.rbdUsed || 0) < maxUse) { cb.rbdUsed = (cb.rbdUsed || 0) + 1; used = true; }
      else if (statusOf(cb.player, 'rewind') > 0) { addStatus(run, cb.player, 'rewind', -1, true); used = true; }
      if (used) {
        run.player.hp = Math.max(1, cb.rbdHp);
        for (const k of ['vuln', 'weak', 'frail']) delete cb.player.statuses[k];
        addStatus(run, cb.player, 'witchscent', 1, true);
        pushEv(run, { t: 'fx', fx: 'aoe' });
        pushEv(run, { t: 'text', msg: '「死亡回归」——时间倒回了存档点!' });
        return;
      }
    }
    // 主题:活尸——本场战斗内首次致命伤害不死
    if (run.combat && statusOf(run.combat.player, 'undying') > 0) {
      delete run.combat.player.statuses.undying;
      run.player.hp = Math.max(1, Math.floor(run.player.maxHp * 0.4));
      pushEv(run, { t: 'text', msg: '活尸之躯撑住了这一击,你拒绝死去!' });
      return;
    }
    // 不死鸟之血:战斗内一次重生(优先于遗物)
    if (run.combat && statusOf(run.combat.player, 'demonRevive') > 0) {
      delete run.combat.player.statuses.demonRevive;
      run.player.hp = Math.max(1, Math.floor(run.player.maxHp * 0.5));
      pushEv(run, { t: 'text', msg: '不死鸟之血燃起,你从灰烬中重生!' });
      return;
    }
    if (owned(run, 'phoenixfeather') && !run.phoenixUsed) {
      run.phoenixUsed = true;
      run.player.relics = run.player.relics.filter(id => id !== 'phoenixfeather');
      run.player.hp = Math.max(1, Math.floor(run.player.maxHp * 0.3));
      pushEv(run, { t: 'text', msg: '凤凰羽燃起烈焰,你复活了!' });
      return;
    }
    run.player.hp = 0;
    if (run.combat) run.combat.over = true;
    run.screen = 'gameover';
    run.gameoverSeen = false;
    pushEv(run, { t: 'text', msg: '你倒下了……' });
  }

  function sweepDead(run) {
    const c = run.combat;
    if (!c) return;
    // 尸爆可能连锁,循环处理直到稳定
    let changed = true;
    while (changed) {
      changed = false;
      for (const e of c.enemies) {
        if (e.hp <= 0 && !e.dead) {
          e.dead = true;
          changed = true;
          c.kills = (c.kills || 0) + 1;
          const d = enemyDef(e);
          pushEv(run, { t: 'death', uid: e.uid });
          // 主题:暴食的权能——吞噬倒下的敌人
          const glut = c.player.statuses.gluttony || 0;
          if (glut > 0) {
            run.player.hp = Math.min(run.player.maxHp, run.player.hp + glut);
            addStatus(run, c.player, 'str', 1, true);
            pushEv(run, { t: 'heal', who: 'player', v: glut });
            pushEv(run, { t: 'text', msg: '暴食:吞噬了倒下的敌人' });
          }
          if (statusOf(e, 'corpseExp') > 0) {
            const dmg = e.maxHp;
            for (const o of c.enemies) {
              if (o !== e && !o.dead) hitEnemy(run, o, dmg, { noRetaliate: true });
            }
            pushEv(run, { t: 'text', msg: '尸爆!' });
          }
          if (d && d.onDeath) {
            const A = makeEnemyCtx(run, e);
            d.onDeath(A, e);
          }
        }
      }
    }
    if (c.enemies.every(e => e.dead) && !c.over) {
      c.over = true; c.won = true;
    }
  }

  /* ---------- 卡牌动作上下文(玩家打出卡牌时) ---------- */
  function makeCardCtx(run, inst, targetRef, opts) {
    opts = opts || {};
    const c = run.combat;
    const living = () => c.enemies.filter(e => !e.dead);
    const resolveT = (t) => {
      if (t === undefined || t === null) return targetRef;
      if (typeof t === 'number') return living()[t] || targetRef;
      return t;
    };
    const ctx = {
      run, inst, target: targetRef, isEcho: !!opts.echo,
      // ---- 攻击 ----
      attack(t, o) {
        const target = resolveT(t) || living()[0];
        const view = cardView(run, inst);
        if (target && !opts.echo) pushEv(run, { t: 'fx', fx: 'slash', uid: target.uid });
        const times = (o && o.times) || (view.hits ? view.hits : 1) || 1;
        let total = 0, killed = false;
        const first = !c.firstAttackUsed;
        c.firstAttackUsed = true;
        const bonus = c.pendingAttackBonus; c.pendingAttackBonus = 0;
        let base = (view.dmg || 0) + (c.permBoosts[inst.uid] || 0);
        if (inst.id === 'shiv') base += c.shivBonus || 0;
        if (inst.id === 'imp') base += c.impBonus || 0;
        for (let i = 0; i < times; i++) {
          if (!target || target.dead) break;
          const amt = calcPlayerAttack(run, base, target, {
            bonus, firstAttack: first && i === 0,
            ce: !!view.ceScale, curseDmg: curseDamageBonus(run)
          });
          total += hitEnemy(run, target, amt);
          if (target.dead) killed = true;
        }
        // 黑闪:暴击,追加等量伤害并积攒咒力
        if (view.tech && target && !target.dead && total > 0 && RNG.chance(run, blackFlashChance(run))) {
          hitEnemy(run, target, total, { noRetaliate: true });
          ctx.gainCe(3);
          pushEv(run, { t: 'fx', fx: 'blackflash', uid: target.uid });
          pushEv(run, { t: 'text', msg: '黑闪!' });
          total *= 2;
          if (target.dead) killed = true;
        }
        // 剧毒烟雾
        if (statusOf(c.player, 'fumes') > 0 && target && !target.dead && !opts.echo) {
          addStatus(run, target, 'poison', statusOf(c.player, 'fumes'));
        }
        return killed;
      },
      attackAll(o) {
        const view = cardView(run, inst);
        const times = (o && o.times) || 1;
        let total = 0;
        if (!opts.echo) pushEv(run, { t: 'fx', fx: 'aoe' });
        const first = !c.firstAttackUsed;
        const base = (view.dmg || 0) + (c.permBoosts[inst.uid] || 0);
        for (let i = 0; i < times; i++) {
          for (const e of living()) {
            const amt = calcPlayerAttack(run, base, e, {
              firstAttack: first && i === 0 && e === living()[0],
              ce: !!view.ceScale, curseDmg: curseDamageBonus(run)
            });
            total += hitEnemy(run, e, amt);
          }
        }
        c.firstAttackUsed = true;
        if (statusOf(c.player, 'fumes') > 0) {
          for (const e of living()) addStatus(run, e, 'poison', statusOf(c.player, 'fumes'));
        }
        return total;
      },
      attackRandom(o) {
        o = o || {};
        const view = cardView(run, inst);
        const times = o.times || 1;
        let total = 0;
        if (!opts.echo) pushEv(run, { t: 'fx', fx: 'multi' });
        const first = !c.firstAttackUsed;
        const base = o.dmg !== undefined ? o.dmg : ((view.dmg || 0) + (c.permBoosts[inst.uid] || 0));
        c.firstAttackUsed = true;
        for (let i = 0; i < times; i++) {
          const alive = living();
          if (!alive.length) break;
          const target = RNG.pick(run, alive);
          const amt = calcPlayerAttack(run, base, target, {
            firstAttack: first && i === 0, curseDmg: curseDamageBonus(run)
          });
          total += hitEnemy(run, target, amt);
        }
        return total;
      },
      attackBonus(n) { c.pendingAttackBonus = (c.pendingAttackBonus || 0) + n; },
      // ---- 防御 ----
      gainBlock(n) {
        const amount = n !== undefined ? n : (cardView(run, inst).block || 0);
        gainPlayerBlock(run, amount);
      },
      // ---- 状态 ----
      applyTo(t, key, n) {
        const target = resolveT(t);
        if (!target || target.dead) return;
        addStatus(run, target, key, n);
      },
      applyAll(key, n) { for (const e of living()) addStatus(run, e, key, n); },
      applySelf(key, n) { addStatus(run, c.player, key, n, true); },
      multiplyPoison(t, m) {
        const target = resolveT(t);
        if (!target || target.dead) return;
        const cur = statusOf(target, 'poison');
        if (cur > 0) addStatus(run, target, 'poison', cur * (m - 1));
      },
      // ---- 手牌 ----
      draw(n) { drawCards(run, n); },
      handSize() { return c.hand.length; },
      currentBlock() { return c.player.block; },
      poisonOf(t) { const target = resolveT(t); return target ? statusOf(target, 'poison') : 0; },
      selfStr() { return (c.player.statuses.str || 0) + (c.player.statuses.tempStr || 0); },
      exhaustedCount() { return c.exhaust.length; },
      killsCount() { return c.kills || 0; },
      stripBlock(t) {
        const target = resolveT(t);
        if (target && !target.dead && target.block > 0) {
          target.block = 0;
          pushEv(run, { t: 'text', msg: target.name + ' 的格挡被击碎!' });
        }
      },
      spreadPoison(t, copyMode) {
        const target = resolveT(t);
        if (!target || target.dead) return;
        const stacks = statusOf(target, 'poison');
        if (stacks <= 0) return;
        let amount;
        if (copyMode) {
          amount = stacks;
        } else {
          amount = Math.floor(stacks / 2);
          if (amount > 0) addStatus(run, target, 'poison', -amount);
        }
        if (amount > 0) {
          for (const o of living()) {
            if (o !== target) addStatus(run, o, 'poison', amount);
          }
        }
      },
      burstPoison(t, keepStacks) {
        const target = resolveT(t);
        if (!target || target.dead) return;
        const stacks = statusOf(target, 'poison');
        if (stacks <= 0) return;
        hitEnemy(run, target, stacks, { noRetaliate: true });
        if (!keepStacks) addStatus(run, target, 'poison', -Math.floor(stacks / 2));
        sweepDead(run);
      },
      tryExecute(t) {
        const target = resolveT(t);
        if (!target || target.dead) return false;
        if (target.hp > 0 && target.hp < target.maxHp * 0.35) {
          pushEv(run, { t: 'text', msg: '处决!' });
          target.hp = 0;
          target.block = 0;
          sweepDead(run);
          return true;
        }
        return false;
      },
      healLostPct(pct, cap) {
        const lost = run.player.maxHp - run.player.hp;
        if (lost <= 0) return;
        const heal = Math.min(cap || 999, Math.max(1, Math.floor(lost * pct)));
        this.heal(heal);
      },
      bonusImp(n) { c.impBonus = (c.impBonus || 0) + n; },
      exhaustHandWhere(pred) {
        let n = 0;
        const staying = [];
        for (const h of c.hand) {
          if (pred(CARDS.get(h.id))) { exhaustCard(run, h); n++; }
          else staying.push(h);
        }
        c.hand = staying;
        return n;
      },
      discardHand() {
        const hand = [...c.hand];
        c.hand = [];
        for (const h of hand) discardCard(run, h);
      },
      chooseDiscard(n) {
        if (c.hand.length <= n) {
          // 全弃
          const hand = [...c.hand]; c.hand = [];
          for (const h of hand) discardCard(run, h);
          return;
        }
        c.pending = { type: 'discard', n };
      },
      chooseDiscardToTop() {
        if (!c.discard.length) return;
        c.pending = { type: 'discardToTop', n: 1 };
      },
      addToken(id, n) {
        for (let i = 0; i < n; i++) {
          if (c.hand.length >= 10) break;
          const tk = { id, up: 0, uid: uid() };
          c.hand.push(tk);
          pushEv(run, { t: 'addCard', id });
        }
      },
      addStatusToDiscard(id, n) {
        for (let i = 0; i < n; i++) c.discard.push({ id, up: 0, uid: uid() });
        pushEv(run, { t: 'text', msg: CARDS.get(id).name + ' ×' + n });
      },
      // ---- 资源 ----
      heal(n) {
        const before = run.player.hp;
        run.player.hp = clamp(run.player.hp + n, 0, run.player.maxHp);
        if (run.player.hp > before) pushEv(run, { t: 'heal', who: 'player', v: run.player.hp - before });
      },
      loseHp(n) {
        // 卡牌生命代价:不触发死亡检定的特殊情况也走统一检定
        run.player.hp -= n;
        c.hpLostThisTurn += n;
        pushEv(run, { t: 'dmg', who: 'player', v: n, self: true });
        checkPlayerDeath(run);
        // 献祭契约:失去生命转化为全场伤害
        if (run.player.hp > 0 && statusOf(c.player, 'bloodPact') > 0) {
          for (const e of c.enemies.filter(e => !e.dead)) {
            hitEnemy(run, e, n, { noRetaliate: true });
          }
          sweepDead(run);
        }
      },
      gainEnergy(n) { c.player.energy += n; pushEv(run, { t: 'energy', v: c.player.energy }); },
      spendAllEnergy() {
        const x = c.player.energy;
        c.player.energy = 0;
        pushEv(run, { t: 'energy', v: 0 });
        return x;
      },
      permBoost(cardInst, n) {
        c.permBoosts[cardInst.uid] = (c.permBoosts[cardInst.uid] || 0) + n;
      },
      bonusShiv(n) { c.shivBonus = (c.shivBonus || 0) + n; },
      hpLostThisTurn() { return c.hpLostThisTurn || 0; },
      // ---- 战斗外可用(药水共用) ----
      maxHp() { return run.player.maxHp; },
      gainGold(n) { run.player.gold += n; pushEv(run, { t: 'gold', v: run.player.gold }); },
      dealMagicDamage(t, n) {
        const target = resolveT(t);
        if (target && !target.dead) hitEnemy(run, target, n, { noRetaliate: true });
        sweepDead(run);
      },

      /* ================= 联动主题:通用 ================= */
      themeId() { const t = themeOf(run); return t ? t.id : null; },
      randomGhost() { return RNG.pick(run, THEMES.ghostPool); },
      playedThisTurn(id) { return (c.playedIds || []).includes(id); },
      targetHasDebuff(t) {
        const target = resolveT(t);
        if (!target) return false;
        return ['vuln', 'weak', 'frail', 'poison', 'seal', 'sealAction', 'scorch', 'weakness']
          .some(k => statusOf(target, k) > 0);
      },
      mutateBonus() { return c.mutateBonus || 0; },
      addWeakness(t, n) {
        const target = resolveT(t);
        if (!target || target.dead) return;
        addStatus(run, target, 'weakness', n === undefined ? 2 : n);
        pushEv(run, { t: 'text', msg: target.name + ' 的弱点被看穿了!' });
      },
      dealMagicAll(n) {
        for (const e of living()) hitEnemy(run, e, n, { noRetaliate: true });
        sweepDead(run);
      },
      /* ================= 联动主题二批:通用 ================= */
      cardsPlayed() { return c.combatCards || 0; },
      allies() { return (run.player.allies || []).length; },
      selfStatus(key) { return statusOf(c.player, key); },
      roll() { return RNG.float(run); },
      randInt(a, b) { return RNG.int(run, a, b); },
      chance(p) { return RNG.chance(run, p); },
      cleanseDebuffs() {
        for (const k of ['vuln', 'weak', 'frail', 'witchscent']) delete c.player.statuses[k];
      },
      randomSpirit() {
        const pool = THEMES.spiritPool || [];
        return pool.length ? RNG.pick(run, pool) : null;
      },
      redline() {
        const t = themeOf(run);
        if (!t || !t.redline) return -1;
        return t.redline + relicVal(run, 'redlinePlus');
      },
      /* ---- 西游记:棍势 ---- */
      cudgel(n) { if (n > 0) addStatus(run, c.player, 'cudgel', n, true); },
      cudgelCount() { return statusOf(c.player, 'cudgel'); },
      spendCudgel(n) {
        const have = statusOf(c.player, 'cudgel');
        const use = Math.min(have, n);
        if (use > 0) addStatus(run, c.player, 'cudgel', -use, true);
        return use;
      },
      /* ---- 妖精的尾巴:龙之意志 ---- */
      dragonforce(n) { if (n > 0) addStatus(run, c.player, 'dragonforce', n, true); },
      /* ---- 奥特曼:光能 ---- */
      light() { return c.light ? c.light.val : 0; },
      lightMax() { return c.light ? c.light.max : 0; },
      gainLight(n) {
        if (!c.light || n <= 0) return;
        const before = c.light.val;
        c.light.val = Math.min(c.light.max, c.light.val + n);
        if (c.light.val !== before) pushEv(run, { t: 'status', who: 'player', key: 'light', v: c.light.val });
      },
      spendLight(n) {
        if (!c.light || n <= 0) return 0;
        const use = Math.min(c.light.val, n);
        c.light.val -= use;
        if (use > 0) {
          pushEv(run, { t: 'status', who: 'player', key: 'light', v: c.light.val });
          if ((c.player.statuses.plasmaspark || 0) > 0) ctx.dealMagicAll(use);
        }
        return use;
      },
      spendLightAll() { return ctx.spendLight(c.light ? c.light.val : 0); },
      /* ---- 神秘复苏:鬼 / 魂火 / 阴阳眼 ---- */
      setGhost(id, power) {
        const d = CARDS.get(id);
        if (!d) return;
        const p = power !== undefined ? power : c.player.statuses.ghostPower || 1;
        c.player.ghostKey = id;
        c.player.ghostName = d.name;
        c.player.statuses.ghostPower = p;
        c.ghostTriggered = 0;
        pushEv(run, { t: 'text', msg: '鬼物附身:' + d.name + (p > 1 ? ' · 强度 ' + p : '') });
        pushEv(run, { t: 'status', who: 'player', key: 'ghostPower', v: p });
      },
      ghostName() { return c.player.ghostName || ''; },
      addSoulfire(n) {
        if (n <= 0) return;
        addStatus(run, c.player, 'soulfire', n, true);
      },
      soulfire() { return statusOf(c.player, 'soulfire'); },
      spendSoulfire(n) {
        const have = statusOf(c.player, 'soulfire');
        const use = Math.min(have, n);
        if (use > 0) addStatus(run, c.player, 'soulfire', -use, true);
        return use;
      },
      triggerGhost() { if (c.player.ghostName) ghostTrigger(run, ctx); },
      addEye(n) {
        const mult = owned(run, 'mysteye') ? 1.5 : 1;
        addStatus(run, c.player, 'eye', Math.max(1, Math.round(n * mult)), true);
        if (statusOf(c.player, 'eye') >= EYE_MAX) ghostEyeBurst(run);
      },
      eye() { return statusOf(c.player, 'eye'); },
      /* ---- 咒术回战:咒力 / 领域 / 咒术 ---- */
      ce() { return c.ce || 0; },
      gainCe(n) {
        if (n <= 0) return;
        const max = ceMax(run);
        const before = c.ce || 0;
        c.ce = Math.min(max, before + n);
        if (c.ce !== before) pushEv(run, { t: 'status', who: 'player', key: 'ce', v: c.ce });
      },
      spendCe(n) {
        const use = Math.min(c.ce || 0, n);
        c.ce = (c.ce || 0) - use;
        pushEv(run, { t: 'status', who: 'player', key: 'ce', v: c.ce });
        return use;
      },
      spendCeAll() {
        const n = c.ce || 0;
        c.ce = 0;
        if (n > 0) pushEv(run, { t: 'status', who: 'player', key: 'ce', v: 0 });
        return n;
      },
      addField(n) { addField(run, n); },
      modifyField(n) { addField(run, n); },
      field() { return c.field ? c.field.val : 0; },
      fieldMax() { return c.field ? c.field.max : 0; },
      setCostDelta(n, count) {
        c.costDelta = { n: n, count: count || 1 };
        pushEv(run, { t: 'text', msg: '术式顺转:下一张咒术牌费用 ' + n });
      }
    };
    return ctx;
  }

  /* ================= 联动主题:结算辅助 ================= */
  const EYE_MAX = 10;

  function ceMax(run) {
    let m = 12;
    if (owned(run, 'jjkfinger')) m += 5;
    return m;
  }

  // 黑闪几率:基础 25%,「六眼」可提升
  function blackFlashChance(run) {
    const c = run.combat;
    if (!c) return 0;
    return Math.min(0.9, 0.25 + (c.player.statuses.sixEyes || 0) / 100);
  }

  // 「鬼」触发:每当你打出一张牌
  function ghostTrigger(run, ctx) {
    const c = run.combat;
    if (!c || !c.player.ghostName) return;
    const power = c.player.statuses.ghostPower || 0;
    if (power <= 0) return;
    switch (c.player.ghostKey) {
      case 'mn_mirrorghost':
        gainPlayerBlock(run, power);
        break;
      case 'mn_hangghost':
        ctx.attackRandom({ dmg: power, times: 1 });
        break;
      case 'mn_bloodghost':
        ctx.heal(power);
        break;
      case 'mn_ghostking':
        ctx.dealMagicAll(power);
        break;
      /* 从零开始的异世界:精灵(打出技能牌时触发,见 playCard 的门控) */
      case 'rz_sp_ice':
        ctx.attackRandom({ dmg: power, times: 1 });
        break;
      case 'rz_sp_shield':
        gainPlayerBlock(run, power);
        break;
      case 'rz_sp_heal':
        ctx.heal(power);
        break;
      case 'rz_sp_wind':
        ctx.dealMagicAll(power);
        break;
      default:
        break;
    }
  }

  // 阴阳眼开眼:消耗全部层数,造成爆发伤害与永久力量
  function ghostEyeBurst(run) {
    const c = run.combat;
    if (!c) return;
    const n = statusOf(c.player, 'eye');
    addStatus(run, c.player, 'eye', -n, true);
    const dmg = n * 3 + (owned(run, 'mystreverse') ? 15 : 0);
    for (const e of c.enemies.filter(x => !x.dead)) hitEnemy(run, e, dmg, { noRetaliate: true });
    pushEv(run, { t: 'fx', fx: 'aoe' });
    pushEv(run, { t: 'text', msg: '阴阳眼开眼!爆发 ' + dmg + ' 点伤害' });
    const str = Math.max(1, Math.floor(n / 4));
    addStatus(run, c.player, 'str', str, true);
    if (!owned(run, 'mystreverse')) {
      const loss = 4;
      c.hpLostThisTurn = (c.hpLostThisTurn || 0) + loss;
      run.player.hp = Math.max(1, run.player.hp - loss);
      pushEv(run, { t: 'dmg', who: 'player', v: loss, self: true });
      pushEv(run, { t: 'text', msg: '开眼反噬:失去 ' + loss + ' 点生命' });
    }
    sweepDead(run);
  }

  // 镜域/领域之值:满值反噬并重置
  /* ================= 联动伙伴:行动上下文 ================= */
  function makeAllyCtx(run, allyId) {
    const c = run.combat;
    const living = () => (c ? c.enemies.filter(e => !e.dead) : []);
    // 伙伴等级(商店训练):数值效果按等级放大
    const lv = (allyId && run.player.allyLv && run.player.allyLv[allyId]) || 1;
    const m = 1 + 0.5 * (lv - 1);
    const M = (n) => Math.round(n * m);
    return {
      lv,
      mul: M,
      draw(n) { if (n > 0) drawCards(run, n); },
      soulfire(n) { if (n > 0) addStatus(run, c.player, 'soulfire', M(n), true); },
      weaknessAll(n) {
        if (n <= 0) return;
        for (const e of living()) addStatus(run, e, 'weakness', M(n));
      },
      block(n) { if (n > 0) gainPlayerBlock(run, M(n)); },
      heal(n) { if (n > 0) run.player.hp = Math.min(run.player.maxHp, run.player.hp + M(n)); },
      dmgRandom(n) {
        const alive = living();
        if (n <= 0 || !alive.length) return;
        hitEnemy(run, RNG.pick(run, alive), M(n), { noRetaliate: true });
        sweepDead(run);
      },
      dmgAll(n) {
        if (n <= 0 || !living().length) return;
        for (const e of living()) hitEnemy(run, e, M(n), { noRetaliate: true });
        sweepDead(run);
      },
      vulnRandom(n) {
        const alive = living();
        if (n <= 0 || !alive.length) return;
        addStatus(run, RNG.pick(run, alive), 'vuln', M(n));
      },
      str(n) { if (n > 0) addStatus(run, c.player, 'str', M(n), true); },
      barrier(n) { if (n > 0) addStatus(run, c.player, 'barrier', M(n), true); },
      light(n) { if (c && c.light && n > 0) c.light.val = Math.min(c.light.max, c.light.val + M(n)); },
      cudgel(n) { if (n > 0) addStatus(run, c.player, 'cudgel', M(n), true); },
      ce(n) { if (n > 0) c.ce = Math.min(ceMax(run), (c.ce || 0) + M(n)); },
      field(n) { addField(run, n); },
      gold(n) { run.player.gold = Math.max(0, run.player.gold + M(n)); },
      token(id, n) {
        for (let i = 0; i < n; i++) {
          if (!c || c.hand.length >= 10) break;
          c.hand.push({ id, up: 0, uid: uid() });
        }
      },
      contractSpirit() {
        if (!c || c.player.ghostName || !THEMES.spiritPool || !THEMES.spiritPool.length) return;
        const sid = RNG.pick(run, THEMES.spiritPool);
        c.player.ghostKey = sid;
        c.player.ghostName = CARDS.get(sid) ? CARDS.get(sid).name : '精灵';
        c.player.statuses.ghostPower = (THEMES.spiritPower && THEMES.spiritPower[sid]) || 1;
        pushEv(run, { t: 'text', msg: '碧翠丝为你缔结了「' + c.player.ghostName + '」' });
      }
    };
  }

  function addField(run, n) {
    const c = run.combat;
    if (!c || !c.field || !n) return;
    c.field.val = Math.max(0, c.field.val + n);
    pushEv(run, { t: 'status', who: 'player', key: 'field', v: c.field.val });
    if (c.field.val >= c.field.max) {
      c.field.val = 0;
      if (owned(run, 'jjkexpansion')) {
        pushEv(run, { t: 'text', msg: '领域结晶稳定了结界,你安然无恙' });
        return;
      }
      // 结界护佑:抵消一次反噬
      if ((run.wardCharges || 0) > 0) {
        run.wardCharges -= 1;
        pushEv(run, { t: 'text', msg: '结界护佑抵消了这次反噬(剩余 ' + run.wardCharges + ' 层)' });
        return;
      }
      const dmg = 2 + 2 * run.act;
      damagePlayer(run, dmg, false);
      pushEv(run, { t: 'fx', fx: 'aoe' });
      pushEv(run, { t: 'text', msg: '领域反噬!你失去 ' + dmg + ' 点生命' });
      for (const e of c.enemies.filter(x => !x.dead)) addStatus(run, e, 'str', 2);
      sweepDead(run);
    }
  }

  function fieldTick(run) {
    const c = run.combat;
    if (!c || !c.field) return;
    const inc = 1 + statusOf(c.player, 'fieldBoost');
    addField(run, inc);
  }

  function gainPlayerBlock(run, amount) {
    const c = run.combat;
    if (!c || amount <= 0) return;
    let amt = amount + (c.player.statuses.dex || 0);
    if ((c.player.statuses.frail || 0) > 0) amt = Math.floor(amt * 0.75);
    if (amt <= 0) amt = 0;
    c.player.block += amt;
    pushEv(run, { t: 'fx', fx: 'shield' });
    pushEv(run, { t: 'block', who: 'player', v: c.player.block });
  }

  function discardCard(run, inst) {
    const c = run.combat;
    c.discard.push(inst);
    pushEv(run, { t: 'discard' });
    // 被弃置触发(战术家)
    const d = CARDS.get(inst.id);
    if (d && d.onDiscard) {
      d.onDiscard({
        gainEnergy(n) { c.player.energy += n; pushEv(run, { t: 'energy', v: c.player.energy }); },
        draw(n) { drawCards(run, n); }
      }, inst);
    }
  }
  function exhaustCard(run, inst) {
    const c = run.combat;
    c.exhaust.push(inst);
    pushEv(run, { t: 'exhaust', name: CARDS.view(inst).name });
    const fnp = statusOf(c.player, 'feelNoPain');
    if (fnp > 0) gainPlayerBlock(run, fnp);
    // 灵魂收割:消耗牌获得力量
    const sc = statusOf(c.player, 'soulCatch');
    if (sc > 0) addStatus(run, c.player, 'str', sc, true);
    // 献血仪式:消耗牌回复生命
    const br = statusOf(c.player, 'bloodRitual');
    if (br > 0 && run.player.hp > 0) {
      run.player.hp = clamp(run.player.hp + br, 0, run.player.maxHp);
      pushEv(run, { t: 'heal', who: 'player', v: br });
    }
  }

  function drawCards(run, n) {
    const c = run.combat;
    for (let i = 0; i < n; i++) {
      if (!c.draw.length) {
        if (!c.discard.length) break;
        c.draw = RNG.shuffle(run, c.discard);
        c.discard = [];
        pushEv(run, { t: 'shuffle' });
      }
      const card = c.draw.pop();
      if (c.hand.length >= 10) {
        c.discard.push(card);
      } else {
        c.hand.push(card);
      }
    }
    pushEv(run, { t: 'draw', n });
  }

  /* ---------- 敌人动作上下文 ---------- */
  function makeEnemyCtx(run, e) {
    const c = run.combat;
    const living = () => c.enemies.filter(x => !x.dead);
    return {
      run, self: e,
      attack(o) {
        const times = (o && o.times) || 1;
        const d = enemyDef(e).moves[e.move];
        let scale = 1;
        if (run.act > 3) scale = 1 + 0.15 * (run.act - 3);
        for (let i = 0; i < times; i++) {
          const amt = Math.floor(calcEnemyAttack(run, e, (d.dmg || 0)) * scale);
          damagePlayer(run, amt, true);
          // 玩家荆棘
          const th = statusOf(c.player, 'thorns');
          if (th > 0) hitEnemy(run, e, th, { noRetaliate: true });
          if (e.dead) break;
        }
        sweepDead(run);
      },
      gainSelfBlock(n) {
        let amt = n;
        if ((e.statuses.frail || 0) > 0) amt = Math.floor(amt * 0.75);
        e.block += amt;
        pushEv(run, { t: 'block', who: 'enemy', uid: e.uid, v: e.block });
      },
      buffSelf(key, n) { addStatus(run, e, key, n); },
      buffAllies(key, n) { for (const o of living()) addStatus(run, o, key, n); },
      gainAlliesBlock(n) { for (const o of living()) if (o !== e) { o.block += n; pushEv(run, { t: 'block', who: 'enemy', uid: o.uid, v: o.block }); } },
      debuffPlayer(key, n) { addStatus(run, c.player, key, n, true); },
      addStatusToDiscard(id, n) {
        for (let i = 0; i < n; i++) c.discard.push({ id, up: 0, uid: uid() });
        pushEv(run, { t: 'text', msg: CARDS.get(id).name + ' ×' + n });
      },
      summon(id) {
        if (c.enemies.length >= 5) return;
        const ne = spawnEnemy(run, id, run.act > 3 ? run.act - 2 : 1);
        ne.move = pickEnemyMove(run, ne);
        c.enemies.push(ne);
        pushEv(run, { t: 'summon', name: ne.name });
      },
      healSelf(n) {
        if (e.dead) return;
        e.hp = clamp(e.hp + n, 0, e.maxHp);
        pushEv(run, { t: 'heal', who: 'enemy', uid: e.uid, v: n });
      },
      /* 主题专用:调整领域/镜域之值 */
      modifyField(n) { addField(run, n); },
      /* 主题专用:提升自身最大生命(画皮鬼 / 真人) */
      buffSelfMaxHp(n) {
        if (e.dead) return;
        e.maxHp += n;
        e.hp += n;
        pushEv(run, { t: 'heal', who: 'enemy', uid: e.uid, v: n });
        pushEv(run, { t: 'text', msg: e.name + ' 的生命上限提升到 ' + e.maxHp });
      },
      /* 主题专用:看穿玩家弱点(使玩家受到的伤害提高) */
      revealWeakness() {
        if (statusOf(c.player, 'weakness') > 0) return;
        addStatus(run, c.player, 'weakness', 2, true);
      }
    };
  }

  function pickEnemyMove(run, e) {
    const d = enemyDef(e);
    let key = d.ai(e, { run, turn: run.combat.turn, combat: run.combat });
    if (!key || !d.moves[key]) key = Object.keys(d.moves)[0];
    return key;
  }

  /* ---------- 回合流程 ---------- */
  function startCombat(run, encIds, kind) {
    const theme = themeOf(run);
    const scale = run.act > 3 ? run.act - 2 : 1;
    // 镜域第 2/3 段的敌人强度按段位略微上调
    let bossScale = scale;
    if (theme && run.act > 1 && run.act <= theme.acts.length) bossScale = scale * (1 + 0.18 * (run.act - 1));
    const enemies = encIds.map(id => spawnEnemy(run, id, bossScale));
    const deckCopy = run.player.deck.map(x => ({ id: x.id, up: x.up, uid: uid() }));
    run.combat = {
      kind, turn: 0, over: false, won: false,
      enemies,
      hand: [], draw: RNG.shuffle(run, deckCopy), discard: [], exhaust: [],
      player: { block: 0, statuses: {}, energy: 0, maxEnergy: 3 + relicVal(run, 'energyBonus') + (run.daily === 'turbo' ? 1 : 0) },
      hpLostThisTurn: 0, permBoosts: {}, shivBonus: 0, impBonus: 0, kills: 0,
      firstAttackUsed: false, firstSkillUsed: false, pendingAttackBonus: 0,
      pending: null, cardsPlayed: 0, playedIds: [], techniqueUsed: false,
      combatCards: 0, ce: 0, mutateBonus: 0, costDelta: null, ghostTriggered: 0,
      field: theme ? { val: 0, max: theme.fieldMax || 10, label: theme.fieldLabel || '镜域' } : null,
      light: (theme && theme.light) ? { val: theme.light.start, max: theme.light.max + relicVal(run, 'lightMaxBonus') } : null,
      rbdHp: (theme && theme.deathRewind) ? run.player.hp : undefined,
      rbdUsed: 0
    };
    run.screen = 'combat';
    // 先进入第 1 回合(抽牌、充能),再结算开局遗物,避免格挡被回合开始清空
    startPlayerTurn(run, true);
    // 敌人初始意图(此时 turn 已为 1)
    for (const e of enemies) e.move = pickEnemyMove(run, e);
    if (kind === 'boss') pushEv(run, { t: 'fx', fx: 'boss', name: enemies[0].name });
    const c = run.combat;
    // 主题开局:镜域之值 / 咒力 / 鬼 / 领域屏障
    if (theme) {
      if (c.field) c.field.val = Math.min(c.field.max - 1, Math.max(0, run.player.curse || 0));
      if (owned(run, 'mystmirror')) addStatus(run, c.player, 'soulfire', 3, true);
      if (owned(run, 'mystpagoda')) { for (const e of enemies) addStatus(run, e, 'seal', 1); }
      if (owned(run, 'jjkcore')) { c.ce = Math.min(ceMax(run), c.ce + 3); if (c.field) c.field.val = Math.min(c.field.max - 1, c.field.val + 2); }
      if (owned(run, 'jjkglass')) c.ce = Math.min(ceMax(run), c.ce + 1);
      if (owned(run, 'jjkfinger')) c.ce = Math.min(ceMax(run), c.ce + 2);
      if (owned(run, 'jjkmask')) addStatus(run, c.player, 'barrier', 1, true);
      if (owned(run, 'mystbell') && THEMES.ghostPool && THEMES.ghostPool.length) {
        const gid = RNG.pick(run, THEMES.ghostPool);
        c.player.ghostKey = gid;
        c.player.ghostName = CARDS.get(gid).name;
        c.player.statuses.ghostPower = THEMES.ghostPower[gid] || 1;
      }
      if (owned(run, 'jjkteach') && c.hand.length < 10) c.hand.push({ id: 'jj_dog', up: 0, uid: uid() });
      /* ---- 联动主题二批:开局遗物 ---- */
      if (owned(run, 'rz_gospel') && THEMES.spiritPool && THEMES.spiritPool.length) {
        const sid = RNG.pick(run, THEMES.spiritPool);
        c.player.ghostKey = sid;
        c.player.ghostName = CARDS.get(sid) ? CARDS.get(sid).name : '精灵';
        c.player.statuses.ghostPower = (THEMES.spiritPower && THEMES.spiritPower[sid]) || 1;
      }
      if (owned(run, 'xy_cudgel')) addStatus(run, c.player, 'cudgel', 3, true);
      if (owned(run, 'xy_hairbox') && c.hand.length < 10) c.hand.push({ id: 'xy_clone', up: 0, uid: uid() });
      if (owned(run, 'ft_emblem')) addStatus(run, c.player, 'dragonforce', 2, true);
      pushEv(run, { t: 'text', msg: theme.name + ' · ' + (themeActOf(run) ? themeActOf(run).name : '镜域') });
    }
    if (relicVal(run, 'strStart')) addStatus(run, c.player, 'str', relicVal(run, 'strStart'), true);
    if (relicVal(run, 'dexStart')) addStatus(run, c.player, 'dex', relicVal(run, 'dexStart'), true);
    const bs = relicVal(run, 'blockStart');
    if (bs) gainPlayerBlock(run, bs);
    if (owned(run, 'thornscrown')) addStatus(run, c.player, 'thorns', 3, true);
    if (owned(run, 'sacredidol')) { addStatus(run, c.player, 'str', 1, true); addStatus(run, c.player, 'dex', 1, true); }
    if (owned(run, 'gamblerdice') && RNG.chance(run, 0.5)) { c.player.maxEnergy += 1; c.player.energy += 1; pushEv(run, { t: 'text', msg: '赌徒骰子:能量上限+1!' }); }
    if (owned(run, 'ninjascroll') && c.hand.length < 10) {
      c.hand.push({ id: 'shiv', up: 0, uid: uid() });
    }
    if (owned(run, 'deathbook')) {
      const upgradable = c.hand.filter(h => !h.up && CARDS.upgradeable(h.id));
      if (upgradable.length) {
        const pick = RNG.pick(run, upgradable);
        pick._tempUp = true;
      }
    }
    // 主题:伙伴的战斗开始效果
    for (const aid of (run.player.allies || [])) {
      const d = THEMES.allyMap && THEMES.allyMap[aid];
      if (d && d.combatStart) d.combatStart(makeAllyCtx(run, aid));
    }
    // 主题:双人组合羁绊(全部伙伴都在场时生效)
    const th2 = themeOf(run);
    if (th2 && th2.duos) {
      for (const duo of th2.duos) {
        if (duo.ids.every(id => (run.player.allies || []).includes(id))) {
          if (duo.combatStart) duo.combatStart(makeAllyCtx(run));
          pushEv(run, { t: 'text', msg: '🤝 羁绊「' + duo.name + '」发动:' + duo.note });
        }
      }
    }
    void th2;
  }

  function startPlayerTurn(run, first) {
    const c = run.combat;
    c.turn += 1;
    c.hpLostThisTurn = 0;
    c.firstAttackUsed = false;
    c.firstSkillUsed = false;
    c.cardsPlayed = 0;
    c.playedIds = [];
    c.ghostTriggered = 0;
    // 路障外清空格挡
    if ((c.player.statuses.barricade || 0) < 1) c.player.block = 0;
    // 能量重置
    c.player.energy = c.player.maxEnergy;
    // ---- 联动主题:每回合开始 ----
    c.costDelta = null;
    c.techniqueUsed = false;
    if (c.field) c.field.val = Math.max(0, c.field.val);
    if (owned(run, 'jjkfragment')) c.ce = Math.min(ceMax(run), (c.ce || 0) + 1);
    const six = statusOf(c.player, 'sixEyes');
    if (six > 0) c.ce = Math.min(ceMax(run), (c.ce || 0) + (six >= 25 ? 3 : 2));
    // ---- 联动主题二批:回合开始 ----
    if (c.light) {
      const et = c.player.statuses.eternal || 0;
      if (et >= 2) c.light.val = Math.min(c.light.max, c.light.val + 1);
      if (owned(run, 'ul_spark')) c.light.val = Math.min(c.light.max, c.light.val + 1);
    }
    if (owned(run, 'xy_goldhoop')) addStatus(run, c.player, 'cudgel', 1, true);
    const majesty = statusOf(c.player, 'majesty');
    if (majesty > 0) addStatus(run, c.player, 'cudgel', 2 * majesty, true);
    /* ---- v5 新状态:每回合增益 ---- */
    const soulgain = statusOf(c.player, 'soulgain');
    if (soulgain > 0) addStatus(run, c.player, 'soulfire', soulgain, true);
    const eyerit = statusOf(c.player, 'eyeritual');
    if (eyerit > 0) addStatus(run, c.player, 'eye', Math.max(1, Math.round(eyerit * (owned(run, 'mysteye') ? 1.5 : 1))), true);
    const cegen = statusOf(c.player, 'cegen');
    if (cegen > 0) c.ce = Math.min(ceMax(run), (c.ce || 0) + cegen);
    const lightrit = statusOf(c.player, 'lightritual');
    if (lightrit > 0 && c.light) c.light.val = Math.min(c.light.max, c.light.val + lightrit);
    const unseenDmg = statusOf(c.player, 'unseen');
    if (unseenDmg > 0) {
      const aliveU = c.enemies.filter(e => !e.dead);
      if (aliveU.length) {
        const tgt = RNG.pick(run, aliveU);
        hitEnemy(run, tgt, unseenDmg, { noRetaliate: true });
        pushEv(run, { t: 'text', msg: '看不见的手抓向了 ' + tgt.name });
        sweepDead(run);
        if (c.over) { finishCombat(run); return; }
      }
    }
    const scales = statusOf(c.player, 'scales');
    if (scales > 0) gainPlayerBlock(run, scales);
    // 玩家中毒结算(无视格挡)
    const pois = statusOf(c.player, 'poison');
    if (pois > 0) {
      run.player.hp = Math.max(0, run.player.hp - pois);
      addStatus(run, c.player, 'poison', -1);
      pushEv(run, { t: 'dmg', who: 'player', v: pois, self: true });
      checkPlayerDeath(run);
    }
    // 血怒
    if ((c.player.statuses.bloodRage || 0) > 0) {
      addStatus(run, c.player, 'str', c.player.statuses.bloodRage, true);
      run.player.hp -= 2;
      pushEv(run, { t: 'dmg', who: 'player', v: 2, self: true });
      checkPlayerDeath(run);
    }
    // 深渊注视:随机敌人易伤
    if ((c.player.statuses.abyssGaze || 0) > 0) {
      const alive = c.enemies.filter(e => !e.dead);
      if (alive.length) addStatus(run, RNG.pick(run, alive), 'vuln', c.player.statuses.abyssGaze);
    }
    // 生命转化:失去生命换能量
    if ((c.player.statuses.lifeConvert || 0) > 0) {
      const cost = c.player.statuses.lifeConvert;
      run.player.hp = Math.max(0, run.player.hp - cost);
      c.player.energy += 1;
      pushEv(run, { t: 'dmg', who: 'player', v: cost, self: true });
      pushEv(run, { t: 'energy', v: c.player.energy });
      checkPlayerDeath(run);
    }
    // 主题:伙伴的回合效果 + 身外身法
    for (const aid of (run.player.allies || [])) {
      const d = THEMES.allyMap && THEMES.allyMap[aid];
      if (d && d.turnStart) d.turnStart(makeAllyCtx(run));
    }
    if ((c.player.statuses.monkeys || 0) > 0 && c.hand.length < 10) {
      c.hand.push({ id: 'xy_clone', up: 0, uid: uid() });
    }
    // 抽牌
    let n = 5 + (c.player.statuses.drawNext || 0);
    if (c.player.statuses.drawNext) delete c.player.statuses.drawNext;
    if (first) n += relicVal(run, 'drawFirstTurn');
    // 固有牌优先
    const innate = c.draw.filter(x => CARDS.view(tempView(x)).innate);
    if (innate.length) {
      c.draw = c.draw.filter(x => !CARDS.view(tempView(x)).innate);
      c.draw.push(...innate); // pop() 从末尾抽
    }
    drawCards(run, n);
    // 时之沙漏
    if (owned(run, 'hourglass') && c.turn === 3) { c.player.energy += 1; pushEv(run, { t: 'text', msg: '时之沙漏:获得1点能量' }); }
    pushEv(run, { t: 'turnStart', turn: c.turn });
  }
  function tempView(x) { return x; } // 固有查询时 _tempUp 不影响

  function endPlayerTurn(run) {
    const c = run.combat;
    if (c.over || run.screen !== 'combat') return;
    // 回合结束触发
    const metal = statusOf(c.player, 'metal');
    if (metal > 0) gainPlayerBlock(run, metal);
    // 恶魔之力:回合结束失去生命
    const dp = statusOf(c.player, 'demonPact');
    if (dp > 0) {
      run.player.hp = Math.max(0, run.player.hp - dp);
      c.hpLostThisTurn += dp;
      pushEv(run, { t: 'dmg', who: 'player', v: dp, self: true });
      checkPlayerDeath(run);
      if (run.screen === 'gameover') return;
    }
    // ---- 联动主题:回合结束 ----
    const turnAoe = (statusOf(c.player, 'kitchen') || 0) + (statusOf(c.player, 'law') || 0) + (statusOf(c.player, 'havoc') || 0);
    if (turnAoe > 0) {
      for (const e of c.enemies.filter(x => !x.dead)) hitEnemy(run, e, turnAoe, { noRetaliate: true });
      sweepDead(run);
      if (c.over) { finishCombat(run); return; }
    }
    // 主题:光能消耗;归零则能量枯竭
    if (c.light) {
      if (owned(run, 'ul_tower') || (c.player.statuses.eternal || 0) > 0) {
        // 永恒之辉/等离子火花塔:光能不消耗
      } else {
        c.light.val = Math.max(0, c.light.val - 1);
        pushEv(run, { t: 'status', who: 'player', key: 'light', v: c.light.val });
        if (c.light.val <= 0) {
          const drain = 2 + run.act;
          run.player.hp = Math.max(0, run.player.hp - drain);
          c.hpLostThisTurn += drain;
          pushEv(run, { t: 'dmg', who: 'player', v: drain, self: true });
          pushEv(run, { t: 'text', msg: '光能耗竭!彩色计时器熄灭,失去 ' + drain + ' 点生命' });
          checkPlayerDeath(run);
          if (run.screen === 'gameover') return;
        }
      }
    }
    // 主题:燃烧生命——回合结束失去等同层数的生命
    const burnLife = statusOf(c.player, 'burnlife');
    if (burnLife > 0) {
      run.player.hp = Math.max(0, run.player.hp - burnLife);
      c.hpLostThisTurn += burnLife;
      pushEv(run, { t: 'dmg', who: 'player', v: burnLife, self: true });
      checkPlayerDeath(run);
      if (run.screen === 'gameover') return;
    }
    c.mutateBonus = 0;
    fieldTick(run);
    if (run.screen === 'gameover') return;
    if (c.over) { finishCombat(run); return; }
    // 手中状态/诅咒伤害
    let burnDmg = 0;
    for (const h of c.hand) {
      if (h.id === 'burn') burnDmg += 2;
      if (h.id === 'decay') burnDmg += 3;
      if (h.id === 'mn_burnghost') burnDmg += 4;
    }
    const scorch = statusOf(c.player, 'scorch');
    if (scorch > 0) { burnDmg += scorch; addStatus(run, c.player, 'scorch', -1, true); }
    if (burnDmg > 0) {
      run.player.hp = Math.max(0, run.player.hp - burnDmg);
      c.hpLostThisTurn += burnDmg;
      pushEv(run, { t: 'dmg', who: 'player', v: burnDmg, self: true });
      checkPlayerDeath(run);
      if (run.screen === 'gameover') return;
    }
    // 虚无牌消耗
    const staying = [];
    for (const h of c.hand) {
      if (CARDS.view(h).ethereal) exhaustCard(run, h);
      else staying.push(h);
    }
    c.hand = staying;
    // 弃手牌
    for (const h of [...c.hand]) discardCard(run, h);
    c.hand = [];
    // 临时力量消失
    if (c.player.statuses.tempStr) delete c.player.statuses.tempStr;
    // 减益递减
    for (const k of ['vuln', 'weak', 'frail']) {
      if ((c.player.statuses[k] || 0) > 0) addStatus(run, c.player, k, -1, true);
    }
    if ((c.player.statuses.weakness || 0) > 0) addStatus(run, c.player, 'weakness', -1, true);
    if ((c.player.statuses.seal || 0) > 0) addStatus(run, c.player, 'seal', -1, true);
    // 主题:龙之力遗物——「龙之意志」不衰减
    const decayKeys = owned(run, 'ft_eternal') ? ['witchscent'] : ['witchscent', 'dragonforce'];
    for (const k of decayKeys) {
      if ((c.player.statuses[k] || 0) > 0) addStatus(run, c.player, k, -1, true);
    }
    // 敌人回合
    enemyTurn(run);
    if (run.screen === 'gameover') return;
    if (c.over) { finishCombat(run); return; }
    startPlayerTurn(run, false);
  }

  function enemyTurn(run) {
    const c = run.combat;
    for (const e of c.enemies) {
      if (e.dead) continue;
      // 中毒
      const pois = statusOf(e, 'poison');
      if (pois > 0) {
        e.hp = Math.max(0, e.hp - pois);
        addStatus(run, e, 'poison', -1);
        pushEv(run, { t: 'fx', fx: 'poison', uid: e.uid });
        pushEv(run, { t: 'dmg', who: 'enemy', uid: e.uid, v: pois, self: true });
        if (e.hp <= 0) { sweepDead(run); continue; }
      }
    }
    for (const e of c.enemies) {
      if (e.dead || run.screen === 'gameover') continue;
      // 词缀回合效果
      if (e.affix) {
        e._affixTurn = (e._affixTurn || 0) + 1;
        if (e.affix === 'cursed' && RNG.chance(run, 0.35)) {
          addStatus(run, c.player, 'weak', 1, true);
          pushEv(run, { t: 'text', msg: e.affixName + '诅咒侵蚀:你获得了虚弱' });
        }
      }
      // 主题:「封锁」使敌人下一回合无法行动
      const sealAction = statusOf(e, 'sealAction');
      if (sealAction > 0) {
        addStatus(run, e, 'sealAction', -1);
        pushEv(run, { t: 'text', msg: e.name + ' 被封锁了行动' });
        continue;
      }
      const d = enemyDef(e);
      const move = d.moves[e.move] || d.moves[Object.keys(d.moves)[0]];
      e._last = e.move;
      const A = makeEnemyCtx(run, e);
      move.exec(A, e);
      // 词缀:行动后结算
      if (e.affix && !e.dead) {
        if (e.affix === 'vampiric' && e.hp < e.maxHp) {
          e.hp = Math.min(e.maxHp, e.hp + 3);
          pushEv(run, { t: 'text', msg: e.affixName + '吸血:' + e.name + ' 回复了 3 点生命' });
        }
        if (e.affix === 'shielded' && e._affixTurn % 4 === 0) {
          e.block += 5;
          pushEv(run, { t: 'text', msg: e.affixName + '固守:' + e.name + ' 获得了格挡' });
        }
      }
      // 敌人回合结束:减益递减
      for (const k of ['vuln', 'weak', 'frail']) {
        if ((e.statuses[k] || 0) > 0) addStatus(run, e, k, -1);
      }
      sweepDead(run);
      if (run.screen === 'gameover') return;
    }
    // 仪式(回合结束获得力量)
    for (const e of c.enemies) {
      if (!e.dead && statusOf(e, 'ritual') > 0) addStatus(run, e, 'str', statusOf(e, 'ritual'));
    }
    sweepDead(run);
    // 选择下一轮意图
    for (const e of c.enemies) {
      if (!e.dead) e.move = pickEnemyMove(run, e);
    }
  }

  function finishCombat(run) {
    const c = run.combat;
    if (!c.won) return;
    // 主题:伙伴的战斗胜利效果
    for (const aid of (run.player.allies || [])) {
      const d = THEMES.allyMap && THEMES.allyMap[aid];
      if (d && d.onVictory) d.onVictory(makeAllyCtx(run, aid));
    }
    // 主题:双人羁绊的胜利效果
    const thV = themeOf(run);
    if (thV && thV.duos) {
      for (const duo of thV.duos) {
        if (duo.onVictory && duo.ids.every(id => (run.player.allies || []).includes(id))) {
          duo.onVictory(makeAllyCtx(run));
        }
      }
    }
    // 奖励
    const rewards = [];
    let gold;
    if (c.kind === 'boss') gold = RNG.int(run, 75, 99);
    else if (c.kind === 'elite') gold = RNG.int(run, 25, 35);
    else gold = RNG.int(run, 10, 20);
    gold += relicVal(run, 'goldCombatBonus');
    // 每日「精英猎人」:精英金币 ×2
    if (c.kind === 'elite' && run.daily === 'elitehunter') gold *= 2;
    // 词缀敌人额外赏金
    gold += 8 * c.enemies.filter(e => e.dead && e.affix).length;
    rewards.push({ type: 'gold', amount: gold });
    // 每日「血月」:胜利后回满生命
    if (run.daily === 'bloodmoon') run.player.hp = run.player.maxHp;
    // 卡牌奖励
    const nCards = 3 + relicVal(run, 'cardRewardBonus');
    const options = rollCardReward(run, nCards);
    rewards.push({ type: 'card', options, taken: false });
    // 药水
    if (RNG.chance(run, 0.4)) rewards.push({ type: 'potion', id: POTIONS.random(run) });
    // 精英/BOSS 遗物
    if (c.kind === 'elite' || c.kind === 'boss') {
      const r = randomUnownedRelic(run);
      if (r) rewards.push({ type: 'relic', id: r });
    }
    run.rewards = rewards;
    run.rewardsClaimed = 0;
    // 战斗胜利遗物
    const heal = relicVal(run, 'healOnWin');
    if (heal) {
      run.player.hp = clamp(run.player.hp + heal, 0, run.player.maxHp);
    }
    if (c.kind === 'elite' && relicVal(run, 'healAfterElite')) {
      run.player.hp = clamp(run.player.hp + relicVal(run, 'healAfterElite'), 0, run.player.maxHp);
    }
    run.player.stats.enemies += c.enemies.length;
    if (c.kind === 'boss') run.player.stats.bosses += 1;
    run.screen = 'reward';
  }

  function rollCardReward(run, n) {
    return makeRewardCards(run, n);
  }

  /* ================= 牌局外部:奖励/地图/商店等 ================= */
  function randomUnownedRelic(run) {
    const pool = relicPoolFor(run);
    if (!pool.length) return null;
    return RNG.pick(run, pool);
  }

  function makeRewardCards(run, n) {
    const cls = run.player.cls;
    const theme = themeOf(run);
    const lucky = owned(run, 'luckylens');
    const out = [];
    const used = new Set();
    // 每日挑战「诅咒之地」:卡牌奖励 +1 张
    if (run.daily === 'cursedland') n += 1;
    // 主题局:一部分奖励从主题专属卡池中抽取,保证联动牌持续出现
    const themeQuota = theme ? Math.ceil(n * 0.6) : 0;
    for (let i = 0; i < n; i++) {
      const roll = RNG.float(run);
      let rar;
      const rareP = lucky ? 0.30 : 0.12;
      const uncP = lucky ? 0.45 : 0.37;
      if (roll < rareP) rar = 'rare';
      else if (roll < rareP + uncP) rar = 'uncommon';
      else rar = 'common';
      let pool;
      if (i < themeQuota) {
        pool = themedCardPool(run, rar).filter(id => !used.has(id));
        if (!pool.length) pool = themedCardPool(run, null).filter(id => !used.has(id));
      }
      if (!pool || !pool.length) pool = CARDS.pool(cls, rar).filter(id => !used.has(id));
      if (!pool.length) pool = CARDS.pool(cls, 'common').filter(id => !used.has(id));
      if (!pool.length) pool = themedCardPool(run, null).filter(id => !used.has(id));
      if (!pool.length) continue;
      const id = RNG.pick(run, pool);
      used.add(id);
      out.push(id);
    }
    // 客串卡:主题局 1.5% 概率,某个选项被替换为其他主题的牌
    if (theme && out.length && RNG.chance(run, 0.015)) {
      const others = THEMES.all.filter(t => t.id !== theme.id);
      const other = RNG.pick(run, others);
      const opool = (other.pool || []).filter(id => CARDS.get(id) && CARDS.get(id).rarity !== 'basic');
      if (opool.length) {
        const gi = RNG.int(run, 0, out.length - 1);
        out[gi] = RNG.pick(run, opool);
      }
    }
    return out;
  }

  /* ================= v5:难度 / 进阶 / 每日挑战 / 敌人词缀 ================= */
  const DIFF_MULTS = {
    easy: { hp: 0.85, dmg: 0.85, score: 0.8, label: '轻松' },
    normal: { hp: 1, dmg: 1, score: 1, label: '标准' },
    hard: { hp: 1.15, dmg: 1.15, score: 1.25, label: '困难' }
  };

  const DAILY_RULES = [
    { id: 'cheap', name: '廉价魔力', desc: '所有卡牌费用 -1,最大生命 -30%' },
    { id: 'elitehunter', name: '精英猎人', desc: '精英出现率大增,精英悬赏金币 ×2' },
    { id: 'bloodmoon', name: '血月', desc: '敌人伤害 +20%,每场战斗胜利后回满生命' },
    { id: 'rich', name: '贫穷贵公子', desc: '起始金币 500,商店价格 ×2' },
    { id: 'glass', name: '玻璃大炮', desc: '最大生命 50,每进入一层获得 1 张随机升级牌' },
    { id: 'cursedland', name: '诅咒之地', desc: '起始污染 +3,卡牌奖励 +1 张' },
    { id: 'turbo', name: ' turbo 魔力', desc: '每回合能量 +1,敌人生命 +25%' },
    { id: 'giantslayer', name: '巨人杀手', desc: '敌人生命 +30%,对 BOSS 伤害 +50%' }
  ];

  const AFFIXES = {
    shielded: { name: '壁垒', art: '🛡️', hpMult: 1, desc: '开场及每 3 回合获得格挡' },
    tough: { name: '坚韧', art: '💚', hpMult: 1.4, desc: '生命 +40%' },
    swift: { name: '迅捷', art: '⚡', hpMult: 0.9, desc: '伤害 +25%,生命 -10%' },
    thorny: { name: '荆棘', art: '🌵', hpMult: 1, desc: '被攻击时反伤 3 点' },
    vampiric: { name: '吸血', art: '🩸', hpMult: 1, desc: '每回合结束时回复 4 点生命' },
    cursed: { name: '诅咒', art: '☠️', hpMult: 1, desc: '每回合 35% 几率使你虚弱' }
  };
  const AFFIX_KEYS = Object.keys(AFFIXES);

  // 应用难度/进阶/每日参数:必须在 genMap 之前调用
  function applyRunOpts(run, opts) {
    opts = opts || {};
    run.difficulty = DIFF_MULTS[opts.difficulty] ? opts.difficulty : 'normal';
    run.ascension = Math.max(0, Math.min(20, opts.ascension || 0));
    const d = DIFF_MULTS[run.difficulty];
    const asc = run.ascension;
    run.enemyHpMult = d.hp * (1 + 0.07 * asc);
    run.enemyDmgMult = d.dmg * (1 + 0.04 * asc);
    if (opts.daily && DAILY_RULES.some(r => r.id === opts.daily)) {
      run.daily = opts.daily;
      if (run.daily === 'rich') run.player.gold = 500;
      if (run.daily === 'glass') { run.player.maxHp = 50; run.player.hp = 50; }
      if (run.daily === 'cheap') { run.player.maxHp = Math.max(30, Math.floor(run.player.maxHp * 0.7)); run.player.hp = run.player.maxHp; }
      if (run.daily === 'cursedland' && run.player.curse !== undefined) run.player.curse = (run.player.curse || 0) + 3;
      if (run.daily === 'turbo') run.enemyHpMult *= 1.25;
      if (run.daily === 'giantslayer') run.enemyHpMult *= 1.3;
      if (run.daily === 'bloodmoon') run.enemyDmgMult *= 1.2;
    }
    if (asc > 0) {
      // 进阶:起始生命递减(不低于 55%)
      const cut = Math.min(Math.floor(run.player.maxHp * 0.45), 2 * asc);
      run.player.maxHp -= cut; run.player.hp -= cut;
    }
  }

  function scoreMult(run) {
    const d = DIFF_MULTS[run.difficulty] || DIFF_MULTS.normal;
    let m = d.score * (1 + 0.15 * (run.ascension || 0));
    if (run.daily) m *= 1.5;
    return m;
  }

  function dailySeed(dateStr) {
    // YYYYMMDD -> 整数种子
    return parseInt(String(dateStr).replace(/-/g, ''), 10) || 20260101;
  }
  function dailyPick(dateStr) {
    const seed = dailySeed(dateStr);
    const rule = DAILY_RULES[seed % DAILY_RULES.length];
    return rule;
  }

  /* ================= Engine 主对象 ================= */
  const Engine = {
    newRun(cls, seed, opts) {
      const run = {
        v: 1,
        seed: seed === undefined ? RNG.newSeed() : seed,
        cls,
        act: 1, floorTotal: 0,
        nodeIndex: null, prevIndex: null, path: [],
        map: null,
        player: {
          cls, hp: 80, maxHp: 80, gold: 99,
          potions: [null, null, null], potionSlots: 3,
          relics: [RELICS.starter(cls)],
          deck: CARDS.starterDeck(cls),
          allies: [],
          stats: { enemies: 0, bosses: 0, cardsPlayed: 0 }
        },
        combat: null, rewards: null, rewardsClaimed: 0,
        shop: null, restDone: false,
        event: null, eventResult: null,
        screen: 'map', over: false, endless: false,
        phoenixUsed: false, removals: 0,
        stats: { score: 0 }
      };
      run.rng = { s: run.seed };
      applyRunOpts(run, opts);
      run.map = genMap(run);
      run.evts = [];
      this._run = run;
      bumpStats('runs');
      if (GS.Codex) for (const x of run.player.deck) GS.Codex.record('cards', x.id);
      saveRun(run);
      return run;
    },

    get run() { return this._run; },
    setRun(run) { this._run = run; },

    /* ---------- 联动主题开局 ---------- */
    newThemeRun(themeId, seed, starterAllyId, opts) {
      const theme = THEMES.get(themeId);
      if (!theme) throw new Error('未知联动主题: ' + themeId);
      // 初始伙伴:必须是该主题标记为 starter 的角色
      let allies = [];
      if (starterAllyId) {
        const a = (theme.allyDefs || []).find(x => x.id === starterAllyId && x.starter);
        if (a) allies = [a.id];
      }
      const run = {
        v: 1, theme: theme.id,
        seed: seed === undefined ? RNG.newSeed() : seed,
        cls: theme.cls,
        act: 1, floorTotal: 0,
        nodeIndex: null, prevIndex: null, path: [],
        map: null,
        player: {
          cls: theme.cls, hp: theme.startHp, maxHp: theme.startHp, gold: 99,
          potions: [null, null, null], potionSlots: 3,
          relics: [theme.starterRelic],
          deck: theme.starterDeck.map(id => ({ id, up: 0 })),
          curse: 0,
          allies,
          stats: { enemies: 0, bosses: 0, cardsPlayed: 0 }
        },
        wardCharges: 0,
        combat: null, rewards: null, rewardsClaimed: 0,
        shop: null, restDone: false,
        event: null, eventResult: null,
        screen: 'map', over: false, endless: false,
        phoenixUsed: false, removals: 0,
        stats: { score: 0 }
      };
      run.rng = { s: run.seed };
      applyRunOpts(run, opts);
      run.map = genMap(run);
      run.evts = [];
      this._run = run;
      bumpStats('runs');
      if (GS.Codex) {
        for (const x of run.player.deck) GS.Codex.record('cards', x.id);
        for (const aid of run.player.allies || []) GS.Codex.record('allies', aid);
      }
      saveRun(run);
      return run;
    },

    // 镜域祭坛 / 结界:走事件界面,提供多分支选择
    openDomainEvent(run, kind) {
      const theme = themeOf(run);
      const pool = ((theme && theme.npcs) || []).filter(n => n.type === kind);
      const npc = pool.length
        ? pool[Math.min(run.act - 1, pool.length - 1)] || pool[0]
        : { name: kind === 'ward' ? '镇魂结界' : '咒物祭坛', art: kind === 'ward' ? '🛡️' : '🩸', text: '' };
      const A = this.makeEventCtx(run);
      const self = this;
      const choices = [];
      if (kind === 'ward') {
        choices.push({
          label: '净化污染(失去少量生命)',
          hint: '污染 -3,获得 1 层结界护佑',
          fx() {
            const loss = Math.min(run.player.hp - 1, 5);
            if (loss > 0) A.loseHp(loss);
            run.player.curse = Math.max(0, (run.player.curse || 0) - 3);
            run.wardCharges = (run.wardCharges || 0) + 1;
            return `你以 ${loss} 点生命为代价净化了污染。`;
          }
        });
        choices.push({
          label: '稳固结界(回复生命)',
          hint: '回复 12 点生命',
          fx() { A.heal(12); return '结界的力量涌入体内,伤口开始愈合。'; }
        });
        choices.push({
          label: '研究结界(升级卡牌)',
          hint: '随机升级 1 张牌',
          fx() { const n = A.upgradeRandom(1); return n ? '你从结界中悟出了新的用法。' : '没有可以升级的牌。'; }
        });
      } else {
        choices.push({
          label: '献祭血肉(燃烧卡组)',
          hint: '污染 -3,失去 6 点生命',
          can() { return run.player.hp > 6; },
          fx() {
            A.loseHp(6);
            run.player.curse = Math.max(0, (run.player.curse || 0) - 3);
            return '祭坛吞下了你的血。污染退散了一些。';
          }
        });
        choices.push({
          label: '夺取咒物(贪婪)',
          hint: '获得 60~90 金币,但污染 +1 并加入 1 张「伤口」',
          fx() {
            A.gainGold(A.randInt(60, 90));
            run.player.curse = (run.player.curse || 0) + 1;
            A.curse('wound');
            return '你抓起了祭坛上的东西,掌心多了一道无法愈合的伤口。';
          }
        });
        choices.push({
          label: '吞下咒胎(力量)',
          hint: '失去 10 点生命,获得 1 张主题稀有牌',
          can() { return run.player.hp > 10; },
          fx() {
            A.loseHp(10);
            const ids = themedCardPool(run, 'rare');
            if (!ids.length) return '咒胎里空空如也。';
            const id = RNG.pick(run, ids);
            run.player.deck.push({ id, up: 0 });
            return '你吞下了它,得到了「' + CARDS.get(id).name + '」。';
          }
        });
      }
      run.event = {
        id: 'domain_' + kind,
        name: npc.name,
        art: npc.art,
        text: npc.text || '空气中弥漫着不属于活人的气息。',
        choices
      };
      run.eventResult = null;
      run.screen = 'event';
      void self;
    },

    /* ---------- 地图导航 ---------- */
    reachableNodes(run) {
      if (!run.map) return [];
      if (run.nodeIndex === null) return run.map[0].map((_, i) => ({ row: 0, i }));
      const { row, i } = run.nodeIndex;
      if (row >= run.map.length - 1) return [];
      return run.map[row][i].edges.map(j => ({ row: row + 1, i: j }));
    },

    enterNode(run, row, i) {
      if (run.screen === 'gameover' || run.screen === 'victory') return;
      const node = run.map[row][i];
      // 校验可达
      const ok = this.reachableNodes(run).some(p => p.row === row && p.i === i);
      if (!ok) return;
      run.prevIndex = run.nodeIndex;
      run.nodeIndex = { row, i };
      run.path.push({ row, i });
      run.floorTotal += 1;
      if (owned(run, 'cornucopia')) { run.player.gold += 10; }
      // 每日「玻璃大炮」:每层获得 1 张随机升级牌
      if (run.daily === 'glass') {
        const pool = themedCardPool(run, null).length ? themedCardPool(run, null) : CARDS.pool(run.player.cls, 'common');
        if (pool.length) {
          const id = RNG.pick(run, pool);
          run.player.deck.push({ id, up: 1 });
          if (GS.Codex) GS.Codex.record('cards', id);
        }
      }
      run.event = null; run.eventResult = null; run.restDone = false; run.rewards = null;
      // 主题:每进入新一层,镜域污染加深
      const theme = themeOf(run);
      if (theme && node.type !== 'ward' && node.type !== 'curse') {
        run.player.curse = (run.player.curse || 0) + 1;
      }
      switch (node.type) {
        case 'combat': {
          const t = themeEncounterTable(run);
          const encs = t ? t.normal : ENEMIES.encounters(Math.min(run.act, 3)).normal;
          const enc = RNG.pick(run, encs);
          startCombat(run, enc, 'normal');
          break;
        }
        case 'elite': {
          const t = themeEncounterTable(run);
          const encs = t ? t.elite : ENEMIES.encounters(Math.min(run.act, 3)).elite;
          const enc = RNG.pick(run, encs);
          startCombat(run, enc, 'elite');
          break;
        }
        case 'boss': {
          const t = themeEncounterTable(run);
          const encs = t ? t.boss : ENEMIES.encounters(Math.min(run.act, 3)).boss;
          startCombat(run, encs[0], 'boss');
          break;
        }
        case 'curse': {
          // 镜域的「咒物祭坛」:以生命或卡组为代价换取力量
          this.openDomainEvent(run, 'curse');
          break;
        }
        case 'ward': {
          // 「镇魂结界 / 简易领域」:净化污染、休整或升级
          this.openDomainEvent(run, 'ward');
          break;
        }
        case 'rest':
          run.screen = 'rest';
          break;
        case 'shop': {
          run.shop = genShop(run);
          if (owned(run, 'glassvial')) this.gainPotion(run);
          run.screen = 'shop';
          break;
        }
        case 'treasure': {
          const r = randomUnownedRelic(run);
          run.rewards = [];
          if (r) run.rewards.push({ type: 'relic', id: r });
          if (RNG.chance(run, 0.4)) run.rewards.push({ type: 'potion', id: POTIONS.random(run) });
          const g = RNG.int(run, 25, 60);
          run.rewards.push({ type: 'gold', amount: g });
          if (owned(run, 'lantern')) run.rewards.push({ type: 'gold', amount: 25 });
          run.rewardsClaimed = 0;
          run.screen = 'treasure';
          break;
        }
        case 'event': {
          // 主题局:80% 出主题专属事件,20% 出通用事件
          const th = themeOf(run);
          if (th && th.events && th.events.length && RNG.chance(run, 0.8)) {
            run.event = RNG.pick(run, th.events);
          } else {
            run.event = EVENTS.random(run);
          }
          if (GS.Codex && run.event && run.event.id) GS.Codex.record('events', run.event.id);
          run.eventResult = null;
          run.screen = 'event';
          break;
        }
      }
      saveRun(run);
    },

    /* ---------- 战斗动作 ---------- */
    cardCost(run, inst) {
      const view = cardView(run, inst);
      let cost = view.cost;
      if (cost === 'X') return 0;
      if (run.combat && !run.combat.firstSkillUsed && view.type === 'skill' && owned(run, 'silkthread') && cost > 0) cost -= 1;
      // ---- 联动主题 ----
      if (run.combat && view.tech) {
        // 每回合第一张咒术牌免费
        if (!run.combat.techniqueUsed) return 0;
        const cd = run.combat.costDelta;
        if (cd && cd.count > 0 && typeof cost === 'number') cost = Math.max(0, cost + cd.n);
      }
      // 每日挑战「廉价魔力」:所有卡牌费用 -1
      if (run.daily === 'cheap' && typeof cost === 'number' && cost > 0) cost -= 1;
      return cost;
    },
    effectiveView(run, inst) {
      const view = { ...cardView(run, inst) };
      if (inst && inst._tempUp && !inst.up) view.upMark = true;
      return view;
    },
    calcCardDamage(run, inst, target) {
      const view = this.effectiveView(run, inst);
      let base = (view.dmg || 0) + ((run.combat && run.combat.permBoosts[inst.uid]) || 0);
      if (inst.id === 'shiv' && run.combat) base += run.combat.shivBonus || 0;
      const amt = calcPlayerAttack(run, base, target || (run.combat && run.combat.enemies.find(e => !e.dead)), {
        ce: !!view.ceScale, curseDmg: curseDamageBonus(run)
      });
      return amt;
    },
    calcCardBlock(run, inst) {
      const view = this.effectiveView(run, inst);
      let amt = (view.block || 0) + ((run.combat && run.combat.player.statuses.dex) || 0);
      if (run.combat && (run.combat.player.statuses.frail || 0) > 0) amt = Math.floor(amt * 0.75);
      return Math.max(0, amt);
    },

    canPlay(run, handIdx) {
      const c = run.combat;
      if (!c || c.over || run.screen !== 'combat') return false;
      if (c.pending) return false;
      const inst = c.hand[handIdx];
      if (!inst) return false;
      const view = this.effectiveView(run, inst);
      if (view.unplayable) return false;
      const cost = this.cardCost(run, inst);
      if (cost > c.player.energy) return false;
      if (view.target === 'enemy' && !c.enemies.some(e => !e.dead)) return false;
      if (view.target === 'random' && !c.enemies.some(e => !e.dead)) return false;
      return true;
    },

    playCard(run, handIdx, targetIdx) {
      const c = run.combat;
      if (!this.canPlay(run, handIdx)) return false;
      const inst = c.hand[handIdx];
      const view = this.effectiveView(run, inst);
      // 支付费用
      if (view.cost !== 'X') {
        c.player.energy -= this.cardCost(run, inst);
      }
      // 咒术:记录本回合首张咒术牌(已免费),并消耗「术式顺转」减费
      if (view.tech) {
        if (!c.techniqueUsed) {
          c.techniqueUsed = true;
          pushEv(run, { t: 'text', msg: '咒术发动 · 首次免费' });
        } else if (c.costDelta && c.costDelta.count > 0) {
          c.costDelta.count -= 1;
          if (c.costDelta.count <= 0) c.costDelta = null;
        }
      }
      // 黑闪预告由 attack 内部结算
      if (view.type === 'skill') c.firstSkillUsed = true;
      // 从手牌移除
      c.hand.splice(handIdx, 1);
      pushEv(run, { t: 'play', name: view.name });
      // 剧痛诅咒
      let painCount = 0;
      for (const h of c.hand) if (h.id === 'pain') painCount++;
      if (painCount > 0) {
        run.player.hp -= painCount;
        c.hpLostThisTurn += painCount;
        pushEv(run, { t: 'dmg', who: 'player', v: painCount, self: true });
        checkPlayerDeath(run);
        if (run.screen === 'gameover') return true;
      }
      // 目标解析
      const living = c.enemies.filter(e => !e.dead);
      let target = null;
      if (view.target === 'enemy') target = living[clamp(targetIdx === undefined ? 0 : targetIdx, 0, living.length - 1)];
      const exec = (isEcho) => {
        const ctx = makeCardCtx(run, inst, target, { echo: isEcho });
        if (view.play) view.play(ctx, inst, target);
        else if (view.dmg) {
          // 纯数值卡的默认行为
          if (view.target === 'all') ctx.attackAll();
          else if (view.target === 'random') ctx.attackRandom();
          else ctx.attack(target);
        } else if (view.block && view.type === 'skill') {
          ctx.gainBlock();
        }
        // 敌方"技能反制"钩子(血斧兽王)
        if (view.type === 'skill') {
          for (const e of c.enemies.filter(e => !e.dead)) {
            const ed = enemyDef(e);
            if (ed.onPlayerSkill) ed.onPlayerSkill(makeEnemyCtx(run, e), e);
          }
        }
        // 残影
        const ai = statusOf(c.player, 'afterimage');
        if (ai > 0) gainPlayerBlock(run, ai);
        // 千刀万剐
        const cuts = statusOf(c.player, 'cuts');
        if (cuts > 0) {
          for (const e of c.enemies.filter(e => !e.dead)) hitEnemy(run, e, cuts, { noRetaliate: true });
        }
        sweepDead(run);
      };
      // 主题:伙伴联动——打出对应卡牌时,额外触发伙伴的专属效果
      for (const aid of (run.player.allies || [])) {
        const ad = THEMES.allyMap && THEMES.allyMap[aid];
        if (ad && ad.synergy && ad.synergy.ids && ad.synergy.ids.includes(inst.id)) {
          ad.synergy.fx(makeCardCtx(run, inst, target), inst, target);
          pushEv(run, { t: 'text', msg: '🔗 ' + ad.name + '·' + (ad.synergy.name || '联动') + '!' });
        }
      }
      exec(false);
      const echoReady = (c.player.statuses.echo || 0) > 0 && c.cardsPlayed === 0 && !view.unplayable;
      // 移动卡牌去向(回响副本不再移动)
      if (view.exhaust) exhaustCard(run, inst);
      else discardCard(run, inst);
      // 回响:本回合第一张牌再执行一次
      if (echoReady && view.type !== 'power') {
        pushEv(run, { t: 'text', msg: '回响!' });
        exec(true);
      }
      c.cardsPlayed += 1;
      c.combatCards = (c.combatCards || 0) + 1;
      if (!c.playedIds) c.playedIds = [];
      if (!c.playedIds.includes(inst.id)) c.playedIds.push(inst.id);
      sweepDead(run);
      // 主题「法天象地」:打出攻击牌获得棍势
      if ((c.player.statuses.growstaff || 0) > 0 && view.type === 'attack') {
        addStatus(run, c.player, 'cudgel', c.player.statuses.growstaff, true);
      }
      // 主题「鬼 / 精灵」:打出牌触发(精灵仅在打出技能牌时触发)
      if (c.player.ghostName && run.screen === 'combat') {
        const gk = c.player.ghostKey || '';
        const spiritOk = gk.indexOf('rz_') !== 0 || view.type === 'skill';
        if (spiritOk) {
          c.ghostTriggered = (c.ghostTriggered || 0) + 1;
          const extra = (owned(run, 'mystcoffin') && c.ghostTriggered === 1) ? 2 : 1;
          for (let g = 0; g < extra; g++) ghostTrigger(run, makeCardCtx(run, inst, target, { echo: true }));
          sweepDead(run);
        }
      }
      if (c.over && c.won) finishCombat(run);
      saveRun(run);
      return true;
    },

    endTurn(run) {
      const c = run.combat;
      if (!c || c.over || run.screen !== 'combat' || c.pending) return;
      endPlayerTurn(run);
      if (run.screen !== 'gameover' && run.combat && run.combat.over && run.combat.won) finishCombat(run);
      saveRun(run);
    },

    /* ---------- 待选交互 ---------- */
    resolveDiscard(run, indices) {
      const c = run.combat;
      if (!c || !c.pending || c.pending.type !== 'discard') return;
      const sel = [...new Set(indices)].filter(i => i >= 0 && i < c.hand.length);
      if (sel.length !== c.pending.n) return;
      sel.sort((a, b) => b - a);
      for (const i of sel) { discardCard(run, c.hand[i]); c.hand.splice(i, 1); }
      c.pending = null;
      saveRun(run);
    },
    resolveDiscardToTop(run, discardIdx) {
      const c = run.combat;
      if (!c || !c.pending || c.pending.type !== 'discardToTop') return;
      const inst = c.discard[discardIdx];
      if (!inst) return;
      c.discard.splice(discardIdx, 1);
      c.draw.push(inst);
      c.pending = null;
    },
    cancelPending(run) {
      const c = run.combat;
      if (c && c.pending && c.pending.type === 'discardToTop') c.pending = null;
    },

    /* ---------- 药水 ---------- */
    potionUsable(run, slot) {
      const p = run.player.potions[slot];
      if (!p) return false;
      const d = POTIONS.get(p);
      const inCombat = run.screen === 'combat' && run.combat && !run.combat.over;
      if (!d.anywhere && !inCombat) return false;
      if ((d.target === 'enemy') && !inCombat) return false;
      return true;
    },
    usePotion(run, slot, targetIdx) {
      if (!this.potionUsable(run, slot)) return false;
      const id = run.player.potions[slot];
      const d = POTIONS.get(id);
      const inCombat = run.screen === 'combat' && run.combat && !run.combat.over;
      let A;
      if (inCombat) {
        const living = run.combat.enemies.filter(e => !e.dead);
        const t = d.target === 'enemy' ? living[clamp(targetIdx || 0, 0, living.length - 1)] : null;
        A = makeCardCtx(run, null, t, {});
      } else {
        A = this.makeWorldCtx(run);
      }
      d.use(A, id, A.target);
      run.player.potions[slot] = null;
      if (inCombat) {
        sweepDead(run);
        if (run.combat.over && run.combat.won) finishCombat(run);
      }
      pushEv(run, { t: 'potion', name: d.name });
      saveRun(run);
      return true;
    },
    gainPotion(run, id) {
      const slot = run.player.potions.findIndex(x => !x);
      if (slot === -1) { run.player.gold += 15; pushEv(run, { t: 'text', msg: '药水已满,转为 15 金币' }); return false; }
      run.player.potions[slot] = id || POTIONS.random(run);
      return true;
    },
    discardPotion(run, slot) {
      if (!run.player.potions[slot]) return;
      run.player.potions[slot] = null;
    },

    /* ---------- 奖励界面 ---------- */
    claimReward(run, idx) {
      const r = run.rewards[idx];
      if (!r || r.taken) return;
      if (r.type === 'gold') {
        run.player.gold += r.amount;
        r.taken = true;
      } else if (r.type === 'potion') {
        // 药水栏满时 gainPotion 内部转为 15 金币;无论成败都标记已领取,防止反复领取
        this.gainPotion(run, r.id);
        r.taken = true;
      } else if (r.type === 'relic') {
        this.acquireRelic(run, r.id);
        r.taken = true;
      } else if (r.type === 'card') {
        // UI 先弹出选牌
        r.taken = true;
      }
      saveRun(run);
    },
    takeCardReward(run, rewardIdx, cardId) {
      const r = run.rewards[rewardIdx];
      if (!r || r.type !== 'card' || r.taken) return;
      run.player.deck.push({ id: cardId, up: 0 });
      if (GS.Codex) GS.Codex.record('cards', cardId);
      r.taken = true;
      saveRun(run);
    },
    skipCardReward(run, rewardIdx) {
      const r = run.rewards[rewardIdx];
      if (!r || r.type !== 'card' || r.taken) return;
      r.taken = true;
      saveRun(run);
    },
    leaveReward(run) {
      const isBoss = run.combat && run.combat.kind === 'boss';
      const theme = themeOf(run);
      run.rewards = null;
      run.combat = null;
      if (isBoss) {
        if (theme) {
          // 镜域:打完本段 BOSS 后进入下一段,走完所有段即通关
          if (run.act >= theme.acts.length && !run.endless) {
            run.screen = 'victory';
            run.player.stats.won = true;
            bumpStats('wins');
            bumpClassWin(run.cls);
            Engine.onVictoryScore(run);
            Engine.onRunWon(run);
            saveRun(run);
            return;
          }
          run.act += 1;
          run.nodeIndex = null;
          run.path = [];
          run.map = genMap(run);
          run.player.curse = Math.max(0, (run.player.curse || 0) - 1);
          const bonus = Math.floor(run.player.maxHp * 0.25);
          run.player.hp = clamp(run.player.hp + bonus, 0, run.player.maxHp);
          const nextAct = themeActOf(run);
          pushEv(run, { t: 'text', msg: '通往下一片镜域:回复 ' + bonus + ' 点生命' + (nextAct ? ' · ' + nextAct.name : '') });
          run.screen = 'map';
          saveRun(run);
          return;
        }
        if (run.act >= 3 && !run.endless) {
          run.screen = 'victory';
          run.player.stats.won = true;
          bumpStats('wins');
          bumpClassWin(run.cls);
          Engine.onVictoryScore(run);
          Engine.onRunWon(run);
          saveRun(run);
          return;
        }
        run.act += 1;
        run.nodeIndex = null;
        run.path = [];
        run.map = genMap(run);
        // 幕间休整:击败 BOSS 后回复 25% 生命
        const bonus = Math.floor(run.player.maxHp * 0.25);
        run.player.hp = clamp(run.player.hp + bonus, 0, run.player.maxHp);
        pushEv(run, { t: 'text', msg: '幕间休整:回复 ' + bonus + ' 点生命' });
        run.screen = 'map';
      } else {
        run.screen = 'map';
      }
      saveRun(run);
    },

    acquireRelic(run, id) {
      if (owned(run, id)) return;
      run.player.relics.push(id);
      const d = RELICS.get(id);
      if (d.potionSlots) {
        run.player.potionSlots += d.potionSlots;
        run.player.potions.push(null);
      }
      if (d.onAcquire) {
        const g = this.makeWorldCtx(run);
        d.onAcquire(g);
      }
      pushEv(run, { t: 'relic', name: d.name });
    },

    /* ---------- 商店 ---------- */
    shopPrice(run, base) {
      let mult = 1;
      if (owned(run, 'membercard')) mult *= 0.5;
      if (owned(run, 'ancientcoin')) mult *= 0.8;
      if (run.daily === 'rich') mult *= 2;
      return Math.max(1, Math.round(base * mult));
    },
    buyShopItem(run, kind, idx) {
      const s = run.shop;
      if (!s) return false;
      if (kind === 'card') {
        const it = s.cards[idx];
        const price = this.shopPrice(run, it && it.price);
        if (!it || it.sold || run.player.gold < price) return false;
        run.player.gold -= price;
        run.player.deck.push({ id: it.id, up: 0 });
        it.sold = true;
      } else if (kind === 'potion') {
        const it = s.potions[idx];
        const price = this.shopPrice(run, it && it.price);
        if (!it || it.sold || run.player.gold < price) return false;
        if (!this.gainPotion(run, it.id)) return false;
        run.player.gold -= price;
        it.sold = true;
      } else if (kind === 'relic') {
        const it = s.relics[idx];
        const price = this.shopPrice(run, it && it.price);
        if (!it || it.sold || run.player.gold < price) return false;
        run.player.gold -= price;
        this.acquireRelic(run, it.id);
        it.sold = true;
      } else if (kind === 'ally') {
        const it = s.allies && s.allies[idx];
        const price = this.shopPrice(run, it && it.price);
        const cap = (GS.THEMES && GS.THEMES.allyCap) || 4;
        if (!it || it.sold || run.player.gold < price) return false;
        if ((run.player.allies || []).length >= cap) return false;
        run.player.gold -= price;
        if (!run.player.allies) run.player.allies = [];
        run.player.allies.push(it.id);
        it.sold = true;
      } else if (kind === 'remove') {
        const price = this.removePrice(run);
        if (s.removeUsed || run.player.gold < price) return false;
        run.player.gold -= price;
        run.removals += 1;
        s.removeUsed = true;
        s.awaitingRemove = true; // UI 弹出选牌
      }
      if (GS.Codex) {
        if (kind === 'card' && s.cards && s.cards[idx]) GS.Codex.record('cards', s.cards[idx].id);
        if (kind === 'ally' && s.allies && s.allies[idx]) GS.Codex.record('allies', s.allies[idx].id);
      }
      saveRun(run);
      return true;
    },

    /* ---------- v5:伙伴训练 / 伙伴主动技能 ---------- */
    allyTrainPrice(run, allyId) {
      const lv = (run.player.allyLv && run.player.allyLv[allyId]) || 1;
      if (lv >= 3) return null; // 已满级
      return 90 + 70 * (lv - 1);
    },
    buyAllyTrain(run, allyId) {
      if (!(run.player.allies || []).includes(allyId)) return false;
      const price = this.allyTrainPrice(run, allyId);
      if (price === null || run.player.gold < price) return false;
      run.player.gold -= price;
      if (!run.player.allyLv) run.player.allyLv = {};
      run.player.allyLv[allyId] = (run.player.allyLv[allyId] || 1) + 1;
      saveRun(run);
      return true;
    },
    allyLv(run, allyId) { return (run.player.allyLv && run.player.allyLv[allyId]) || 1; },
    allyActiveInfo(run) {
      const c = run.combat;
      if (!c) return [];
      return (run.player.allies || []).map(aid => {
        const d = THEMES.allyMap && THEMES.allyMap[aid];
        const used = !!(c.allyActiveUsed && c.allyActiveUsed[aid]);
        return { id: aid, name: d ? d.name : aid, active: d && d.active ? d.active : null, used, lv: this.allyLv(run, aid) };
      });
    },
    useAllyActive(run, aid) {
      const c = run.combat;
      if (!c || c.over || run.screen !== 'combat') return false;
      if (!(run.player.allies || []).includes(aid)) return false;
      const d = THEMES.allyMap && THEMES.allyMap[aid];
      if (!d || !d.active) return false;
      if (!c.allyActiveUsed) c.allyActiveUsed = {};
      if (c.allyActiveUsed[aid]) return false;
      c.allyActiveUsed[aid] = true;
      d.active.fx(makeAllyCtx(run, aid));
      pushEv(run, { t: 'text', msg: '⚡ ' + d.name + '发动「' + d.active.name + '」!' });
      sweepDead(run);
      if (c.over) finishCombat(run);
      checkPlayerDeath(run);
      saveRun(run);
      return true;
    },

    /* ---------- v5:双分支升级(锻造时选 A/B) ---------- */
    resolvePendingBranch(run, deckIdx, path) {
      const p = run.pending;
      if (!p || p.type !== 'smith') return;
      const inst = run.player.deck[deckIdx];
      if (!inst || inst.up || !CARDS.upgradeable(inst.id)) return;
      inst.up = 1;
      if (path === 2 && CARDS.branchable(inst.id)) inst.path = 2;
      run.pending = null;
      saveRun(run);
    },
    removePrice(run) { return 75 + 25 * (run.removals || 0); },
    shopRemoveCard(run, deckIdx) {
      const s = run.shop;
      if (!s || !s.awaitingRemove) return;
      const inst = run.player.deck[deckIdx];
      if (!inst) return;
      run.player.deck.splice(deckIdx, 1);
      s.awaitingRemove = false;
      saveRun(run);
    },
    leaveShop(run) {
      run.shop = null;
      run.screen = 'map';
      saveRun(run);
    },

    /* ---------- 篝火 ---------- */
    restHealAmount(run) {
      return Math.floor(run.player.maxHp * 0.3) + relicVal(run, 'restHealBonus');
    },
    restHeal(run) {
      if (run.screen !== 'rest' || run.restDone) return;
      const amt = this.restHealAmount(run);
      run.player.hp = clamp(run.player.hp + amt, 0, run.player.maxHp);
      run.restDone = true;
      pushEv(run, { t: 'heal', who: 'player', v: amt });
      saveRun(run);
    },
    restSmithCount(run) { return 1 + relicVal(run, 'smithBonus'); },
    restSmith(run) {
      if (run.screen !== 'rest' || run.restDone) return;
      run.restDone = true;
      run.pending = { type: 'smith', n: this.restSmithCount(run) };
      saveRun(run);
    },
    restPurify(run) {
      if (run.screen !== 'rest' || run.restDone) return;
      if (!relicHas(run, 'purifyAtRest')) return;
      run.restDone = true;
      run.pending = { type: 'remove', n: 1 };
      saveRun(run);
    },
    leaveRest(run) {
      run.screen = 'map';
      saveRun(run);
    },

    /* ---------- 事件 ---------- */
    eventCan(run, idx) {
      const ch = run.event.choices[idx];
      if (!ch) return false;
      if (ch.can && !ch.can(this.makeEventProxy(run))) return false;
      return true;
    },
    chooseEvent(run, idx) {
      if (run.screen !== 'event' || run.eventResult) return;
      if (!this.eventCan(run, idx)) return;
      const ch = run.event.choices[idx];
      const A = this.makeEventCtx(run);
      run.eventResult = ch.fx(A) || '';
      // 事件中可能死亡
      if (run.player.hp <= 0) {
        run.screen = 'gameover';
        run.gameoverSeen = false;
        saveRun(run);
        return;
      }
      saveRun(run);
    },
    leaveEvent(run) {
      run.event = null;
      run.eventResult = null;
      run.screen = 'map';
      saveRun(run);
    },

    /* ---------- 通用上下文(事件/遗物获取) ---------- */
    makeEventProxy(run) {
      const self = this;
      return {
        gold: () => run.player.gold,
        hp: () => run.player.hp,
        maxHp: () => run.player.maxHp
      };
    },
    makeWorldCtx(run) {
      const self = this;
      return {
        gold: () => run.player.gold,
        hp: () => run.player.hp,
        maxHp: () => run.player.maxHp,
        heal(n) { run.player.hp = clamp(run.player.hp + n, 0, run.player.maxHp); },
        loseHp(n) { run.player.hp -= n; if (run.player.hp <= 0) { run.player.hp = 0; } },
        gainGold(n) { run.player.gold += Math.floor(n * (relicHas(run, 'eventGoldMult') ? 2 : 1)); },
        loseGold(n) { run.player.gold = Math.max(0, run.player.gold - n); },
        addMaxHp(n) {
          run.player.maxHp = Math.max(10, run.player.maxHp + n);
          if (n > 0) run.player.hp += n;
          run.player.hp = clamp(run.player.hp, 1, run.player.maxHp);
        },
        chance(p) { return RNG.chance(run, p); },
        randInt(a, b) { return RNG.int(run, a, b); },
        randomRelic() { const r = randomUnownedRelic(run); if (r) self.acquireRelic(run, r); return r; },
        relicName(id) { const d = RELICS.get(id); return d ? d.name : '神秘物品'; },
        gainPotion(id) { self.gainPotion(run, id); },
        curse(id) { run.player.deck.push({ id, up: 0 }); },
        gainRareCard() {
          const pool = CARDS.pool(run.player.cls, 'rare');
          if (!pool.length) return;
          run.player.deck.push({ id: RNG.pick(run, pool), up: 0 });
        },
        chooseColorless() {
          run.pending = { type: 'colorless', n: 1 };
        },
        removeCard() { run.pending = { type: 'remove', n: 1 }; },
        upgradeChoose() { run.pending = { type: 'smith', n: 1 }; },
        upgradeRandom(n) {
          let cnt = 0;
          const cand = run.player.deck.filter(x => !x.up && CARDS.upgradeable(x.id));
          RNG.shuffle(run, cand);
          for (const x of cand) { if (cnt >= n) break; x.up = 1; cnt++; }
          return cnt;
        },
        upgradeRandomWhere(pred, n) {
          let cnt = 0;
          const cand = run.player.deck.filter(x => !x.up && CARDS.upgradeable(x.id) && pred(CARDS.get(x.id)));
          RNG.shuffle(run, cand);
          for (const x of cand) { if (cnt >= n) break; x.up = 1; cnt++; }
          return cnt;
        },
        countCards(pred) { return run.player.deck.filter(x => pred(CARDS.get(x.id))).length; },
        removeWhere(pred) { run.player.deck = run.player.deck.filter(x => !pred(CARDS.get(x.id))); },
        transform() { run.pending = { type: 'transform', n: 1 }; },
        duplicate() { run.pending = { type: 'duplicate', n: 1 }; },
        /* ---- v5:主题事件辅助 ---- */
        gainThemeCard(rar) {
          const ids = themedCardPool(run, rar);
          if (!ids.length) return;
          const id = RNG.pick(run, ids);
          run.player.deck.push({ id, up: 0 });
          if (global.GS.Codex) global.GS.Codex.record('cards', id);
          return id;
        },
        addCurse(n) {
          if (run.player.curse !== undefined) run.player.curse = (run.player.curse || 0) + n;
        },
        reduceCurse(n) {
          if (run.player.curse !== undefined) run.player.curse = Math.max(0, (run.player.curse || 0) - n);
        }
      };
    },
    makeEventCtx(run) { return this.makeWorldCtx(run); },

    /* ---------- 待选卡牌(卡组层面) ---------- */
    pendingInfo(run) {
      const p = run.pending;
      if (!p) return null;
      const info = { ...p };
      if (p.type === 'smith') {
        info.title = p.n > 1 ? '选择 ' + p.n + ' 张牌进行升级' : '选择 1 张牌进行升级';
        info.filter = (inst) => !inst.up && CARDS.upgradeable(inst.id);
      } else if (p.type === 'remove') {
        info.title = '选择 1 张牌移除';
        info.filter = () => true;
      } else if (p.type === 'transform') {
        info.title = '选择 1 张牌变化';
        info.filter = (inst) => CARDS.get(inst.id).cls !== 'status' && CARDS.get(inst.id).cls !== 'curse' && CARDS.get(inst.id).cls !== 'special';
      } else if (p.type === 'duplicate') {
        info.title = '选择 1 张牌复制';
        info.filter = (inst) => CARDS.get(inst.id).rarity !== 'special';
      } else if (p.type === 'colorless') {
        info.title = '选择 1 张无色牌';
        info.pool = rollColorless(run, 3);
      }
      return info;
    },
    resolvePending(run, indices) {
      const p = run.pending;
      if (!p) return;
      if (p.type === 'smith') {
        for (const i of [...new Set(indices)]) {
          const inst = run.player.deck[i];
          if (inst && !inst.up && CARDS.upgradeable(inst.id)) inst.up = 1;
        }
      } else if (p.type === 'remove') {
        for (const i of [...new Set(indices)].sort((a, b) => b - a)) {
          run.player.deck.splice(i, 1);
        }
      } else if (p.type === 'transform') {
        const inst = run.player.deck[indices[0]];
        if (inst) {
          const cls = CARDS.get(inst.id).cls;
          const pool = (cls === 'none' || cls === 'colorless') ? [...CARDS.pool(run.player.cls, 'common'), ...CARDS.pool(run.player.cls, 'uncommon'), ...CARDS.pool(run.player.cls, 'rare')] : [...CARDS.pool(cls, 'common'), ...CARDS.pool(cls, 'uncommon'), ...CARDS.pool(cls, 'rare')];
          if (pool.length) inst.id = RNG.pick(run, pool);
          inst.up = 0;
        }
      } else if (p.type === 'duplicate') {
        const inst = run.player.deck[indices[0]];
        if (inst) run.player.deck.push({ id: inst.id, up: inst.up });
      } else if (p.type === 'colorless') {
        const id = indices.id;
        if (id) run.player.deck.push({ id, up: 0 });
      }
      run.pending = null;
      saveRun(run);
    },

    /* ---------- 无尽模式 ---------- */
    continueEndless(run) {
      if (run.screen !== 'victory') return;
      run.endless = true;
      run.act += 1;
      run.nodeIndex = null;
      run.map = genMap(run);
      run.screen = 'map';
      saveRun(run);
    },

    /* ---------- 结束 ---------- */
    score(run) {
      const base = run.floorTotal * 2 + Math.floor(run.player.gold / 10) + run.player.stats.bosses * 50 + (run.player.stats.won ? 500 : 0);
      return Math.floor(base * scoreMult(run));
    },

    drainEvents(run) {
      const e = run.evts || [];
      run.evts = [];
      return e;
    },

    // UI 辅助:敌人意图展示信息
    intentInfo(run, e) {
      const d = enemyDef(e);
      const mv = d.moves[e.move] || d.moves[Object.keys(d.moves)[0]];
      let dmg = 0;
      if (mv.dmg) {
        dmg = calcEnemyAttack(run, e, mv.dmg);
        if (run.act > 3) dmg = Math.floor(dmg * (1 + 0.15 * (run.act - 3)));
      }
      return { key: e.move, name: mv.name, intent: mv.intent, dmg, hits: mv.hits || 1 };
    }
  };

  function rollColorless(run, n) {
    const pool = [...CARDS.colorlessPool('uncommon'), ...CARDS.colorlessPool('rare')];
    RNG.shuffle(run, pool);
    return pool.slice(0, n);
  }

  /* ================= 商店生成 ================= */
  function genShop(run) {
    const cls = run.player.cls;
    const themeT = themeOf(run);
    const cards = [];
    const rars = ['common', 'common', 'uncommon', 'uncommon', 'rare'];
    const used = new Set();
    for (const rar of rars) {
      let pool;
      // 主题局:商店里主题牌与职业牌交替出现
      if (themeT && RNG.chance(run, 0.6)) pool = themedCardPool(run, rar).filter(id => !used.has(id));
      if (!pool || !pool.length) pool = CARDS.pool(cls, rar).filter(id => !used.has(id));
      if (!pool.length) pool = themedCardPool(run, null).filter(id => !used.has(id));
      if (!pool.length) continue;
      const id = RNG.pick(run, pool);
      used.add(id);
      const base = { common: RNG.int(run, 45, 55), uncommon: RNG.int(run, 68, 82), rare: RNG.int(run, 135, 165) }[rar];
      cards.push({ id, price: base, sold: false });
    }
    if (themeT) {
      for (const cid of rollColorless(run, 2)) {
        cards.push({ id: cid, price: RNG.int(run, 85, 115), sold: false });
      }
    }
    const potions = [];
    const pUsed = new Set();
    for (let i = 0; i < 3; i++) {
      let id;
      let guard = 0;
      do { id = POTIONS.random(run); guard++; } while (pUsed.has(id) && guard < 20);
      pUsed.add(id);
      potions.push({ id, price: RNG.int(run, 48, 66), sold: false });
    }
    const relics = [];
    const rPool = relicPoolFor(run);
    RNG.shuffle(run, rPool);
    for (let i = 0; i < 2 && i < rPool.length; i++) {
      const d = RELICS.get(rPool[i]);
      const base = d.rarity === 'rare' ? RNG.int(run, 160, 190) : RNG.int(run, 140, 170);
      relics.push({ id: rPool[i], price: base, sold: false });
    }
    // 主题局:伙伴货架(仅出售商店限定角色,初始伙伴只能在开局选择,限购至 4 名)
    const allies = [];
    if (themeT && (run.player.allies || []).length < (GS.THEMES.allyCap || 4)) {
      const aPool = (themeT.allyDefs || []).filter(a =>
        !a.starter && !(run.player.allies || []).includes(a.id));
      if (aPool.length) {
        const d = RNG.pick(run, aPool);
        allies.push({ id: d.id, price: d.cost, sold: false });
      }
    }
    return {
      cards, potions, relics, allies,
      removeUsed: false, awaitingRemove: false
    };
  }

  /* ================= 存档 / 统计 ================= */
  function saveRun(run) {
    try {
      if (run === null) { localStorage.removeItem(SAVE_KEY); return; }
      if (run.screen === 'gameover') return;
      const data = JSON.parse(JSON.stringify(run, (k, v) => {
        if (k === 'evts') return undefined;
        return v;
      }));
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { /* 存储不可用时忽略 */ }
  }

  function loadRun() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const run = JSON.parse(raw);
      if (!run || run.v !== 1) return null;
      // 兼容旧存档:补齐联动主题字段
      if (run.theme && !THEMES.get(run.theme)) run.theme = null;
      if (run.theme) { run.player.curse = run.player.curse || 0; run.wardCharges = run.wardCharges || 0; }
      run.evts = [];
      if (!run.path) run.path = [];
      Engine._run = run;
      // 战斗中的牌 uid 需要继续分配
      const maxUid = scanMaxUid(run);
      uidCounter = maxUid + 1;
      return run;
    } catch (e) { return null; }
  }
  function scanMaxUid(obj) {
    let m = 0;
    if (Array.isArray(obj)) { for (const x of obj) m = Math.max(m, scanMaxUid(x)); }
    else if (obj && typeof obj === 'object') {
      for (const k in obj) {
        if (k === 'uid' && typeof obj[k] === 'number') m = Math.max(m, obj[k]);
        else m = Math.max(m, scanMaxUid(obj[k]));
      }
    }
    return m;
  }

  function loadStats() {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        s.points = s.points || 0;
        s.spent = s.spent || 0;
        return s;
      }
    } catch (e) { }
    return { runs: 0, wins: 0, losses: 0, best: 0, points: 0, spent: 0, classWins: { warrior: 0, ranger: 0, warlock: 0 } };
  }
  function saveStats(s) {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) { }
  }
  function bumpStats(key) {
    const s = loadStats();
    s[key] = (s[key] || 0) + 1;
    saveStats(s);
  }
  function bumpClassWin(cls) {
    const s = loadStats();
    s.classWins[cls] = (s.classWins[cls] || 0) + 1;
    saveStats(s);
  }
  Engine.saveRun = saveRun;
  Engine.loadRun = loadRun;
  Engine.loadStats = loadStats;
  Engine._testStartCombat = startCombat; // 测试钩子
  Engine._testGenShop = genShop; // 测试钩子
  Engine._testSpawn = spawnEnemy; // 测试钩子
  Engine._testRewardCards = makeRewardCards; // 测试钩子
  Engine.bumpStats = bumpStats;
  Engine.onGameOver = function (run) {
    bumpStats('losses');
    const sc = Engine.score(run);
    const s = loadStats();
    if (sc > s.best) { s.best = sc; saveStats(s); }
    Engine.awardRunPoints(run);
    saveRun(null);
  };
  // 积分:每局结束按得分发放,用于解锁技能包
  Engine.awardRunPoints = function (run) {
    if (!run || run.pointsAwarded) return 0;
    run.pointsAwarded = true;
    const sc = Engine.score(run);
    const s = loadStats();
    s.points += sc;
    saveStats(s);
    return sc;
  };
  Engine.availablePoints = function () {
    const s = loadStats();
    return Math.max(0, s.points - s.spent);
  };
  Engine.spendPoints = function (n) {
    if (Engine.availablePoints() < n) return false;
    const s = loadStats();
    s.spent += n;
    saveStats(s);
    return true;
  };
  Engine.onVictoryScore = function (run) {
    const sc = Engine.score(run);
    const s = loadStats();
    if (sc > s.best) { s.best = sc; saveStats(s); }
    return sc;
  };
  // v5:通关后处理 —— 解锁下一级进阶 / 记录每日挑战
  Engine.runKey = function (run) { return run.theme ? ('t:' + run.theme) : ('c:' + run.cls); };
  Engine.getAscension = function (key) {
    const s = loadStats();
    return Math.min(20, (s.asc && s.asc[key]) || 0);
  };
  Engine.setAscension = function (key, lv) {
    const s = loadStats();
    s.asc = s.asc || {};
    s.asc[key] = Math.max(s.asc[key] || 0, Math.min(20, lv));
    saveStats(s);
  };
  Engine.onRunWon = function (run) {
    const key = Engine.runKey(run);
    const cur = Engine.getAscension(key);
    if ((run.ascension || 0) >= cur && cur < 20) Engine.setAscension(key, cur + 1);
    if (run.daily) {
      const s = loadStats();
      s.daily = s.daily || {};
      s.daily.date = todayStr();
      s.daily.won = true;
      s.daily.score = Engine.score(run);
      saveStats(s);
    }
  };
  function todayStr() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  Engine.todayStr = todayStr;
  Engine.dailyInfo = function (dateStr) {
    const ds = dateStr || todayStr();
    const seed = dailySeed(ds);
    const rule = dailyPick(ds);
    const themes = THEMES.all;
    const theme = themes[seed % themes.length];
    return { date: ds, seed, rule, theme };
  };
  Engine.dailyRules = DAILY_RULES;
  Engine.affixes = AFFIXES;
  // 图鉴里程碑发奖
  Engine.grantPoints = function (n) {
    if (!n || n <= 0) return 0;
    const s = loadStats();
    s.points += n;
    saveStats(s);
    return n;
  };
  Engine.newRunPublic = Engine.newRun;

  global.GS.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
