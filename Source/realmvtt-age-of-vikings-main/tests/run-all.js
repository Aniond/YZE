import assert from "node:assert/strict";
import { loadScript } from "./load-script.js";
import { parseAllScripts } from "./parse-check.js";

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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
