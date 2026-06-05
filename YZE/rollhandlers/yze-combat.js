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

const meta = (data && data.roll && data.roll.metadata) || {};
const dice = (data && data.roll && data.roll.dice)     || [];

const skillName  = meta.skillName  || 'Attack';
const baseDamage = parseInt(meta.baseDamage || '0', 10);
const range      = meta.range || 'engaged';
const attrKey    = meta.attrKey || 'strength';
const isPush     = meta.isPush  || false;
// Campaign setting replaces the per-character autoApply toggle.
// api.getSetting() is the confirmed Realm API (same as 5e/PF2e coinWeight pattern).
const auto       = api.getSetting('autoApplyDamage') === 'yes';

// Apply `dmg` to the currently targeted tokens. Returns { lines, targets } where
// targets is [{ id, recordType, hp }] (hp = Health left after the hit), so a push
// can re-apply to the same foes.
function applyDamageToTargets(dmg) {
  const out = { lines: '', targets: [] };
  if (dmg <= 0) return out;
  const targets = api.getTargets ? api.getTargets() : [];
  if (targets.length === 0) {
    out.lines += `\n[center]No target selected - apply ${dmg} damage manually (after armor).[/center]`;
    return out;
  }
  for (let t = 0; t < targets.length; t++) {
    const tok = targets[t].token;
    if (!tok) continue;
    const rtype = tok.recordType || 'characters';

    // Armor soak (SRD p.20): roll the target's armor rating in d6, each 6 cancels
    // one point of damage. Armor protects against attack damage, never against
    // self-inflicted push damage (which is applied elsewhere). Banes (1s) degrade
    // the armor by one step each, but only if damage actually penetrated.
    const armorRating = yzeArmorTotal((p) => api.getValueOnRecord(tok, p));
    let soak = 0, armorLine = '';
    if (armorRating > 0) {
      const ar = yzeRollPoolN(armorRating);
      soak = ar.sixes;
      armorLine = ` [armor ${armorRating}: -${soak}]`;
      if (ar.ones > 0 && (dmg - soak) > 0 && rtype === 'npcs') {
        // Penetrated — degrade NPC armor by the number of banes rolled.
        const newArmor = Math.max(0, armorRating - ar.ones);
        api.setValuesOnRecord(tok, { 'data.armor': newArmor });
        armorLine += ` (armor degraded to ${newArmor})`;
      }
    }

    const net = Math.max(0, dmg - soak);
    const cur = parseInt(api.getValueOnRecord(tok, 'data.curHealth') || '0', 10);
    const next = Math.max(0, cur - net);
    api.setValuesOnRecord(tok, { 'data.curHealth': next }); // have the token here
    out.targets.push({ id: tok._id, recordType: rtype, hp: next });
    out.lines += `\n[center]${tok.name || 'Target'}${armorLine}: ${cur} to ${next} Health`
               + (next === 0 ? ' [color=red]BROKEN[/color]' : '') + '[/center]';
  }
  return out;
}

