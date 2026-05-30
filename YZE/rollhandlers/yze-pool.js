// YZE yze_pool — dice pool roll handler
// Called by: skill roll buttons on character-skills.html, NPC quick rolls
// Counts 6s (successes), locks 1s, tracks rerollable dice for push

var meta  = (data && data.roll && data.roll.metadata) || {};
var dice  = (data && data.roll && data.roll.dice)     || [];

var attrKey    = meta.attrKey    || 'strength';
var attrCount  = meta.attrCount  || 0;
var skillCount = meta.skillCount || 0;
var gearCount  = meta.gearCount  || 0;
var skillName  = meta.skillName  || 'Skill Roll';
var isPush     = meta.isPush     || false;
var opposed    = meta.opposed    || 0;

// ── Parse dice results ────────────────────────────────────────────────────
// On a push the blanks (2-5) are re-rolled while 6s (successes) and 1s (locked
// banes) are kept (SRD p.9). yzeParseInitial tags each die by source and records
// per-type counts so the kept dice can be reconstructed later from scalars alone.
var p = yzeParseInitial(dice, attrCount, skillCount);
var successes   = p.successes;
var rerollCount = p.rerollCount;

// ── Pride bonus (+1 free success, once per session) ───────────────────────
var prideBonus = !isPush ? parseInt(api.getValue('data.prideBonus') || '0', 10) : 0;
if (prideBonus > 0) {
  successes += prideBonus;
  api.setValues({ 'data.prideBonus': 0 });
}

// ── Stress dice (SRD p.X) — rolled inline, separate from the main pool ────
// Only on initial rolls (not pushes). Stress dice 6s = successes; 1s = panic.
// Blanks join rerollCount so the Push button re-rolls them too.
var stressCount  = !isPush ? parseInt(api.getValue('data.stress') || '0', 10) : 0;
if (isNaN(stressCount) || stressCount < 0) stressCount = 0;
var stressBanes  = 0;
var stressSixes  = 0;
var stressBlanks = 0;
var stressVals   = [];
if (stressCount > 0) {
  var sr      = yzeRollPoolN(stressCount);
  stressSixes  = sr.sixes;
  stressBanes  = sr.ones;
  stressBlanks = stressCount - sr.sixes - sr.ones;
  stressVals   = sr.vals;
  successes   += stressSixes;
  rerollCount += stressBlanks;
  if (stressBanes > 0) {
    api.setValues({ 'data.panicTriggered': true });
  }
}

// ── Tint the dice (Realm renders them) and write the verdict text ─────────
yzeColorDice(data.roll.dice, meta);

var threshold = parseInt(api.getValue('data.successThreshold') || '1', 10);
if (isNaN(threshold) || threshold < 1) threshold = 1;

var msg;
if (opposed > 0) {
  // Opposed rolls always use standard yzeVerdict — threshold doesn't apply
  msg = yzeVerdict(successes, opposed);
} else if (successes >= threshold) {
  msg = '**[center][color=green]SUCCESS[/color] - ' + successes + ' success'
      + (successes > 1 ? 'es' : '')
      + (threshold > 1 ? ' (needed ' + threshold + ')' : '')
      + '[/center]**';
} else if (successes > 0) {
  msg = '**[center][color=orange]PARTIAL[/color] - ' + successes + ' of ' + threshold + ' required[/center]**';
} else {
  msg = '**[center][color=red]FAILURE[/color][/center]**';
}
if (prideBonus > 0) {
  msg += '\n[center][color=olive]Pride — +' + prideBonus + ' success[/color][/center]';
}
var diffLabel = yzeFormatDifficulty(meta.difficulty || '');
if (diffLabel) {
  msg += '\n[center][color=orange]Difficulty: ' + diffLabel + '[/color][/center]';
}
if (stressCount > 0) {
  msg += '\n[center]Stress (' + stressCount + 'd6): ' + stressVals.join(' / ') + '[/center]';
  if (stressBanes > 0) {
    msg += '\n[center][color=red]Panic triggered — roll on the panic table![/color][/center]';
  }
}

