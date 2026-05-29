// YZE yze_armor — defender's armor / cover soak roll (SRD p.20-21).
//
// Used when damage is applied manually (auto-apply off) or for cover, which the
// attack handler can't know about. Roll a number of d6 equal to the armor/cover
// rating; each 6 cancels one point of incoming damage. This roll is NOT an action
// and CANNOT be pushed. A bane (1) degrades the protection by one step each — but
// only if any damage actually penetrates (SRD: "If the armor absorbs all the
// damage, any banes rolled have no effect"), which the roller resolves at the table.
//
// meta: { kind: 'armor' | 'cover', rating: N, label: '...' }
// Cover only protects against ranged attacks and is rolled BEFORE armor.

var meta = (data && data.roll && data.roll.metadata) || {};
var dice = (data && data.roll && data.roll.dice)     || [];

var kind  = meta.kind  || 'armor';
var label = meta.label || (kind === 'cover' ? 'Cover' : 'Armor');

var soak = 0, banes = 0;
for (var i = 0; i < dice.length; i++) {
  var v = parseInt(dice[i].value, 10);
  if (v === 6) { soak++;  dice[i].customColor = 'green'; }
  else if (v === 1) { banes++; dice[i].customColor = 'red'; }
}

var msg = '**[center][color=blue]' + label + '[/color] - soak ' + soak + '[/center]**';
msg += '\n[center]Reduce incoming damage by ' + soak + '[/center]';
if (banes > 0) {
  msg += '\n[center][color=orange]' + banes + ' bane' + (banes > 1 ? 's' : '')
       + ' - if damage got through, ' + (kind === 'cover' ? 'cover' : 'armor')
       + ' degrades by ' + banes + '[/color][/center]';
}
if (kind === 'cover') {
  msg += '\n[center]Cover protects vs ranged attacks only[/center]';
}

api.sendMessage(msg, data.roll, [], [{ name: label + ' roll', tooltip: kind + ' soak' }]);
