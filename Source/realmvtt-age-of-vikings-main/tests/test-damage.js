import assert from "node:assert/strict";

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

export function registerDamageTests(test, loadScript) {
  const { aov } = loadScript(["rollhandlers/common.js", "rollhandlers/damage.js"]);

  test("damage plans implement normal and three special weapon families", () => {
    assert.deepEqual(plain(aov.rollDamagePlan({ kind: "normal", weaponRoll: 6, damageModifierRoll: 3 })), {
      rawDamage: 9, ignoreArmor: false, stuck: false, consciousnessMultiplier: null
    });
    assert.equal(aov.rollDamagePlan({ kind: "special", family: "impaling", weaponRoll: 6, damageModifierRoll: 3 }).rawDamage, 15);
    assert.equal(aov.rollDamagePlan({ kind: "special", family: "slashing", weaponRoll: 6, secondWeaponRoll: 4, damageModifierRoll: 3 }).rawDamage, 13);
    assert.equal(aov.rollDamagePlan({ kind: "special", family: "crushing", weaponRoll: 6, damageModifierRoll: 3, maxDamageModifier: 4 }).rawDamage, 13);
  });

  test("critical damage is maximum special damage and ignores armor", () => {
    const result = aov.rollDamagePlan({
      kind: "critical", family: "impaling", maxWeaponDamage: 8, damageModifierRoll: 3
    });
    assert.equal(result.rawDamage, 19);
    assert.equal(result.ignoreArmor, true);
  });

  test("damage application reduces total and location HP after armor and is reversible", () => {
    const record = {
      curHp: 12,
      locations: [{ key: "body", curHp: 5, armor: 2 }, { key: "head", curHp: 4, armor: 1 }]
    };
    const result = aov.applyDamagePlan(record, { locationKey: "body", rawDamage: 7, ignoreArmor: false });
    assert.deepEqual(plain(result.values), { "data.curHp": 7, "data.locations.0.data.curHp": 0 });
    assert.deepEqual(plain(result.restoreValues), { "data.curHp": 12, "data.locations.0.data.curHp": 5 });
    assert.equal(result.appliedDamage, 5);
    assert.ok(result.warnings.includes("body-disabled"));
  });

  test("draugur multipliers and healing are applied before record mutation", () => {
    const result = aov.applyDamagePlan(
      { curHp: 20, locations: [{ key: "body", curHp: 8, armor: 4 }] },
      { locationKey: "body", rawDamage: 6, damageMultiplier: 2, ignoreArmor: true }
    );
    assert.equal(result.appliedDamage, 12);
    assert.equal(result.values["data.curHp"], 8);
    assert.equal(aov.applyHealing(3, 5, 10), 8);
    assert.equal(aov.applyHealing(8, 5, 10), 10);
  });

  test("Wyrd changes one failed combat roll for one permanent POW", () => {
    assert.equal(aov.canUseWyrd({ usedToday: false, permanentPow: 11 }, "failure", true), true);
    assert.equal(aov.canUseWyrd({ usedToday: true, permanentPow: 11 }, "failure", true), false);
    assert.equal(aov.canUseWyrd({ usedToday: false, permanentPow: 11 }, "fumble", true), false);
    assert.deepEqual(plain(aov.applyWyrd({ usedToday: false, permanentPow: 11 }, "failure", true)), {
      tier: "success", permanentPow: 10, usedToday: true
    });
  });
}