// ═══ PUSH ═══════════════════════════════════════════════════════════════════
if (isPush) {
  const allDice = yzeRebuildPool(meta, dice);
  const counts  = yzeCountPool(allDice);
  const successes = counts.successes;
  const attrBanes = counts.attrBanes;
  const gearBanes = counts.gearBanes;

  const newDamage = successes > 0 ? baseDamage + (successes - 1) : 0;
  const delta     = Math.max(0, newDamage - (parseInt(meta.prevDamage || '0', 10)));

  yzeColorDice(data.roll.dice, { // Realm renders the re-rolled dice, tinted by source
    attrCount:  meta.rerollAttr  || 0,
    skillCount: meta.rerollSkill || 0,
    gearCount:  meta.rerollGear  || 0
  });

  const pushThreshold = yzeEffectiveThreshold(record);

  let msgP;
  if (successes >= pushThreshold) {
    msgP = `**[center][color=green]HIT[/color] - ${successes} success${successes > 1 ? 'es' : ''}`
         + (pushThreshold > 1 ? ` (needed ${pushThreshold})` : '') + '[/center]**';
    msgP += `\n[center]Damage: ${newDamage}`;
    if (successes > 1) msgP += ` (base ${baseDamage} +${successes - 1} extra)`;
    msgP += '[/center]';

    if (delta > 0 && auto) {
      // Re-apply the extra damage to the originally-hit targets (locked at hit).
      const sess   = api.getSession ? api.getSession('yzeLastRoll') : null;
      const locked = (sess && sess.targets) ? sess.targets : [];
      if (locked.length > 0) {
        for (let k = 0; k < locked.length; k++) {
          const tg = locked[k];
          const before  = parseInt(tg.hp || '0', 10);
          const finalHp = Math.max(0, before - delta);
          api.setValueOnTokenById(tg.id, tg.recordType || 'characters', 'data.curHealth', finalHp);
          msgP += `\n[center]Target: ${before} to ${finalHp} Health`
                + (finalHp === 0 ? ' [color=red]BROKEN[/color]' : '') + '[/center]';
        }
      } else {
        msgP += applyDamageToTargets(delta).lines;
      }
    } else if (delta > 0 && !auto) {
      msgP += `\n[center]+${delta} extra damage from push (after armor).[/center]`;
      const _acp = 'var _d=' + delta + ','
        + '_ts=api.getTargets?api.getTargets():[];'
        + "if(!_ts.length){api.showNotification('Select a target first.','red','Apply Damage');}"
        + 'else{'
        + 'for(var _i=0;_i<_ts.length;_i++){'
        + 'var _tk=_ts[_i]&&_ts[_i].token;if(!_tk)continue;'
        + "var _c=parseInt(api.getValueOnRecord(_tk,'data.curHealth')||'0',10);"
        + "api.setValuesOnRecord(_tk,{'data.curHealth':Math.max(0,_c-_d)});"
        + '}'
        + "api.showNotification('Applied '+_d+' push damage.','red','Apply Damage');}";
      msgP += '\n```Apply_Push_Damage_(' + delta + ')\n' + _acp + '\n```';
    }
  } else if (successes > 0) {
    msgP = `**[center][color=orange]PARTIAL[/color] - ${successes} of ${pushThreshold} required — not a hit[/center]**`;
  } else {
    msgP = '**[center][color=red]MISS[/color][/center]**';
  }

  // Attribute banes hurt the attacker (Melee=Str / Marksmanship=Agi -> Health).
  if (attrBanes > 0) {
    const poolA = yzePoolFieldForRecord(record, attrKey);
    const stressA = (poolA === 'curResolve');
    const curA = parseInt((record && record.data && record.data[poolA]) || '0', 10);
    const updA = {}; updA['data.' + poolA] = Math.max(0, curA - attrBanes);
    api.setValues(updA);
    msgP += `\n**[center][color=red]${attrBanes} bane${attrBanes > 1 ? 's' : ''} - attacker takes `
          + attrBanes + (stressA ? ' stress (Resolve)' : ' damage (Health)') + '[/color][/center]**';
  }

  // Gear banes degrade this weapon's own bonus (SRD p.11). At 0 it breaks.
  if (gearBanes > 0) {
    let degraded = false;
    if (meta.weaponId) {
      const list = (record && record.data && record.data.gearList) || [];
      for (let g = 0; g < list.length; g++) {
        if (list[g] && list[g]._id === meta.weaponId) {
          const curBonus = parseInt((list[g].data && list[g].data.bonus) || '0', 10);
          const newBonus = Math.max(0, curBonus - gearBanes);
          const pathB = {}; pathB['data.gearList.' + g + '.data.bonus'] = newBonus;
          api.setValues(pathB);
          degraded = true;
          msgP += `\n[center]Gear bane x${gearBanes} - ${list[g].name || 'weapon'}`
                + ` bonus ${curBonus} to ${newBonus}${newBonus === 0 ? ' (BROKEN)' : ''}[/center]`;
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
  api.sendMessage(msgP, data.roll, [], [{ name: `${skillName} (Pushed)`, tooltip: `${range} attack, pushed` }]);
  return;
}

// ═══ INITIAL ATTACK ══════════════════════════════════════════════════════════
const attrCount  = parseInt(meta.attrCount  || '0', 10);
const skillCount = parseInt(meta.skillCount || '0', 10);

const p = yzeParseInitial(dice, attrCount, skillCount);
let successes   = p.successes;

// ── Pride bonus (+1 free success, once per session) ───────────────────────
const prideBonus = parseInt(api.getValue('data.prideBonus') || '0', 10);
if (prideBonus > 0) {
  successes += prideBonus;
  api.setValues({ 'data.prideBonus': 0 });
}

const threshold   = yzeEffectiveThreshold(record);

const totalDamage = successes >= threshold ? baseDamage + (successes - 1) : 0;

yzeColorDice(data.roll.dice, meta); // Realm renders the dice, tinted by source

let msg;
let hitTargets = []; // {id, recordType, hp} — locked for the push
const diffLabel = yzeFormatDifficulty(meta.difficulty || '');

if (successes >= threshold) {
  msg = `**[center][color=green]HIT[/color] - ${successes} success${successes > 1 ? 'es' : ''}`
      + (threshold > 1 ? ` (needed ${threshold})` : '') + '[/center]**';
  if (prideBonus > 0) {
    msg += `\n[center][color=olive]Pride — +${prideBonus} success[/color][/center]`;
  }
  if (diffLabel) {
    msg += `\n[center][color=orange]Difficulty: ${diffLabel}[/color][/center]`;
  }
  msg += `\n[center]Damage: ${totalDamage}`;
  if (successes > 1) msg += ` (base ${baseDamage} +${successes - 1} extra)`;
  msg += '[/center]';
  if (auto) {
    const ret = applyDamageToTargets(totalDamage);
    msg += ret.lines;
    hitTargets = ret.targets;
  } else if (totalDamage > 0) {
    msg += `\n[center]Auto-apply off - deal ${totalDamage} damage (after armor roll).[/center]`;
    // Apply Damage chat button — GM selects/targets a token then clicks this.
    // Inline code per PF2e damage.js pattern: damage baked as literal, no custom
    // function deps needed. Armor is handled separately via the Roll Armor button.
    const _ac = 'var _d=' + totalDamage + ','
      + '_ts=api.getTargets?api.getTargets():[];'
      + "if(!_ts.length){api.showNotification('Select a target first.','red','Apply Damage');}"
      + 'else{'
      + 'for(var _i=0;_i<_ts.length;_i++){'
      + 'var _tk=_ts[_i]&&_ts[_i].token;if(!_tk)continue;'
      + "var _c=parseInt(api.getValueOnRecord(_tk,'data.curHealth')||'0',10);"
      + "api.setValuesOnRecord(_tk,{'data.curHealth':Math.max(0,_c-_d)});"
      + '}'
      + "api.showNotification('Applied '+_d+' damage.','red','Apply Damage');}";
    msg += '\n```Apply_Damage_(' + totalDamage + ')\n' + _ac + '\n```';
  }
} else if (successes > 0) {
  msg = `**[center][color=orange]PARTIAL[/color] - ${successes} of ${threshold} required — not a hit[/center]**`;
  if (prideBonus > 0) {
    msg += `\n[center][color=olive]Pride — +${prideBonus} success[/color][/center]`;
  }
  if (diffLabel) {
    msg += `\n[center][color=orange]Difficulty: ${diffLabel}[/color][/center]`;
  }
} else {
  msg = '**[center][color=red]MISS[/color][/center]**';
  if (prideBonus > 0) {
    msg += `\n[center][color=olive]Pride — +${prideBonus} success (still a miss)[/color][/center]`;
  }
  if (diffLabel) {
    msg += `\n[center][color=orange]Difficulty: ${diffLabel}[/color][/center]`;
  }
}

msg += yzeEffectChatLine();

// ── Push eligibility — store context so the PUSH button can re-roll blanks ──
const canPush = p.rerollCount > 0;
if (canPush) {
  // Self-contained inline Push chip: roll params baked in as literals so the
  // button works without api.getSession. (The session is still set below so a
  // pushed HIT can re-apply extra damage to the locked targets.)
  const _snC = String(skillName).replace(/'/g, '');
  const _rgC = String(range).replace(/'/g, '');
  const _wid = String(meta.weaponId || '').replace(/'/g, '');
  const _pmC = "{isPush:true,mode:'combat'"
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
api.sendMessage(msg, data.roll, [], [{ name: skillName, tooltip: `${range} attack` }]);
