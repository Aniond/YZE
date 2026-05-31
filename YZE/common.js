// Year Zero Engine — Realm VTT Ruleset
// Powered by Year Zero Engine
// Licensed under the Year Zero Engine Free Tabletop License
// https://freeleaguepublishing.com/community-content/free-tabletop-licenses/

// YZE damage model: Health & Resolve POOLS (SRD p.5).
// Damage reduces Health, stress reduces Resolve; you are Broken at 0 in either.
// Attributes are NOT damaged in this variant — only Health/Resolve are.
// (Max Health/Resolve are computed sheet-side: calcMaxHealth/calcMaxResolve in
// character-main.html for PCs; the NPC sheet stores maxHealth directly.)

// ── Push helpers (shared by yze_pool, yze_push, yze_combat) ───────────────
// YZE dice pool: 6s = successes, 1s on ATTRIBUTE dice = banes, blanks (2-5) are
// the only dice re-rolled on a push. Kept dice (6s + 1s) are reconstructed from
// per-type counts, so nothing but scalars ever travels through roll metadata.

// Parse an initial roll's dice into typed dice + per-type kept/reroll counts.
// Dice order is [attr][skill][gear].
function yzeParseInitial(dice, attrCount, skillCount) {
  var o = { typed: [], successes: 0, rerollCount: 0,
            s6Attr: 0, s6Skill: 0, s6Gear: 0,
            b1Attr: 0, b1Skill: 0, b1Gear: 0,
            rerollAttr: 0, rerollSkill: 0, rerollGear: 0 };
  for (var i = 0; i < dice.length; i++) {
    var v = parseInt(dice[i].value, 10);
    var t = (i < attrCount) ? 'base_attr'
          : (i < attrCount + skillCount) ? 'base_skill'
          : 'gear';
    o.typed.push({ value: v, type: t });
    if (v === 6) {
      o.successes++;
      if (t === 'base_attr') o.s6Attr++; else if (t === 'base_skill') o.s6Skill++; else o.s6Gear++;
    } else if (v === 1) {
      if (t === 'base_attr') o.b1Attr++; else if (t === 'base_skill') o.b1Skill++; else o.b1Gear++;
    } else {
      o.rerollCount++;
      if (t === 'base_attr') o.rerollAttr++; else if (t === 'base_skill') o.rerollSkill++; else o.rerollGear++;
    }
  }
  return o;
}

// Rebuild the full pool after a push: kept dice (from per-type counts in meta)
// plus the freshly re-rolled dice (re-tagged by position: attr, then skill, gear).
function yzeRebuildPool(meta, rerolled) {
  var all = [];
  function add(n, val, type) { for (var k = 0; k < (n || 0); k++) all.push({ value: val, type: type }); }
  add(meta.s6Attr, 6, 'base_attr'); add(meta.s6Skill, 6, 'base_skill'); add(meta.s6Gear, 6, 'gear');
  add(meta.b1Attr, 1, 'base_attr'); add(meta.b1Skill, 1, 'base_skill'); add(meta.b1Gear, 1, 'gear');
  var ra = meta.rerollAttr || 0, rs = meta.rerollSkill || 0;
  for (var i = 0; i < rerolled.length; i++) {
    var v = parseInt(rerolled[i].value, 10);
    var t = (i < ra) ? 'base_attr' : (i < ra + rs) ? 'base_skill' : 'gear';
    all.push({ value: v, type: t });
  }
  return all;
}

// Count successes (6s) and banes (1s) by source over a typed pool.
function yzeCountPool(all) {
  var r = { successes: 0, attrBanes: 0, gearBanes: 0 };
  for (var i = 0; i < all.length; i++) {
    var v = all[i].value, t = all[i].type;
    if (v === 6) r.successes++;
    else if (v === 1) { if (t === 'base_attr') r.attrBanes++; else if (t === 'gear') r.gearBanes++; }
  }
  return r;
}

// Strength/Agility banes cost Health (damage); Wits/Empathy banes cost Resolve (stress).
function yzePoolForAttr(attrKey) {
  return (attrKey === 'wits' || attrKey === 'empathy') ? 'curResolve' : 'curHealth';
}

// Which current-pool field a bane should reduce for THIS record. PCs have both
// Health and Resolve (Wits/Emp banes -> Resolve). NPCs are Health-only (no Resolve
// track, SRD "Just Health" variant), so every bane hits Health for them — this
// avoids writing a phantom data.curResolve that has no UI.
function yzePoolFieldForRecord(record, attrKey) {
  if (record && record.recordType === 'npcs') return 'curHealth';
  return yzePoolForAttr(attrKey);
}

// Should attack damage be written to the TARGET's token? Opt-in toggle, off by
// default (a fresh/unset checkbox is treated as off). The attacker's own
// consequences — banes to their Health/Resolve, wear on their own weapon —
// always apply regardless; this only gates writing to someone else's sheet.
function yzeAutoApply(rec) {
  return !!(rec && rec.data && (rec.data.autoApply === true || rec.data.autoApply === 1));
}

// ── Encumbrance (SRD p.6) ─────────────────────────────────────────────────

// Carry limit = 2 × Strength (dice pool system).
function yzeCarryLimit() {
  var str = parseInt(api.getValue('data.strength') || '0', 10);
  return 2 * (isNaN(str) ? 0 : str);
}

