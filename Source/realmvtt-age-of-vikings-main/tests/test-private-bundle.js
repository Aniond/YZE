import assert from "node:assert/strict";
import { validatePrivateBundle } from "../tools/validate-private-bundle.mjs";

const bundleRoot = "C:/Projects/AgeOfVikings/private/cursed-farm";

export function registerPrivateBundleTests(test) {
  test("private Cursed Farm bundle contains corrected heroes and scenario dependencies", () => {
    const result = validatePrivateBundle(bundleRoot);
    assert.deepEqual(result.errors, []);
    assert.equal(result.heroCount, 6);
    assert.ok(result.recordKeys.includes("npc:bull-ox"));
    assert.ok(result.recordKeys.includes("npc:eirikur-draugur"));
    assert.ok(result.recordKeys.includes("npc:outlaw"));
    assert.ok(result.recordKeys.includes("item:eirikurs-blade"));
  });
}
