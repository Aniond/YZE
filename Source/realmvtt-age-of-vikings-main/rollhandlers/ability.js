var aov = aov || {};

var abilityRoll = data && data.roll ? data.roll : { total: 0, dice: [] };
var abilityTarget = aov.number(abilityRoll.metadata && abilityRoll.metadata.target, 0);
var percentileDie = (abilityRoll.dice || []).find(function (die) { return die.type === 100 || die.type === "d100"; });
var percentileValue = percentileDie ? aov.number(percentileDie.value, 100) : aov.number(abilityRoll.total, 100);
var abilityResult = aov.classifyPercentile(abilityTarget, percentileValue);
var abilityName = (abilityRoll.metadata && abilityRoll.metadata.rollName) || "Ability";
var resultColor = abilityResult.tier === "failure" || abilityResult.tier === "fumble" ? "red" : "green";
api.sendMessage(
  "**[center][color=" + resultColor + "]" + abilityResult.tier.toUpperCase() + "[/color][/center]**",
  abilityRoll,
  [],
  [{ name: abilityName, tooltip: abilityName + " " + abilityTarget + "%" }]
);
