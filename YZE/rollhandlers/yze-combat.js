// YZE yze_combat — weapon attack roll handler (initial roll + push).
//
// Initiative is card-based (rollhandlers/onRollInitiative.js); critical injuries
// are handled by yze_crit. This handler only resolves attacks.
//
// Chat output follows Sean's pattern: tint the rolled dice (die.customColor) and
// pass the roll object to api.sendMessage so Realm renders the dice; the message
// text carries only the verdict, using **[center][color=..]..[/color][/center]**.
//
// YZE combat (SRD): a hit deals the weapon's base damage +1 per extra success.
// A pushed attack can add successes (never lose them, since 6s are kept), and
// brings the usual push risks: attribute banes hurt the attacker (Health), and
// gear banes degrade the weapon's bonus. Writes to a TARGET's Health are gated
// by the Auto-apply toggle (yzeAutoApply); the attacker's own consequences apply
// regardless.
//
// Target locking: on the initial hit we record each target's id, recordType and
// post-hit Health in the session. The push re-uses those exact targets (writing
// by id via setValueOnTokenById) so it always lands on the originally-hit foe.

var meta = (data && data.roll && data.roll.metadata) || {};
var dice = (data && data.roll && data.roll.dice)     || [];

var skillName  = meta.skillName  || 'Attack';
var baseDamage = parseInt(meta.baseDamage || '0', 10);
var range      = meta.range || 'engaged';
var attrKey    = meta.attrKey || 'strength';
var isPush     = meta.isPush  || false;
var auto       = yzeAutoApply(record);

// Apply `dmg` to the currently targeted tokens. Returns { lines, targets } where
// targets is [{ id, recordType, hp }] (hp = Health left after the hit), so a push
// can re-apply to the same foes.
function applyDamageToTargets(dmg) {
  var out = { lines: '', targets: [] };
  if (dmg <= 0) return out;
  var targets = api.getTargets ? api.getTargets() : [];
  if (targets.length === 0) {
    out.lines += '\n[center]No target selected - apply ' + dmg + ' damage manually (after armor).[/center]';
    return out;
  }
  for (var t = 0; t < targets.length; t++) {
    var tok = targets[t].token;
    if (!tok) continue;
    var rtype = tok.recordType || 'characters';

    // Armor soak (SRD p.20): roll the target's armor rating in d6, each 6 cancels
    // one point of damage. Armor protects against attack damage, never against
    // self-inflicted push damage (which is applied elsewhere). Banes (1s) degrade
    // the armor by one step each, but only if damage actually penetrated.
    var armorRating = yzeArmorTotal(function(p) { return api.getValueOnRecord(tok, p); });
    var soak = 0, armorLine = '';
    if (armorRating > 0) {
      var ar = yzeRollPoolN(armorRating);
      soak = ar.sixes;
      armorLine = ' [armor ' + armorRating + ': -' + soak + ']';
      if (ar.ones > 0 && (dmg - soak) > 0 && rtype === 'npcs') {
        // Penetrated — degrade NPC armor by the number of banes rolled.
        var newArmor = Math.max(0, armorRating - ar.ones);
        api.setValuesOnRecord(tok, { 'data.armor': newArmor });
        armorLine += ' (armor degraded to ' + newArmor + ')';
      }
    }

    var net = Math.max(0, dmg - soak);
    var cur = parseInt(api.getValueOnRecord(tok, 'data.curHealth') || '0', 10);
    var next = Math.max(0, cur - net);
    api.setValuesOnRecord(tok, { 'data.curHealth': next }); // have the token here
    out.targets.push({ id: tok._id, recordType: rtype, hp: next });
    out.lines += '\n[center]' + (tok.name || 'Target') + armorLine + ': ' + cur + ' to ' + next + ' Health'
               + (next === 0 ? ' [color=red]BROKEN[/color]' : '') + '[/center]';
  }
  return out;
}

