// YZE yze_mishap — Magic Mishap roll (D12).
//
// Called after a spellcasting mishap (data.mishapTriggered = true) via the
// inline Roll_Mishap button in yze-spell.js, or directly by the Mishap Roll
// button on character-magic.html.
//
// Results 2–3 apply immediate damage / stress.
// Results 8–9 trigger a critical injury roll (yze_crit).
// Clears data.mishapTriggered after resolving.

var dice   = (data && data.roll && data.roll.dice) || [];
var result = dice.length > 0 ? parseInt(dice[0].value, 10) : 1;
if (isNaN(result) || result < 1)  result = 1;
if (result > 12) result = 12;

// ── Mishap table (D12) ────────────────────────────────────────────────────
var MISHAP = {
  1:  { name: 'Sleepless',        effect: 'The magic makes you unable to sleep for D6 days.' },
  2:  { name: 'Drained',          effect: 'Your spell drains your energy, inflicting one point of stress.', stress: true },
  3:  { name: 'Backlash',         effect: 'Your magic hurts your body and you suffer one point of damage.', damage: true },
  4:  { name: 'Magical Disease',  effect: 'The spell triggers a magical disease with a virulence of 2D6. You and everyone within Engaged range for the next shift are exposed to the contagion.' },
  5:  { name: 'Wrong Target',     effect: 'The spell also affects a friend or other unintended victim. A healing or helping spell affects an enemy alongside the intended target.' },
  6:  { name: 'Altered Appearance', effect: 'Your magic permanently alters your appearance. The GM decides how.' },
  7:  { name: 'Blinded',          effect: 'The spell blinds you. You act as in total darkness for the next full day.' },
  8:  { name: 'Mind Ravaged',     effect: 'The spell ravages your mind. Immediately roll for a mental critical injury.', mentalCrit: true },
  9:  { name: 'Bones Broken',     effect: 'The force of the magic breaks bones in your body. Immediately roll for a physical critical injury.', physCrit: true },
  10: { name: 'Demon Summoned',   effect: 'Your magic attracts a demon from another dimension.' },
  11: { name: 'Uncontrolled',     effect: 'The spell goes out of control and has an opposite or unexpected effect. The GM decides what happens.' },
  12: { name: 'Consumed',         effect: 'The magic consumes you. You die.', death: true }
};

var entry = MISHAP[result] || { name: 'Unknown (' + result + ')', effect: 'No table entry.' };

// ── Apply immediate mechanical effects ───────────────────────────────────
if (entry.stress) {
  var curStress = parseInt(api.getValue('data.stress') || '0', 10);
  if (isNaN(curStress)) curStress = 0;
  api.setValues({ 'data.stress': Math.min(10, curStress + 1) });
}
if (entry.damage) {
  var curHp = parseInt((record && record.data && record.data.curHealth) || '0', 10);
  api.setValues({ 'data.curHealth': Math.max(0, curHp - 1) });
}
if (entry.death) {
  api.setValues({ 'data.curHealth': 0 });
}

api.setValues({ 'data.mishapTriggered': false });

// ── Build chat card (matches yze-crit.js style) ───────────────────────────
var msg = '**[center][color=red]MAGIC MISHAP[/color][/center]**';
msg += '\n[center]D12: ' + result + '[/center]';
msg += '\n**[center]' + entry.name + '[/center]**';
msg += '\n[center]' + entry.effect + '[/center]';

if (entry.stress) {
  msg += '\n[center][color=orange]+1 stress[/color][/center]';
}
if (entry.damage) {
  msg += '\n[center][color=red]−1 Health[/color][/center]';
}
if (entry.death) {
  msg += '\n**[center][color=red]CHARACTER DIES — no save[/color][/center]**';
}

// Trigger crit rolls for results 8 and 9
if (entry.mentalCrit) {
  msg += '\n[center][color=red]Rolling mental critical injury…[/color][/center]';
  api.roll('2d6', { critType: 'mental' }, 'yze_crit');
}
if (entry.physCrit) {
  msg += '\n[center][color=red]Rolling physical critical injury…[/color][/center]';
  api.roll('2d6', { critType: 'physical' }, 'yze_crit');
}

api.sendMessage(msg, data.roll, [], [{ name: 'Mishap: ' + entry.name, tooltip: entry.effect }]);
