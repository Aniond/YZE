import assert from "node:assert/strict";
import { loadScript } from "./load-script.js";
import { parseAllScripts } from "./parse-check.js";
import { registerPercentileTests } from "./test-percentile.js";
import { registerDerivedTests } from "./test-derived.js";
import { registerCombatTests } from "./test-combat.js";
import { registerDamageTests } from "./test-damage.js";
import { registerTabTests } from "./test-tabs.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL ${name}`);
    console.error(error.stack || error);
  }
}

test("common script exposes the aov namespace", () => {
  const context = loadScript("rollhandlers/common.js");
  assert.equal(typeof context.aov, "object");
});

test("all JavaScript and HTML script blocks parse", () => {
  assert.deepEqual(parseAllScripts(), []);
});

registerPercentileTests(test, loadScript);
registerDerivedTests(test, loadScript);
registerCombatTests(test, loadScript);
registerDamageTests(test, loadScript);
registerTabTests(test);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