// ── Heal the broken — apply Health recovery to targeted token ────────────
if (meta.isHeal && successes > 0) {
  var targets = api.getTargets ? api.getTargets() : [];
  if (targets.length > 0) {
    var tok   = targets[0].token;
    var curHp = parseInt(api.getValueOnRecord(tok, 'data.curHealth') || '0', 10);
    var maxHp = parseInt(api.getValueOnRecord(tok, 'data.maxHealth') || '1', 10);
    var newHp = Math.min(maxHp, curHp + successes);
    api.setValuesOnRecord(tok, { 'data.curHealth': newHp });
    msg += '\n[center][color=green]Healed ' + successes + ' point'
         + (successes > 1 ? 's' : '') + ' of Health'
         + (tok.name ? ' (' + tok.name + ')' : '') + '[/color][/center]';
  } else {
    msg += '\n[center]No target selected — apply ' + successes + ' Health manually.[/center]';
  }
}

// ── Gear repair — report result (apply manually from gear sheet) ──────────
if (meta.isRepair) {
  var canRestore = Math.min(successes, Math.max(0, (meta.maxBonus || 0) - (meta.curBonus || 0)));
  if (canRestore > 0) {
    msg += '\n[center][color=green]Repair: restore ' + canRestore
         + ' gear bonus point' + (canRestore > 1 ? 's' : '')
         + ' (update bonus on the item manually).[/color][/center]';
  } else if (successes > 0) {
    msg += '\n[center][color=green]Repair successful — gear already at max bonus.[/color][/center]';
  } else {
    msg += '\n[center][color=red]Repair failed — no bonus restored. Retry next shift.[/color][/center]';
  }
}

// ── Push eligibility ──────────────────────────────────────────────────────
var canPush = !isPush && rerollCount > 0;

// Death saves cannot be pushed (SRD rule); add specific outcome message.
if (meta.isDeathSave) {
  canPush = false;
  if (successes > 0) {
    msg += '\n**[center][color=green]Lingers on — make another save at the next interval.[/color][/center]**';
  } else {
    msg += '\n**[center][color=red]Character dies.[/color][/center]**';
  }
}

if (canPush) {
  if (successes === 0) {
    // Failure — show an inline Push button so players can push directly from chat.
    // Button code reads the session context and fires the yze_push roll handler.
    // yze-push.js resets canPush = 0 after the push completes.
    msg += '\n```Push_the_Roll\n' +
      'var _s=api.getSession(\'yzeLastRoll\');' +
      'if(_s&&_s.rerollCount>0){' +
      'api.roll(_s.rerollCount+\'d6\',' +
      '{isPush:true,mode:\'pool\',' +
      'attrKey:_s.attrKey,skillName:_s.skillName,opposed:_s.opposed||0,' +
      's6Attr:_s.s6Attr,s6Skill:_s.s6Skill,s6Gear:_s.s6Gear,' +
      'b1Attr:_s.b1Attr,b1Skill:_s.b1Skill,b1Gear:_s.b1Gear,' +
      'rerollAttr:_s.rerollAttr,rerollSkill:_s.rerollSkill,rerollGear:_s.rerollGear},' +
      '\'yze_push\');}' +
      '\n```';
  } else {
    // Success with blanks — push is possible but unlikely wanted; show a text hint.
    msg += '\n[center][color=orange]Push available — use the Push button on your sheet[/color][/center]';
  }
  api.setSession('yzeLastRoll', {
    mode:    'pool',
    s6Attr:  p.s6Attr, s6Skill: p.s6Skill, s6Gear: p.s6Gear,
    b1Attr:  p.b1Attr, b1Skill: p.b1Skill, b1Gear: p.b1Gear,
    rerollCount: rerollCount,    // includes stress blanks
    rerollAttr:  p.rerollAttr,
    rerollSkill: p.rerollSkill,
    rerollGear:  p.rerollGear,
    rerollStress: stressBlanks,  // how many of rerollCount are stress dice
    s6Stress:    stressSixes,    // locked stress 6s (successes)
    b1Stress:    stressBanes,    // locked stress banes (panic already triggered)
    attrKey:     attrKey,
    skillName:   skillName,
    opposed:     opposed
  });
}

api.setValues({ 'data.canPush': canPush ? 1 : 0, 'data.successThreshold': 1 });

api.sendMessage(msg, data.roll, [], [{ name: skillName, tooltip: skillName + ' roll' }]);
