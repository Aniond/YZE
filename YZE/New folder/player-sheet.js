/* ========================================================================
   PLAYER SHEET — MOCKUP STATE & RENDERERS
   ======================================================================== */

const state = {
  name: 'Lyra Brennan',
  archetype: 'Wasteland Medic',
  xp: 12,
  xpSpent: 8,

  attrs: {
    strength: 3,
    agility:  4,
    wits:     5,
    empathy:  3
  },

  // 12 core YZE skills
  skills: {
    sk_force:        0,
    sk_melee:        2,
    sk_stamina:      1,
    sk_marksmanship: 3,
    sk_mobility:     2,
    sk_stealth:      4,
    sk_crafting:     2,
    sk_observation:  3,
    sk_survival:     1,
    sk_healing:      4,
    sk_insight:      2,
    sk_persuasion:   1
  },

  health:  { cur: 4, max: 4 },
  resolve: { cur: 5, max: 5 },

  conditions: { phys: 0, ment: 0 },

  rollMod: 0,
  opposed: 0,
  autoApply: false,

  // Combat / weapons
  equippedId: 'w1',
  weapons: [
    { id: 'w1', name: 'Hunting Knife',  attr: 'strength', skill: 'Melee',        bonus: 1, dmg: 2, range: 'engaged' },
    { id: 'w2', name: 'Salvaged Carbine', attr: 'agility',  skill: 'Marksmanship', bonus: 2, dmg: 3, range: 'long'    }
  ],
  armor: [
    { id: 'a1', name: 'Patchwork Leather Vest', rating: 3 }
  ],
  equipment: [
    { id: 'e1', name: 'Medkit',         qty: 1 },
    { id: 'e2', name: 'Compass',        qty: 1 },
    { id: 'e3', name: 'Rope (10m)',     qty: 1 },
    { id: 'e4', name: 'Ration (×3)',    qty: 3 }
  ],
  other: [
    { id: 'o1', name: 'Tarnished locket', note: 'Belonged to her sister' }
  ],
  gearNotes: 'Carbine ammo running low — 4 shots left.',

  // Attack modifiers
  mods: {
    aim:         false,
    defenseless: false,
    range:       'short',
    light:       0,
    other:       0
  },
  cover: 0,

  // Notes structured
  notes: {
    appearance:    'Mid-30s, lean build. Auburn hair tied back. Scar across right cheek from the Black Year.',
    relationships: 'Owes Cassel a favor (gunsmith, Salt Junction). Lost contact with brother Tomas two seasons ago.',
    secrets:       'Carries her sister\'s locket. The infection in her left leg is getting worse.',
    xpLog:         '+1 Reached Salt Junction\n+2 Saved the caravan\n+1 Brokered peace with the Choir\n−2 Bought Healing rank 3\n−3 Bought Marksmanship rank 3\n−3 Bought Stealth rank 4',
    freeform:      ''
  },

  activeTab: 'sheet',
  modsOpen: false,
  pushAvailable: false
};

const SKILLS = [
  { key: 'sk_force',        name: 'Force',        attr: 'strength' },
  { key: 'sk_melee',        name: 'Melee',        attr: 'strength' },
  { key: 'sk_stamina',      name: 'Stamina',      attr: 'strength' },
  { key: 'sk_marksmanship', name: 'Marksmanship', attr: 'agility'  },
  { key: 'sk_mobility',     name: 'Mobility',     attr: 'agility'  },
  { key: 'sk_stealth',      name: 'Stealth',      attr: 'agility'  },
  { key: 'sk_crafting',     name: 'Crafting',     attr: 'wits'     },
  { key: 'sk_observation',  name: 'Observation',  attr: 'wits'     },
  { key: 'sk_survival',     name: 'Survival',     attr: 'wits'     },
  { key: 'sk_healing',      name: 'Healing',      attr: 'empathy'  },
  { key: 'sk_insight',      name: 'Insight',      attr: 'empathy'  },
  { key: 'sk_persuasion',   name: 'Persuasion',   attr: 'empathy'  }
];

const ATTR_LABELS = {
  strength: { full: 'Strength', short: 'STR' },
  agility:  { full: 'Agility',  short: 'AGI' },
  wits:     { full: 'Wits',     short: 'WIT' },
  empathy:  { full: 'Empathy',  short: 'EMP' }
};

const RANGE_MOD = { short: 0, engaged: -3, medium: -1, long: -2, extreme: -3 };