// Sum the weight of all items in data.gearList (default weight 1 per item).
function yzeCurrentLoad() {
  var list  = getGearList();
  var total = 0;
  for (var i = 0; i < list.length; i++) {
    var w = parseFloat((list[i].data && list[i].data.weight !== undefined)
              ? list[i].data.weight : 1);
    if (isNaN(w)) w = 1;
    total += w;
  }
  return total;
}

// Check encumbrance and update data.overEncumbered + display fields.
// Guarded so it only writes when values actually change (prevents onrecordchanged loop).
function yzeEncumbranceCheck() {
  var limit  = yzeCarryLimit();
  var load   = yzeCurrentLoad();
  var pack   = api.getValue('data.hasBackpack');
  var hasPack = (pack === true || pack === 1 || pack === '1' || pack === 'true');
  var effectiveLimit = hasPack ? limit * 2 : limit;
  var over   = load > effectiveLimit;
  var display = load + ' / ' + effectiveLimit;

  var curOver    = api.getValue('data.overEncumbered');
  var wasOver    = (curOver === true || curOver === 1 || curOver === '1' || curOver === 'true');
  var curDisplay = api.getValue('data.encumbranceDisplay') || '';

  var upd = {}, dirty = false;
  if (over !== wasOver) {
    upd['data.overEncumbered']     = over;
    upd['fields.encWarning.hidden'] = !over;
    dirty = true;
  }
  if (display !== curDisplay) {
    upd['data.encumbranceDisplay'] = display;
    dirty = true;
  }
  if (dirty) {
    api.setValues(upd);
    if (over && !wasOver) {
      api.showNotification('Over encumbrance limit — -2 to physical rolls', 'red', 'Encumbrance');
    }
  }
}

// ── Status effects — dice penalties ───────────────────────────────────────
// Native Realm VTT effects use "Alter a Data Field" to write strMod (STR/AGI
// penalty) and witMod (WIT/EMP penalty) directly onto data.*. The roll
// handlers read those fields here and subtract the penalty from the pool.
// Values stored as NEGATIVE integers (e.g. Entangled sets strMod = -1).
function yzeEffectPenalty(attrKey) {
  if (attrKey === 'strength' || attrKey === 'agility') {
    var sm = parseInt(api.getValue('data.strMod') || '0', 10);
    return isNaN(sm) ? 0 : sm;
  }
  if (attrKey === 'wits' || attrKey === 'empathy') {
    var wm = parseInt(api.getValue('data.witMod') || '0', 10);
    return isNaN(wm) ? 0 : wm;
  }
  return 0;
}

