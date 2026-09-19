/* 微光尖塔 - 界面层 */
(function (global) {
  'use strict';
  const { Engine, CARDS, ENEMIES, RELICS, POTIONS, AudioFX } = GS;

  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, html) => {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined) d.innerHTML = html;
    return d;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const STATUS_EXPLAIN = {
    str: ['力量', '攻击伤害 +层数'],
    tempStr: ['临时力量', '本回合攻击伤害 +层数'],
    dex: ['敏捷', '获得的格挡 +层数'],
    vuln: ['易伤', '受到的攻击伤害 ×1.5,每回合结束 -1'],
    weak: ['虚弱', '造成的攻击伤害 ×0.75,每回合结束 -1'],
    frail: ['脆弱', '获得的格挡 ×0.75,每回合结束 -1'],
    poison: ['中毒', '回合开始时受到等同层数的伤害(无视格挡),然后 -1 层'],
    metal: ['金属化', '回合结束时获得等同层数的格挡'],
    thorns: ['荆棘', '被攻击时对攻击者造成等同层数的伤害'],
    ritual: ['仪式', '回合结束时获得等同层数的力量'],
    barricade: ['路障', '回合开始时格挡不再消失'],
    echo: ['回响', '每回合打出的第一张牌会执行两次'],
    corpseExp: ['尸爆', '死亡时对所有其他敌人造成等同其最大生命值的伤害'],
    fumes: ['剧毒烟雾', '打出攻击牌时对其目标施加等同层数的中毒'],
    cuts: ['千刀万剐', '每打出一张牌,对所有敌人造成等同层数的伤害'],
    afterimage: ['残影', '每打出一张牌,获得等同层数的格挡'],
    feelNoPain: ['麻痹痛楚', '每有牌被消耗,获得等同层数的格挡'],
    drawNext: ['下回合抽牌', '下回合额外抽取等同层数的牌'],
    bloodRage: ['血怒', '回合开始获得等同层数的力量并失去 2 生命'],
    soulCatch: ['灵魂收割', '每有牌被消耗,获得等同层数的力量'],
    bloodPact: ['献祭契约', '每因卡牌失去 1 点生命,对所有敌人造成 1 点伤害'],
    bloodRitual: ['献血仪式', '每有牌被消耗,回复等同层数的生命'],
    demonPact: ['恶魔之力', '每回合结束时失去等同层数的生命'],
    abyssGaze: ['深渊注视', '每回合开始时,随机一名敌人获得等同层数的易伤'],
    lifeConvert: ['生命转化', '每回合开始时失去等同层数的生命,获得 1 点能量'],
    demonRevive: ['不死鸟之血', '首次受到致命伤害时回复 50% 生命,然后移除此效果'],
    /* ---- 联动主题 ---- */
    soulfire: ['魂火', '打出「鬼」相关牌时可消耗,提升威力;不随回合消失'],
    eye: ['阴阳眼', '累积到 10 层时自行开眼:对所有敌人造成大量伤害并获得力量,同时反噬生命'],
    yinyang: ['阴阳眼(被动)', '每当你获得格挡,额外获得等同层数的格挡,并累积 1 层阴阳眼'],
    mystBloom: ['彼岸花', '每当你打出一张牌,获得 1 层魂火'],
    undying: ['活尸', '本场战斗中首次受到致命伤害时不死,并回复 40% 生命'],
    ghostPower: ['鬼物', '每当你打出一张牌便触发一次,效果由附身的鬼决定'],
    seal: ['镇压', '造成的伤害 -25%,每回合结束 -1'],
    sealAction: ['封锁', '下回合无法行动'],
    weakness: ['弱点', '受到的伤害提高 35%'],
    ce: ['咒力', '战斗内的燃料:强化攻击牌、支付代价、开启领域'],
    sixEyes: ['六眼', '每回合开始获得咒力,并提升黑闪几率'],
    kitchen: ['伏魔御厨子', '每回合结束时对所有敌人造成等同层数的伤害'],
    fieldBoost: ['领域扩张', '每回合结束时领域之值额外增加'],
    barrier: ['领域屏障', '抵挡一次伤害后消失'],
    scorch: ['灼伤', '回合结束时受到等同层数的伤害,然后 -1 层'],
    wei: ['咒力护甲', '受到的攻击伤害 -35%'],
    /* ---- 联动主题二批 ---- */
    witchscent: ['魔女之香', '灾祸闻香而来:敌人的攻击 +25%,每回合结束 -1 层;部分卡牌可将其转化为力量'],
    rewind: ['死亡回归(额外)', '死亡时额外倒回至战斗开始时的生命'],
    unseen: ['看不见的手', '每回合开始时,对随机敌人造成等同层数的伤害'],
    gluttony: ['暴食的权能', '每当有敌人死亡,回复等同层数的生命并获得 1 点力量'],
    cudgel: ['棍势', '金箍棒的势:被「千钧重棍」等牌消耗,打出爆发伤害'],
    growstaff: ['法天象地', '每当你打出一张攻击牌,获得 1 层棍势'],
    majesty: ['大圣威仪', '每回合开始时获得 2 层棍势'],
    sixarms: ['三头六臂', '你的攻击牌伤害提升(每层 +2)'],
    dragonforce: ['龙之意志', '每层使你的攻击 +15%(最多按 2 层计),每回合结束 -1 层'],
    scales: ['灭龙之鳞', '每回合开始时,获得等同层数的格挡'],
    monkeys: ['身外身法', '每回合开始时,将 1 张「猴子猴孙」加入手牌'],
    burnlife: ['燃烧生命', '回合结束时失去等同层数的生命'],
    plasmaspark: ['等离子火花', '每当你消耗光能,对所有敌人造成等同消耗量的伤害'],
    eternal: ['永恒之辉', '光能不再随回合消耗;2 层时每回合开始额外 +1 光能']
  };

  const NODE_META = {
    combat: ['⚔️', '战斗', '#e05252'],
    elite: ['💀', '精英战斗', '#c05aff'],
    rest: ['🔥', '营地', '#f0a050'],
    shop: ['🏪', '商店', '#5ad0a0'],
    event: ['❓', '未知事件', '#8ab8ff'],
    treasure: ['🎁', '宝箱', '#f0c96a'],
    boss: ['👑', 'BOSS', '#ff4040'],
    curse: ['🩸', '咒物祭坛', '#ff6b9d'],
    ward: ['🛡️', '镇魂结界', '#7fe7d0']
  };

  const CLASS_META = {
    warrior: { name: '剑士', art: '⚔️', desc: '以力量与钢铁意志著称的战士。<br>越战越勇,用重击碾碎一切。', relic: '燃烧之血:战斗胜利后回复 6 生命' },
    ranger: { name: '游侠', art: '🗡️', desc: '行动如风的暗影猎手。<br>毒素与飞刃让敌人在无声中倒下。', relic: '蛇形之戒:每场战斗第一回合多抽 2 张牌' },
    warlock: { name: '术士', art: '🔮', desc: '与深渊做交易的秘法师。<br>以生命为筹码,换取毁灭性的力量。', relic: '蚀刻颅骨:战斗开始时获得 5 点格挡' }
  };

  // 联动主题:从 GS.THEMES 动态生成职业信息,复用同一套渲染
  function themeMetaList() { return (GS.THEMES && GS.THEMES.all) || []; }
  // 各主题卡牌角标
  const THEME_CARD_TAG = {
    mystery: '鬼物', rezero: '精灵', ultraman: '光能', wukong: '西游', fairytail: '灭龙'
  };
  function themeMeta(t) {
    return {
      theme: t.id,
      name: t.name,
      art: t.art,
      desc: t.desc,
      relic: t.relic,
      tip: t.tip,
      tag: t.tag
    };
  }
  function classMeta(cls) {
    if (CLASS_META[cls]) return CLASS_META[cls];
    const t = GS.THEMES && GS.THEMES.byClass(cls);
    return t ? themeMeta(t) : { name: cls, art: '❔', desc: '', relic: '' };
  }
  function themeOfRun(run) { return run && run.theme && GS.THEMES ? GS.THEMES.get(run.theme) : null; }

  const UI = {
    run: null,
    busy: false,
    targeting: null,   // {mode:'card'|'potion', idx}
    discardPicks: [],
    selClass: 'warrior',
    selTheme: null,
    selAlly: null,
    gameoverHandled: false,

    /* ================= 初始化 ================= */
    init() {
      AudioFX.init();
      this.initStars();
      this.bind();
      this.render();
      window.addEventListener('resize', () => { if (this.run && this.run.screen === 'map') this.drawMapEdges(); });
    },

    bind() {
      $('#btn-deck').onclick = () => { AudioFX.play('click'); if (this.run) this.deckModal(); };
      $('#btn-help').onclick = () => { AudioFX.play('click'); this.helpModal(); };
      $('#btn-menu').onclick = () => {
        AudioFX.play('click');
        if (!this.run || this.run.screen === 'gameover' || this.run.screen === 'victory') { this.toMenu(); return; }
        this.confirmModal('返回主菜单?', '本局进度已自动存档,可随时继续。', () => this.toMenu());
      };
      $('#btn-mute').onclick = () => {
        AudioFX.setMuted(!AudioFX.muted);
        $('#btn-mute').textContent = AudioFX.muted ? '🔇' : '🔊';
        AudioFX.play('click');
      };
      $('#btn-mute').textContent = AudioFX.muted ? '🔇' : '🔊';
      $('#btn-endturn').onclick = () => this.onEndTurn();
      document.addEventListener('keydown', e => this.onKey(e));
      document.addEventListener('click', e => {
        const tip = $('#tooltip');
        if (!tip.classList.contains('hidden')) tip.classList.add('hidden');
      });
      document.addEventListener('contextmenu', e => {
        const slot = e.target.closest('.potion-slot');
        if (slot && this.run) {
          e.preventDefault();
          const idx = [...$('#hud-potions').children].indexOf(slot);
          if (this.run.player.potions[idx]) {
            this.run.player.potions[idx] = null;
            Engine.saveRun(this.run);
            this.toast('已丢弃药水');
            this.render();
          }
        }
      });
    },

    onKey(e) {
      if (!this.run || this.busy) return;
      if (e.key === 'Escape') {
        this.cancelTargeting();
        if (!$('#modal-layer').classList.contains('hidden')) this.closeModal();
        return;
      }
      if (this.run.screen !== 'combat') return;
      if (e.key === 'e' || e.key === 'E') { this.onEndTurn(); return; }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        const c = this.run.combat;
        if (c && !c.pending && c.hand[n - 1]) this.tryPlayCard(n - 1);
      }
    },

    /* ================= 主渲染 ================= */
    update() {
      const run = this.run;
      if (!run) { this.render(); return; }
      const evts = Engine.drainEvents(run);
      this.render();
      if (evts && evts.length) {
        this.busy = true;
        this.animateEvents(evts).then(() => {
          this.busy = false;
          this.render();
          if (run.screen === 'gameover' && !this.gameoverHandled) {
            this.gameoverHandled = true;
            Engine.onGameOver(run);
          }
        });
      }
    },

    render() {
      const run = this.run;
      const inRun = !!run && !['menu'].includes(run.screen);
      $('#hud').classList.toggle('hidden', !inRun);
      $('#combat-bottom').classList.toggle('hidden', !(run && run.screen === 'combat'));
      if (!run) { this.renderMenu(); return; }
      this.renderHUD();
      const screen = $('#screen');
      screen.innerHTML = '';
      switch (run.screen) {
        case 'map': this.renderMap(screen); break;
        case 'combat': this.renderCombat(screen); break;
        case 'reward': case 'treasure': this.renderReward(screen); break;
        case 'shop': this.renderShop(screen); break;
        case 'rest': this.renderRest(screen); break;
        case 'event': this.renderEvent(screen); break;
        case 'gameover': this.renderGameover(screen); break;
        case 'victory': this.renderVictory(screen); break;
        default: this.renderMenu();
      }
      if (run.pending) this.openPendingModal();
    },

    renderHUD() {
      const run = this.run, p = run.player;
      const pct = Math.max(0, Math.min(100, p.hp / p.maxHp * 100));
      const orb = $('#hp-orb');
      orb.querySelector('.hp-fill').style.height = pct + '%';
      orb.querySelector('.hp-text').textContent = p.hp + '/' + p.maxHp;
      orb.onclick = () => this.tooltipText(`生命 ${p.hp} / ${p.maxHp}`);
      $('#hud-gold').textContent = '🪙 ' + p.gold;
      const theme = themeOfRun(run);
      let actName;
      if (theme) {
        const acts = theme.acts;
        actName = run.act > acts.length ? `无尽·第${run.act - acts.length}轮` : (acts[run.act - 1] ? acts[run.act - 1].name : theme.name);
      } else {
        actName = run.act > 3 ? `无尽·第${run.act - 3}轮` : `第${run.act}幕`;
      }
      $('#hud-floor').textContent = `${actName} · 第${run.floorTotal}层`;
      const title = $('#hud-title');
      if (theme) {
        title.innerHTML = `<span class="theme-badge">${theme.art} ${esc(theme.name)}</span>` +
          (run.player.curse ? `<span class="curse-badge" title="污染:每层使你的伤害提高,同时镜域之值更深">🩸 污染 ${run.player.curse}</span>` : '');
      } else {
        title.textContent = '微光尖塔';
      }
      // 药水
      const potBox = $('#hud-potions');
      potBox.innerHTML = '';
      for (let i = 0; i < p.potionSlots; i++) {
        const id = p.potions[i];
        const slot = el('div', 'potion-slot' + (id ? ' filled' : ' empty'), id ? POTIONS.get(id).art : '');
        if (id) {
          const d = POTIONS.get(id);
          this.attachTip(slot, `<b>${esc(d.name)}</b><br>${esc(d.desc)}<br><span style="color:#9aa3c7">${Engine.potionUsable(run, i) ? '点击使用 · 右键丢弃' : (d.anywhere ? '' : '仅战斗中可用 · 右键丢弃')}</span>`);
          slot.onclick = () => this.onPotionClick(i);
        }
        potBox.appendChild(slot);
      }
      // 遗物
      const relBox = $('#hud-relics');
      relBox.innerHTML = '';
      for (const id of p.relics) {
        const d = RELICS.get(id);
        if (!d) continue;
        const ic = el('div', 'relic-icon', d.art);
        this.attachTip(ic, `<b>${esc(d.name)}</b><br>${esc(d.desc)}`);
        relBox.appendChild(ic);
      }
      // 伙伴
      const allyBox = $('#hud-allies');
      if (allyBox) {
        allyBox.innerHTML = '';
        for (const aid of (p.allies || [])) {
          const d = GS.THEMES && GS.THEMES.allyMap && GS.THEMES.allyMap[aid];
          if (!d) continue;
          const ic = el('div', 'ally-icon');
          ic.innerHTML = `<span class="art-emoji">${d.art}</span><img class="ally-img" src="assets/ally/${aid}.png" onload="this.parentElement.classList.add('img-on')" onerror="this.remove()" alt="">`;
          this.attachTip(ic, `<b>伙伴 · ${esc(d.name)}</b><br>${esc(d.desc)}<br><span style="color:#9aa3c7">每回合开始时生效(伙伴 ${(p.allies || []).length}/4)</span>`);
          allyBox.appendChild(ic);
        }
      }
      // 战斗数值
      const c = run.combat;
      if (run.screen === 'combat' && c) {
        const meta = classMeta(run.cls);
        $('#player-avatar').innerHTML = `<span class="art-emoji">${meta.art}</span><img class="hero-img" src="assets/heroes/${run.cls}.png" onload="this.parentElement.classList.add('img-on')" onerror="this.remove()" alt="">`;
        this.attachTip($('#player-avatar'), `<b>${esc(meta.name)}</b><br>生命 ${p.hp}/${p.maxHp}`);
        $('#player-block').innerHTML = c.player.block > 0 ? `<div class="block-badge">🛡 ${c.player.block}</div>` : '';
        $('#player-status').innerHTML = '';
        if (theme) {
          if (c.player.ghostName) {
            const isSpirit = (c.player.ghostKey || '').indexOf('rz_') === 0;
            const chip = el('span', 'status-chip ghost' + (isSpirit ? ' spirit' : ''), `${isSpirit ? '🧚' : '👻'} ${esc(c.player.ghostName)}`);
            const gd = (GS.THEMES.ghosts && GS.THEMES.ghosts[c.player.ghostKey]) || [c.player.ghostName, ''];
            const trigTxt = isSpirit ? '每当你打出一张技能牌,就会触发一次' : '每当你打出一张牌,就会触发一次';
            this.attachTip(chip, `<b>${esc(gd[0])} · 强度 ${c.player.statuses.ghostPower || 1}</b><br>${esc(gd[1])}<br><span style="color:#9aa3c7">${trigTxt}</span>`);
            $('#player-status').appendChild(chip);
          }
          if (c.ce > 0) {
            const chip = el('span', 'status-chip ce', `💠 咒力 ${c.ce}`);
            this.attachTip(chip, `<b>咒力</b><br>强化咒术牌、支付代价、开启领域`);
            $('#player-status').appendChild(chip);
          }
          if (c.light) {
            const redlineV = (theme.redline || 3) + ((GS.RELICS.get('ul_meter') && run.player.relics.includes('ul_meter')) ? 1 : 0);
            const low = c.light.val <= redlineV;
            const chip = el('span', 'status-chip light' + (low ? ' low' : ''), `🔴 光能 ${c.light.val}/${c.light.max}`);
            this.attachTip(chip, `<b>光能</b><br>每回合结束 -1;≤ ${redlineV} 时进入「红色警戒」,攻击大幅提升。<br><span style="color:#9aa3c7">归零后每回合受到能量枯竭伤害</span>`);
            $('#player-status').appendChild(chip);
          }
          if (theme.id === 'fairytail') {
            const chip = el('span', 'status-chip bond', `🤝 羁绊 ${c.combatCards || 0}`);
            this.attachTip(chip, `<b>羁绊</b><br>本场战斗中打出的牌数;部分灭龙魔法随羁绊增强`);
            $('#player-status').appendChild(chip);
          }
        }
        for (const [k, v] of Object.entries(c.player.statuses)) {
          if (!v) continue;
          if (k === 'ghostPower') continue;
          if (theme && k === 'ce') continue;
          $('#player-status').appendChild(this.statusChip(k, v));
        }
        $('#energy-text').textContent = c.player.energy + '/' + c.player.maxEnergy;
        $('#btn-endturn').disabled = this.busy || !!c.pending || c.over;
        $('#pile-draw').innerHTML = `<div>抽</div><div class="cnt">${c.draw.length}</div>`;
        $('#pile-discard').innerHTML = `<div>弃</div><div class="cnt">${c.discard.length}</div>`;
        this.attachTip($('#pile-draw'), `抽牌堆:${c.draw.length} 张(点击查看)`);
        this.attachTip($('#pile-discard'), `弃牌堆:${c.discard.length} 张 · 消耗区:${c.exhaust.length} 张`);
        $('#pile-draw').onclick = () => this.pileModal('抽牌堆', c.draw);
        $('#pile-discard').onclick = () => this.pileModal('弃牌堆', c.discard.concat(c.exhaust.map(x => ({ ...x, _ex: true }))), '含消耗区');
        this.renderHand();
      }
    },

    statusChip(key, v) {
      const info = STATUS_EXPLAIN[key] || [CARDS.STATUS_TEXT[key] || key, ''];
      const isDebuff = ['vuln', 'weak', 'frail', 'poison', 'seal', 'sealAction', 'weakness', 'scorch', 'witchscent', 'burnlife'].includes(key);
      const chip = el('span', 'status-chip ' + (isDebuff ? 'debuff' : 'buff'), `${info[0]} ${v}`);
      this.attachTip(chip, `<b>${esc(info[0])}</b><br>${esc(info[1])}`);
      return chip;
    },

    /* ================= 卡牌元素 ================= */
    cardEl(inst, opts) {
      opts = opts || {};
      const run = this.run;
      const view = Engine.effectiveView(run, inst);
      const card = el('div', 'card');
      card.classList.add('type-' + view.type, 'rarity-' + (view.rarity || 'special'), 'cls-' + view.cls);
      if (inst.up) card.classList.add('upgraded');
      if (inst._tempUp && !inst.up) card.classList.add('tempup', 'upgraded');
      const costTxt = view.cost === 'X' ? 'X' : (opts.cost !== undefined ? opts.cost : view.cost);
      let desc = view.desc || '';
      // 数值预览
      let dmgN = view.dmg, blkN = view.block;
      if (opts.preview && run.screen === 'combat') {
        if (view.dmg) dmgN = Engine.calcCardDamage(run, inst, null);
        if (view.block) blkN = Engine.calcCardBlock(run, inst);
      }
      desc = desc.replace('{D}', dmgN !== undefined ? dmgN : '?').replace('{B}', blkN !== undefined ? blkN : '?');
      card.innerHTML = `
        <div class="cost">${costTxt}</div>
        <div class="cname">${esc(view.name)}</div>
        <div class="cart">${{ attack: '攻击', skill: '技能', power: '能力', curse: '诅咒', status: '状态' }[view.type] || ''}</div>
        <div class="cdesc">${esc(desc)}</div>
        ${view.tech ? '<div class="ctag">咒术</div>' : (THEME_CARD_TAG[view.cls] ? `<div class="ctag ghost">${THEME_CARD_TAG[view.cls]}</div>` : '')}
        <div class="rarity-gem"></div>`;
      if (view.ethereal) card.title = '';
      this.attachTip(card, this.cardTip(inst, view), true);
      return card;
    },

    cardTip(inst, view) {
      let extra = [];
      if (view.exhaust) extra.push('消耗');
      if (view.ethereal) extra.push('虚无');
      if (view.innate) extra.push('固有');
      if (view.unplayable) extra.push('无法打出');
      if (view.tech) extra.push('咒术:每回合第一张免费');
      const rarityMap = { basic: '初始', common: '普通', uncommon: '罕见', rare: '稀有', special: '特殊' };
      let html = `<b>${esc(view.name)}</b> <span style="color:#9aa3c7">(${rarityMap[view.rarity] || ''})</span><br>${esc(view.desc || '')}`;
      const run = this.run;
      if (run && run.screen === 'combat' && run.combat) {
        const live = [];
        if (view.dmg) live.push(`当前伤害 <b style="color:#ff9a76">${Engine.calcCardDamage(run, inst, null)}</b>`);
        if (view.block) live.push(`当前格挡 <b style="color:#6ee7ff">${Engine.calcCardBlock(run, inst)}</b>`);
        if (view.tech) live.push(`本回合咒力 <b style="color:#c9a6ff">${run.combat.ce || 0}</b>`);
        if (live.length) html += `<br><span style="color:#9aa3c7">${live.join(' · ')}</span>`;
      }
      if (extra.length) html += `<br><span style="color:#6ee7ff">${extra.join(' · ')}</span>`;
      // 伙伴联动提示:已拥有联动伙伴时,在卡牌 tooltip 上标出
      if (run && run.player && run.player.allies && run.player.allies.length) {
        for (const aid of run.player.allies) {
          const ad = GS.THEMES && GS.THEMES.allyMap && GS.THEMES.allyMap[aid];
          if (ad && ad.synergy && ad.synergy.ids && ad.synergy.ids.includes(inst.id)) {
            html += `<br><span style="color:#ffc0da">🔗 ${esc(ad.name)}·${esc(ad.synergy.name)}:${esc(ad.synergy.note)}</span>`;
          }
        }
      }
      return html;
    },

    renderHand() {
      const run = this.run, c = run.combat;
      const hand = $('#hand');
      hand.innerHTML = '';
      const n = c.hand.length;
      c.hand.forEach((inst, i) => {
        const card = this.cardEl(inst, { preview: true });
        if (!Engine.canPlay(run, i) || this.busy) card.classList.add('unplayable');
        // 扇形
        const mid = (n - 1) / 2;
        const off = i - mid;
        const rot = off * (n > 6 ? 3.4 : 4.6);
        const ty = Math.abs(off) * (n > 6 ? 2.4 : 3.4);
        card.style.transform = `rotate(${rot}deg) translateY(${ty}px)`;
        card.style.zIndex = 10 + i;
        card.dataset.handIdx = i;
        card.onclick = e => { e.stopPropagation(); this.onHandCardClick(i); };
        hand.appendChild(card);
      });
      hand.classList.toggle('discarding', c.pending && c.pending.type === 'discard');
      if (c.pending && c.pending.type === 'discard') {
        c.hand.forEach((inst, i) => {
          const card = hand.children[i];
          if (this.discardPicks.includes(i)) card.classList.add('picked');
          card.onclick = e => { e.stopPropagation(); this.toggleDiscardPick(i); };
        });
      }
    },

    /* ================= 交互:出牌 ================= */
    onHandCardClick(idx) {
      const run = this.run, c = run.combat;
      if (this.busy || !c || c.over) return;
      if (c.pending) {
        if (c.pending.type === 'discard') this.toggleDiscardPick(idx);
        return;
      }
      this.tryPlayCard(idx);
    },

    tryPlayCard(idx) {
      const run = this.run, c = run.combat;
      if (!Engine.canPlay(run, idx)) { AudioFX.play('click'); return; }
      const view = Engine.effectiveView(run, c.hand[idx]);
      if (view.target === 'enemy' && c.enemies.some(e => !e.dead)) {
        this.targeting = { mode: 'card', idx };
        this.render();
        this.toast('选择一个目标(再次点击卡牌取消)');
        [...$('#hand').children][idx]?.classList.add('selected-to-play');
      } else {
        Engine.playCard(run, idx, 0);
        this.cancelTargeting();
        this.update();
      }
    },

    onEnemyClick(enemyIdx) {
      const run = this.run, c = run.combat;
      if (this.busy || !c || c.over) return;
      if (this.targeting) {
        const t = this.targeting;
        this.cancelTargeting();
        if (t.mode === 'card') {
          Engine.playCard(run, t.idx, enemyIdx);
        } else if (t.mode === 'potion') {
          Engine.usePotion(run, t.slot, enemyIdx);
        }
        this.update();
      }
    },

    onPotionClick(slot) {
      const run = this.run;
      if (this.busy) return;
      if (!Engine.potionUsable(run, slot)) { this.toast('现在无法使用这瓶药水'); return; }
      const d = POTIONS.get(run.player.potions[slot]);
      if (d.target === 'enemy') {
        const c = run.combat;
        if (!c || !c.enemies.some(e => !e.dead)) { this.toast('需要选择一个敌人目标'); return; }
        this.targeting = { mode: 'potion', slot };
        this.render();
        this.toast('选择一个目标投掷');
      } else {
        Engine.usePotion(run, slot, 0);
        this.update();
      }
    },

    cancelTargeting() {
      this.targeting = null;
      if (this.run && this.run.screen === 'combat') this.render();
    },

    toggleDiscardPick(idx) {
      const run = this.run, c = run.combat;
      if (!c.pending || c.pending.type !== 'discard') return;
      const i = this.discardPicks.indexOf(idx);
      if (i >= 0) this.discardPicks.splice(i, 1);
      else {
        if (this.discardPicks.length >= c.pending.n) return;
        this.discardPicks.push(idx);
      }
      if (this.discardPicks.length === c.pending.n) {
        Engine.resolveDiscard(run, [...this.discardPicks]);
        this.discardPicks = [];
        this.update();
      } else {
        this.render();
      }
    },

    onEndTurn() {
      const run = this.run, c = run && run.combat;
      if (this.busy || !c || c.over || run.screen !== 'combat' || c.pending) return;
      this.cancelTargeting();
      this.discardPicks = [];
      AudioFX.play('turn');
      Engine.endTurn(run);
      this.update();
    },

    /* ================= 战斗画面 ================= */
    renderCombat(screen) {
      const run = this.run, c = run.combat;
      const area = el('div', 'combat-area');
      const row = el('div', 'enemy-row' + (this.targeting ? ' enemy-targetable' : ''));
      c.enemies.forEach((e, idx) => {
        const living = c.enemies.filter(x => !x.dead);
        const li = living.indexOf(e);
        const box = el('div', 'enemy' + (e.dead ? ' dead' : ''));
        box.dataset.uid = e.uid;
        // 意图
        let intentHtml = '';
        if (!e.dead) {
          const info = Engine.intentInfo(run, e);
          const icons = {
            attack: '⚔️', attackDebuff: '⚔️💜', attackDefend: '⚔️🛡️', defend: '🛡️',
            buff: '🔺', debuff: '🔻', strong: '☠️', sleep: '💤', unknown: '❔'
          };
          const dmgTxt = info.dmg ? ` <b>${info.dmg}${info.hits > 1 ? '×' + info.hits : ''}</b>` : '';
          intentHtml = `<div class="intent ${info.intent}"><i>${icons[info.intent] || '❔'}</i>${esc(info.name)}${dmgTxt}</div>`;
          box.title = '';
        }
        const hpPct = Math.max(0, e.hp / e.maxHp * 100);
        box.innerHTML = `
          ${intentHtml}
          <div class="art"><span class="art-emoji">${e.art}</span><img class="enemy-img" src="assets/enemies/${e.id}.png" onload="this.parentElement.classList.add('img-on')" onerror="this.remove()" alt=""></div>
          <div class="name">${esc(e.name)}</div>
          <div class="hpbar"><div class="fill" style="width:${hpPct}%"></div><div class="num">${e.hp}/${e.maxHp}</div></div>
          ${e.block > 0 ? `<div class="block-badge">🛡 ${e.block}</div>` : ''}
          <div class="status-row"></div>`;
        const stRow = box.querySelector('.status-row');
        for (const [k, v] of Object.entries(e.statuses)) {
          if (!v || k === 'corpseExp') continue;
          stRow.appendChild(this.statusChip(k, v));
        }
        if (e.statuses.corpseExp) stRow.appendChild(this.statusChip('corpseExp', e.statuses.corpseExp));
        if (this.targeting && !e.dead) box.classList.add('art-highlight');
        box.onclick = () => { if (li >= 0) this.onEnemyClick(li); };
        row.appendChild(box);
      });
      area.appendChild(row);
      // 联动主题:域之量表(积满会反噬)
      if (c.field) {
        const pctv = Math.max(0, Math.min(100, c.field.val / c.field.max * 100));
        const danger = c.field.val / c.field.max >= 0.66;
        const gauge = el('div', 'field-gauge' + (danger ? ' danger' : ''), `
          <div class="fg-label">${esc(c.field.label)} ${c.field.val}/${c.field.max}</div>
          <div class="fg-bar"><div class="fg-fill" style="width:${pctv}%"></div></div>
          <div class="fg-hint">积满将反噬并重置</div>`);
        this.attachTip(gauge, `<b>${esc(c.field.label)}</b><br>随着回合推进而加深,积满时你受到反噬伤害、敌人获得力量。<br><span style="color:#9aa3c7">「镇压」「简易领域」等牌可以降低此值</span>`);
        area.appendChild(gauge);
      }
      screen.appendChild(area);
    },

    /* ================= 地图画面 ================= */
    renderMap(screen) {
      const run = this.run;
      const theme = themeOfRun(run);
      const wrap = el('div', 'map-wrap');
      let actName;
      if (theme) {
        actName = run.act > theme.acts.length
          ? `无尽 · 第 ${run.act - theme.acts.length} 轮`
          : (theme.acts[run.act - 1] ? theme.acts[run.act - 1].name : theme.name);
      } else {
        actName = run.act > 3 ? `无尽 · 第 ${run.act - 3} 轮` : `第 ${run.act} 幕`;
      }
      wrap.appendChild(el('div', 'map-title', `${actName} — ${theme ? theme.name : '微光尖塔'}`));
      if (theme && run.act <= theme.acts.length && theme.acts[run.act - 1] && theme.acts[run.act - 1].intro) {
        wrap.appendChild(el('div', 'map-intro', theme.acts[run.act - 1].intro));
      }
      const scroll = el('div', 'map-scroll');
      const inner = el('div', 'map-inner');
      inner.innerHTML = '<svg id="map-svg"></svg>';
      const reach = Engine.reachableNodes(run);
      const reachSet = new Set(reach.map(p => p.row + ':' + p.i));
      const pathSet = new Set((run.path || []).map(p => p.row + ':' + p.i));
      run.map.forEach((rowNodes, r) => {
        const rowEl = el('div', 'map-row');
        rowEl.dataset.row = r;
        rowNodes.forEach((node, i) => {
          const [ic, name, color] = NODE_META[node.type];
          const key = r + ':' + i;
          const isCur = run.nodeIndex && run.nodeIndex.row === r && run.nodeIndex.i === i;
          const cls = 'map-node' +
            (reachSet.has(key) ? ' reachable' : '') +
            (pathSet.has(key) ? ' visited' : '') +
            (isCur ? ' current' : '');
          const nd = el('div', cls, ic);
          nd.style.left = (8 + node.x * 84) + '%';
          nd.style.top = '50%';
          nd.dataset.pos = key;
          nd.dataset.type = node.type;
          this.attachTip(nd, `<b style="color:${color}">${name}</b>`);
          if (reachSet.has(key)) {
            nd.onclick = () => {
              if (this.busy) return;
              AudioFX.play('click');
              Engine.enterNode(run, r, i);
              this.update();
            };
          }
          rowEl.appendChild(nd);
        });
        inner.appendChild(rowEl);
      });
      scroll.appendChild(inner);
      wrap.appendChild(scroll);
      const legend = el('div', 'map-legend');
      for (const [type, meta] of Object.entries(NODE_META)) {
        if (type === 'boss') continue;
        legend.appendChild(el('span', '', `${meta[0]} ${meta[1]}`));
      }
      legend.appendChild(el('span', '', '👑 BOSS'));
      wrap.appendChild(legend);
      screen.appendChild(wrap);
      requestAnimationFrame(() => {
        this.drawMapEdges();
        // 滚动到当前节点附近
        if (run.nodeIndex) {
          const cur = inner.querySelector('.map-node.current') || inner.querySelector('.map-node.visited:last-of-type');
          if (cur) cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } else {
          scroll.scrollTop = 0;
        }
      });
    },

    drawMapEdges() {
      const run = this.run;
      if (!run || !run.map) return;
      const svg = document.getElementById('map-svg');
      if (!svg) return;
      const inner = svg.parentElement;
      const rect = inner.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
      let lines = '';
      const posOf = nd => {
        const r = nd.getBoundingClientRect();
        return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 };
      };
      run.map.forEach((rowNodes, r) => {
        rowNodes.forEach((node, i) => {
          const from = inner.querySelector(`.map-node[data-pos="${r}:${i}"]`);
          if (!from) return;
          const p1 = posOf(from);
          for (const j of node.edges) {
            const to = inner.querySelector(`.map-node[data-pos="${r + 1}:${j}"]`);
            if (!to) continue;
            const p2 = posOf(to);
            const visitedEdge = (run.path || []).some((p, idx) => p.row === r && p.i === i && run.path[idx + 1] && run.path[idx + 1].row === r + 1 && run.path[idx + 1].i === j);
            lines += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${visitedEdge ? '#f0c96a' : '#3a4570'}" stroke-width="${visitedEdge ? 3 : 2}" ${visitedEdge ? 'style="filter:drop-shadow(0 0 4px rgba(240,201,106,.6))"' : ''}/>`;
          }
        });
      });
      svg.innerHTML = lines;
    },

    /* ================= 奖励画面 ================= */
    renderReward(screen) {
      const run = this.run;
      const isTreasure = run.screen === 'treasure';
      const panel = el('div', 'panel-screen');
      panel.appendChild(el('div', 'panel-title', isTreasure ? '🎁 宝箱' : '⚔️ 战利品'));
      const list = el('div', 'reward-list');
      (run.rewards || []).forEach((r, i) => {
        let item;
        if (r.type === 'gold') {
          item = el('div', 'reward-item' + (r.taken ? ' taken' : ''), `<span class="ic">🪙</span><span>获得 ${r.amount} 金币</span>`);
          if (!r.taken) item.onclick = () => { AudioFX.play('coin'); Engine.claimReward(run, i); this.update(); };
        } else if (r.type === 'potion') {
          const d = POTIONS.get(r.id);
          item = el('div', 'reward-item' + (r.taken ? ' taken' : ''), `<span class="ic">${d.art}</span><span>获得药水:${d.name}</span>`);
          if (!r.taken) item.onclick = () => { AudioFX.play('potion'); Engine.claimReward(run, i); this.update(); };
        } else if (r.type === 'relic') {
          const d = RELICS.get(r.id);
          item = el('div', 'reward-item' + (r.taken ? ' taken' : ''), `<span class="ic">${d.art}</span><span>获得遗物:<b style="color:#f0c96a">${d.name}</b></span>`);
          if (!r.taken) item.onclick = () => { AudioFX.play('relic'); Engine.claimReward(run, i); this.update(); };
        } else if (r.type === 'card') {
          item = el('div', 'reward-item' + (r.taken ? ' taken' : ''), `<span class="ic">🂠</span><span>${r.taken ? '已选择卡牌奖励' : '选择一张卡牌加入卡组'}</span>`);
          if (!r.taken) item.onclick = () => this.cardRewardModal(i);
        }
        list.appendChild(item);
      });
      panel.appendChild(list);
      const btn = el('button', 'primary', isTreasure ? '继续前进' : '离开');
      btn.onclick = () => { AudioFX.play('click'); Engine.leaveReward(run); this.update(); };
      panel.appendChild(btn);
      screen.appendChild(panel);
    },

    cardRewardModal(rewardIdx) {
      const run = this.run;
      const r = run.rewards[rewardIdx];
      if (!r || r.type !== 'card') return;
      const modal = el('div', 'modal');
      modal.appendChild(el('h3', '', '选择一张卡牌'));
      const list = el('div', 'card-list');
      r.options.forEach(id => {
        const inst = { id, up: 0 };
        const card = this.cardEl(inst, { preview: false });
        card.classList.add('pickable');
        card.onclick = () => {
          AudioFX.play('upgrade');
          Engine.takeCardReward(run, rewardIdx, id);
          this.closeModal();
          this.update();
        };
        list.appendChild(card);
      });
      modal.appendChild(list);
      const btns = el('div', 'modal-btns');
      const skip = el('button', 'ghost', '跳过');
      skip.onclick = () => {
        Engine.skipCardReward(run, rewardIdx);
        this.closeModal();
        this.update();
      };
      btns.appendChild(skip);
      modal.appendChild(btns);
      modal.appendChild(el('div', 'tip-line', '卡组越精简,抽到关键牌的概率越高'));
      this.openModal(modal);
    },

    /* ================= 商店 ================= */
    renderShop(screen) {
      const run = this.run, s = run.shop;
      const panel = el('div', 'panel-screen');
      panel.appendChild(el('div', 'panel-title', '🏪 黑市商店'));
      const grid = el('div', 'shop-grid');
      // 卡牌
      const secCards = el('div', 'shop-section');
      secCards.appendChild(el('div', 'shop-label', '— 卡 牌 —'));
      s.cards.forEach((it, i) => {
        const wrap = el('div', 'shop-item' + (it.sold ? ' sold' : ''));
        const price = Engine.shopPrice(run, it.price);
        const card = this.cardEl({ id: it.id, up: 0 }, { preview: false });
        wrap.appendChild(card);
        wrap.appendChild(el('div', 'price', '🪙 ' + price));
        wrap.onclick = () => {
          if (Engine.buyShopItem(run, 'card', i)) { AudioFX.play('coin'); this.update(); }
          else this.toast('金币不足');
        };
        secCards.appendChild(wrap);
      });
      grid.appendChild(secCards);
      // 药水与遗物
      const sec2 = el('div', 'shop-section');
      s.potions.forEach((it, i) => {
        const d = POTIONS.get(it.id);
        const price = Engine.shopPrice(run, it.price);
        const wrap = el('div', 'shop-item potion-item' + (it.sold ? ' sold' : ''));
        wrap.innerHTML = `<div class="big-ic">${d.art}</div><div class="sub-name">${esc(d.name)}</div>`;
        this.attachTip(wrap, `<b>${esc(d.name)}</b><br>${esc(d.desc)}`);
        wrap.appendChild(el('div', 'price', '🪙 ' + price));
        wrap.onclick = () => {
          if (Engine.buyShopItem(run, 'potion', i)) { AudioFX.play('potion'); this.update(); }
          else this.toast('金币不足或药水栏已满');
        };
        sec2.appendChild(wrap);
      });
      s.relics.forEach((it, i) => {
        const d = RELICS.get(it.id);
        const price = Engine.shopPrice(run, it.price);
        const wrap = el('div', 'shop-item relic-item' + (it.sold ? ' sold' : ''));
        wrap.innerHTML = `<div class="big-ic">${d.art}</div><div class="sub-name">${esc(d.name)}</div>`;
        this.attachTip(wrap, `<b>${esc(d.name)}</b><br>${esc(d.desc)}`);
        wrap.appendChild(el('div', 'price', '🪙 ' + price));
        wrap.onclick = () => {
          if (Engine.buyShopItem(run, 'relic', i)) { AudioFX.play('relic'); this.update(); }
          else this.toast('金币不足');
        };
        sec2.appendChild(wrap);
      });
      grid.appendChild(sec2);
      // 伙伴货架(主题局)
      if (s.allies && s.allies.length) {
        const secA = el('div', 'shop-section');
        secA.appendChild(el('div', 'shop-label', `— 🤝 伙 伴(${(run.player.allies || []).length}/4)—`));
        s.allies.forEach((it, i) => {
          const d = GS.THEMES && GS.THEMES.allyMap && GS.THEMES.allyMap[it.id];
          if (!d) return;
          const price = Engine.shopPrice(run, it.price);
          const wrap = el('div', 'shop-item ally-item' + (it.sold ? ' sold' : ''));
          wrap.innerHTML = `<div class="big-ic"><span>${d.art}</span><img class="ally-img" src="assets/ally/${it.id}.png" onload="this.parentElement.classList.add('img-on')" onerror="this.remove()" alt=""></div><div class="sub-name">${esc(d.name)}</div><div class="ally-desc">${esc(d.desc)}</div>`;
          this.attachTip(wrap, `<b>伙伴 · ${esc(d.name)}</b><br>${esc(d.desc)}<br><span style="color:#9aa3c7">购买后伴随整个镜域之旅,每回合开始时生效</span>`);
          wrap.appendChild(el('div', 'price', '🪙 ' + price));
          wrap.onclick = () => {
            if (Engine.buyShopItem(run, 'ally', i)) { AudioFX.play('relic'); this.update(); }
            else this.toast('金币不足或伙伴已满(4 名)');
          };
          secA.appendChild(wrap);
        });
        grid.appendChild(secA);
      }
      // 移除服务
      const sec3 = el('div', 'shop-section');
      const rmPrice = Engine.removePrice(run);
      const rm = el('button', s.removeUsed ? 'ghost' : 'danger', s.removeUsed ? '已移除 1 张牌' : `🧹 移除一张牌(🪙 ${rmPrice})`);
      rm.disabled = s.removeUsed;
      rm.onclick = () => {
        if (Engine.buyShopItem(run, 'remove', 0)) {
          AudioFX.play('click');
          this.update();
        } else this.toast('金币不足');
      };
      sec3.appendChild(rm);
      grid.appendChild(sec3);
      panel.appendChild(grid);
      const leave = el('button', 'primary', '离开商店');
      leave.onclick = () => { AudioFX.play('click'); Engine.leaveShop(run); this.update(); };
      panel.appendChild(leave);
      screen.appendChild(panel);
      if (s.awaitingRemove) this.openPendingModal();
    },

    /* ================= 篝火 ================= */
    renderRest(screen) {
      const run = this.run;
      const panel = el('div', 'panel-screen');
      panel.appendChild(el('div', 'panel-title', '🔥 篝火'));
      panel.appendChild(el('div', 'event-text', '火焰噼啪作响。你可以在这里稍作休整,或者磨砺你的卡牌。'));
      const opts = el('div', 'rest-opts');
      const mk = (ic, t, d, fn, disabled) => {
        const o = el('div', 'rest-opt' + (disabled ? ' disabled' : ''), `<div class="ic">${ic}</div><div class="t">${t}</div><div class="d">${d}</div>`);
        if (!disabled) o.onclick = () => { AudioFX.play('click'); fn(); };
        opts.appendChild(o);
      };
      mk('🛌', '休息', `回复 ${Engine.restHealAmount(run)} 点生命(${run.player.hp} → ${Math.min(run.player.maxHp, run.player.hp + Engine.restHealAmount(run))})`,
        () => { Engine.restHeal(run); AudioFX.play('heal'); this.update(); }, run.restDone);
      mk('🔨', '锻造', `升级卡组中的 ${Engine.restSmithCount(run)} 张牌`,
        () => { Engine.restSmith(run); this.update(); }, run.restDone);
      if (run.player.relics.includes('censer')) {
        mk('⛩️', '净化', '移除卡组中的 1 张牌',
          () => { Engine.restPurify(run); this.update(); }, run.restDone);
      }
      panel.appendChild(opts);
      const leave = el('button', run.restDone ? 'primary' : 'ghost', run.restDone ? '继续前进' : '直接离开(不休息)');
      leave.onclick = () => { AudioFX.play('click'); Engine.leaveRest(run); this.update(); };
      panel.appendChild(leave);
      screen.appendChild(panel);
    },

    /* ================= 事件 ================= */
    renderEvent(screen) {
      const run = this.run;
      const ev = run.event;
      const panel = el('div', 'panel-screen');
      panel.appendChild(el('div', 'event-art', ev.art));
      panel.appendChild(el('div', 'event-name', ev.name));
      panel.appendChild(el('div', 'event-text', ev.text));
      if (!run.eventResult) {
        const choices = el('div', 'event-choices');
        ev.choices.forEach((ch, i) => {
          const can = Engine.eventCan(run, i);
          const c = el('div', 'event-choice' + (can ? '' : ' disabled'),
            `<div>[${i + 1}] ${esc(ch.label)}</div>${ch.hint ? `<div class="hint">${esc(ch.hint)}</div>` : ''}`);
          if (can) c.onclick = () => { AudioFX.play('click'); Engine.chooseEvent(run, i); this.update(); };
          choices.appendChild(c);
        });
        panel.appendChild(choices);
      } else {
        panel.appendChild(el('div', 'event-result', run.eventResult));
        const leave = el('button', 'primary', '继续前进');
        leave.onclick = () => { AudioFX.play('click'); Engine.leaveEvent(run); this.update(); };
        panel.appendChild(leave);
      }
      screen.appendChild(panel);
    },

    /* ================= 结算画面 ================= */
    renderGameover(screen) {
      const run = this.run;
      const theme = themeOfRun(run);
      const panel = el('div', 'panel-screen');
      panel.appendChild(el('div', 'end-art', '💀'));
      panel.appendChild(el('div', 'end-title lose', theme ? '你被鬼潮吞没了' : '你倒下了'));
      const sc = Engine.score(run);
      const pts = Engine.awardRunPoints(run);
      const table = el('div', 'score-table');
      const prog = theme
        ? `到达:<b>${run.act <= theme.acts.length ? theme.acts[run.act - 1].name : '无尽'}</b> · 第 ${run.floorTotal} 层`
        : `到达:<b>${run.act > 3 ? '无尽 第' + (run.act - 3) + ' 轮' : '第 ' + run.act + ' 幕'}</b> · 第 ${run.floorTotal} 层`;
      table.innerHTML = `
        <span>${prog}</span>
        <span>击败敌人:<b>${run.player.stats.enemies}</b> · BOSS:<b>${run.player.stats.bosses}</b></span>
        <span>剩余金币:<b>${run.player.gold}</b></span>
        <span style="font-size:22px">最终得分:<b style="color:#f0c96a">${sc}</b></span>
        <span style="font-size:17px">🏆 获得积分:<b style="color:#6ee7ff">+${pts}</b>(可用于解锁技能包)</span>`;
      panel.appendChild(table);
      const btns = el('div', 'modal-btns');
      const again = el('button', 'primary', '再次攀登');
      again.onclick = () => { this.gameoverHandled = false; this.run = null; this.render(); };
      const menu = el('button', 'ghost', '主菜单');
      menu.onclick = () => { this.gameoverHandled = false; this.run = null; this.render(); };
      btns.append(again, menu);
      panel.appendChild(btns);
      screen.appendChild(panel);
      AudioFX.play('defeat');
    },

    renderVictory(screen) {
      const run = this.run;
      const theme = themeOfRun(run);
      const meta = classMeta(run.cls);
      const panel = el('div', 'panel-screen');
      panel.appendChild(el('div', 'end-art', theme ? theme.art : '🏆'));
      panel.appendChild(el('div', 'end-title win', theme ? `${theme.name} · 镜域制霸!` : '登顶成功!'));
      const sc = Engine.score(run);
      const pts = Engine.awardRunPoints(run);
      const table = el('div', 'score-table');
      const loc = theme
        ? `通关镜域:<b>${theme.acts.map(a => a.name).join(' → ')}</b>`
        : `职业:<b>${meta.name}</b> · 击败敌人:<b>${run.player.stats.enemies}</b>`;
      table.innerHTML = `
        <span>${loc}</span>
        <span>总层数:<b>${run.floorTotal}</b> · 剩余金币:<b>${run.player.gold}</b>${theme ? ` · 污染:<b>${run.player.curse || 0}</b>` : ''}</span>
        <span style="font-size:22px">最终得分:<b style="color:#f0c96a">${sc}</b></span>
        <span style="font-size:17px">🏆 获得积分:<b style="color:#6ee7ff">+${pts}</b>(可用于解锁技能包)</span>`;
      panel.appendChild(table);
      const btns = el('div', 'modal-btns');
      const endless = el('button', 'danger', '🌀 无尽攀登(更强的敌人)');
      endless.onclick = () => { AudioFX.play('relic'); Engine.continueEndless(run); this.update(); };
      const menu = el('button', 'ghost', '结束本局');
      menu.onclick = () => { Engine.saveRun(null); this.run = null; this.render(); };
      btns.append(endless, menu);
      panel.appendChild(btns);
      screen.appendChild(panel);
      AudioFX.play('victory');
    },

    /* ================= 主菜单 ================= */
    renderMenu(screen) {
      const scr = screen || $('#screen');
      scr.innerHTML = '';
      const wrap = el('div', 'menu-wrap');
      wrap.appendChild(el('div', 'game-title', '微光尖塔'));
      wrap.appendChild(el('div', 'game-sub', 'GLIMMER SPIRE'));
      const mode = this.selTheme ? 'theme' : 'class';
      // 模式切换
      const tabs = el('div', 'mode-tabs');
      const tabClass = el('button', 'mode-tab' + (mode === 'class' ? ' active' : ''), '⚔️ 经典攀登');
      tabClass.onclick = () => { AudioFX.play('click'); this.selTheme = null; this.render(); };
      const tabTheme = el('button', 'mode-tab' + (mode === 'theme' ? ' active' : ''), '🌀 联动主题');
      tabTheme.onclick = () => {
        AudioFX.play('click');
        if (!this.selTheme) this.selTheme = themeMetaList()[0] ? themeMetaList()[0].id : null;
        this.render();
      };
      tabs.append(tabClass, tabTheme);
      wrap.appendChild(tabs);

      const cards = el('div', 'class-cards');
      if (mode === 'class') {
        for (const [cls, meta] of Object.entries(CLASS_META)) {
          cards.appendChild(this.classCard(cls, meta, false));
        }
      } else {
        for (const t of themeMetaList()) {
          cards.appendChild(this.classCard(t.cls, themeMeta(t), true));
        }
        wrap.appendChild(el('div', 'theme-hint',
          '联动主题是独立的卡组与闯关模式:专属卡池、专属敌人与 BOSS,以及随层数加深的「污染」与「领域」。'));
        // 伙伴选择:开局选 1 名初始伙伴同行,其余「商店限定」角色只能在对局中的商店招募
        wrap.appendChild(this.allyPicker());
      }
      wrap.appendChild(cards);

      const btns = el('div', 'menu-btns');
      const meta = this.selTheme ? themeMeta(GS.THEMES.get(this.selTheme)) : CLASS_META[this.selClass];
      const start = el('button', 'primary', this.selTheme ? `进入镜域 · ${meta.name}` : `开始攀登 · ${meta.name}`);
      start.onclick = () => {
        AudioFX.resume();
        AudioFX.play('relic');
        this.gameoverHandled = false;
        this.run = this.selTheme ? Engine.newThemeRun(this.selTheme, undefined, this.selAlly || undefined) : Engine.newRun(this.selClass);
        this.update();
      };
      btns.appendChild(start);
      const saved = Engine.loadRun();
      if (saved) {
        const savedMeta = classMeta(saved.cls);
        const savedTheme = themeOfRun(saved);
        const loc = savedTheme
          ? `${savedTheme.name} · ${savedTheme.acts[Math.min(saved.act - 1, savedTheme.acts.length - 1)].name}`
          : (saved.act > 3 ? '无尽' : '第' + saved.act + '幕');
        const cont = el('button', '', `继续上次攀登(${loc} · 第${saved.floorTotal}层 · ${savedMeta.name})`);
        cont.onclick = () => {
          AudioFX.resume();
          AudioFX.play('click');
          const r = Engine.loadRun();
          if (r) { this.gameoverHandled = false; this.run = r; this.update(); }
        };
        btns.appendChild(cont);
      }
      const stats = el('button', 'ghost', '📊 历史战绩');
      stats.onclick = () => this.statsModal();
      btns.appendChild(stats);
      const packsBtn = el('button', '', `🛒 技能包商店(积分 ${Engine.availablePoints()})`);
      packsBtn.onclick = () => this.packShopModal();
      btns.appendChild(packsBtn);
      const help = el('button', 'ghost', '❔ 玩法说明');
      help.onclick = () => this.helpModal();
      btns.appendChild(help);
      wrap.appendChild(btns);
      scr.appendChild(wrap);
    },

    /* 联动主题:初始伙伴选择器(开局选 1 名;商店限定角色仅展示) */
    allyPicker() {
      const theme = this.selTheme ? GS.THEMES.get(this.selTheme) : null;
      if (!theme || !(theme.allyDefs || []).length) return el('div', 'ally-picker-hidden');
      const starters = theme.allyDefs.filter(a => a.starter);
      // 切换主题时重置默认选择
      if (!starters.some(a => a.id === this.selAlly)) this.selAlly = starters.length ? starters[0].id : null;
      const box = el('div', 'ally-picker');
      box.appendChild(el('div', 'shop-label', '— 🤝 选择初始伙伴(开局同行 1 名)—'));
      const row = el('div', 'ally-pick-row');
      for (const a of theme.allyDefs) {
        const sel = a.id === this.selAlly;
        const chip = el('div', 'ally-pick' + (sel ? ' selected' : '') + (a.starter ? '' : ' shop-only'));
        let syn = '';
        if (a.synergy) {
          syn = `<div class="ally-syn">🔗 ${esc(a.synergy.note)}</div>`;
        } else {
          syn = `<div class="ally-syn dim">🔗 暂无卡牌联动</div>`;
        }
        chip.innerHTML = `<div class="ap-head"><span class="ap-art"><span class="art-emoji">${a.art}</span><img class="ally-img" src="assets/ally/${a.id}.png" onload="this.parentElement.classList.add('img-on')" onerror="this.remove()" alt=""></span><span class="ap-name">${esc(a.name)}</span>${a.starter ? '' : '<span class="ap-shop">🏪 商店限定</span>'}</div>` +
          `<div class="ap-desc">${esc(a.desc)}</div>` + syn;
        if (a.starter) {
          chip.onclick = () => { AudioFX.play('click'); this.selAlly = a.id; this.render(); };
        } else {
          this.attachTip(chip, `<b>🏪 商店限定</b><br>${esc(a.name)}不会出现在初始选择中,<br>只能在镜域途中经由商店招募(每局商店随机出现)。`);
        }
        row.appendChild(chip);
      }
      box.appendChild(row);
      return box;
    },

    classCard(cls, meta, isTheme) {      const selected = isTheme ? this.selTheme === meta.theme : (!this.selTheme && this.selClass === cls);
      const card = el('div', 'class-card' + (selected ? ' selected' : '') + (isTheme ? ' theme-card' : ''),
        `<div class="class-art"><span class="art-emoji">${meta.art}</span>` +
        `<img src="assets/${isTheme ? 'themes/' + meta.theme : 'heroes/' + cls}.png" onload="this.parentElement.classList.add('img-on')" onerror="this.remove()" alt="">` +
        `</div><div class="class-name">${esc(meta.name)}</div>` +
        (isTheme && meta.tag ? `<div class="class-tag">${esc(meta.tag)}</div>` : '') +
        `<div class="class-desc">${meta.desc}</div><div class="class-relic">${meta.relic}</div>`);
      card.onclick = () => {
        AudioFX.play('click');
        if (isTheme) this.selTheme = meta.theme;
        else { this.selClass = cls; this.selTheme = null; }
        this.render();
      };
      return card;
    },

    toMenu() {
      this.run = null;
      this.gameoverHandled = false;
      this.closeModal();
      this.render();
    },

    /* ================= 弹窗 ================= */
    openModal(node) {
      const layer = $('#modal-layer');
      layer.innerHTML = '';
      layer.appendChild(node);
      layer.classList.remove('hidden');
      node.addEventListener('click', e => e.stopPropagation());
    },
    closeModal() {
      $('#modal-layer').classList.add('hidden');
      $('#modal-layer').innerHTML = '';
    },

    deckModal() {
      const run = this.run;
      const modal = el('div', 'modal');
      modal.appendChild(el('h3', '', `卡组(${run.player.deck.length} 张)`));
      const list = el('div', 'card-list');
      const sorted = [...run.player.deck].sort((a, b) => {
        const va = CARDS.view(a), vb = CARDS.view(b);
        return (va.cls || '').localeCompare(vb.cls || '') || va.name.localeCompare(vb.name);
      });
      sorted.forEach(inst => list.appendChild(this.cardEl(inst)));
      modal.appendChild(list);
      const btns = el('div', 'modal-btns');
      const close = el('button', '', '关闭');
      close.onclick = () => this.closeModal();
      btns.appendChild(close);
      modal.appendChild(btns);
      this.openModal(modal);
    },

    pileModal(title, pile, sub) {
      const modal = el('div', 'modal');
      modal.appendChild(el('h3', '', `${title}(${pile.length} 张)${sub ? ' · ' + sub : ''}`));
      const list = el('div', 'card-list');
      const sorted = [...pile].sort((a, b) => CARDS.view(a).name.localeCompare(CARDS.view(b).name));
      sorted.forEach(inst => {
        const c = this.cardEl(inst);
        if (inst._ex) c.style.outline = '2px dashed #c05aff';
        list.appendChild(c);
      });
      modal.appendChild(list);
      modal.appendChild(el('div', 'tip-line', '紫色虚线框 = 消耗区的牌'));
      const btns = el('div', 'modal-btns');
      const close = el('button', '', '关闭');
      close.onclick = () => this.closeModal();
      btns.appendChild(close);
      modal.appendChild(btns);
      this.openModal(modal);
    },

    openPendingModal() {
      const run = this.run;
      const info = Engine.pendingInfo(run);
      if (!info) { run.pending = null; return; }
      if ($('#modal-layer').querySelector('.pending-modal')) return;
      const modal = el('div', 'modal pending-modal');
      modal.appendChild(el('h3', '', info.title));
      const list = el('div', 'card-list');
      let picked = [];
      if (info.pool) {
        info.pool.forEach(id => {
          const card = this.cardEl({ id, up: 0 });
          card.classList.add('pickable');
          card.onclick = () => {
            Engine.resolvePending(run, { id });
            this.closeModal();
            this.update();
          };
          list.appendChild(card);
        });
      } else {
        run.player.deck.forEach((inst, i) => {
          if (info.filter && !info.filter(inst)) return;
          const card = this.cardEl(inst);
          card.classList.add('pickable');
          card.onclick = () => {
            if (info.n > 1) {
              const at = picked.indexOf(i);
              if (at >= 0) { picked.splice(at, 1); card.classList.remove('picked'); }
              else if (picked.length < info.n) { picked.push(i); card.classList.add('picked'); }
              if (picked.length === info.n) {
                Engine.resolvePending(run, picked);
                AudioFX.play('upgrade');
                this.closeModal();
                this.update();
              }
            } else {
              Engine.resolvePending(run, [i]);
              AudioFX.play('upgrade');
              this.closeModal();
              this.update();
            }
          };
          list.appendChild(card);
        });
      }
      modal.appendChild(list);
      modal.appendChild(el('div', 'tip-line', info.n > 1 ? `已选 0/${info.n} 张` : '点击一张牌确认'));
      const btns = el('div', 'modal-btns');
      const close = el('button', '', '关闭');
      close.onclick = () => this.closeModal();
      btns.appendChild(close);
      modal.appendChild(btns);
      this.openModal(modal);
    },

    confirmModal(title, text, onOk) {
      const modal = el('div', 'modal');
      modal.style.maxWidth = '380px';
      modal.appendChild(el('h3', '', title));
      modal.appendChild(el('div', 'help-content', text));
      const btns = el('div', 'modal-btns');
      const ok = el('button', 'primary', '确定');
      ok.onclick = () => { this.closeModal(); onOk(); };
      const cancel = el('button', 'ghost', '取消');
      cancel.onclick = () => this.closeModal();
      btns.append(ok, cancel);
      modal.appendChild(btns);
      this.openModal(modal);
    },

    helpModal() {
      const modal = el('div', 'modal');
      modal.appendChild(el('h3', '', '玩法说明'));
      modal.appendChild(el('div', 'help-content', `
        <h4>目标</h4>
        攀登 15 层高的尖塔,击败每一幕的 BOSS。征服第三幕后即登顶成功,也可以选择继续<span class="kw">无尽攀登</span>挑战更强的敌人。
        <h4>战斗</h4>
        每回合获得 3 点能量并抽 5 张牌,打出卡牌攻击敌人或获得格挡。回合结束后格挡消失,未打出的牌进入弃牌堆。
        敌人头顶会显示<span class="kw">意图</span>:⚔️ 即将攻击(附伤害),🛡️ 防御,🔺 强化自身,🔻 削弱你,☠️ 致命重击。
        <h4>卡组构筑</h4>
        战斗胜利后可选择新卡牌。卡组越精简越强——商店的<span class="kw">移除服务</span>、篝火的<span class="kw">净化</span>和部分事件都能删牌。
        <span class="kw">消耗</span>:打出后本场战斗内不再返回牌堆。<span class="kw">虚无</span>:回合结束时若在手牌中则消耗。<span class="kw">固有</span>:必定在开局手牌中。
        <h4>常见状态</h4>
        <span class="kw">易伤</span>受到攻击伤害×1.5 ·<span class="kw">虚弱</span>造成攻击伤害×0.75 ·<span class="kw">中毒</span>回合开始掉血且无视格挡 ·<span class="kw">力量</span>攻击伤害加成 ·<span class="kw">格挡</span>抵御攻击直到回合结束
        <h4>节点</h4>
        ⚔️战斗 💀精英(高风险高回报) 🔥篝火(休整/锻造) 🏪商店 ❓事件 🎁宝箱 👑BOSS
        <h4>快捷键</h4>
        <span class="kbd">1-9</span> 打出对应手牌 · <span class="kbd">E</span> 结束回合 · <span class="kbd">Esc</span> 取消/关闭
        <h4>存档与技能包</h4>
        每走一步自动存档,关闭页面后可从主菜单继续。每局结算按得分累积<b style="color:#6ee7ff">积分</b>,
        在主菜单的<b>技能包商店</b>解锁新流派卡牌(永久加入对应职业卡池)。
        <h4>🌀 联动主题(特殊卡组)</h4>
        主菜单切到<b>联动主题</b>即可进入独立卡组与独立闯关模式:专属卡池、专属敌人与 BOSS、
        以及随层数加深的<b>污染</b>与<b>领域</b>机制,打赢主题 BOSS 会直接进入下一片镜域。
        <div style="margin-top:8px" id="theme-help-list"></div>`));
      const list = modal.querySelector('#theme-help-list');
      for (const t of themeMetaList()) {
        const box = el('div', 'help-theme');
        box.innerHTML = `<b style="color:#f0c96a">${t.art} ${esc(t.name)}</b>
          <div style="color:#9aa3c7;margin:2px 0 4px">${esc(t.tag || '')} · 初始遗物:${esc(t.relic)}</div>
          <div>${esc(t.tip || '')}</div>`;
        if (list) list.appendChild(box);
      }
      const btns = el('div', 'modal-btns');
      const close = el('button', '', '开始冒险');
      close.onclick = () => this.closeModal();
      btns.appendChild(close);
      modal.appendChild(btns);
      this.openModal(modal);
    },

    statsModal() {
      const s = Engine.loadStats();
      const modal = el('div', 'modal');
      modal.style.maxWidth = '420px';
      modal.appendChild(el('h3', '', '历史战绩'));
      modal.appendChild(el('div', 'help-content', `
        <h4>总攀登次数:${s.runs}</h4>
        <h4>登顶成功:${s.wins} 次(${s.runs ? Math.round(s.wins / s.runs * 100) : 0}%)</h4>
        <h4>最佳得分:${s.best}</h4>
        <h4>累计积分:${s.points}(已消费 ${s.spent},可用 ${Engine.availablePoints()})</h4>
        <h4>已解锁技能包:${GS.Unlocks.list().length} / ${GS.Unlocks.all.length}</h4>
        <div style="margin-top:10px">
          ⚔️ 剑士登顶 ${s.classWins.warrior || 0} 次<br>
          🗡️ 游侠登顶 ${s.classWins.ranger || 0} 次<br>
          🔮 术士登顶 ${s.classWins.warlock || 0} 次
          ${themeMetaList().map(t => `<br>${t.art} ${esc(t.name)} 通关 ${s.classWins[t.cls] || 0} 次`).join('')}
        </div>`));
      const btns = el('div', 'modal-btns');
      const close = el('button', '', '关闭');
      close.onclick = () => this.closeModal();
      btns.appendChild(close);
      modal.appendChild(btns);
      this.openModal(modal);
    },

    packShopModal() {
      const self = this;
      const build = () => {
        const modal = el('div', 'modal pack-modal');
        modal.appendChild(el('h3', '', `技能包商店`));
        const pts = Engine.availablePoints();
        modal.appendChild(el('div', 'tip-line', `当前可用积分:<b style="color:#f0c96a;font-size:17px"> ${pts}</b> —— 每局结算按得分自动累积,解锁后包内卡牌永久进入该职业的卡池`));
        for (const cls of ['warrior', 'ranger', 'warlock']) {
          const meta = CLASS_META[cls];
          const section = el('div', '', '');
          section.style.cssText = 'margin-top:18px';
          section.appendChild(el('div', 'shop-label', `${meta.art} ${meta.name}`));
          for (const pack of GS.Unlocks.all.filter(p => p.cls === cls)) {
            const owned = GS.Unlocks.owned(pack.id);
            const row = el('div', 'pack-row');
            const head = el('div', 'pack-head');
            head.innerHTML = `<span class="pack-name">${esc(pack.name)}</span>
              <span class="pack-cost ${owned ? 'owned' : ''}">${owned ? '✓ 已解锁' : '🪙 ' + pack.cost + ' 积分'}</span>`;
            row.appendChild(head);
            row.appendChild(el('div', 'pack-desc', esc(pack.desc)));
            const cardsBox = el('div', 'pack-cards');
            for (const cid of pack.cards) {
              cardsBox.appendChild(this.cardEl({ id: cid, up: 0 }, { preview: false }));
            }
            row.appendChild(cardsBox);
            if (!owned) {
              const btn = el('button', pts >= pack.cost ? 'primary' : 'ghost', pts >= pack.cost ? `解锁(${pack.cost} 积分)` : `积分不足(${pack.cost})`);
              btn.disabled = pts < pack.cost;
              btn.onclick = () => {
                if (Engine.spendPoints(pack.cost)) {
                  GS.Unlocks.unlock(pack.id);
                  AudioFX.play('relic');
                  self.toast('已解锁技能包「' + pack.name + '」!');
                  self.closeModal();
                  self.packShopModal();
                  // 刷新主菜单按钮上的积分
                  if (!self.run) self.render();
                } else self.toast('积分不足');
              };
              row.appendChild(btn);
            }
            section.appendChild(row);
          }
          modal.appendChild(section);
        }
        const btns = el('div', 'modal-btns');
        const close = el('button', '', '关闭');
        close.onclick = () => { this.closeModal(); if (!this.run) this.render(); };
        btns.appendChild(close);
        modal.appendChild(btns);
        return modal;
      };
      this.openModal(build());
    },

    /* ================= tooltip / toast ================= */
    attachTip(node, html) {
      node.addEventListener('mouseenter', ev => {
        const tip = $('#tooltip');
        tip.innerHTML = html;
        tip.classList.remove('hidden');
        const r = node.getBoundingClientRect();
        const tr = tip.getBoundingClientRect();
        let x = r.left + r.width / 2 - tr.width / 2;
        let y = r.top - tr.height - 8;
        if (y < 4) y = r.bottom + 8;
        if (x < 4) x = 4;
        if (x + tr.width > innerWidth - 4) x = innerWidth - tr.width - 4;
        tip.style.left = x + 'px';
        tip.style.top = y + 'px';
      });
      node.addEventListener('mouseleave', () => $('#tooltip').classList.add('hidden'));
    },
    tooltipText(html) {
      const tip = $('#tooltip');
      tip.innerHTML = html;
      tip.classList.remove('hidden');
      tip.style.left = '20px';
      tip.style.top = '80px';
    },
    toast(msg) {
      const t = $('#toast');
      t.textContent = msg;
      t.classList.remove('hidden');
      t.style.animation = 'none';
      void t.offsetWidth;
      t.style.animation = '';
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => t.classList.add('hidden'), 2000);
    },

    /* ================= 动画 ================= */
    async animateEvents(evts) {
      const run = this.run;
      if (!run) return;
      const speed = evts.length > 24 ? 70 : evts.length > 12 ? 120 : 200;
      let lastShieldFx = 0;
      for (const ev of evts) {
        switch (ev.t) {
          case 'fx': {
            if (ev.fx === 'slash') {
              const anchor = document.querySelector(`.enemy[data-uid="${ev.uid}"] .art`) || document.querySelector('.enemy .art');
              if (anchor) { this.fxAt(anchor, 'fx-slash'); this.fxAt(anchor, 'fx-ring'); AudioFX.play('attack'); }
              await sleep(90);
            } else if (ev.fx === 'aoe') {
              const row = document.querySelector('.enemy-row');
              if (row) this.fxAt(row, 'fx-aoeflash', true);
              AudioFX.play('bigattack');
              await sleep(160);
            } else if (ev.fx === 'multi') {
              this.centerText('✦ 连锁打击 ✦');
              await sleep(120);
            } else if (ev.fx === 'shield') {
              // 高频触发时节流
              const now = Date.now();
              if (now - lastShieldFx > 400) {
                lastShieldFx = now;
                const anchor = $('#player-anchor');
                if (anchor) this.fxAt(anchor, 'fx-shieldring');
              }
            } else if (ev.fx === 'poison') {
              const anchor = document.querySelector(`.enemy[data-uid="${ev.uid}"] .art`);
              if (anchor) {
                for (let i = 0; i < 3; i++) {
                  setTimeout(() => this.fxAt(anchor, 'fx-poisonbubble'), i * 120);
                }
              }
              await sleep(100);
            } else if (ev.fx === 'blackflash') {
              const anchor = document.querySelector(`.enemy[data-uid="${ev.uid}"] .art`) || document.querySelector('.enemy .art');
              if (anchor) this.fxAt(anchor, 'fx-blackflash');
              const flash = el('div', 'blackflash-text', '黑 闪');
              document.body.appendChild(flash);
              setTimeout(() => flash.remove(), 900);
              AudioFX.play('bigattack');
              await sleep(420);
            } else if (ev.fx === 'boss') {
              const banner = el('div', 'boss-banner', `⚔ ${esc(ev.name)} ⚔<small>BOSS 战</small>`);
              document.body.appendChild(banner);
              setTimeout(() => banner.remove(), 1800);
              document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
              AudioFX.play('bigattack');
              await sleep(600);
            }
            break;
          }
          case 'dmg': {
            const anchor = ev.who === 'player'
              ? $('#player-anchor')
              : document.querySelector(`.enemy[data-uid="${ev.uid}"] .art`);
            if (anchor) {
              this.floatAt(anchor, (ev.self ? '' : '-') + ev.v, ev.self ? 'dmg-self' : 'dmg');
              if (ev.who === 'player') {
                AudioFX.play('hurt');
                document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
                const vg = $('#vignette');
                vg.classList.remove('flash'); void vg.offsetWidth; vg.classList.add('flash');
              } else { AudioFX.play('enemyHit'); anchor.classList.remove('hit'); void anchor.offsetWidth; anchor.classList.add('hit'); }
            }
            await sleep(speed + 100);
            break;
          }
          case 'block': {
            const anchor = ev.who === 'player' ? $('#player-anchor') : document.querySelector(`.enemy[data-uid="${ev.uid}"]`);
            if (anchor) this.floatAt(anchor, '🛡' + ev.v, 'block');
            if (ev.who === 'player') AudioFX.play('block');
            await sleep(speed);
            break;
          }
          case 'heal': {
            const anchor = ev.who === 'player' ? $('#hp-orb') : document.querySelector(`.enemy[data-uid="${ev.uid}"]`);
            if (anchor) this.floatAt(anchor, '+' + ev.v, 'heal');
            AudioFX.play('heal');
            await sleep(speed);
            break;
          }
          case 'gold': {
            this.floatAt($('#hud-gold'), '🪙', 'gold');
            AudioFX.play('coin');
            await sleep(90);
            break;
          }
          case 'status': {
            if (ev.key === 'field') {
              const gauge = document.querySelector('.field-gauge');
              if (gauge) { gauge.classList.remove('pulse'); void gauge.offsetWidth; gauge.classList.add('pulse'); }
              await sleep(60);
              break;
            }
            const anchor = ev.who === 'player' ? $('#player-anchor') : document.querySelector(`.enemy[data-uid="${ev.uid}"]`);
            if (anchor && ev.key) this.floatAt(anchor, (CARDS.STATUS_TEXT[ev.key] || ev.key) + ' ' + (ev.v > 0 ? '+' + ev.v : ev.v), 'status');
            await sleep(speed * 0.5);
            break;
          }
          case 'energy': {
            const orb = $('#energy-orb');
            if (orb) { orb.classList.remove('pulse'); void orb.offsetWidth; orb.classList.add('pulse'); }
            await sleep(40);
            break;
          }
          case 'death': {
            AudioFX.play('death');
            const node = document.querySelector(`.enemy[data-uid="${ev.uid}"]`);
            if (node) node.classList.add('dead');
            await sleep(speed + 120);
            break;
          }
          case 'text': {
            this.centerText(ev.msg);
            await sleep(speed + 260);
            break;
          }
          case 'play': {
            AudioFX.play('playCard');
            const g = el('div', 'ghost-card', esc(ev.name || ''));
            document.body.appendChild(g);
            setTimeout(() => g.remove(), 600);
            await sleep(60);
            break;
          }
          case 'draw': { AudioFX.play('draw'); await sleep(50); break; }
          case 'shuffle': { AudioFX.play('shuffle'); await sleep(80); break; }
          case 'turnStart': { await sleep(60); break; }
          case 'potion': { AudioFX.play('potion'); await sleep(120); break; }
          case 'relic': { AudioFX.play('relic'); this.centerText('✨ ' + ev.name + ' ✨'); await sleep(500); break; }
          case 'summon': { this.centerText('幽灵出现: ' + ev.name); await sleep(200); break; }
          default: await sleep(30);
        }
      }
    },

    fxAt(anchor, cls, fullSize) {
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      const f = el('div', cls);
      if (fullSize) { f.style.left = '0'; f.style.top = '0'; f.style.width = r.width + 'px'; f.style.height = r.height + 'px'; }
      $('#float-layer').appendChild(f);
      // 定位到视口坐标(float-layer 是 fixed 全屏)
      if (!fullSize) {
        const fr = f.getBoundingClientRect();
        f.style.left = (r.left + r.width / 2 - fr.width / 2) + 'px';
        f.style.top = (r.top + r.height / 2 - fr.height / 2) + 'px';
        // 毒泡加随机水平偏移
        if (cls === 'fx-poisonbubble') f.style.left = (parseFloat(f.style.left) + (Math.random() * 60 - 30)) + 'px';
      }
      setTimeout(() => f.remove(), 1300);
    },

    floatAt(anchor, text, cls) {
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      const f = el('div', 'float-num ' + cls, esc(text));
      f.style.left = (r.left + r.width / 2 + (Math.random() * 40 - 20)) + 'px';
      f.style.top = (r.top + r.height * 0.35) + 'px';
      $('#float-layer').appendChild(f);
      setTimeout(() => f.remove(), 1200);
    },
    centerText(msg) {
      const f = el('div', 'float-text', esc(msg));
      $('#float-layer').appendChild(f);
      setTimeout(() => f.remove(), 1500);
    },

    /* ================= 星空背景 ================= */
    initStars() {
      const canvas = $('#bg-stars');
      const ctx = canvas.getContext('2d');
      let stars = [];
      function resize() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        stars = [];
        const n = Math.floor(innerWidth * innerHeight / 12000);
        for (let i = 0; i < n; i++) {
          stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.4 + 0.3,
            p: Math.random() * Math.PI * 2,
            s: 0.008 + Math.random() * 0.02,
            hue: Math.random() < 0.25 ? (Math.random() < 0.5 ? '110,231,255' : '167,139,250') : '255,255,255'
          });
        }
      }
      resize();
      window.addEventListener('resize', resize);
      let meteor = null;
      let lastMeteor = 0;
      function frame(t) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const st of stars) {
          st.p += st.s;
          const a = 0.25 + Math.abs(Math.sin(st.p)) * 0.6;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${st.hue},${a})`;
          ctx.fill();
        }
        if (!meteor && t - lastMeteor > 6000 + Math.random() * 8000) {
          meteor = { x: Math.random() * canvas.width * 0.7, y: -10, vx: 4 + Math.random() * 3, vy: 3 + Math.random() * 2, life: 1 };
          lastMeteor = t;
        }
        if (meteor) {
          meteor.x += meteor.vx; meteor.y += meteor.vy; meteor.life -= 0.012;
          const grad = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x - meteor.vx * 12, meteor.y - meteor.vy * 12);
          grad.addColorStop(0, `rgba(255,255,255,${meteor.life})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(meteor.x - meteor.vx * 12, meteor.y - meteor.vy * 12);
          ctx.stroke();
          if (meteor.life <= 0 || meteor.y > canvas.height + 20) meteor = null;
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
  };

  global.GS.UI = UI;
  window.addEventListener('DOMContentLoaded', () => UI.init());
})(typeof window !== 'undefined' ? window : globalThis);