/* ========================================================================
   TABS
   ======================================================================== */
function switchTab(name) {
  state.activeTab = name;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tabpane').forEach(p => p.classList.toggle('active', p.dataset.pane === name));
}

document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => switchTab(t.dataset.tab));
});

/* ========================================================================
   DERIVED — H/R max from attributes
   ======================================================================== */
function recomputeMax() {
  state.health.max  = Math.ceil((state.attrs.strength + state.attrs.agility) / 2) + 1;
  state.resolve.max = Math.ceil((state.attrs.wits     + state.attrs.empathy) / 2) + 1;
  if (state.health.cur  > state.health.max)  state.health.cur  = state.health.max;
  if (state.resolve.cur > state.resolve.max) state.resolve.cur = state.resolve.max;
}

/* ========================================================================
   PERSISTENT HEADER
   ======================================================================== */
function renderHeader() {
  document.getElementById('nameInput').value = state.name;
  document.getElementById('archetypeInput').value = state.archetype;
  document.getElementById('xpDisplay').textContent = (state.xp - state.xpSpent);

  // Health
  renderVitalBar('healthBar', state.health.cur, state.health.max, 'health');
  // Resolve
  renderVitalBar('resolveBar', state.resolve.cur, state.resolve.max, 'resolve');

  // Conditions
  document.querySelectorAll('.cond-mini').forEach(card => {
    const type = card.dataset.type;
    const count = state.conditions[type];
    card.dataset.count = count;
    card.querySelector('[data-val]').textContent = count;
  });
}

function renderVitalBar(id, cur, max, type) {
  const bar = document.getElementById(id);
  const pipsWrap = bar.querySelector('.vb-pips');
  let html = '';
  for (let i = 0; i < max; i++) {
    const filled = i < cur;
    const crit = cur > 0 && i === cur - 1 && cur < max;
    html += `<button class="vb-pip ${filled ? 'filled' : ''} ${crit ? 'crit' : ''}" onclick="setVital('${type}', ${filled ? i : i + 1})"></button>`;
  }
  pipsWrap.innerHTML = html;
  bar.querySelector('[data-cur]').value = cur;
  bar.querySelector('[data-max]').textContent = max;
}

function setVital(type, value) {
  const v = state[type];
  v.cur = Math.max(0, Math.min(v.max, value));
  renderHeader();
}

function adjustCondition(type, delta) {
  state.conditions[type] = Math.max(0, Math.min(3, state.conditions[type] + delta));
  renderHeader();
}

function breakNpc(type) {
  state.conditions[type] = 3;
  if (type === 'phys') state.health.cur = 0;
  else state.resolve.cur = 0;
  renderHeader();
  toast(type === 'phys' ? 'Broken — rolling Physical Critical' : 'Broken — rolling Mental Critical');
}

/* ========================================================================
   SHEET TAB — attributes
   ======================================================================== */
function renderAttrs() {
  const grid = document.getElementById('attrGrid');
  grid.innerHTML = Object.keys(state.attrs).map(k => {
    const v = state.attrs[k];
    let pips = '';
    for (let i = 0; i < 5; i++) {
      pips += `<button class="attr-pip ${i < v ? 'filled' : ''}" onclick="event.stopPropagation(); setAttr('${k}', ${i + 1})"></button>`;
    }
    return `
      <div class="attr-card" data-attr="${k}" onclick="rollAttr('${k}')">
        <div class="attr-label">${ATTR_LABELS[k].full.toUpperCase()}</div>
        <div class="attr-value" data-zero="${v === 0}">${v}</div>
        <div class="attr-pips">${pips}</div>
        <div class="attr-roll-hint">Tap to roll</div>
      </div>
    `;
  }).join('');
}
function setAttr(k, v) {
  state.attrs[k] = Math.max(0, Math.min(5, v));
  recomputeMax();
  renderAttrs();
  renderHeader();
  renderSkills();
}
function rollAttr(k) {
  toast(`Rolling ${ATTR_LABELS[k].full} (${state.attrs[k]}d6)`);
  triggerPush();
}

/* ========================================================================
   SKILLS TAB — grouped by attribute
   ======================================================================== */