// ═══ PUSH ═══════════════════════════════════════════════════════════════════
if (isPush) {
  var allDice = yzeRebuildPool(meta, dice);
  var counts  = yzeCountPool(allDice);
  var successes = counts.successes;
  var attrBanes = counts.attrBanes;
  var gearBanes = counts.gearBanes;

  var newDamage = successes > 0 ? baseDamage + (successes - 1) : 0;
  var delta     = Math.max(0, newDamage - (parseInt(meta.prevDamage || '0', 10)));

  yzeColorDice(data.roll.dice, { // Realm renders the re-rolled dice, tinted by source
    attrCount:  meta.rerollAttr  || 0,
    skillCount: meta.rerollSkill || 0,
    gearCount:  meta.rerollGear  || 0
  });

  var pushThreshold = yzeEffectiveThreshold(record);

  var msgP;
  if (successes >= pushThreshold) {
    msgP = '**[center][color=green]HIT[/color] - ' + successes + ' success' + (successes > 1 ? 'es' : '')
         + (pushThreshold > 1 ? ' (needed ' + pushThreshold + ')' : '') + '[/center]**';
    msgP += '\n[center]Damage: ' + newDamage;
    if (successes > 1) msgP += ' (base ' + baseDamage + ' +' + (successes - 1) + ' extra)';
    msgP += '[/center]';

    if (delta > 0 && auto) {
      // Re-apply the extra damage to the originally-hit targets (locked at hit).
      var sess   = api.getSession ? api.getSession('yzeLastRoll') : null;
      var locked = (sess && sess.targets) ? sess.targets : [];
      if (locked.length > 0) {
        for (var k = 0; k < locked.length; k++) {
          var tg = locked[k];
          var before  = parseInt(tg.hp || '0', 10);
          var finalHp = Math.max(0, before - delta);
          api.setValueOnTokenById(tg.id, tg.recordType || 'characters', 'data.curHealth', finalHp);
          msgP += '\n[center]Target: ' + before + ' to ' + finalHp + ' Health'
                + (finalHp === 0 ? ' [color=red]BROKEN[/color]' : '') + '[/center]';
        }
      } else {
        msgP += applyDamageToTargets(delta).lines;
      }
    } else if (delta > 0 && !auto) {
      msgP += '\n[center]+' + delta + ' damage from the push - apply manually.[/center]';
    }
  } else if (successes > 0) {
    msgP = '**[center][color=orange]PARTIAL[/color] - ' + successes + ' of ' + pushThreshold + ' required — not a hit[/center]**';
  } else {
    msgP = '**[center][color=red]MISS[/color][/center]**';
  }

  // Attribute banes hurt the attacker (Melee=Str / Marksmanship=Agi -> Health).
  if (attrBanes > 0) {
    var poolA = yzePoolFieldForRecord(record, attrKey);
    var stressA = (poolA === 'curResolve');
    var curA = parseInt((record && record.data && record.data[poolA]) || '0', 10);
    var updA = {}; updA['data.' + poolA] = Math.max(0, curA - attrBanes);
    api.setValues(updA);
    msgP += '\n**[center][color=red]' + attrBanes + ' bane' + (attrBanes > 1 ? 's' : '') + ' - attacker takes '
          + attrBanes + (stressA ? ' stress (Resolve)' : ' damage (Health)') + '[/color][/center]**';
  }

  // Gear banes degrade this weapon's own bonus (SRD p.11). At 0 it breaks.
  if (gearBanes > 0) {
    var degraded = false;
    if (meta.weaponId) {
      var list = (record && record.data && record.data.gearList) || [];
      for (var g = 0; g < list.length; g++) {
        if (list[g] && list[g]._id === meta.weaponId) {
          var curBonus = parseInt((list[g].data && list[g].data.bonus) || '0', 10);
          var newBonus = Math.max(0, curBonus - gearBanes);
          var pathB = {}; pathB['data.gearList.' + g + '.data.bonus'] = newBonus;
          api.setValues(pathB);
          degraded = true;
          msgP += '\n[center]Gear bane x' + gearBanes + ' - ' + (list[g].name || 'weapon')
                + ' bonus ' + curBonus + ' to ' + newBonus + (newBonus === 0 ? ' (BROKEN)' : '') + '[/center]';
          break;
        }
      }
    }
    if (!degraded) {
      msgP += '\n[center]Gear bane x' + gearBanes + ' - reduce the weapon\'s bonus by ' + gearBanes + '[/center]';
    }
  }

  api.setValues({ 'data.canPush': 0, 'data.successThreshold': 1 });
  data.roll.total = successes;
  api.sendMessage(msgP, data.roll, [], [{ name: skillName + ' (Pushed)', tooltip: range + ' attack, pushed' }]);
  return;
}

// ═══ INITIAL ATTACK ══════════════════════════════════════════════════════════
var attrCount  = parseInt(meta.attrCount  || '0', 10);
var skillCount = parseInt(meta.skillCount || '0', 10);

var p = yzeParseInitial(dice, attrCount, skillCount);
var successes   = p.successes;

// ── Pride bonus (+1 free success, once per session) ───────────────────────
var prideBonus = parseInt(api.getValue('data.prideBonus') || '0', 10);
if (prideBonus > 0) {
  successes += prideBonus;
  api.setValues({ 'data.prideBonus': 0 });
}

var threshold   = yzeEffectiveThreshold(record);

