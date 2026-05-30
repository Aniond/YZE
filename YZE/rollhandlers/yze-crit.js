// YZE yze_crit — Critical Injury roll (D66), per the SRD physical & mental tables.
//
// D66 is rolled as 2d6: the first die is the tens digit, the second is the ones
// digit, giving a value of 11-66 using only the digits 1-6 (36 outcomes).
//
// metadata: { critType: 'physical' | 'mental' }  (defaults to 'physical')
//   physical → SRD "Critical Injuries — Physical"  (lethal, with death saves)
//   mental   → SRD "Critical Injuries — Mental"    (trauma, ranged results)

var meta     = (data && data.roll && data.roll.metadata) || {};
var dice     = (data && data.roll && data.roll.dice)     || [];
var critType = (meta.critType === 'mental') ? 'mental' : 'physical';

// ── Build the D66 value from two d6 (tens, ones) ──────────────────────────
var d66, tens, ones;
if (dice.length >= 2) {
  tens = parseInt(dice[0].value, 10);
  ones = parseInt(dice[1].value, 10);
  d66  = tens * 10 + ones;
} else if (dice.length === 1) {
  d66  = parseInt(dice[0].value, 10);
  tens = Math.floor(d66 / 10);
  ones = d66 % 10;
} else {
  d66 = 11; tens = 1; ones = 1;
}

// ── Physical table — keyed by exact D66 value ─────────────────────────────
// time/mod only apply to lethal injuries; instant injuries kill with no save.
var PHYS = {
  11: { name: 'Winded',            heal: '--', effect: 'None.' },
  12: { name: 'Stunned',           heal: '--', effect: 'None.' },
  13: { name: 'Crippling pain',    heal: '--', effect: 'None.' },
  14: { name: 'Sprained ankle',    heal: '--', effect: 'Mobility -2 and movement is a slow action until a Healing roll is made.' },
  15: { name: 'Blood in eyes',     heal: '--', effect: 'Observation and Marksmanship -2 until a Healing roll is made.' },
  16: { name: 'Concussion',        heal: 'D6', effect: 'Mobility -2.' },
  21: { name: 'Severed ear',       heal: 'D6', effect: 'Observation -2.' },
  22: { name: 'Broken toes',       heal: 'D6', effect: 'Movement becomes a slow action.' },
  23: { name: 'Broken hand',       heal: 'D6', effect: 'Hand cannot be used.' },
  24: { name: 'Knocked out teeth', heal: 'D6', effect: 'Persuasion -2.' },
  25: { name: 'Impaled thigh',     heal: '2D6', effect: 'Movement becomes a slow action.' },
  26: { name: 'Slashed shoulder',  heal: 'D6', effect: 'Arm cannot be used.' },
  31: { name: 'Broken nose',       heal: 'D6', effect: 'Persuasion and Observation -1.' },
  32: { name: 'Crotch hit',        heal: 'D6', effect: 'One point of damage for every Mobility or Melee roll made.' },
  33: { name: 'Broken ribs',       heal: '2D6', effect: 'Mobility and Observation -2.' },
  34: { name: 'Gouged eye',        heal: '2D6', effect: 'Marksmanship and Observation -2.' },
  35: { name: 'Busted kneecap',    heal: '2D6', effect: 'Movement becomes a slow action.' },
  36: { name: 'Broken arm',        heal: '2D6', effect: 'Arm cannot be used.' },
  41: { name: 'Broken leg',        heal: '2D6', effect: 'Movement becomes a slow action.' },
  42: { name: 'Crushed foot',      heal: '3D6', effect: 'Movement becomes a slow action.' },
  43: { name: 'Crushed elbow',     heal: '3D6', effect: 'Arm cannot be used.' },
  44: { name: 'Punctured lung',    heal: 'D6',  lethal: true, time: 'Shift', mod: 0, effect: 'Stamina and Mobility -2.' },
  45: { name: 'Bleeding gut',      heal: 'D6',  lethal: true, time: 'Shift', mod: 0, effect: 'One point of damage for every Mobility or Melee roll made.' },
  46: { name: 'Ruptured intestines', heal: '2D6', lethal: true, time: 'Shift', mod: 0, effect: 'Disease with virulence 6.' },
  51: { name: 'Busted kidney',     heal: '2D6', lethal: true, time: 'Day', mod: 0, effect: 'Mobility -2 and movement is a slow action.' },
  52: { name: 'Severed arm artery', heal: 'D6', lethal: true, time: 'Stretch', mod: -1, effect: 'Arm cannot be used.' },
  53: { name: 'Severed leg artery', heal: 'D6', lethal: true, time: 'Stretch', mod: -1, effect: 'Movement becomes a slow action.' },
  54: { name: 'Severed arm',       heal: 'Permanent', lethal: true, time: 'Shift', mod: -1, effect: 'Arm cannot be used.' },
  55: { name: 'Severed leg',       heal: 'Permanent', lethal: true, time: 'Shift', mod: -1, effect: 'Movement becomes a slow action.' },
  56: { name: 'Cracked spine',     heal: '3D6', effect: 'Paralyzed from the neck down. If no Healing roll is made in time, the effect is permanent.' },
  61: { name: 'Ruptured jugular',  heal: '2D6', lethal: true, time: 'Round', mod: -1, effect: 'Stamina -1.' },
  62: { name: 'Ruptured aorta',    heal: '3D6', lethal: true, time: 'Round', mod: -2, effect: 'Stamina -2.' },
  63: { name: 'Disemboweled',      heal: '--', instant: true, effect: 'Instant death.' },
  64: { name: 'Crushed skull',     heal: '--', instant: true, effect: 'Your story ends here.' },
  65: { name: 'Pierced head',      heal: '--', instant: true, effect: 'You die immediately.' },
  66: { name: 'Impaled heart',     heal: '--', instant: true, effect: 'Your heart beats for the last time.' }
};

