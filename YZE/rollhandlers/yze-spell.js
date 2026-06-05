// YZE yze_spell — Spellcasting roll handler.
//
// Called via castSpell() in common.js after WP is deducted.
// Roll: WP-spend D6s. Each 6 = overcharge (+1 power level).
// Each 1 = mishap (cannot be pushed — SRD rule).
// Power level = wpSpend + overchargeCount.
//
// Magic dice tinted blue (blanks), green (6s), red (1s).

const meta = (data && data.roll && data.roll.metadata) || {};
const dice = (data && data.roll && data.roll.dice)     || [];

const wpSpend      = parseInt(meta.wpSpend      || 1,     10);
const spellName    = meta.spellName    || 'Spell';
const rank         = parseInt(meta.rank         || 1,     10);
const discipline   = meta.discipline   || '';
const portrait     = meta.portrait     || '';
let safeCast     = meta.safeCast     || false;
const safecastDice = parseInt(meta.safecastDice || 1,     10);
const chanceCast   = meta.chanceCast   || false;
const fromGrimoire = meta.fromGrimoire || false;

// Chance Cast overrides Safe Cast (mutually exclusive per SRD).
if (chanceCast) safeCast = false;

// ── Grimoire — effective rank is one lower (minimum 1) ───────────────────
const effectiveRank = fromGrimoire ? Math.max(1, rank - 1) : rank;

// ── Safe Cast — reduce dice pool ─────────────────────────────────────────
// If the reduced pool hits zero or less, the spell works automatically
// (no roll, no mishap, no overcharge). Return early with a chat notice.
let rolledDice = wpSpend; // the actual number of dice rolled
if (safeCast) {
  rolledDice = wpSpend - safecastDice;
  if (rolledDice <= 0) {
    const powerLevelSafe = wpSpend; // full WP spent, no overcharge
    const discLabelSafe  = discipline ? ` [${discipline}]` : '';
    const iconStrSafe    = portrait ? `[center]![](${portrait}?width=30&height=30)[/center]\n` : '';
    let msgSafe = `${iconStrSafe}**[center]${spellName}${discLabelSafe}[/center]**`;
    msgSafe += `\n[center]WP: ${wpSpend}   Rank: ${effectiveRank}[/center]`;
    msgSafe += `\n[center]Power Level: ${powerLevelSafe}[/center]`;
    msgSafe += '\n[center][color=green]Safe Cast — spell works as intended. No dice rolled.[/color][/center]';
    if (fromGrimoire) {
      msgSafe += `\n[center][color=blue]Grimoire — effective rank ${effectiveRank}[/color][/center]`;
    }
    data.roll.total = powerLevelSafe;
    api.sendMessage(msgSafe, undefined, [], [{ name: spellName, tooltip: discipline || 'Spell' }]);
    return;
  }
}

// ── Count outcomes ────────────────────────────────────────────────────────
let overcharge  = 0;
let mishapCount = 0;
for (let i = 0; i < dice.length; i++) {
  const v = parseInt(dice[i].value, 10);
  if      (v === 6) overcharge++;
  else if (v === 1) mishapCount++;
}

const powerLevel = wpSpend + overcharge;

// ── Color dice — magic dice are blue when blank, green on 6, red on 1 ────
for (let j = 0; j < dice.length; j++) {
  const dv = parseInt(dice[j].value, 10);
  if      (dv === 6) dice[j].customColor = 'green';
  else if (dv === 1) dice[j].customColor = 'red';
  else               dice[j].customColor = 'blue';
}

// ── Apply mishap state ────────────────────────────────────────────────────
// Chance Cast always triggers a mishap regardless of dice results.
const triggerMishap = (mishapCount > 0) || chanceCast;
if (triggerMishap) {
  api.setValues({ 'data.mishapTriggered': true });
}
// Spells cannot be pushed (SRD) — do NOT set data.canPush

// ── Build chat card ───────────────────────────────────────────────────────
const discLabel = discipline ? ` [${discipline}]` : '';
const iconStr   = portrait ? `[center]![](${portrait}?width=30&height=30)[/center]\n` : '';
let msg = `${iconStr}**[center]${spellName}${discLabel}[/center]**`;
msg += `\n[center]WP: ${wpSpend}   Rank: ${effectiveRank}[/center]`;
msg += `\n[center]Power Level: ${powerLevel}`;
if (overcharge > 0) {
  msg += ` (base ${wpSpend} +${overcharge} overcharge)`;
}
msg += '[/center]';

if (safeCast) {
  msg += `\n[center][color=olive]Safe Cast — ${safecastDice} fewer ${safecastDice > 1 ? 'dice' : 'die'}[/color][/center]`;
}
if (fromGrimoire) {
  msg += `\n[center][color=blue]Grimoire — effective rank ${effectiveRank}[/color][/center]`;
}
if (overcharge > 0) {
  msg += `\n[center][color=green]Overcharged +${overcharge}[/color][/center]`;
}
if (chanceCast) {
  msg += '\n**[center][color=red]Chance Cast — automatic mishap triggered![/color][/center]**';
  msg += '\n```Roll_Mishap\napi.roll(\'1d12\', {}, \'yze_mishap\');\n```';
} else if (mishapCount > 0) {
  msg += '\n**[center][color=red]Magic Mishap![/color][/center]**';
  msg += '\n```Roll_Mishap\napi.roll(\'1d12\', {}, \'yze_mishap\');\n```';
}

data.roll.total = powerLevel;
api.sendMessage(msg, data.roll, [], [{ name: spellName, tooltip: discipline || 'Spell' }]);
