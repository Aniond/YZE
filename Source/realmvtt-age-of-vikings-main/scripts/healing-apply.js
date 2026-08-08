var healingAmount = Math.max(0, Number(value) || 0);
var currentHp = Number(record && record.data && record.data.curHp) || 0;
var maximumHp = Number(record && record.data && record.data.maxHp) || currentHp;
var healedHp = aov.applyHealing(currentHp, healingAmount, maximumHp);
api.showPrompt(
  "Apply Healing",
  "Confirm healing",
  "Restore " + (healedHp - currentHp) + " total HP (maximum " + maximumHp + ").",
  [{ label: "Apply healing", value: "apply" }],
  null,
  function (choice) {
    if (choice === "apply") api.setValues({ "data.curHp": healedHp });
  }
);
