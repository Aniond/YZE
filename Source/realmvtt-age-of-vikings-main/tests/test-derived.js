import assert from "node:assert/strict";

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

export function registerDerivedTests(test, loadScript) {
  const { aov } = loadScript("rollhandlers/common.js");

  test("Njall corrected characteristics produce published derived values", () => {
    assert.deepEqual(plain(aov.calculateDerived({
      str: 14, con: 10, siz: 18, dex: 13, int: 14, pow: 11, cha: 7
    })), {
      maxHp: 12,
      maxMagicPoints: 11,
      movement: 10,
      healingRate: 2,
      damageModifier: "+1D4",
      maxEnc: 12
    });
  });

  test("derived calculations cover low and exceptional characteristics", () => {
    assert.equal(aov.calculateDerived({ str: 3, con: 3, siz: 3, pow: 3 }).maxHp, 0);
    assert.equal(aov.calculateDerived({ str: 3, con: 3, siz: 3, pow: 3 }).damageModifier, "-1D4");
    assert.equal(aov.calculateDerived({ str: 30, con: 25, siz: 30, pow: 25 }).maxHp, 33);
    assert.equal(aov.calculateDerived({ str: 30, con: 25, siz: 30, pow: 25 }).damageModifier, "+3D6");
    assert.equal(aov.calculateDerived({ str: 30, con: 25, siz: 30, pow: 25 }).maxEnc, 28);
  });

  test("Njall skill category modifiers match corrected table", () => {
    assert.deepEqual(plain(aov.calculateSkillCategoryModifiers({
      str: 14, siz: 18, dex: 13, int: 14, pow: 11, cha: 7
    })), {
      agility: 0,
      communication: -5,
      knowledge: 5,
      manipulation: 10,
      weapons: 10,
      mythic: 0,
      perception: 5,
      stealth: 0
    });
  });
}
