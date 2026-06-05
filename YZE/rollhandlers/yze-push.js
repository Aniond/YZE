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

const meta     = (data && data.roll && data.roll.metadata) || {};
const rerolled = (data && data.roll && data.roll.dice)     || [];

const attrKey   = meta.attrKey   || 'strength';
const skillName = meta.skillName || 'Skill Roll';
const opposed   = meta.opposed   || 0;

const allDice = yzeRebuildPool(meta, rerolled);
const counts  = yzeCountPool(allDice);
const successes = counts.successes + (meta.s6Stress || 0); // add locked stress 6s from initial roll
const attrBanes = counts.attrBanes;
let gearBanes = counts.gearBanes;

// ── Stress dice on the push ───────────────────────────────────────────────
// Stress blanks from the initial roll were re-rolled last in the rerolled[]
// array (order: attr blanks → skill blanks → gear blanks → stress blanks).
// Check those final N dice for new panic; exclude any banes from gear-degrade.
const rerollStress    = meta.rerollStress || 0;
let stressPushBanes = 0;
if (rerollStress > 0) {
  const stressStart = rerolled.length - rerollStress;
  for (let si = stressStart; si < rerolled.length; si++) {
    if (parseInt(rerolled[si].value, 10) === 1) {
      stressPushBanes++;
      gearBanes--;   // was mis-tagged as gear by yzeRebuildPool; remove it
    }
  }
  if (stressPushBanes > 0) {
    api.setValues({ 'data.panicTriggered': true });
  }
  // Clamp: stress corrections can bring gearBanes below zero; floor it.
  if (gearBanes < 0) gearBanes = 0;
}

// ── Apply damage / stress for attribute banes (your own consequence) ──────
const pool     = yzePoolFieldForRecord(record, attrKey);
const isStress = (pool === 'curResolve');
if (attrBanes > 0) {
  const cur = parseInt((record && record.data && record.data[pool]) || '0', 10);
  const upd = {};
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

const kept = (meta.s6Attr || 0) + (meta.s6Skill || 0) + (meta.s6Gear || 0);

const threshold = yzeEffectiveThreshold(record);
let msg;
if (opposed > 0) {
  msg = yzeVerdict(successes, opposed);
} else if (successes >= threshold) {
  msg = `**[center][color=green]SUCCESS[/color] - ${successes} success`
      + (successes > 1 ? 'es' : '')
      + (threshold > 1 ? ` (needed ${threshold})` : '')
      + '[/center]**';
} else if (successes > 0) {
  msg = `**[center][color=orange]PARTIAL[/color] - ${successes} of ${threshold} required[/center]**`;
} else {
  msg = '**[center][color=red]FAILURE[/color][/center]**';
}

if (kept > 0) {
  msg += `\n[center](${kept} kept from the first roll)[/center]`;
}
if (attrBanes > 0) {
  const costWord = isStress ? 'stress (Resolve)' : 'damage (Health)';
  msg += `\n**[center][color=red]${attrBanes} bane${attrBanes > 1 ? 's' : ''}`
       + ` - ${attrBanes} ${costWord}[/color][/center]**`;
  if (isStress) {
    msg += `\n[center][color=blue]+${attrBanes} WP from pushing[/color][/center]`;
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
api.sendMessage(msg, data.roll, [], [{ name: `${skillName} (Pushed)`, tooltip: 'Pushed roll' }]);
