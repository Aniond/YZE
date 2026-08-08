var aov = {};

aov.number = function (value, fallback) {
  var parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number(fallback || 0);
};

aov.clampPercent = function (value) {
  return Math.max(0, aov.number(value, 0));
};

aov.abilityResultRows = [
  [1, 5, 1, 1, 96], [6, 7, 1, 1, 96], [8, 10, 1, 2, 96],
  [11, 12, 1, 2, 97], [13, 17, 2, 3, 97], [18, 22, 2, 4, 97],
  [23, 27, 2, 5, 97], [28, 30, 2, 6, 97], [31, 32, 2, 6, 98],
  [33, 37, 2, 7, 98], [38, 42, 2, 8, 98], [43, 47, 2, 9, 98],
  [48, 49, 2, 10, 98], [50, 50, 3, 10, 98], [51, 52, 3, 10, 99],
  [53, 57, 3, 11, 99], [58, 62, 3, 12, 99], [63, 67, 3, 13, 99],
  [68, 69, 3, 14, 99], [70, 70, 4, 14, 99], [71, 72, 4, 14, 100],
  [73, 77, 4, 15, 100], [78, 82, 4, 16, 100], [83, 87, 4, 17, 100],
  [88, 89, 4, 18, 100], [90, 92, 5, 18, 100], [93, 97, 5, 19, 100],
  [98, 102, 5, 20, 100], [103, 107, 5, 21, 100], [108, 109, 5, 22, 100],
  [110, 112, 6, 22, 100], [113, 117, 6, 23, 100], [118, 122, 6, 24, 100]
];

aov.abilityThresholds = function (target) {
  for (var index = 0; index < aov.abilityResultRows.length; index += 1) {
    var row = aov.abilityResultRows[index];
    if (target >= row[0] && target <= row[1]) {
      return { criticalMax: row[2], specialMax: row[3], fumbleMin: row[4] };
    }
  }
  if (target > 122) {
    return {
      criticalMax: Math.max(1, Math.round(target * 0.05)),
      specialMax: Math.max(1, Math.round(target * 0.2)),
      fumbleMin: 100
    };
  }
  return { criticalMax: 1, specialMax: 1, fumbleMin: 96 };
};

aov.classifyPercentile = function (targetValue, rollValue) {
  var target = aov.clampPercent(targetValue);
  var roll = aov.number(rollValue, 100);
  if (roll === 0) roll = 100;
  roll = Math.max(1, Math.min(100, Math.round(roll)));

  var thresholds = aov.abilityThresholds(target);
  var criticalMax = thresholds.criticalMax;
  var specialMax = thresholds.specialMax;
  var effectiveSuccess = Math.max(5, Math.min(95, target));
  var fumbleMin = thresholds.fumbleMin;
  var tier;

  if (roll >= fumbleMin) tier = "fumble";
  else if (roll >= 96) tier = "failure";
  else if (roll <= criticalMax) tier = "critical";
  else if (roll <= specialMax) tier = "special";
  else if (roll <= effectiveSuccess) tier = "success";
  else tier = "failure";

  return {
    tier: tier,
    target: target,
    roll: roll,
    criticalMax: criticalMax,
    specialMax: specialMax,
    fumbleMin: fumbleMin
  };
};

aov.resolveOpposed = function (left, right) {
  var ranks = { fumble: -1, failure: 0, success: 1, special: 2, critical: 3 };
  var leftRank = ranks[left.tier];
  var rightRank = ranks[right.tier];

  if (leftRank <= 0 && rightRank <= 0) return { outcome: "two-losers", winner: null };
  if (leftRank > rightRank) return { outcome: "winner", winner: "left" };
  if (rightRank > leftRank) return { outcome: "winner", winner: "right" };
  if (left.tier === "critical") return { outcome: "tie", winner: null };
  if (left.roll > right.roll) return { outcome: "winner", winner: "left" };
  if (right.roll > left.roll) return { outcome: "winner", winner: "right" };
  return { outcome: "tie", winner: null };
};

