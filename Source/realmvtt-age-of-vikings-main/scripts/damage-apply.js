var targetData = record && record.data ? record.data : {};
var selectedLocation = targetData.pendingHitLocation || "body";
var pendingPlan = {
  locationKey: selectedLocation,
  rawDamage: Math.max(0, Number(value) || 0),
  ignoreArmor: targetData.pendingIgnoreArmor === true,
  damageMultiplier: Number(targetData.damageTakenMultiplier) || 1
};
var preview = aov.applyDamagePlan(targetData, pendingPlan);
var damageOptions = [{ label: "Apply " + preview.appliedDamage + " damage", value: "apply" }];
api.showPrompt(
  "Apply Damage",
  "Confirm location damage",
  selectedLocation + ": " + preview.appliedDamage + " after armor. Total and location HP will both change.",
  damageOptions,
  null,
  function (choice) {
    if (choice === "apply") api.setValues(preview.values);
  }
);
