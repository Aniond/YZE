import assert from "node:assert/strict";

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

export function registerCombatTests(test, loadScript) {
  const { aov } = loadScript(["rollhandlers/common.js", "rollhandlers/attack.js"]);

  test("DEX ranks space multiple attacks through the round", () => {
    assert.deepEqual(plain(aov.dexRanks(15, 2)), [15, 8]);
    assert.deepEqual(plain(aov.dexRanks(17, 3)), [17, 11, 5]);
    assert.deepEqual(plain(aov.dexRanks(12, 1)), [12]);
  });

  test("every attack/parry and attack/dodge matrix cell resolves", () => {
    const tiers = ["critical", "special", "success", "failure", "fumble"];
    for (const defense of ["parry", "dodge"]) {
      for (const attackTier of tiers) {
        for (const defenseTier of tiers) {
          const result = aov.resolveAttackDefense(attackTier, defenseTier, defense);
          assert.equal(typeof result.code, "string", `${defense} ${attackTier}/${defenseTier}`);
          assert.ok(["none", "normal", "special", "critical"].includes(result.targetDamageMode));
          assert.equal(typeof result.attackerFumble, "boolean");
          assert.equal(typeof result.defenderFumble, "boolean");
        }
      }
    }
  });

  test("dodge matrix preserves critical and fumble exceptions", () => {
    assert.deepEqual(plain(aov.resolveAttackDefense("critical", "success", "dodge")), {
      code: "critical-through-normal-dodge",
      targetDamageMode: "critical",
      ignoreArmor: true,
      parried: false,
      attackerFumble: false,
      defenderFumble: false
    });
    assert.equal(aov.resolveAttackDefense("failure", "fumble", "dodge").targetDamageMode, "normal");
    assert.equal(aov.resolveAttackDefense("fumble", "fumble", "dodge").targetDamageMode, "none");
    assert.equal(aov.resolveAttackDefense("fumble", "fumble", "dodge").attackerFumble, true);
    assert.equal(aov.resolveAttackDefense("fumble", "fumble", "dodge").defenderFumble, true);
  });

  test("parry matrix returns weapon and excess-damage instructions", () => {
    const bothCritical = aov.resolveAttackDefense("critical", "critical", "parry");
    assert.equal(bothCritical.targetDamageMode, "normal");
    assert.equal(bothCritical.defenderWeaponDamage, "threshold-one");
    assert.equal(bothCritical.excessTo, "rolled-location");

    const failedAttackCriticalParry = aov.resolveAttackDefense("failure", "critical", "parry");
    assert.equal(failedAttackCriticalParry.targetDamageMode, "none");
    assert.equal(failedAttackCriticalParry.parryDamageMode, "special");
    assert.equal(failedAttackCriticalParry.attackerWeaponDamage, "full");
  });

  test("hit locations are selected from an inclusive D20 profile", () => {
    const profile = [
      { min: 1, max: 4, key: "right-leg" },
      { min: 5, max: 8, key: "left-leg" },
      { min: 9, max: 20, key: "body" }
    ];
    assert.equal(aov.findHitLocation(profile, 1).key, "right-leg");
    assert.equal(aov.findHitLocation(profile, 8).key, "left-leg");
    assert.equal(aov.findHitLocation(profile, 20).key, "body");
    assert.equal(aov.findHitLocation(profile, 21), null);
  });
}