aov.resistanceChance = function (active, passive) {
  return 50 + aov.number(active, 0) * 5 - aov.number(passive, 0) * 5;
};

aov.augmentModifier = function (tier) {
  return ({ critical: 50, special: 30, success: 20, failure: -20, fumble: -50 })[tier];
};

aov.characteristicModifier = function (value, bands, extraPerBand) {
  var score = Math.max(1, aov.number(value, 1));
  if (score <= 20) return bands[Math.min(4, Math.floor((score - 1) / 4))];
  return bands[4] + Math.ceil((score - 20) / 4) * extraPerBand;
};

aov.hitPointSizeModifier = function (siz) {
  return aov.characteristicModifier(siz, [-2, -1, 0, 1, 2], 1);
};

aov.hitPointPowerModifier = function (pow) {
  return aov.characteristicModifier(pow, [-1, 0, 0, 0, 1], 1);
};

aov.damageModifier = function (str, siz) {
  var total = aov.number(str, 0) + aov.number(siz, 0);
  if (total <= 12) return "-1D4";
  if (total <= 24) return "0";
  if (total <= 32) return "+1D4";
  if (total <= 40) return "+1D6";
  if (total <= 56) return "+2D6";
  return "+" + (2 + Math.ceil((total - 56) / 16)) + "D6";
};

aov.calculateDerived = function (data) {
  data = data || {};
  var con = aov.number(data.con, 0);
  var pow = aov.number(data.pow, 0);
  return {
    maxHp: Math.max(0, con + aov.hitPointSizeModifier(data.siz) + aov.hitPointPowerModifier(pow)),
    maxMagicPoints: Math.max(0, pow),
    movement: 10,
    healingRate: Math.max(1, Math.ceil(con / 6)),
    damageModifier: aov.damageModifier(data.str, data.siz),
    maxEnc: Math.ceil((aov.number(data.str, 0) + con) / 2)
  };
};

aov.calculateSkillCategoryModifiers = function (data) {
  data = data || {};
  function contribution(field, bands, extra) {
    return aov.characteristicModifier(data[field], bands, extra);
  }

  var agility = contribution("str", [-5, 0, 0, 0, 5], 5)
    + contribution("siz", [5, 0, 0, 0, -5], -5)
    + contribution("dex", [-10, -5, 0, 5, 10], 5)
    + contribution("pow", [-5, 0, 0, 0, 5], 5);
  var communication = contribution("int", [-5, 0, 0, 0, 5], 5)
    + contribution("pow", [-5, 0, 0, 0, 5], 5)
    + contribution("cha", [-10, -5, 0, 5, 10], 5);
  var knowledge = contribution("int", [-10, -5, 0, 5, 10], 5)
    + contribution("pow", [-5, 0, 0, 0, 5], 5);
  var manipulation = contribution("str", [-5, 0, 0, 0, 5], 5)
    + contribution("dex", [-10, -5, 0, 5, 10], 5)
    + contribution("int", [-10, -5, 0, 5, 10], 5)
    + contribution("pow", [-5, 0, 0, 0, 5], 5);
  var mythic = contribution("pow", [-10, -5, 0, 5, 10], 5)
    + contribution("cha", [-5, 0, 0, 0, 5], 5);
  var perception = contribution("int", [-10, -5, 0, 5, 10], 5)
    + contribution("pow", [-5, 0, 0, 0, 5], 5);
  var stealth = contribution("siz", [10, 5, 0, -5, -10], -5)
    + contribution("dex", [-10, -5, 0, 5, 10], 5)
    + contribution("int", [-10, -5, 0, 5, 10], 5)
    + contribution("pow", [5, 0, 0, 0, -5], -5);

  return {
    agility: agility,
    communication: communication,
    knowledge: knowledge,
    manipulation: manipulation,
    weapons: manipulation,
    mythic: mythic,
    perception: perception,
    stealth: stealth
  };
};
