var aov = aov || {};

aov.rollDamagePlan = function (input) {
  input = input || {};
  var kind = input.kind || "normal";
  var family = input.family || "other";
  var weapon = aov.number(input.weaponRoll, 0);
  var secondWeapon = aov.number(input.secondWeaponRoll, weapon);
  var maxWeapon = aov.number(input.maxWeaponDamage, weapon);
  var damageModifier = aov.number(input.damageModifierRoll, 0);
  var maxDamageModifier = aov.number(input.maxDamageModifier, damageModifier);
  var rawDamage = weapon + damageModifier;
  var stuck = false;
  var consciousnessMultiplier = null;

  if (kind === "special") {
    if (family === "impaling") { rawDamage = weapon * 2 + damageModifier; stuck = true; }
    if (family === "slashing") { rawDamage = weapon + secondWeapon + damageModifier; consciousnessMultiplier = 5; }
    if (family === "crushing") rawDamage = weapon + damageModifier + maxDamageModifier;
  }
  if (kind === "critical") {
    if (family === "impaling" || family === "slashing") rawDamage = maxWeapon * 2 + damageModifier;
    else if (family === "crushing") rawDamage = maxWeapon + maxDamageModifier + damageModifier;
    else rawDamage = maxWeapon + damageModifier;
    stuck = family === "impaling";
    consciousnessMultiplier = family === "slashing" ? 5 : null;
  }

  return {
    rawDamage: Math.max(0, rawDamage),
    ignoreArmor: kind === "critical" || input.ignoreArmor === true,
    stuck: stuck,
    consciousnessMultiplier: consciousnessMultiplier
  };
};

aov.applyDamagePlan = function (recordData, plan) {
  recordData = recordData || {};
  plan = plan || {};
  var locations = recordData.locations || [];
  var locationIndex = -1;
  var location = null;
  for (var index = 0; index < locations.length; index += 1) {
    var candidate = locations[index].data || locations[index];
    if (candidate.key === plan.locationKey) { locationIndex = index; location = candidate; break; }
  }
  var multiplier = aov.number(plan.damageMultiplier, 1);
  var rawDamage = Math.max(0, aov.number(plan.rawDamage, 0) * multiplier);
  var armor = location && !plan.ignoreArmor ? Math.max(0, aov.number(location.armor, 0)) : 0;
  var damage = Math.max(0, rawDamage - armor);
  var currentTotal = aov.number(recordData.curHp, 0);
  var values = { "data.curHp": currentTotal - damage };
  var restoreValues = { "data.curHp": currentTotal };
  var warnings = [];

  if (location) {
    var currentLocation = aov.number(location.curHp, 0);
    var locationPath = "data.locations." + locationIndex + ".data.curHp";
    values[locationPath] = currentLocation - damage;
    restoreValues[locationPath] = currentLocation;
    if (values[locationPath] <= 0) warnings.push(location.key + "-disabled");
  } else {
    warnings.push("missing-hit-location");
  }
  if (values["data.curHp"] <= 0) warnings.push("total-hp-zero");

  return { values: values, warnings: warnings, restoreValues: restoreValues, appliedDamage: damage };
};

aov.applyHealing = function (current, amount, maximum) {
  return Math.min(aov.number(maximum, 0), aov.number(current, 0) + Math.max(0, aov.number(amount, 0)));
};

aov.canUseWyrd = function (state, tier, isCombatRoll) {
  state = state || {};
  return isCombatRoll === true && tier === "failure" && state.usedToday !== true && aov.number(state.permanentPow, 0) > 0;
};

aov.applyWyrd = function (state, tier, isCombatRoll) {
  state = state || {};
  if (!aov.canUseWyrd(state, tier, isCombatRoll)) {
    return { tier: tier, permanentPow: aov.number(state.permanentPow, 0), usedToday: state.usedToday === true };
  }
  return { tier: "success", permanentPow: aov.number(state.permanentPow, 0) - 1, usedToday: true };
};
