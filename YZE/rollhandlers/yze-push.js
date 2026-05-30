// YZE yze_push — skill-roll push handler.
//
// onPushClick (via yzePushRoll) re-rolls ONLY the blanks (2-5) from the initial
// roll and hands us the kept-dice counts + reroll counts via metadata. We rebuild
// the FULL final pool (kept 6s + locked 1s + re-rolls) — "all dice count after the
// push" (SRD p.9) — and count over it:
//   • 1 on an ATTRIBUTE die → bane: 1 damage (Str/Agi) or stress (Wits/Emp)
//   • 1s on skill dice: no effect
//   • 1 on a GEAR die: degrades the gear (reported; skill rolls rarely use gear)
//
// Helpers (yzeRebuildPool / yzeCountPool / yzePoolForAttr) live in common.js.
// Banes hit the roller's own Health/Resolve, so they always apply.

var meta     = (data && data.roll && data.roll.metadata) || {};
var rerolled = (data && data.roll && data.roll.dice)     || [];

var attrKey   = meta.attrKey   || 'strength';
var skillName = meta.skillName || 'Skill Roll';
var opposed   = meta.opposed   || 0;

var allDice = yzeRebuildPool(meta, rerolled);
var counts  = yzeCountPool(allDice);
var successes = counts.successes + (meta.s6Stress || 0); // add locked stress 6s from initial roll
var attrBanes = counts.attrBanes;
var gearBanes = counts.gearBanes;

// ── Stress dice on the push ───────────────────────────────────────────────
// Stress blanks from the initial roll were re-rolled last in the rerolled[]
// array (order: attr blanks → skill blanks → gear blanks → stress blanks).
// Check those final N dice for new panic; exclude any banes from gear-degrade.
var rerollStress    = meta.rerollStress || 0;
var stressPushBanes = 0;
if (rerollStress > 0) {
  var stressStart = rerolled.length - rerollStress;
  for (var si = stressStart; si < rerolled.length; si++) {
    if (parseInt(rerolled[si].value, 10) === 1) {
      stressPushBanes++;
      gearBanes--;   // was mis-tagged as gear by yzeRebuildPool; remove it
    }
  }
  if (stressPushBanes > 0) {
    api.setValues({ 'data.panicTriggered': true });
  }
}

// ── Apply damage / stress for attribute banes (your own consequence) ──────
var pool     = yzePoolFieldForRecord(record, attrKey);
var isStress = (pool === 'curResolve');
if (attrBanes > 0) {
  var cur = parseInt((record && record.data && record.data[pool]) || '0', 10);
  var upd = {};
  upd['data.' + pool] = Math.max(0, cur - attrBanes);
  api.setValues(upd);
  // SRD: gain WP equal to the Resolve damage taken when pushing on Wits/Empathy
  if (isStress) gainWP(attrBanes);
}

// A push can only happen once.
api.setValues({ 'data.canPush': 0 });

// ── Build chat card ───────────────────────────────────────────────────────
// Realm renders the re-rolled dice; the verdict text covers the FULL pool
// (kept successes + the re-roll). Tint re-rolled dice by outcome and source.
yzeColorDice(data.roll.dice, {
  attrCount:  meta.rerollAttr  || 0,
  skillCount: meta.rerollSkill || 0,
  gearCount:  meta.rerollGear  || 0
});

var kept = (meta.s6Attr || 0) + (meta.s6Skill || 0) + (meta.s6Gear || 0);

var msg = yzeVerdict(successes, opposed);

if (kept > 0) {
  msg += '\n[center](' + kept + ' kept from the first roll)[/center]';
}
if (attrBanes > 0) {
  var costWord = isStress ? 'stress (Resolve)' : 'damage (Health)';
  msg += '\n**[center][color=red]' + attrBanes + ' bane' + (attrBanes > 1 ? 's' : '')
       + ' - ' + attrBanes + ' ' + costWord + '[/color][/center]**';
  if (isStress) {
    msg += '\n[center][color=blue]+' + attrBanes + ' WP from pushing[/color][/center]';
  }
}
if (gearBanes > 0) {
  msg += '\n[center]Gear bane x' + gearBanes
       + ' - reduce the weapon\'s bonus by ' + gearBanes + '[/center]';
}
if (stressPushBanes > 0) {
  msg += '\n[center][color=red]Panic triggered — roll on the panic table![/color][/center]';
}

data.roll.total = successes;
api.sendMessage(msg, data.roll, [], [{ name: skillName + ' (Pushed)', tooltip: 'Pushed roll' }]);
