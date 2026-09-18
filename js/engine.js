/* 微光尖塔 - 核心引擎(纯逻辑,无 DOM)
   所有状态可 JSON 序列化;UI 通过 Engine.actions 驱动 */
(function (global) {
  'use strict';
  global.GS = global.GS || {};
  const { RNG, CARDS, ENEMIES, RELICS, POTIONS, EVENTS } = GS;

  let uidCounter = 1;
  function uid() { return uidCounter++; }

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

  function genMap(run) {
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
    for (let r = 0; r < ROWS - 1; r++) {
      const cur = map[r], nxt = map[r + 1];
      cur.forEach((n, i) => {
        const links = r === ROWS - 2 ? 1 : RNG.int(run, 1, Math.min(3, nxt.length));
        // 按 x 距离排序
        const sorted = nxt.map((m, j) => ({ j, d: Math.abs(m.x - n.x) + RNG.float(run) * 0.02 })).sort((a, b) => a.d - b.d);
        const chosen = new Set();
        for (let k = 0; k < links && k < sorted.length; k++) chosen.add(sorted[k].j);
        n.edges = [...chosen];
      });
      // 修复孤点:下一行没有入边的节点连到上一行最近节点
      nxt.forEach((m, j) => {
        const hasIn = cur.some(n => n.edges.includes(j));
        if (!hasIn) {
          let best = 0, bd = 9;
          cur.forEach((n, i) => { const d = Math.abs(n.x - m.x); if (d < bd) { bd = d; best = i; } });
          cur[best].edges.push(j);
        }
      });
    }
    return map;
  }

  /* ================= 战斗 ================= */
  function spawnEnemy(run, id, scale) {
    const d = ENEMIES.get(id);
    if (!d) throw new Error('未知敌人: ' + id);
    const [a, b] = d.maxHp;
    let hp = RNG.int(run, a, b);
    if (scale > 1) hp = Math.floor(hp * (1 + 0.35 * (scale - 1)));
    const e = {
      uid: uid(), id, name: d.name, art: d.art,
      hp, maxHp: hp, block: 0, statuses: {}, dead: false,
      isElite: !!d.elite, isBoss: !!d.boss,
      move: null, _last: null, _feasted: false, _p2: false
    };
    if (d.init) d.init(e, run);
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
    let atk = base + (st.str || 0) + (st.tempStr || 0);
    if (owned(run, 'courageemblem') && run.player.hp < run.player.maxHp * 0.5) atk += 2;
    if (opts && opts.bonus) atk += opts.bonus;
    if (statusOf(run.combat.player, 'weak') > 0) atk = Math.floor(atk * 0.75);
    if (opts && opts.firstAttack) atk += relicVal(run, 'firstAttackBonus');
    if (target) {
      if (target.isElite) atk = Math.floor(atk * (1 + relicSumDiscount(run, 'eliteDmgMult')));
      if (target.isBoss) atk = Math.floor(atk * (1 + relicSumDiscount(run, 'bossDmgMult')));
      if (statusOf(target, 'vuln') > 0) atk = Math.floor(atk * 1.5);
    }
    return Math.max(0, atk);
  }
  function relicSumDiscount(run, key) {
    let v = 0;
    for (const id of run.player.relics) { const d = RELICS.get(id); if (d && d[key]) v += d[key]; }
    return v;
  }

  function calcEnemyAttack(run, e, base) {
    let atk = base + statusOf(e, 'str');
    if (statusOf(e, 'weak') > 0) atk = Math.floor(atk * 0.75);
    if (statusOf(run.combat.player, 'vuln') > 0) atk = Math.floor(atk * 1.5);
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
          const d = enemyDef(e);
          pushEv(run, { t: 'death', uid: e.uid });
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
        if (target && !opts.echo) pushEv(run, { t: 'fx', fx: 'slash', uid: target.uid });
        const times = (o && o.times) || (cardView(run, inst).hits ? cardView(run, inst).hits : 1) || 1;
        let total = 0, killed = false;
        const first = !c.firstAttackUsed;
        c.firstAttackUsed = true;
        const bonus = c.pendingAttackBonus; c.pendingAttackBonus = 0;
        let base = (cardView(run, inst).dmg || 0) + (c.permBoosts[inst.uid] || 0);
        if (inst.id === 'shiv') base += c.shivBonus || 0;
        for (let i = 0; i < times; i++) {
          if (!target || target.dead) break;
          const amt = calcPlayerAttack(run, base, target, { bonus, firstAttack: first && i === 0 });
          total += hitEnemy(run, target, amt);
          if (target.dead) killed = true;
        }
        // 剧毒烟雾
        if (statusOf(c.player, 'fumes') > 0 && target && !target.dead && !opts.echo) {
          addStatus(run, target, 'poison', statusOf(c.player, 'fumes'));
        }
        return killed;
      },
      attackAll(o) {
        const times = (o && o.times) || 1;
        let total = 0;
        if (!opts.echo) pushEv(run, { t: 'fx', fx: 'aoe' });
        const first = !c.firstAttackUsed;
        const base = (cardView(run, inst).dmg || 0) + (c.permBoosts[inst.uid] || 0);
        for (let i = 0; i < times; i++) {
          for (const e of living()) {
            const amt = calcPlayerAttack(run, base, e, { firstAttack: first && i === 0 && e === living()[0] });
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
        const times = (o && o.times) || 1;
        let total = 0;
        if (!opts.echo) pushEv(run, { t: 'fx', fx: 'multi' });
        const first = !c.firstAttackUsed;
        const base = (cardView(run, inst).dmg || 0) + (c.permBoosts[inst.uid] || 0);
        c.firstAttackUsed = true;
        for (let i = 0; i < times; i++) {
          const alive = living();
          if (!alive.length) break;
          const target = RNG.pick(run, alive);
          const amt = calcPlayerAttack(run, base, target, { firstAttack: first && i === 0 });
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
      }
    };
    return ctx;
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
    const scale = run.act > 3 ? run.act - 2 : 1;
    const enemies = encIds.map(id => spawnEnemy(run, id, scale));
    const deckCopy = run.player.deck.map(x => ({ id: x.id, up: x.up, uid: uid() }));
    run.combat = {
      kind, turn: 0, over: false, won: false,
      enemies,
      hand: [], draw: RNG.shuffle(run, deckCopy), discard: [], exhaust: [],
      player: { block: 0, statuses: {}, energy: 0, maxEnergy: 3 + relicVal(run, 'energyBonus') },
      hpLostThisTurn: 0, permBoosts: {}, shivBonus: 0,
      firstAttackUsed: false, firstSkillUsed: false, pendingAttackBonus: 0,
      pending: null, cardsPlayed: 0
    };
    run.screen = 'combat';
    // 先进入第 1 回合(抽牌、充能),再结算开局遗物,避免格挡被回合开始清空
    startPlayerTurn(run, true);
    // 敌人初始意图(此时 turn 已为 1)
    for (const e of enemies) e.move = pickEnemyMove(run, e);
    if (kind === 'boss') pushEv(run, { t: 'fx', fx: 'boss', name: enemies[0].name });
    const c = run.combat;
    if (relicVal(run, 'strStart')) addStatus(run, c.player, 'str', relicVal(run, 'strStart'), true);
    if (relicVal(run, 'dexStart')) addStatus(run, c.player, 'dex', relicVal(run, 'dexStart'), true);
    if (owned(run, 'etchedskull')) gainPlayerBlock(run, 5);
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
  }

  function startPlayerTurn(run, first) {
    const c = run.combat;
    c.turn += 1;
    c.hpLostThisTurn = 0;
    c.firstAttackUsed = false;
    c.firstSkillUsed = false;
    c.cardsPlayed = 0;
    // 路障外清空格挡
    if ((c.player.statuses.barricade || 0) < 1) c.player.block = 0;
    // 能量重置
    c.player.energy = c.player.maxEnergy;
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
    // 抽牌
    let n = 5 + (c.player.statuses.drawNext || 0);
    if (c.player.statuses.drawNext) delete c.player.statuses.drawNext;
    if (first && owned(run, 'snaking')) n += 2;
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
    // 手中状态/诅咒伤害
    let burnDmg = 0;
    for (const h of c.hand) {
      if (h.id === 'burn') burnDmg += 2;
      if (h.id === 'decay') burnDmg += 3;
    }
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
      const d = enemyDef(e);
      const move = d.moves[e.move] || d.moves[Object.keys(d.moves)[0]];
      e._last = e.move;
      const A = makeEnemyCtx(run, e);
      move.exec(A, e);
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
    // 奖励
    const rewards = [];
    let gold;
    if (c.kind === 'boss') gold = RNG.int(run, 75, 99);
    else if (c.kind === 'elite') gold = RNG.int(run, 25, 35);
    else gold = RNG.int(run, 10, 20);
    gold += relicVal(run, 'goldCombatBonus');
    rewards.push({ type: 'gold', amount: gold });
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
    const pool = RELICS.all.filter(id => {
      const d = RELICS.get(id);
      if (d.rarity === 'starter') return false;
      return !owned(run, id);
    });
    if (!pool.length) return null;
    return RNG.pick(run, pool);
  }

  function makeRewardCards(run, n) {
    const cls = run.player.cls;
    const lucky = owned(run, 'luckylens');
    const out = [];
    const used = new Set();
    for (let i = 0; i < n; i++) {
      const roll = RNG.float(run);
      let rar;
      const rareP = lucky ? 0.30 : 0.12;
      const uncP = lucky ? 0.45 : 0.37;
      if (roll < rareP) rar = 'rare';
      else if (roll < rareP + uncP) rar = 'uncommon';
      else rar = 'common';
      let pool = CARDS.pool(cls, rar).filter(id => !used.has(id));
      if (!pool.length) pool = CARDS.pool(cls, 'common').filter(id => !used.has(id));
      if (!pool.length) continue;
      const id = RNG.pick(run, pool);
      used.add(id);
      out.push(id);
    }
    return out;
  }

  /* ================= Engine 主对象 ================= */
  const Engine = {
    newRun(cls, seed) {
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
      run.map = genMap(run);
      run.evts = [];
      this._run = run;
      bumpStats('runs');
      saveRun(run);
      return run;
    },

    get run() { return this._run; },
    setRun(run) { this._run = run; },

    /* ---------- 地图导航 ---------- */
    reachableNodes(run) {
      if (!run.map) return [];
      if (run.nodeIndex === null) return run.map[0].map((_, i) => ({ row: 0, i }));
      const { row, i } = run.nodeIndex;
      if (row >= ROWS - 1) return [];
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
      run.event = null; run.eventResult = null; run.restDone = false; run.rewards = null;
      switch (node.type) {
        case 'combat': {
          const encs = ENEMIES.encounters(Math.min(run.act, 3)).normal;
          const enc = RNG.pick(run, encs);
          startCombat(run, enc, 'normal');
          break;
        }
        case 'elite': {
          const encs = ENEMIES.encounters(Math.min(run.act, 3)).elite;
          const enc = RNG.pick(run, encs);
          startCombat(run, enc, 'elite');
          break;
        }
        case 'boss': {
          const encs = ENEMIES.encounters(Math.min(run.act, 3)).boss;
          startCombat(run, encs[0], 'boss');
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
          run.event = EVENTS.random(run);
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
      const amt = calcPlayerAttack(run, base, target || (run.combat && run.combat.enemies.find(e => !e.dead)), {});
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
      sweepDead(run);
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
        if (this.gainPotion(run, r.id)) r.taken = true;
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
      run.rewards = null;
      run.combat = null;
      if (isBoss) {
        if (run.act >= 3 && !run.endless) {
          run.screen = 'victory';
          run.player.stats.won = true;
          bumpStats('wins');
          bumpClassWin(run.cls);
          Engine.onVictoryScore(run);
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
      } else if (kind === 'remove') {
        const price = this.removePrice(run);
        if (s.removeUsed || run.player.gold < price) return false;
        run.player.gold -= price;
        run.removals += 1;
        s.removeUsed = true;
        s.awaitingRemove = true; // UI 弹出选牌
      }
      saveRun(run);
      return true;
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
        duplicate() { run.pending = { type: 'duplicate', n: 1 }; }
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
      return run.floorTotal * 2 + Math.floor(run.player.gold / 10) + run.player.stats.bosses * 50 + (run.player.stats.won ? 500 : 0);
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
    const cards = [];
    const rars = ['common', 'common', 'uncommon', 'uncommon', 'rare'];
    const used = new Set();
    for (const rar of rars) {
      let pool = CARDS.pool(cls, rar).filter(id => !used.has(id));
      if (!pool.length) pool = CARDS.pool(cls, 'common').filter(id => !used.has(id));
      if (!pool.length) continue;
      const id = RNG.pick(run, pool);
      used.add(id);
      const base = { common: RNG.int(run, 45, 55), uncommon: RNG.int(run, 68, 82), rare: RNG.int(run, 135, 165) }[rar];
      cards.push({ id, price: base, sold: false });
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
    const rPool = RELICS.all.filter(id => {
      const d = RELICS.get(id);
      return d.rarity !== 'starter' && !owned(run, id);
    });
    RNG.shuffle(run, rPool);
    for (let i = 0; i < 2 && i < rPool.length; i++) {
      const d = RELICS.get(rPool[i]);
      const base = d.rarity === 'rare' ? RNG.int(run, 160, 190) : RNG.int(run, 140, 170);
      relics.push({ id: rPool[i], price: base, sold: false });
    }
    return {
      cards, potions, relics,
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
      if (raw) return JSON.parse(raw);
    } catch (e) { }
    return { runs: 0, wins: 0, losses: 0, best: 0, classWins: { warrior: 0, ranger: 0, warlock: 0 } };
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
  Engine.bumpStats = bumpStats;
  Engine.onGameOver = function (run) {
    bumpStats('losses');
    const sc = Engine.score(run);
    const s = loadStats();
    if (sc > s.best) { s.best = sc; saveStats(s); }
    saveRun(null);
  };
  Engine.onVictoryScore = function (run) {
    const sc = Engine.score(run);
    const s = loadStats();
    if (sc > s.best) { s.best = sc; saveStats(s); }
    return sc;
  };
  Engine.newRunPublic = Engine.newRun;

  global.GS.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