// ── Conditions (SRD p.21) ─────────────────────────────────────────────────
// Each physical condition (Exhausted/Battered/Wounded) gives -1 to Strength &
// Agility rolls; each mental condition (Angry/Scared/Disheartened) gives -1 to
// Wits & Empathy rolls. Over-encumbrance adds a further -2 to physical rolls.
// Active status effects add their strMod/witMod on top (yzeEffectPenalty returns
// a negative number, so we SUBTRACT it to turn it into extra dice removed).
// Returns the number of dice to remove for a roll on attrKey (clamped >= 0).
function yzeCondPenalty(attrKey) {
  function on(f) { var v = api.getValue('data.' + f); return (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0; }
  var effPen = yzeEffectPenalty(attrKey); // negative for penalties
  if (attrKey === 'strength' || attrKey === 'agility') {
    var encPen = on('overEncumbered') ? 2 : 0;
    return Math.max(0, on('cond_exhausted') + on('cond_battered') + on('cond_wounded') + encPen - effPen);
  }
  if (attrKey === 'wits' || attrKey === 'empathy') {
    return Math.max(0, on('cond_angry') + on('cond_scared') + on('cond_disheartened') - effPen);
  }
  return 0;
}

// ── Consumables & Supply Rolls (SRD p.7) ─────────────────────────────────
// rollSupply(ratingField, nameField) — rolls D6 for a consumable supply.
// On 1-2 the supply decreases by 1. Uses Math.random() (sheet context only).
function rollSupply(ratingField, nameField) {
  var supply = parseInt(api.getValue('data.' + ratingField) || '0', 10);
  var label  = api.getValue('data.' + nameField) || ratingField;
  if (isNaN(supply) || supply <= 0) {
    api.showNotification(label + ' is already exhausted.', 'red', 'Supply');
    return;
  }
  var roll = Math.floor(Math.random() * 6) + 1;
  var msg  = '**[center]' + label + ' — Supply Roll[/center]**';
  msg     += '\n[center]D6: ' + roll + '[/center]';
  if (roll <= 2) {
    var newSupply = Math.max(0, supply - 1);
    var upd = {};
    upd['data.' + ratingField] = newSupply;
    api.setValues(upd);
    if (newSupply === 0) {
      msg += '\n**[center][color=red]Exhausted — supply depleted[/color][/center]**';
    } else {
      msg += '\n[center][color=red]Supply used — now ' + newSupply + ' remaining[/color][/center]';
    }
  } else {
    msg += '\n[center][color=green]Supply holds — ' + supply + ' remaining[/color][/center]';
  }
  api.sendMessage(msg, undefined, [], [{ name: label + ' Supply', tooltip: 'Supply roll' }]);
}

// Apply a negative dice modifier to a {attr, skill, gear} count, removing dice
// from skill first, then gear, then attribute (SRD p.10 modifier order). Mutates
// and returns the counts object.
function yzeApplyPenalty(counts, penalty) {
  var rem = penalty || 0;
  var take;
  take = Math.min(counts.skill, rem); counts.skill -= take; rem -= take;
  take = Math.min(counts.gear,  rem); counts.gear  -= take; rem -= take;
  take = Math.min(counts.attr,  rem); counts.attr  -= take; rem -= take;
  return counts;
}

// ── Roll modifiers (SRD p.10-11) ──────────────────────────────────────────
// Difficulty (+3..-3), help (+1 each, max +3) and situational modifiers all
// reduce to adding/removing base dice. Apply a SIGNED modifier to a {attr,
// skill, gear} count: a positive modifier adds that many SKILL dice (a 1 on a
// skill die is harmless — banes only matter on attribute & gear dice, so added
// dice never cause self-damage, matching "add dice to your skills", SRD p.10);
// a negative modifier removes dice skill->gear->attr via yzeApplyPenalty.
function yzeApplyModifier(counts, mod) {
  mod = parseInt(mod || 0, 10);
  if (isNaN(mod)) return counts;
  if (mod > 0) counts.skill += mod;
  else if (mod < 0) yzeApplyPenalty(counts, -mod);
  return counts;
}

// Read the active difficulty setting and return its modifier integer.
// 'average' / blank = 0. Stacks with rollMod; both are reset after each roll.
function yzeReadDifficulty() {
  var d = (api.getValue('data.difficulty') || '').toLowerCase().trim();
  if (d === 'trivial')   return  3;
  if (d === 'simple')    return  2;
  if (d === 'easy')      return  1;
  if (d === 'demanding') return -1;
  if (d === 'hard')      return -2;
  if (d === 'formidable') return -3;
  return 0; // 'average' or blank
}

// Human-readable difficulty label for chat (blank when Average).
function yzeFormatDifficulty(d) {
  var MAP = {
    trivial:    'Trivial (+3)',
    simple:     'Simple (+2)',
    easy:       'Easy (+1)',
    demanding:  'Demanding (-1)',
    hard:       'Hard (-2)',
    formidable: 'Formidable (-3)'
  };
  return MAP[(d || '').toLowerCase().trim()] || '';
}

// Read the sheet's ad-hoc roll modifier field (the Modifier stepper), clamped.
// Read-only — the roll builder resets it after rolling so it never silently
// carries to the next roll.
function yzeReadModifier() {
  var m = parseInt(api.getValue('data.rollMod') || '0', 10);
  if (isNaN(m)) m = 0;
  return Math.max(-10, Math.min(10, m));
}

// Read the "opposed — successes to beat" field, clamped to >= 0. Read-only.
function yzeReadOpposed() {
  var o = parseInt(api.getValue('data.opposed') || '0', 10);
  if (isNaN(o) || o < 0) o = 0;
  return Math.min(20, o);
}

// Build the verdict line for a (possibly opposed) skill roll. `opposed` is the
// number of successes the opponent already rolled (0 = unopposed). To win an
// opposed roll you must roll MORE successes than your opponent; a tie fails as
// the active party (SRD p.11). Lives here so yze_pool and yze_push agree.
function yzeVerdict(successes, opposed) {
  opposed = parseInt(opposed || 0, 10);
  if (opposed > 0) {
    var net = successes - opposed;
    if (net > 0)  return '**[center][color=green]SUCCESS[/color] - won by ' + net + ' (' + successes + ' vs ' + opposed + ')[/center]**';
    if (net === 0) return '**[center][color=red]TIE - you fail[/color] (' + successes + ' vs ' + opposed + ')[/center]**';
    return '**[center][color=red]FAILURE[/color] (' + successes + ' vs ' + opposed + ')[/center]**';
  }
  return successes > 0
    ? '**[center][color=green]SUCCESS[/color] - ' + successes + ' success' + (successes > 1 ? 'es' : '') + '[/center]**'
    : '**[center][color=red]FAILURE[/color][/center]**';
}

// ── Armor (SRD p.20) ───────────────────────────────────────────────────────
// A record's effective armor rating: an explicit `data.armor` (NPCs) if set,
// otherwise the sum of armorRating across worn armor in `data.gearList` (PCs).
// `getter(path)` reads a value — pass api.getValue for the current sheet, or a
// closure over api.getValueOnRecord(token, ...) for a target token.
function yzeArmorTotal(getter) {
  var direct = parseInt(getter('data.armor') || '0', 10);
  if (direct > 0) return direct;
  var list = getter('data.gearList') || [];
  var arr = [];
  if (list && list.length !== undefined && typeof list !== 'string') {
    for (var i = 0; i < list.length; i++) arr.push(list[i]);
  } else if (list) {
    for (var k in list) { if (Object.prototype.hasOwnProperty.call(list, k)) arr.push(list[k]); }
  }
  var sum = 0;
  for (var j = 0; j < arr.length; j++) {
    var d = arr[j] && arr[j].data;
    if (d && d.gearType === 'armor') sum += parseInt(d.armorRating || '0', 10);
  }
  return sum;
}

// Roll N six-sided dice with Math.random (for inline soak in the combat handler,
// where a separate api.roll can't be awaited). Returns counts of 6s and 1s plus
// the raw values for display. Armor: 6 cancels 1 damage, 1 (bane) degrades armor.
function yzeRollPoolN(n) {
  var r = { sixes: 0, ones: 0, vals: [] };
  for (var i = 0; i < (n || 0); i++) {
    var v = Math.floor(Math.random() * 6) + 1;
    r.vals.push(v);
    if (v === 6) r.sixes++; else if (v === 1) r.ones++;
  }
  return r;
}

// Shared push trigger — reads the stored roll context and routes to the skill
// push (yze_push) or the attack push (yze_combat). Lives here so the PUSH button
// on any tab does the right thing.
function yzePushRoll() {
  var last = api.getSession('yzeLastRoll');
  if (!last || last.rerollCount <= 0) return;
  var meta = {
    mode:        last.mode,
    attrKey:     last.attrKey,
    skillName:   last.skillName,
    opposed:     last.opposed || 0,
    s6Attr: last.s6Attr, s6Skill: last.s6Skill, s6Gear: last.s6Gear,
    b1Attr: last.b1Attr, b1Skill: last.b1Skill, b1Gear: last.b1Gear,
    rerollAttr: last.rerollAttr, rerollSkill: last.rerollSkill, rerollGear: last.rerollGear,
    isPush: true
  };
  var rollType = 'yze_push';
  if (last.mode === 'combat') {
    meta.baseDamage = last.baseDamage;
    meta.range      = last.range;
    meta.weaponId   = last.weaponId;
    meta.prevDamage = last.prevDamage;
    rollType = 'yze_combat';
  }
  api.roll(last.rerollCount + 'd6', meta, rollType);
  api.setValues({ 'data.canPush': 0 });
  api.setHidden('pushSection', true);
}

// ── Difficulty via status effect (hard-coded names) ───────────────────────
// A GM can apply a status effect named exactly "Difficulty 1" .. "Difficulty 6"
// to a token (the 6 effects are defined in settings.effects — see the config —
// and can also be built/renamed manually in the campaign). When the roller has
// such an effect, the roll handlers use its number as the required-successes
// threshold, overriding the per-sheet data.successThreshold. Names are matched
// verbatim: the word "Difficulty" followed by a digit 1-6.
//
// Confirmed pattern: token.effects is an array whose entries expose .name
// (Sean's 5e ability.js: effects.find(e => e.name === 'Concentration')).
//
// Matching is deliberately forgiving so a hand-built effect links reliably:
// the name just has to contain "difficulty" (any case) followed somewhere by a
// digit 1-6. So "Difficulty 3", "difficulty 3", "Difficulty: 3", and
// "Difficulty Lvl 3" all resolve to 3.
function yzeDifficultyFromEffects(record) {
  var token   = (api.getToken && record) ? api.getToken(record) : null;
  var effects = (token && token.effects) || [];
  for (var i = 0; i < effects.length; i++) {
    var nm = effects[i] && effects[i].name;
    if (typeof nm !== 'string') continue;
    var low = nm.toLowerCase();
    var pos = low.indexOf('difficulty');
    if (pos === -1) continue;
    var rest = nm.substring(pos + 10); // text after the word "difficulty"
    for (var c = 0; c < rest.length; c++) {
      var ch = rest.charAt(c);
      if (ch >= '1' && ch <= '6') return parseInt(ch, 10);
      if (ch >= '0' && ch <= '9') break; // 0/7/8/9 -> not a valid level, stop
    }
  }
  return 0;
}

// Effective required-successes threshold for a roll. A "Difficulty N" token
// effect wins if present; otherwise the per-sheet data.successThreshold (>= 1).
function yzeEffectiveThreshold(record) {
  var fromEffect = yzeDifficultyFromEffects(record);
  if (fromEffect > 0) return fromEffect;
  var t = parseInt(api.getValue('data.successThreshold') || '1', 10);
  if (isNaN(t) || t < 1) t = 1;
  return t;
}

// ── Gear / Attack helpers ─────────────────────────────────────────────────
// Shared by character-gear.html and character-combat.html.

function getGearList() {
  var raw = api.getValue('data.gearList');
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  var arr = [];
  for (var k in raw) {
    if (Object.prototype.hasOwnProperty.call(raw, k)) arr.push(raw[k]);
  }
  return arr;
}

var ATK_RANGE_MOD = { short: 0, medium: -1, long: -2, extreme: -3, engaged: -3 };

function yzeAttackMod() {
  function on(f) { var v = api.getValue('data.' + f); return (v === true || v === 1 || v === '1' || v === 'true'); }
  var aim      = on('atkAim')          ?  2 : 0;
  var defl     = on('atkDefenseless')  ?  3 : 0;
  var moving   = on('modMovingTarget') ? -2 : 0;
  var cover    = on('modCover')        ? -2 : 0;
  var mounted  = on('modMounted')      ? -2 : 0;
  var helpless = on('modHelpless')     ?  2 : 0;
  var light    = parseInt(api.getValue('data.atkLight') || '0', 10);
  var rcode    = api.getValue('data.atkRange') || 'short';
  var rng      = ATK_RANGE_MOD[rcode];
  if (rng === undefined) rng = 0;
  if (defl && rcode === 'engaged') rng = 0;
  return aim + defl + moving + cover + mounted + helpless + light + rng + yzeReadModifier() + yzeReadDifficulty();
}

function rollAttackForItem(item) {
  if (!item) return;
  var d           = item.data || {};
  var linkedAttr  = d.linkedAttr  || 'strength';
  var linkedSkill = d.linkedSkill || 'Melee';
  var gearBonus   = parseInt(d.bonus  || '0', 10);
  var damage      = parseInt(d.damage || '0', 10);
  var range       = d.range || 'engaged';
  var base        = parseInt(api.getValue('data.' + linkedAttr) || '0', 10);
  var skKey       = 'sk_' + String(linkedSkill).toLowerCase();
  var skLvl       = parseInt(api.getValue('data.' + skKey) || '0', 10);
  var pen         = yzeCondPenalty(linkedAttr);
  var counts      = yzeApplyPenalty({ attr: base, skill: skLvl, gear: gearBonus }, pen);
  var difficulty  = api.getValue('data.difficulty') || 'average';
  var mod         = yzeAttackMod();  // already includes yzeReadDifficulty()
  yzeApplyModifier(counts, mod);
  var pool        = counts.attr + counts.skill + counts.gear;
  if (pool <= 0) {
    api.showNotification('Modifiers removed all dice — no attack possible.', 'red', 'Cannot Attack');
    return;
  }
  var tags = [];
  if (pen > 0)   tags.push('-' + pen + ' cond');
  if (mod !== 0) tags.push((mod > 0 ? '+' : '') + mod + ' mod');
  var label = (item.name || linkedSkill) + (tags.length ? ' (' + tags.join(', ') + ')' : '');
  api.roll(pool + 'd6', {
    attrKey:    linkedAttr,
    attrCount:  counts.attr,
    skillCount: counts.skill,
    gearCount:  counts.gear,
    baseDamage: damage,
    skillName:  label,
    range:      range,
    weaponId:   item._id || '',
    isAttack:   true,
    condPenalty: pen,
    mod:         mod,
    difficulty:  difficulty
  }, 'yze_combat');
  api.setValues({
    'data.rollMod':          0,
    'data.difficulty':       'average',
    'data.successThreshold': 1,
    'data.modMovingTarget':  false,
    'data.modCover':         false,
    'data.modMounted':       false,
    'data.modHelpless':      false
  });
}

// ── Attribute-only roll ───────────────────────────────────────────────────
// Rolls just the attribute (no skill). Used by the [Roll STR] etc. buttons
// in the skills-tab section headers. Same pipeline as skill rolls so push
// and roll handlers work unchanged.
function rollAttrOnly(key) {
  var base       = parseInt(api.getValue('data.' + key) || '0', 10);
  var pen        = yzeCondPenalty(key);
  var mod        = yzeReadModifier() + yzeReadDifficulty();
  var opposed    = parseInt(api.getValue('data.opposed')  || '0', 10);
  var difficulty = api.getValue('data.difficulty') || 'average';
  if (isNaN(opposed)) opposed = 0;
  var counts = yzeApplyPenalty({ attr: base, skill: 0, gear: 0 }, pen);
  yzeApplyModifier(counts, mod);
  var total = counts.attr + counts.skill + counts.gear;
  if (total <= 0) {
    api.showNotification('No dice to roll!', 'red', 'Cannot Roll');
    return;
  }
  var label = key.charAt(0).toUpperCase() + key.slice(1);
  api.roll(total + 'd6', {
    attrKey:     key,
    attrCount:   counts.attr,
    skillCount:  0,
    gearCount:   0,
    skillName:   label,
    condPenalty: pen,
    mod:         mod,
    opposed:     opposed,
    difficulty:  difficulty
  }, 'yze_pool');
  api.setValues({ 'data.rollMod': 0, 'data.opposed': 0, 'data.difficulty': 'average', 'data.successThreshold': 1 });
}

// ── Persistent header ─────────────────────────────────────────────────────
// Called from every tab's healthCanvas + resolveCanvas onload/onrecordchanged,
// and also wired into each tab's body canvas/list init so record changes
// always redraw both header and body.

// ── Healing the Broken (SRD p.22) ────────────────────────────────────────

// Roll the Healing skill (Empathy) to restore a broken ally.
// Target a broken ally token first; each success restores 1 Health.
function rollHealBroken() {
  var emp    = parseInt(api.getValue('data.empathy')    || '0', 10);
  var heal   = parseInt(api.getValue('data.sk_healing') || '0', 10);
  var pen    = yzeCondPenalty('empathy');
  var mod    = yzeReadModifier() + yzeReadDifficulty();
  var counts = yzeApplyPenalty({ attr: emp, skill: heal, gear: 0 }, pen);
  yzeApplyModifier(counts, mod);
  var pool   = counts.attr + counts.skill + counts.gear;
  if (pool <= 0) {
    api.showNotification('No Healing dice to roll!', 'red', 'Heal Broken');
    return;
  }
  api.roll(pool + 'd6', {
    skillName:  'Heal (Broken)',
    attrKey:    'empathy',
    attrCount:  counts.attr,
    skillCount: counts.skill,
    gearCount:  0,
    isHeal:     true
  }, 'yze_pool');
  api.setValues({ 'data.rollMod': 0, 'data.difficulty': 'average' });
}

// Stamina (Strength) death save for a lethal critical injury. Cannot push (SRD rule).
function rollDeathSave() {
  var str = parseInt(api.getValue('data.strength') || '0', 10);
  if (str <= 0) {
    api.showNotification('Strength is 0 — cannot make death save!', 'red', 'Death Save');
    return;
  }
  api.roll(str + 'd6', {
    skillName:   'Death Save',
    attrKey:     'strength',
    attrCount:   str,
    skillCount:  0,
    gearCount:   0,
    isDeathSave: true
  }, 'yze_pool');
}

// SRD "on your own" recovery: restore 1 Health or Resolve after a shift of rest.
// Not broken, not starving, not hypothermic.
function selfHealShift() {
  var curH = parseInt(api.getValue('data.curHealth')  || '0', 10);
  var maxH = parseInt(api.getValue('data.maxHealth')  || '1', 10);
  var curR = parseInt(api.getValue('data.curResolve') || '0', 10);
  var maxR = parseInt(api.getValue('data.maxResolve') || '1', 10);
  var upd  = {}, healed = '';
  if (curH < maxH) {
    upd['data.curHealth'] = curH + 1; healed = 'Health';
  } else if (curR < maxR) {
    upd['data.curResolve'] = curR + 1; healed = 'Resolve';
  }
  if (!healed) {
    api.showNotification('Already at full Health and Resolve.', 'blue', 'Self-Heal');
    return;
  }
  api.setValues(upd, function() { drawHeader(); });
  api.showNotification('Self-healed 1 point of ' + healed + ' after a shift of rest.', 'green', 'Self-Heal');
}

// ── Gear Repair (SRD p.11) ─────────────────────────────────────────────────

// Crafting roll to repair degraded gear.
// Called from gear-entry.html where record = the gear item.
// Uses data.repairDice (player-set dice count) since character stats
// are not accessible from the list-item record context.
function rollGearRepair() {
  var n        = parseInt(api.getValue('data.repairDice') || '3', 10);
  var curBonus = parseInt(api.getValue('data.bonus')      || '0', 10);
  var maxBonus = parseInt(api.getValue('data.maxBonus')   || '0', 10);
  if (maxBonus <= 0 || curBonus >= maxBonus) {
    api.showNotification('Gear is at full bonus or max not set.', 'blue', 'Repair');
    return;
  }
  if (n < 1) n = 1;
  api.roll(n + 'd6', {
    skillName:  'Repair (Crafting)',
    attrKey:    'wits',
    attrCount:  n,
    skillCount: 0,
    gearCount:  0,
    isRepair:   true,
    curBonus:   curBonus,
    maxBonus:   maxBonus
  }, 'yze_pool');
}

// ── Willpower Points ──────────────────────────────────────────────────────

// Increment data.wp by amount (clamped 0–10). Shows blue notification.
function gainWP(amount) {
  var cur  = parseInt(api.getValue('data.wp') || '0', 10);
  if (isNaN(cur)) cur = 0;
  var next = Math.min(10, Math.max(0, cur + (parseInt(amount, 10) || 0)));
  if (next !== cur) {
    api.setValues({ 'data.wp': next });
    api.showNotification('+' + amount + ' Willpower Point' + (amount > 1 ? 's' : ''), 'blue', 'Willpower');
  }
}

// Validate WP, deduct, and fire the yze_spell roll handler.
function castSpell(wpSpend, spellName, rank, discipline, portrait) {
  var curWP = parseInt(api.getValue('data.wp') || '0', 10);
  if (isNaN(curWP)) curWP = 0;
  wpSpend = parseInt(wpSpend, 10) || 1;
  if (curWP < wpSpend) {
    api.showNotification('Not enough Willpower Points', 'red', 'Cast Spell');
    return;
  }
  api.setValues({ 'data.wp': curWP - wpSpend });
  api.roll(wpSpend + 'd6', {
    spellName:  spellName  || 'Spell',
    wpSpend:    wpSpend,
    rank:       parseInt(rank, 10) || 1,
    discipline: discipline || '',
    portrait:   portrait   || ''
  }, 'yze_spell');
}

// ── Stress ────────────────────────────────────────────────────────────────

function relieveStress() {
  api.setValues({ 'data.stress': 0 });
  api.showNotification('Stress relieved — you feel calmer', 'green', 'Stress');
}

// ── Pride ─────────────────────────────────────────────────────────────────

// Spend the Pride bonus: marks it used and queues +1 success on the next roll.
// yze-pool.js / yze-combat.js read data.prideBonus before sending chat output.
function usePride() {
  api.setValues({ 'data.prideBonus': 1, 'data.prideUsed': true }, function() {
    drawHeader();
    refreshHeaderBadges();
  });
  api.showNotification('Pride used — +1 success on your next roll', 'green', 'Pride');
}

// Call at the start of each session to restore the Pride bonus.
function resetPrideForSession() {
  api.setValues({ 'data.prideUsed': false, 'data.prideBonus': 0 }, function() {
    drawHeader();
    refreshHeaderBadges();
  });
  api.showNotification('New session — Pride restored', 'blue', 'Session Reset');
}

function drawHeader() {
  // Read stored max pools. If not yet computed (new character, or non-main tab
  // before updateDerived has run), fall back to deriving from base attributes
  // so the pips show immediately on every tab.
  var maxH = parseInt(api.getValue('data.maxHealth'),  10);
  var maxR = parseInt(api.getValue('data.maxResolve'), 10);
  if (isNaN(maxH) || maxH <= 0) {
    var str = parseInt(api.getValue('data.strength') || '0', 10) || 0;
    var agi = parseInt(api.getValue('data.agility')  || '0', 10) || 0;
    maxH = Math.ceil((str + agi) / 2) + 1;
  }
  if (isNaN(maxR) || maxR <= 0) {
    var wit = parseInt(api.getValue('data.wits')    || '0', 10) || 0;
    var emp = parseInt(api.getValue('data.empathy') || '0', 10) || 0;
    maxR = Math.ceil((wit + emp) / 2) + 1;
  }
  drawTinyPips('healthCanvas',  'curHealth',  maxH, '#c8902a', '#e8b85a');
  drawTinyPips('resolveCanvas', 'curResolve', maxR, '#9a7ad4', '#c8a8e8');
}

// Update the Broken badge and Pride button visibility.
// Uses api.setValues with fields.* paths (not api.setHidden) so it never
// triggers onrecordchanged. Call only from user-interaction callbacks, never
// from onrecordchanged handlers or drawHeader().
function refreshHeaderBadges() {
  var broken      = api.getValue('data.isBroken');
  var isBroken    = (broken === true || broken === 1 || broken === '1' || broken === 'true');
  var prideUsed   = api.getValue('data.prideUsed');
  var isPrideUsed = (prideUsed === true || prideUsed === 1 || prideUsed === '1' || prideUsed === 'true');
  api.setValues({
    'fields.brokenBadge.hidden': !isBroken,
    'fields.prideBtn.hidden':    isPrideUsed
  });
}

// maxVal is a pre-computed integer (drawHeader resolves it before calling).
function drawTinyPips(canvasField, curField, maxVal, fillCol, edgeCol) {
  var c = api.getCanvas(canvasField);
  if (!c) return;
  var W = c.width, H = c.height;
  c.clearRect(0, 0, W, H);
  c.clearTooltips();
  var cur = parseInt(api.getValue('data.' + curField) || '0', 10);
  var max = maxVal || 0;
  if (isNaN(cur)) cur = 0;
  if (max <= 0) return;
  var gap  = 2;
  var pipW = Math.floor((W - gap * (max - 1)) / max);
  if (pipW < 4) pipW = 4;
  for (var i = 0; i < max; i++) {
    var x      = i * (pipW + gap);
    var filled = i < cur;
    var crit   = cur > 0 && i === cur - 1 && cur < max;
    c.setFillStyle(crit ? '#cc3333' : (filled ? fillCol : 'rgba(200,144,42,0.10)'));
    c.fillRect(x, 0, pipW, H);
    if (filled) {
      c.setStrokeStyle(edgeCol);
      c.setLineWidth(1);
      c.strokeRect(x + 0.5, 0.5, pipW - 1, H - 1);
    }
    c.tooltip(x, 0, pipW, H, filled ? 'Click to remove' : 'Click to add');
  }
}

function onHealthPipClick()  { onPipClickGeneric('healthCanvas',  'curHealth',  'maxHealth'); }
function onResolvePipClick() { onPipClickGeneric('resolveCanvas', 'curResolve', 'maxResolve'); }

function onPipClickGeneric(canvasField, curField, maxField) {
  var c = api.getCanvas(canvasField);
  if (!c) return;
  var W   = c.width;
  var cur = parseInt(api.getValue('data.' + curField) || '0', 10);
  var max = parseInt(api.getValue('data.' + maxField) || '1', 10);
  if (isNaN(cur)) cur = 0;
  if (isNaN(max) || max <= 0) return;
  var gap  = 2;
  var pipW = Math.floor((W - gap * (max - 1)) / max);
  if (pipW < 4) pipW = 4;
  var idx  = Math.floor(event.x / (pipW + gap));
  if (idx < 0 || idx >= max) return;
  var next = (idx + 1 === cur) ? idx : idx + 1;
  next = Math.max(0, Math.min(max, next));
  var upd = {};
  upd['data.' + curField] = next;
  api.setValues(upd, function() { drawHeader(); });
}

// Break — force all conditions of type, zero the matching pool, roll crit.
// Lives in common.js so the Break button works from every tab's header.
function takeConditionPlayer(type) {
  var boxes = (type === 'mental')
    ? ['cond_angry', 'cond_scared', 'cond_disheartened']
    : ['cond_exhausted', 'cond_battered', 'cond_wounded'];
  var pool  = (type === 'mental') ? 'curResolve' : 'curHealth';
  var label = (type === 'mental') ? 'mental' : 'physical';
  var upd = {}, i;
  for (i = 0; i < boxes.length; i++) upd['data.' + boxes[i]] = true;
  upd['data.' + pool] = 0;
  api.setValues(upd, function() {
    refreshCondPlayerUI();
    drawHeader();
    api.showNotification('Fourth ' + label + ' condition — you are BROKEN!', 'red', 'Broken');
    api.roll('2d6', { critType: type }, 'yze_crit');
  });
}

// Show/hide the broken badge (driven by data.isBroken). Click the badge to clear.
function setBrokenPlayer(v) {
  api.setValues({ 'data.isBroken': !!v }, function() {
    drawHeader();
    refreshHeaderBadges();
  });
}

// ── XP (Notes tab) ────────────────────────────────────────────────────────
// Writes xpAvailable = xp - xpSpent. Guarded: only writes when the stored
// value differs, so it is safe to call from onrecordchanged without looping.
function refreshXp() {
  var xp    = parseInt(api.getValue('data.xp')        || '0', 10);
  var spent = parseInt(api.getValue('data.xpSpent')   || '0', 10);
  var avail = Math.max(0, (isNaN(xp) ? 0 : xp) - (isNaN(spent) ? 0 : spent));
  var cur   = parseInt(api.getValue('data.xpAvailable') || '0', 10);
  if (isNaN(cur)) cur = -1;
  if (avail !== cur) api.setValues({ 'data.xpAvailable': avail });
}

// ── Player Conditions ──────────────────────────────────────────────────────
// Mirrors addCond / removeCond / refreshCondUI from npc-main.html but targets
// common.js so the player character sheet can call these functions.
// Uses the same 6 hidden checkbox fields and the same condPhysDisplay /
// condMentDisplay string fields.

function addCondPlayer(type) {
  var fields = (type === 'mental')
    ? ['cond_angry', 'cond_scared', 'cond_disheartened']
    : ['cond_exhausted', 'cond_battered', 'cond_wounded'];
  for (var i = 0; i < fields.length; i++) {
    var v = api.getValue('data.' + fields[i]);
    if (!(v === true || v === 1 || v === '1' || v === 'true')) {
      api.setValue('data.' + fields[i], true, refreshCondPlayerUI);
      return;
    }
  }
  // All 3 set — trigger break (defined per-sheet as takeConditionPlayer)
  takeConditionPlayer(type);
}

function removeCondPlayer(type) {
  var fields = (type === 'mental')
    ? ['cond_angry', 'cond_scared', 'cond_disheartened']
    : ['cond_exhausted', 'cond_battered', 'cond_wounded'];
  for (var i = fields.length - 1; i >= 0; i--) {
    var v = api.getValue('data.' + fields[i]);
    if (v === true || v === 1 || v === '1' || v === 'true') {
      api.setValue('data.' + fields[i], false, refreshCondPlayerUI);
      return;
    }
  }
}

// Mirror physical and mental counts into the display stringfields.
// Guarded so it never loops when called from onrecordchanged.
function refreshCondPlayerUI() {
  var physF = ['cond_exhausted', 'cond_battered', 'cond_wounded'];
  var mentF = ['cond_angry', 'cond_scared', 'cond_disheartened'];
  var p = 0, m = 0, i, v;
  for (i = 0; i < physF.length; i++) {
    v = api.getValue('data.' + physF[i]);
    if (v === true || v === 1 || v === '1' || v === 'true') p++;
  }
  for (i = 0; i < mentF.length; i++) {
    v = api.getValue('data.' + mentF[i]);
    if (v === true || v === 1 || v === '1' || v === 'true') m++;
  }
  var pd = p + '/3';
  var md = m + '/3';
  var upd = {}, k, has = false;
  if (api.getValue('data.condPhysDisplay') !== pd) upd['data.condPhysDisplay'] = pd;
  if (api.getValue('data.condMentDisplay') !== md) upd['data.condMentDisplay'] = md;
  for (k in upd) { if (upd.hasOwnProperty(k)) { has = true; break; } }
  if (has) api.setValues(upd);
}

// Tint the rolled dice for Realm's dice renderer (Sean's pattern: set
// `die.customColor`, then pass the roll object to api.sendMessage — Realm draws
// the dice itself).
//
// Two-pass coloring:
//   Outcome (always): 6 = green, 1 = red.
//   Source type (blank 2-5 only, when meta is supplied):
//     attr → blue,  skill → orange,  gear → yellow,  stress → purple.
// Realm only exposes `customColor` — there is no separate base-tint property.
//
// meta keys used: attrCount, skillCount, gearCount  (same shape in pool &
// combat handlers; push callers normalise rerollAttr/Skill/Gear into these
// before calling).
function yzeColorDice(dice, meta) {
  if (!dice) return;
  var attrEnd  = meta ? parseInt(meta.attrCount  || 0, 10) : 0;
  var skillEnd = attrEnd  + (meta ? parseInt(meta.skillCount || 0, 10) : 0);
  var gearEnd  = skillEnd + (meta ? parseInt(meta.gearCount  || 0, 10) : 0);
  for (var i = 0; i < dice.length; i++) {
    var v = parseInt(dice[i].value, 10);
    if      (v === 6) { dice[i].customColor = 'green';  }
    else if (v === 1) { dice[i].customColor = 'red';    }
    else if (meta) {
      // Blank — tint by source so players can read the pool at a glance
      if      (i < attrEnd)  dice[i].customColor = 'blue';
      else if (i < skillEnd) dice[i].customColor = 'orange';
      else if (i < gearEnd)  dice[i].customColor = 'yellow';
      else                   dice[i].customColor = 'purple'; // stress
    }
  }
}