function renderSkills() {
  const wrap = document.getElementById('skillsContainer');
  const attrs = ['strength', 'agility', 'wits', 'empathy'];
  wrap.innerHTML = attrs.map(attr => {
    const skills = SKILLS.filter(s => s.attr === attr);
    const rows = skills.map(s => {
      const lvl = state.skills[s.key];
      let pips = '';
      for (let i = 0; i < 5; i++) {
        pips += `<button class="skill-pip ${i < lvl ? 'filled' : ''}" onclick="setSkill('${s.key}', ${i + 1})"></button>`;
      }
      return `
        <div class="skill-row">
          <div class="skill-name">${s.name}<span class="sk-attr-tag">${ATTR_LABELS[attr].short}</span></div>
          <div class="skill-pips">${pips}</div>
          <button class="skill-roll-btn" onclick="rollSkill('${s.key}')">Roll</button>
        </div>
      `;
    }).join('');
    return `
      <div class="skill-section" data-attr="${attr}">
        <div class="skill-section-head">
          <span class="ss-attr">${ATTR_LABELS[attr].full}</span>
          <span class="ss-val"><span class="lbl">base</span>${state.attrs[attr]}d6</span>
          <button class="roll-attr-btn" onclick="rollAttr('${attr}')">Roll ${ATTR_LABELS[attr].short}</button>
        </div>
        ${rows}
      </div>
    `;
  }).join('');
}

function setSkill(key, level) {
  const cur = state.skills[key];
  state.skills[key] = (level === cur) ? Math.max(0, level - 1) : level;
  renderSkills();
}
function rollSkill(key) {
  const s = SKILLS.find(x => x.key === key);
  const dice = state.attrs[s.attr] + state.skills[key];
  toast(`Rolling ${s.name} (${dice}d6)`);
  triggerPush();
}

/* ========================================================================
   COMBAT TAB
   ======================================================================== */
