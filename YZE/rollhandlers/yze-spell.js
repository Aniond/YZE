// YZE yze_spell — Spellcasting roll handler.
//
// Called via castSpell() in common.js after WP is deducted.
// Roll: WP-spend D6s. Each 6 = overcharge (+1 power level).
// Each 1 = mishap (cannot be pushed — SRD rule).
// Power level = wpSpend + overchargeCount.
//
// Magic dice tinted blue (blanks), green (6s), red (1s).

var meta = (data && data.roll && data.roll.metadata) || {};
var dice = (data && data.roll && data.roll.dice)     || [];

var wpSpend    = parseInt(meta.wpSpend   || 1,  10);
var spellName  = meta.spellName  || 'Spell';
var rank       = parseInt(meta.rank      || 1,  10);
var discipline = meta.discipline || '';
var portrait   = meta.portrait   || '';

// ── Count outcomes ────────────────────────────────────────────────────────
var overcharge  = 0;
var mishapCount = 0;
for (var i = 0; i < dice.length; i++) {
  var v = parseInt(dice[i].value, 10);
  if      (v === 6) overcharge++;
  else if (v === 1) mishapCount++;
}

var powerLevel = wpSpend + overcharge;

// ── Color dice — magic dice are blue when blank, green on 6, red on 1 ────
for (var j = 0; j < dice.length; j++) {
  var dv = parseInt(dice[j].value, 10);
  if      (dv === 6) dice[j].customColor = 'green';
  else if (dv === 1) dice[j].customColor = 'red';
  else               dice[j].customColor = 'blue';
}

// ── Apply mishap state ────────────────────────────────────────────────────
if (mishapCount > 0) {
  api.setValues({ 'data.mishapTriggered': true });
}
// Spells cannot be pushed (SRD) — do NOT set data.canPush

// ── Build chat card (matches yze-crit.js style) ───────────────────────────
var discLabel = discipline ? ' [' + discipline + ']' : '';
var iconStr   = portrait ? '[center]![](' + portrait + '?width=30&height=30)[/center]\n' : '';
var msg = iconStr + '**[center]' + spellName + discLabel + '[/center]**';
msg += '\n[center]WP: ' + wpSpend + '   Rank: ' + rank + '[/center]';
msg += '\n[center]Power Level: ' + powerLevel;
if (overcharge > 0) {
  msg += ' (base ' + wpSpend + ' +' + overcharge + ' overcharge)';
}
msg += '[/center]';

if (overcharge > 0) {
  msg += '\n[center][color=green]Overcharged +' + overcharge + '[/color][/center]';
}

if (mishapCount > 0) {
  msg += '\n**[center][color=red]Magic Mishap![/color][/center]**';
  msg += '\n```Roll_Mishap\napi.roll(\'1d12\', {}, \'yze_mishap\');\n```';
}

data.roll.total = powerLevel;
api.sendMessage(msg, data.roll, [], [{ name: spellName, tooltip: discipline || 'Spell' }]);
