// YZE yze_panic — Panic Roll handler (Stress & Panic rules).
//
// Roll: 1D6 + current stress points on the rolling character.
// Results 11/12/13 reduce stress by 1 (min 0).
// Clears data.panicTriggered after resolving.
//
// Trigger: api.roll('1d6', {}, 'yze_panic')  OR  auto-triggered when
// data.panicTriggered is set by yze-pool.js / yze-push.js.

var dice = (data && data.roll && data.roll.dice) || [];

var dieResult = dice.length > 0 ? parseInt(dice[0].value, 10) : 1;
var stress    = parseInt(api.getValue('data.stress') || '0', 10);
if (isNaN(stress) || stress < 0) stress = 0;
var total     = dieResult + stress;

// ── Panic table (D6 + stress) ─────────────────────────────────────────────
var PANIC = [
  {
    min: 1, max: 6, name: 'Keeping it Together', reducesStress: false,
    effect: 'You manage to keep your nerves in check. Barely.'
  },
  {
    min: 7, max: 7, name: 'Nervous Twitch', reducesStress: false,
    effect: 'You and all PCs in Short range gain a stress point.'
  },
  {
    min: 8, max: 8, name: 'Tremble', reducesStress: false,
    effect: 'You tremble uncontrollably. All skill rolls using Agility suffer a -2 modifier until the end of the scene.'
  },
  {
    min: 9, max: 9, name: 'Drop Item', reducesStress: false,
    effect: 'You drop a weapon or other important item — the GM decides which one.'
  },
  {
    min: 10, max: 10, name: 'Freeze', reducesStress: false,
    effect: 'You are frozen by fear or stress for one round, losing your next turn.'
  },
  {
    min: 11, max: 11, name: 'Seek Cover', reducesStress: true,
    effect: 'You must use your next action to move away from danger and find a safe spot if possible. You must make a retreat roll if you have an enemy at Engaged range. You lose one stress point, but all other PCs in Short range gain one stress point. After one round, you can act normally.'
  },
  {
    min: 12, max: 12, name: 'Scream', reducesStress: true,
    effect: 'You scream for one round, losing your next turn. You lose one stress point, but every PC who hears your scream must make an immediate panic roll.'
  },
  {
    min: 13, max: 13, name: 'Flee', reducesStress: true,
    effect: 'You must flee to a safe place and refuse to leave it. You will not attack anyone and will not attempt anything dangerous. You lose one stress point, but every PC who witnesses this must make an immediate panic roll.'
  },
  {
    min: 14, max: 14, name: 'Berserk', reducesStress: false,
    effect: 'You must immediately attack the nearest person or creature, friendly or not. You will not stop until you or the target is broken. Every PC who witnesses your rampage must make an immediate panic roll.'
  },
  {
    min: 15, max: 99, name: 'Catatonic', reducesStress: false,
    effect: 'You collapse to the floor and cannot talk or move, staring blankly into oblivion.'
  }
];

// ── Look up result ────────────────────────────────────────────────────────
var entry = null;
for (var i = 0; i < PANIC.length; i++) {
  if (total >= PANIC[i].min && total <= PANIC[i].max) {
    entry = PANIC[i];
    break;
  }
}
if (!entry) entry = PANIC[PANIC.length - 1]; // clamp to Catatonic

// ── Apply state changes ───────────────────────────────────────────────────
var updates = { 'data.panicTriggered': false };
if (entry.reducesStress && stress > 0) {
  updates['data.stress'] = stress - 1;
}
api.setValues(updates);

// ── Build chat card (matches yze-crit.js style) ───────────────────────────
var msg = '**[center][color=red]PANIC ROLL[/color][/center]**';
msg += '\n[center]' + dieResult + ' (die) + ' + stress + ' (stress) = ' + total + '[/center]';
msg += '\n**[center]' + entry.name + '[/center]**';
msg += '\n[center]' + entry.effect + '[/center]';
if (entry.reducesStress) {
  msg += '\n[center][color=green]−1 stress[/color][/center]';
}

data.roll.total = dieResult;
api.sendMessage(msg, data.roll, [], [{ name: 'Panic: ' + entry.name, tooltip: entry.effect }]);