function renderCombat() {
  // Equipped weapon banner
  const banner = document.getElementById('equippedBanner');
  const eq = state.weapons.find(w => w.id === state.equippedId);
  if (eq) {
    banner.classList.remove('empty');
    banner.innerHTML = `
      <div class="eq-portrait">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 18l8-8m-2-6l8 8-6 6-8-8 6-6zm2 2l4 4"/></svg>
      </div>
      <div class="eq-body">
        <div class="eq-name">${eq.name}</div>
        <div class="eq-stats">
          <span class="stat">${ATTR_LABELS[eq.attr].short} + ${eq.skill}</span><span class="sep">·</span>
          <span class="stat">Bonus <strong>${eq.bonus}</strong></span><span class="sep">·</span>
          <span class="stat">Dmg <strong>${eq.dmg}</strong></span><span class="sep">·</span>
          <span class="stat">${eq.range}</span>
        </div>
      </div>
      <button class="attack-roll-btn" onclick="rollAttack('${eq.id}')">Roll Attack</button>
    `;
  } else {
    banner.classList.add('empty');
    banner.innerHTML = 'No weapon equipped — tap the pip on a weapon below';
  }

  // Weapon cards grid
  const grid = document.getElementById('weaponsGrid');
  if (state.weapons.length === 0) {
    grid.innerHTML = `
      <div class="weapons-empty">
        Drag a weapon from the compendium to add it.
        <span class="hint">— Or use the Gear tab —</span>
      </div>
    `;
  } else {
    grid.innerHTML = state.weapons.map(w => `
      <div class="weapon-card" data-equipped="${w.id === state.equippedId}">
        <div class="wc-head">
          <div class="wc-portrait">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 18l8-8m-2-6l8 8-6 6-8-8 6-6zm2 2l4 4"/></svg>
          </div>
          <div class="wc-name-block">
            <div class="wc-name">${w.name}</div>
            <div class="wc-meta">${ATTR_LABELS[w.attr].short} · ${w.skill} · ${w.range}</div>
          </div>
          <button class="equip-pip" title="Equip" onclick="toggleEquip('${w.id}')"></button>
        </div>
        <div class="wc-stats">
          <div class="wc-stat"><span class="lbl">BONUS</span><span class="val">+${w.bonus}</span></div>
          <div class="wc-stat"><span class="lbl">DMG</span><span class="val">${w.dmg}</span></div>
        </div>
        <div class="wc-actions">
          <button class="roll" onclick="rollAttack('${w.id}')">Roll Attack</button>
          <button class="del" onclick="deleteWeapon('${w.id}')" title="Remove">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l10 10M13 3L3 13"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Mods collapse summary
  const collapse = document.getElementById('modsCollapse');
  collapse.dataset.open = state.modsOpen;
  const summary = computeModSummary();
  const sumEl = document.getElementById('modsSummary');
  sumEl.textContent = summary.text;
  sumEl.dataset.zero = summary.total === 0 && !state.mods.aim && !state.mods.defenseless;
  renderModsBody();
}

function computeModSummary() {
  const m = state.mods;
  let total = 0;
  const parts = [];
  if (m.aim) { total += 2; parts.push('Aim'); }
  if (m.defenseless) { total += 3; parts.push('Defenseless'); }
  if (RANGE_MOD[m.range] !== 0) { total += RANGE_MOD[m.range]; parts.push(m.range); }
  if (m.light != 0) { total += +m.light; parts.push(m.light < 0 ? 'low light' : ''); }
  if (m.other != 0) { total += +m.other; parts.push(`other ${m.other > 0 ? '+' : ''}${m.other}`); }
  const sign = total > 0 ? '+' : '';
  return { total, text: total === 0 && parts.length === 0 ? 'No modifiers' : `${sign}${total} · ${parts.filter(Boolean).join(' / ')}` };
}

function renderModsBody() {
  const m = state.mods;
  document.getElementById('modAim').dataset.on = m.aim;
  document.getElementById('modDefenseless').dataset.on = m.defenseless;
  document.getElementById('modRange').value = m.range;
  document.getElementById('modLight').value = String(m.light);
  document.getElementById('modOther').value = m.other;
}

function toggleMod(name) {
  state.mods[name] = !state.mods[name];
  renderCombat();
}
function setMod(name, value) {
  state.mods[name] = name === 'light' || name === 'other' ? +value : value;
  renderCombat();
}
function toggleModsCollapse() {
  state.modsOpen = !state.modsOpen;
  renderCombat();
}

function toggleEquip(id) {
  state.equippedId = state.equippedId === id ? null : id;
  renderCombat();
}
function deleteWeapon(id) {
  if (!confirm('Remove this weapon from inventory?')) return;
  state.weapons = state.weapons.filter(w => w.id !== id);
  if (state.equippedId === id) state.equippedId = null;
  renderCombat();
}
function rollAttack(id) {
  const w = state.weapons.find(x => x.id === id);
  if (!w) return;
  const sum = computeModSummary();
  const pool = state.attrs[w.attr] + (state.skills['sk_' + w.skill.toLowerCase()] || 0) + w.bonus + sum.total;
  toast(`Attack: ${w.name} (${Math.max(0, pool)}d6, dmg ${w.dmg})`);
  triggerPush();
}

function rollArmor() {
  const total = state.armor.reduce((n, a) => n + a.rating, 0);
  if (total === 0) { toast('No armor to roll'); return; }
  toast(`Rolling Armor (${total}d6)`);
}
function rollCover() {
  if (state.cover === 0) { toast('Pick a cover type first'); return; }
  toast(`Rolling Cover (${state.cover}d6)`);
}

/* ========================================================================
   GEAR TAB
   ======================================================================== */
function renderGear() {
  document.getElementById('armorList').innerHTML = state.armor.length === 0
    ? '<div class="weapons-empty" style="grid-column:auto;">No armor — drag armor here to add.</div>'
    : state.armor.map(a => gearRowHTML(a, 'armor')).join('');

  document.getElementById('equipmentList').innerHTML = state.equipment.length === 0
    ? '<div class="weapons-empty" style="grid-column:auto;">No equipment.</div>'
    : state.equipment.map(e => gearRowHTML(e, 'equipment')).join('');

  document.getElementById('otherList').innerHTML = state.other.length === 0
    ? '<div class="weapons-empty" style="grid-column:auto;">No other items.</div>'
    : state.other.map(o => gearRowHTML(o, 'other')).join('');

  document.getElementById('armorCount').textContent = state.armor.length;
  document.getElementById('equipmentCount').textContent = state.equipment.length;
  document.getElementById('otherCount').textContent = state.other.length;

  document.getElementById('gearNotes').value = state.gearNotes;
}

function gearRowHTML(item, cat) {
  let stat = '';
  let meta = '';
  if (cat === 'armor')      { stat = `<div class="gr-stat">Armor <strong>${item.rating}</strong></div>`; meta = 'Worn'; }
  else if (cat === 'equipment') { stat = item.qty > 1 ? `<div class="gr-stat">×<strong>${item.qty}</strong></div>` : '<div class="gr-stat"></div>'; meta = 'Carried'; }
  else                          { stat = `<div class="gr-stat" style="font-style:italic;">${item.note || ''}</div>`; meta = ''; }
  return `
    <div class="gear-row">
      <div class="gr-portrait">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 12h6"/></svg>
      </div>
      <div>
        <div class="gr-name">${item.name}</div>
        ${meta ? `<div class="gr-meta">${meta}</div>` : ''}
      </div>
      ${stat}
      <button class="gr-del" onclick="deleteItem('${cat}', '${item.id}')" title="Remove">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l10 10M13 3L3 13"/></svg>
      </button>
    </div>
  `;
}
function deleteItem(cat, id) {
  if (!confirm('Remove this item?')) return;
  state[cat] = state[cat].filter(x => x.id !== id);
  renderGear();
}

/* ========================================================================
   NOTES TAB
   ======================================================================== */
function renderNotes() {
  ['appearance', 'relationships', 'secrets', 'xpLog', 'freeform'].forEach(k => {
    const el = document.getElementById('note_' + k);
    if (el) el.value = state.notes[k];
  });
  document.getElementById('xpEarned').value = state.xp;
  document.getElementById('xpSpent').value = state.xpSpent;
  document.getElementById('xpAvail').value = state.xp - state.xpSpent;
}
function updateXP() {
  state.xp = +document.getElementById('xpEarned').value || 0;
  state.xpSpent = +document.getElementById('xpSpent').value || 0;
  renderNotes();
  renderHeader();
}

/* ========================================================================
   ROLL OPTIONS (Sheet tab)
   ======================================================================== */
function bindNextRoll() {
  document.getElementById('rollMod').addEventListener('input', e => state.rollMod = +e.target.value);
  document.getElementById('opposed').addEventListener('input', e => state.opposed = +e.target.value);
  document.getElementById('autoApply').addEventListener('click', e => {
    state.autoApply = !state.autoApply;
    e.currentTarget.dataset.on = state.autoApply;
  });
}

function triggerPush() {
  state.pushAvailable = true;
  document.getElementById('sheet').dataset.canpush = 'true';
}
function doPush() {
  state.pushAvailable = false;
  document.getElementById('sheet').dataset.canpush = 'false';
  toast('Push! Re-rolling non-1s');
}

/* ========================================================================
   FAB
   ======================================================================== */
function setupFab() {
  const fab = document.getElementById('dockFab');
  const menu = document.getElementById('dockMenu');
  fab.addEventListener('click', e => {
    e.stopPropagation();
    menu.dataset.open = menu.dataset.open === 'true' ? 'false' : 'true';
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.dock')) menu.dataset.open = 'false';
  });
}

/* ========================================================================
   TOAST
   ======================================================================== */
function toast(text) {
  let t = document.querySelector('.__toast');
  if (!t) {
    t = document.createElement('div');
    t.className = '__toast';
    Object.assign(t.style, {
      position: 'fixed', bottom: '108px', right: '36px',
      background: 'rgba(20,16,11,0.95)', color: 'var(--amber-3)',
      border: '1px solid var(--amber-1)', padding: '8px 14px',
      fontSize: '11px', fontFamily: 'var(--font-mono)',
      borderRadius: '4px', zIndex: 300,
      boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
      transition: 'opacity 240ms, transform 240ms',
      pointerEvents: 'none'
    });
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.style.opacity = '1';
  t.style.transform = 'translateY(0)';
  clearTimeout(t._h);
  t._h = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(8px)';
  }, 1800);
}

/* ========================================================================
   INIT
   ======================================================================== */
function init() {
  recomputeMax();
  renderHeader();
  renderAttrs();
  renderSkills();
  renderCombat();
  renderGear();
  renderNotes();
  bindNextRoll();
  setupFab();

  // Bindings for editable fields
  document.getElementById('nameInput').addEventListener('input', e => state.name = e.target.value);
  document.getElementById('archetypeInput').addEventListener('input', e => state.archetype = e.target.value);

  // Health/Resolve number entry
  document.querySelectorAll('.vital-bar [data-cur]').forEach(input => {
    input.addEventListener('input', e => {
      const bar = e.target.closest('.vital-bar');
      const type = bar.dataset.type;
      const pool = type === 'health' ? state.health : state.resolve;
      pool.cur = Math.max(0, Math.min(pool.max, +e.target.value || 0));
      renderHeader();
    });
  });
}

init();