// ── Mental table — keyed by D66 range [min, max] ──────────────────────────
var MENT = [
  { min: 11, max: 16, name: 'Trembling',     heal: 'D6',  effect: 'Modifier -1 on all Agility-based rolls.' },
  { min: 21, max: 21, name: 'White hair',    heal: 'Permanent', effect: 'None.' },
  { min: 22, max: 24, name: 'Anxious',       heal: 'D6',  effect: 'Modifier -1 on all Wits-based rolls.' },
  { min: 25, max: 31, name: 'Sullen',        heal: 'D6',  effect: 'Modifier -1 on all Empathy-based rolls.' },
  { min: 32, max: 35, name: 'Nightmares',    heal: 'D6',  effect: 'Make an Insight roll every shift spent sleeping. Failure means the sleep does not count.' },
  { min: 36, max: 41, name: 'Nocturnal',     heal: '2D6', effect: 'You can only sleep during the light part of the day.' },
  { min: 42, max: 43, name: 'Phobic',        heal: '2D6', effect: 'You are terrified by something related to what broke you (the GM decides). You suffer one point of stress/damage to Wits each round within Short range of it.' },
  { min: 44, max: 45, name: 'Alcoholic',     heal: '3D6', effect: 'You must drink alcohol every day, or suffer one point of stress/damage to Agility.' },
  { min: 46, max: 51, name: 'Claustrophobic', heal: '2D6', effect: 'Every stretch in a confined environment, you suffer one point of stress/damage to Wits.' },
  { min: 52, max: 52, name: 'Mythomaniac',   heal: '2D6', effect: 'You cannot stop yourself from lying about everything. The effect needs to be roleplayed.' },
  { min: 53, max: 54, name: 'Paranoia',      heal: '2D6', effect: 'You are certain that someone is out to get you. The effect needs to be roleplayed.' },
  { min: 55, max: 55, name: 'Delusion',      heal: '3D6', effect: 'You are totally convinced of something untrue (e.g. that a certain color or item does not exist).' },
  { min: 56, max: 56, name: 'Hallucinations', heal: '3D6', effect: 'Make an Insight roll every shift. On a failure you suffer a powerful hallucination (the GM decides the details).' },
  { min: 61, max: 62, name: 'Altered personality', heal: 'Permanent', effect: 'Your personality is altered in a fundamental way (determine how with the GM). The effect should be roleplayed.' },
  { min: 63, max: 63, name: 'Amnesia',       heal: 'D6',  effect: 'You lose all memory and cannot recollect who you or the other PCs are. The effect should be roleplayed.' },
  { min: 64, max: 65, name: 'Catatonic',     heal: 'D6',  effect: 'You stare blankly into oblivion and do not respond to any stimuli.' },
  { min: 66, max: 66, name: 'Heart attack',  heal: '--',  instant: true, effect: 'Your heart stops, and you die of pure fright.' }
];

// ── Look up the result ────────────────────────────────────────────────────
var entry, heading;
if (critType === 'mental') {
  heading = 'Critical Injury — Mental';
  for (var m = 0; m < MENT.length; m++) {
    if (d66 >= MENT[m].min && d66 <= MENT[m].max) { entry = MENT[m]; break; }
  }
} else {
  heading = 'Critical Injury - Physical';
  entry = PHYS[d66];
}
if (!entry) entry = { name: 'Unknown (' + d66 + ')', heal: '--', effect: 'No table entry - check the roll.' };

// ── Build the chat card (Realm renders the 2d6; text carries the result) ──
var msg = '**[center]' + heading + '[/center]**';
msg += '\n[center]D66: ' + d66 + ' (' + tens + ' / ' + ones + ')[/center]';
msg += '\n**[center]' + entry.name + '[/center]**';

if (entry.instant) {
  msg += '\n**[center][color=red]INSTANT DEATH - no death save[/color][/center]**';
} else if (entry.lethal) {
  var saveLine = 'death save after ' + entry.time;
  if (entry.mod) saveLine += ' (' + entry.mod + ' to the save)';
  msg += '\n**[center][color=red]LETHAL[/color] - ' + saveLine + '[/center]**';
}

msg += '\n[center]' + entry.effect + '[/center]';

if (entry.heal && entry.heal !== '--') {
  var healText = (entry.heal === 'Permanent')
    ? '[color=orange]Permanent - never heals[/color]'
    : 'Healing time: ' + entry.heal + ' days';
  msg += '\n[center]' + healText + '[/center]';
}

data.roll.total = d66;
api.sendMessage(msg, data.roll, [], [{ name: entry.name, tooltip: entry.effect }]);
