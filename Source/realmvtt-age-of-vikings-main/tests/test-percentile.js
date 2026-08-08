import assert from "node:assert/strict";

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

export function registerPercentileTests(test, loadScript) {
  const { aov } = loadScript("rollhandlers/common.js");

  test("percentile classifier enforces corrected universal bounds", () => {
    assert.equal(aov.classifyPercentile(5, 1).tier, "critical");
    assert.equal(aov.classifyPercentile(1, 5).tier, "success");
    assert.equal(aov.classifyPercentile(120, 96).tier, "failure");
    assert.equal(aov.classifyPercentile(120, 100).tier, "fumble");
  });

  test("percentile classifier matches corrected threshold boundaries", () => {
    const cases = [
      [8, 1, "critical"], [8, 2, "special"], [8, 3, "success"],
      [30, 2, "critical"], [30, 6, "special"], [30, 7, "success"],
      [70, 4, "critical"], [70, 14, "special"], [70, 15, "success"],
      [113, 6, "critical"], [113, 23, "special"], [113, 24, "success"],
      [122, 6, "critical"], [122, 24, "special"], [122, 25, "success"],
      [150, 8, "critical"], [150, 30, "special"], [150, 31, "success"]
    ];
    for (const [target, roll, tier] of cases) {
      assert.equal(aov.classifyPercentile(target, roll).tier, tier, `${target}/${roll}`);
    }
  });

  test("every corrected table row classifies every D100 result", () => {
    const rows = [
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
    for (const [min, max, criticalMax, specialMax, fumbleMin] of rows) {
      for (let target = min; target <= max; target += 1) {
        for (let roll = 1; roll <= 100; roll += 1) {
          let expected = "failure";
          if (roll >= fumbleMin) expected = "fumble";
          else if (roll >= 96) expected = "failure";
          else if (roll <= criticalMax) expected = "critical";
          else if (roll <= specialMax) expected = "special";
          else if (roll <= Math.max(5, Math.min(95, target))) expected = "success";
          assert.equal(aov.classifyPercentile(target, roll).tier, expected, `${target}/${roll}`);
        }
      }
    }
  });

  test("fumble threshold follows five percent of effective failure chance", () => {
    const cases = [
      [5, 96], [10, 96], [11, 97], [30, 97], [31, 98],
      [50, 98], [51, 99], [70, 99], [71, 100], [200, 100]
    ];
    for (const [target, fumbleMin] of cases) {
      assert.equal(aov.classifyPercentile(target, fumbleMin).tier, "fumble", `${target}`);
      if (fumbleMin > 96) {
        assert.equal(aov.classifyPercentile(target, fumbleMin - 1).tier, "failure", `${target}`);
      }
    }
  });

  test("opposed resolution uses tier then higher successful roll", () => {
    assert.deepEqual(plain(aov.resolveOpposed(
      aov.classifyPercentile(10, 8),
      aov.classifyPercentile(30, 7)
    )), { outcome: "winner", winner: "left" });
    assert.deepEqual(plain(aov.resolveOpposed(
      aov.classifyPercentile(80, 3),
      aov.classifyPercentile(80, 4)
    )), { outcome: "tie", winner: null });
    assert.deepEqual(plain(aov.resolveOpposed(
      aov.classifyPercentile(20, 50),
      aov.classifyPercentile(30, 60)
    )), { outcome: "two-losers", winner: null });
  });

  test("resistance and augment modifiers use published values", () => {
    assert.equal(aov.resistanceChance(10, 15), 25);
    assert.equal(aov.resistanceChance(15, 10), 75);
    assert.equal(aov.augmentModifier("critical"), 50);
    assert.equal(aov.augmentModifier("special"), 30);
    assert.equal(aov.augmentModifier("success"), 20);
    assert.equal(aov.augmentModifier("failure"), -20);
    assert.equal(aov.augmentModifier("fumble"), -50);
  });
}