var totalDamage = successes >= threshold ? baseDamage + (successes - 1) : 0;

yzeColorDice(data.roll.dice, meta); // Realm renders the dice, tinted by source

var msg;
var hitTargets = []; // {id, recordType, hp} — locked for the push
var diffLabel = yzeFormatDifficulty(meta.difficulty || '');

if (successes >= threshold) {
  msg = '**[center][color=green]HIT[/color] - ' + successes + ' success' + (successes > 1 ? 'es' : '')
      + (threshold > 1 ? ' (needed ' + threshold + ')' : '') + '[/center]**';
  if (prideBonus > 0) {
    msg += '\n[center][color=olive]Pride — +' + prideBonus + ' success[/color][/center]';
  }
  if (diffLabel) {
    msg += '\n[center][color=orange]Difficulty: ' + diffLabel + '[/color][/center]';
  }
  msg += '\n[center]Damage: ' + totalDamage;
  if (successes > 1) msg += ' (base ' + baseDamage + ' +' + (successes - 1) + ' extra)';
  msg += '[/center]';
  if (auto) {
    var ret = applyDamageToTargets(totalDamage);
    msg += ret.lines;
    hitTargets = ret.targets;
  } else if (totalDamage > 0) {
    msg += '\n[center]Auto-apply off - deal ' + totalDamage + ' damage manually (after armor).[/center]';
  }
} else if (successes > 0) {
  msg = '**[center][color=orange]PARTIAL[/color] - ' + successes + ' of ' + threshold + ' required — not a hit[/center]**';
  if (prideBonus > 0) {
    msg += '\n[center][color=olive]Pride — +' + prideBonus + ' success[/color][/center]';
  }
  if (diffLabel) {
    msg += '\n[center][color=orange]Difficulty: ' + diffLabel + '[/color][/center]';
  }
} else {
  msg = '**[center][color=red]MISS[/color][/center]**';
  if (prideBonus > 0) {
    msg += '\n[center][color=olive]Pride — +' + prideBonus + ' success (still a miss)[/color][/center]';
  }
  if (diffLabel) {
    msg += '\n[center][color=orange]Difficulty: ' + diffLabel + '[/color][/center]';
  }
}

msg += yzeEffectChatLine();

// ── Push eligibility — store context so the PUSH button can re-roll blanks ──
var canPush = p.rerollCount > 0;
if (canPush) {
  // Self-contained inline Push chip: roll params baked in as literals so the
  // button works without api.getSession. (The session is still set below so a
  // pushed HIT can re-apply extra damage to the locked targets.)
  var _snC = String(skillName).replace(/'/g, '');
  var _rgC = String(range).replace(/'/g, '');
  var _wid = String(meta.weaponId || '').replace(/'/g, '');
  var _pmC = "{isPush:true,mode:'combat'"
    + ",attrKey:'" + attrKey + "'"
    + ",skillName:'" + _snC + "'"
    + ",baseDamage:" + baseDamage
    + ",range:'" + _rgC + "'"
    + ",weaponId:'" + _wid + "'"
    + ",prevDamage:" + (auto ? totalDamage : 0)
    + ",s6Attr:" + p.s6Attr + ",s6Skill:" + p.s6Skill + ",s6Gear:" + p.s6Gear
    + ",b1Attr:" + p.b1Attr + ",b1Skill:" + p.b1Skill + ",b1Gear:" + p.b1Gear
    + ",rerollAttr:" + p.rerollAttr + ",rerollSkill:" + p.rerollSkill + ",rerollGear:" + p.rerollGear
    + "}";
  msg += '\n```Push_the_Attack\n'
    + "api.roll('" + p.rerollCount + "d6'," + _pmC + ",'yze_combat');"
    + '\n```';
  api.setSession('yzeLastRoll', {
    mode:    'combat',
    s6Attr:  p.s6Attr, s6Skill: p.s6Skill, s6Gear: p.s6Gear,
    b1Attr:  p.b1Attr, b1Skill: p.b1Skill, b1Gear: p.b1Gear,
    rerollCount: p.rerollCount,
    rerollAttr:  p.rerollAttr,
    rerollSkill: p.rerollSkill,
    rerollGear:  p.rerollGear,
    attrKey:     attrKey,
    skillName:   skillName,
    baseDamage:  baseDamage,
    range:       range,
    weaponId:    meta.weaponId || '',
    prevDamage:  (auto ? totalDamage : 0),
    targets:     hitTargets
  });
}
api.setValues({ 'data.canPush': canPush ? 1 : 0, 'data.successThreshold': 1 });

data.roll.total = successes;
api.sendMessage(msg, data.roll, [], [{ name: skillName, tooltip: range + ' attack' }]);
