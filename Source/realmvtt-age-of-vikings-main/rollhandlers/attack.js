var aov = aov || {};

aov.dexRanks = function (dexterity, attackCount) {
  var dex = Math.max(0, Math.floor(aov.number(dexterity, 0)));
  var count = Math.max(1, Math.floor(aov.number(attackCount, 1)));
  if (count === 2) return [dex, Math.max(1, Math.ceil(dex / 2))];
  var step = Math.ceil(dex / count);
  var ranks = [];
  for (var index = 0; index < count; index += 1) {
    ranks.push(Math.max(1, dex - (step * index)));
  }
  return ranks;
};

aov.findHitLocation = function (profile, d20) {
  var roll = Math.floor(aov.number(d20, 0));
  for (var index = 0; index < (profile || []).length; index += 1) {
    var location = profile[index];
    if (roll >= location.min && roll <= location.max) return location;
  }
  return null;
};

function attackResult(code, values) {
  var result = {
    code: code,
    targetDamageMode: "none",
    ignoreArmor: false,
    parried: false,
    attackerFumble: false,
    defenderFumble: false
  };
  Object.keys(values || {}).forEach(function (key) { result[key] = values[key]; });
  return result;
}

var dodgeMatrix = {
  critical: {
    critical: ["critical-dodged-by-critical", {}],
    special: ["critical-through-special-dodge", { targetDamageMode: "special" }],
    success: ["critical-through-normal-dodge", { targetDamageMode: "critical", ignoreArmor: true }],
    failure: ["critical-through-failed-dodge", { targetDamageMode: "critical", ignoreArmor: true }],
    fumble: ["critical-through-fumbled-dodge", { targetDamageMode: "critical", ignoreArmor: true, defenderFumble: true }]
  },
  special: {
    critical: ["special-dodged-by-critical", {}],
    special: ["special-dodged-by-special", {}],
    success: ["special-through-normal-dodge", { targetDamageMode: "special" }],
    failure: ["special-through-failed-dodge", { targetDamageMode: "special" }],
    fumble: ["special-through-fumbled-dodge", { targetDamageMode: "special", defenderFumble: true }]
  },
  success: {
    critical: ["normal-dodged-by-critical", {}],
    special: ["normal-dodged-by-special", {}],
    success: ["normal-dodged", {}],
    failure: ["normal-through-failed-dodge", { targetDamageMode: "normal" }],
    fumble: ["normal-through-fumbled-dodge", { targetDamageMode: "normal", defenderFumble: true }]
  },
  failure: {
    critical: ["failed-attack-critical-dodge", {}], special: ["failed-attack-special-dodge", {}],
    success: ["failed-attack-normal-dodge", {}], failure: ["both-fail", {}],
    fumble: ["failed-attack-fumbled-dodge", { targetDamageMode: "normal", defenderFumble: true }]
  },
  fumble: {
    critical: ["fumbled-attack-critical-dodge", { attackerFumble: true }],
    special: ["fumbled-attack-special-dodge", { attackerFumble: true }],
    success: ["fumbled-attack-normal-dodge", { attackerFumble: true }],
    failure: ["fumbled-attack-failed-dodge", { attackerFumble: true }],
    fumble: ["both-fumble", { attackerFumble: true, defenderFumble: true }]
  }
};

var parryMatrix = {
  critical: {
    critical: ["critical-attack-critical-parry", { targetDamageMode: "normal", parried: true, defenderWeaponDamage: "threshold-one", excessTo: "rolled-location" }],
    special: ["critical-attack-special-parry", { targetDamageMode: "special", parried: true, defenderWeaponDamage: "threshold-one", excessTo: "adjacent-no-armor" }],
    success: ["critical-attack-normal-parry", { targetDamageMode: "special", parried: true, defenderWeaponDamage: "full", excessTo: "adjacent-no-armor" }],
    failure: ["critical-attack-failed-parry", { targetDamageMode: "critical", ignoreArmor: true }],
    fumble: ["critical-attack-fumbled-parry", { targetDamageMode: "critical", ignoreArmor: true, defenderFumble: true }]
  },
  special: {
    critical: ["special-attack-critical-parry", { parried: true, parryDamageMode: "normal", attackerWeaponDamage: "threshold-one" }],
    special: ["special-attack-special-parry", { targetDamageMode: "normal", parried: true, defenderWeaponDamage: "threshold-one", excessTo: "rolled-location" }],
    success: ["special-attack-normal-parry", { targetDamageMode: "special", parried: true, defenderWeaponDamage: "excess", excessTo: "adjacent-location" }],
    failure: ["special-attack-failed-parry", { targetDamageMode: "special" }],
    fumble: ["special-attack-fumbled-parry", { targetDamageMode: "special", defenderFumble: true }]
  },
  success: {
    critical: ["normal-attack-critical-parry", { parried: true, parryDamageMode: "special", attackerWeaponDamage: "excess" }],
    special: ["normal-attack-special-parry", { parried: true, parryDamageMode: "normal", attackerWeaponDamage: "threshold-one" }],
    success: ["normal-attack-normal-parry", { targetDamageMode: "normal", parried: true, defenderWeaponDamage: "threshold-one", excessTo: "rolled-location" }],
    failure: ["normal-attack-failed-parry", { targetDamageMode: "normal" }],
    fumble: ["normal-attack-fumbled-parry", { targetDamageMode: "normal", defenderFumble: true }]
  },
  failure: {
    critical: ["failed-attack-critical-parry", { parried: true, parryDamageMode: "special", attackerWeaponDamage: "full" }],
    special: ["failed-attack-special-parry", { parried: true, parryDamageMode: "special", attackerWeaponDamage: "excess" }],
    success: ["failed-attack-normal-parry", { parried: true, parryDamageMode: "normal", attackerWeaponDamage: "threshold-one" }],
    failure: ["both-fail", {}],
    fumble: ["failed-attack-fumbled-parry", { targetDamageMode: "normal", defenderFumble: true }]
  },
  fumble: {
    critical: ["fumbled-attack-critical-parry", { parried: true, attackerFumble: true, parryDamageMode: "special", attackerWeaponDamage: "full" }],
    special: ["fumbled-attack-special-parry", { parried: true, attackerFumble: true, parryDamageMode: "special", attackerWeaponDamage: "excess" }],
    success: ["fumbled-attack-normal-parry", { parried: true, attackerFumble: true, parryDamageMode: "normal", attackerWeaponDamage: "threshold-one" }],
    failure: ["fumbled-attack-failed-parry", { attackerFumble: true }],
    fumble: ["both-fumble", { attackerFumble: true, defenderFumble: true }]
  }
};

aov.resolveAttackDefense = function (attackTier, defenseTier, defenseKind) {
  var matrix = defenseKind === "dodge" ? dodgeMatrix : parryMatrix;
  var cell = matrix[attackTier] && matrix[attackTier][defenseTier];
  if (!cell) return attackResult("invalid-combat-result", {});
  return attackResult(cell[0], cell[1]);
};

aov.attackDodgeMatrix = dodgeMatrix;
aov.attackParryMatrix = parryMatrix;
