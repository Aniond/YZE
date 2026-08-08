# Age of Vikings Realm VTT Ruleset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, test, compile, and deploy a Cursed Farm-ready Age of Vikings ruleset plus a separately versioned private scenario package.

**Architecture:** A tracked reusable ruleset under `Source/realmvtt-age-of-vikings-main` owns Realm schemas, sheets, deterministic mechanics, prompts, and tests. A local private workspace under `C:\Projects\AgeOfVikings\private\cursed-farm` owns copyrighted scenario records and deployment evidence. A bundle manifest checks versions and stable source keys before serial live import.

**Tech Stack:** Realm VTT ruleset HTML components, vanilla JavaScript, Node.js 18+ built-in `node:test`/`vm`, JSON manifests, the local Realm ruleset compiler, Python/pypdf for source extraction, and Realm VTT MCP for authenticated deployment/readback.

## Global Constraints

- Work only in `C:\ruleset-compiler-main\.worktrees\age-of-vikings` on branch `codex/age-of-vikings` for tracked changes.
- Treat `C:\ruleset-compiler-main\Source\realmvtt-5e-main` as read-only structural reference.
- Do not modify the existing ROT, Blood Lords, or Malleus Monstrorum campaigns.
- Apply `CHA2038_Age_of_Vikings_Core_Rulebook_Corrections.pdf` when it differs from the core PDF.
- Keep The Cursed Farm text, maps, handouts, pregens, and live readbacks outside the reusable ruleset repository.
- Use `api.promptRoll()` for player-facing rolls and `api.setValues()` for record updates, following confirmed Sean 5E call patterns.
- Do not use an unconfirmed Realm sheet API method.
- Preview permanent POW loss and damage before record mutation.
- Preserve stable source keys, hashes, live Realm IDs, and full readback evidence.
- No Realm upload occurs until local tests and compiler dry-run pass.

---

### Task 1: Ruleset Skeleton and Test Harness

**Files:**
- Create: `Source/realmvtt-age-of-vikings-main/package.json`
- Create: `Source/realmvtt-age-of-vikings-main/README.md`
- Create: `Source/realmvtt-age-of-vikings-main/tests/run-all.js`
- Create: `Source/realmvtt-age-of-vikings-main/tests/parse-check.js`
- Create: `Source/realmvtt-age-of-vikings-main/tests/load-script.js`
- Create: `Source/realmvtt-age-of-vikings-main/rollhandlers/common.js`

**Interfaces:**
- Produces: `loadScript(relativePath, globals?): Record<string, unknown>` for loading rollhandler globals in a `vm` context.
- Produces: `aov` global namespace from `rollhandlers/common.js`.
- Consumes: Node.js built-ins only.

- [ ] **Step 1: Write the failing harness test**

```javascript
// tests/run-all.js
import test from "node:test";
import assert from "node:assert/strict";
import { loadScript } from "./load-script.js";

test("common script exposes the aov namespace", () => {
  const context = loadScript("rollhandlers/common.js");
  assert.equal(typeof context.aov, "object");
});
```

- [ ] **Step 2: Run the harness and verify failure**

Run: `node Source/realmvtt-age-of-vikings-main/tests/run-all.js`

Expected: FAIL because `load-script.js` and `common.js` do not exist.

- [ ] **Step 3: Implement the loader and namespace**

```javascript
// tests/load-script.js
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function loadScript(relativePath, globals = {}) {
  const context = vm.createContext({ console, ...globals });
  vm.runInContext(fs.readFileSync(path.join(root, relativePath), "utf8"), context);
  return context;
}
```

```javascript
// rollhandlers/common.js
var aov = {};
```

- [ ] **Step 4: Add parse checks and run them**

`parse-check.js` extracts every `<script>` block from ruleset HTML and compiles it with `new Function`, then compiles every `.js` file beneath `rollhandlers`, `scripts`, `importers`, and `wizards`.

Run: `npm test --prefix Source/realmvtt-age-of-vikings-main`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Source/realmvtt-age-of-vikings-main
git commit -m "test: scaffold Age of Vikings ruleset harness"
```

### Task 2: Corrected Percentile and Derived Mechanics

**Files:**
- Modify: `Source/realmvtt-age-of-vikings-main/rollhandlers/common.js`
- Create: `Source/realmvtt-age-of-vikings-main/tests/test-percentile.js`
- Create: `Source/realmvtt-age-of-vikings-main/tests/test-derived.js`

**Interfaces:**
- Produces: `aov.clampPercent(value): number`
- Produces: `aov.classifyPercentile(target, roll): { tier, target, roll, criticalMax, specialMax, fumbleMin }`
- Produces: `aov.resolveOpposed(left, right): { outcome, winner }`
- Produces: `aov.resistanceChance(active, passive): number`
- Produces: `aov.augmentModifier(tier): number`
- Produces: `aov.calculateDerived(data): { maxHp, maxMagicPoints, movement, healingRate, damageModifier, maxEnc }`
- Produces: `aov.calculateSkillCategoryModifiers(data): Record<string, number>`

- [ ] **Step 1: Write failing percentile fixtures**

```javascript
test("corrected universal bounds and tiers", () => {
  assert.equal(aov.classifyPercentile(5, 1).tier, "critical");
  assert.equal(aov.classifyPercentile(1, 5).tier, "success");
  assert.equal(aov.classifyPercentile(120, 96).tier, "failure");
  assert.equal(aov.classifyPercentile(120, 100).tier, "fumble");
  assert.equal(aov.classifyPercentile(113, 6).tier, "critical");
  assert.equal(aov.classifyPercentile(30, 6).tier, "special");
});
```

Add an exhaustive loop for targets `0..200` and rolls `1..100` comparing the implementation to a table-backed oracle encoded from the correction document.

- [ ] **Step 2: Run and verify failure**

Run: `node --test Source/realmvtt-age-of-vikings-main/tests/test-percentile.js`

Expected: FAIL because the functions are undefined.

- [ ] **Step 3: Implement corrected percentile mechanics**

Use an explicit corrected threshold table for targets 1-122 and formula fallback above 122. Represent `00` internally as `100`. Universal bounds override ordinary success but do not erase `01` critical or `00` fumble.

- [ ] **Step 4: Add opposed, resistance, augment, and derived tests**

```javascript
assert.deepEqual(aov.resolveOpposed(
  aov.classifyPercentile(10, 8),
  aov.classifyPercentile(65, 6)
), { outcome: "winner", winner: "left" });
assert.equal(aov.resistanceChance(10, 15), 25);
assert.equal(aov.augmentModifier("critical"), 50);
assert.equal(aov.augmentModifier("fumble"), -50);
```

Derived fixtures cover all six corrected pregens plus generic boundary cases. MOV defaults to 10 for human heroes.

- [ ] **Step 5: Run mechanics tests**

Run: `node --test Source/realmvtt-age-of-vikings-main/tests/test-percentile.js Source/realmvtt-age-of-vikings-main/tests/test-derived.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add Source/realmvtt-age-of-vikings-main/rollhandlers/common.js Source/realmvtt-age-of-vikings-main/tests
git commit -m "feat: add corrected Age of Vikings core mechanics"
```

### Task 3: Combat, Hit Locations, Damage, and Wyrd

**Files:**
- Modify: `Source/realmvtt-age-of-vikings-main/rollhandlers/common.js`
- Create: `Source/realmvtt-age-of-vikings-main/rollhandlers/ability.js`
- Create: `Source/realmvtt-age-of-vikings-main/rollhandlers/attack.js`
- Create: `Source/realmvtt-age-of-vikings-main/rollhandlers/damage.js`
- Create: `Source/realmvtt-age-of-vikings-main/scripts/damage-apply.js`
- Create: `Source/realmvtt-age-of-vikings-main/scripts/healing-apply.js`
- Create: `Source/realmvtt-age-of-vikings-main/scripts/on-roll-initiative.js`
- Create: `Source/realmvtt-age-of-vikings-main/tests/test-combat.js`
- Create: `Source/realmvtt-age-of-vikings-main/tests/test-damage.js`

**Interfaces:**
- Produces: `aov.dexRanks(dex, attackCount): number[]`
- Produces: `aov.resolveAttackDefense(attackTier, defenseTier, defenseKind): CombatResolution`
- Produces: `aov.findHitLocation(profile, d20): HitLocation`
- Produces: `aov.rollDamagePlan(input): DamagePlan`
- Produces: `aov.applyDamagePlan(recordData, plan): { values, warnings, restoreValues }`
- Produces: `aov.canUseWyrd(data, rollContext): boolean`
- Produces: `aov.applyWyrd(data): { values, resultTier }`

- [ ] **Step 1: Write failing combat-table tests**

Encode every cell of the corrected Attack & Parry Results table as fixtures. Add DEX-rank cases including `DEX 15 / 2 = [15, 8]` and `DEX 17 / 3 = [17, 11, 5]`.

- [ ] **Step 2: Run and verify failure**

Run: `node --test Source/realmvtt-age-of-vikings-main/tests/test-combat.js`

Expected: FAIL because combat resolvers do not exist.

- [ ] **Step 3: Implement table-driven combat resolution**

Keep the attack/defense matrix as data. Return instructions such as `hitTarget`, `blocked`, `damageAttackingWeapon`, `damageDefendingWeapon`, `excessToLocation`, and `rollFumble` rather than mutating records.

- [ ] **Step 4: Write failing damage tests**

Fixtures cover human and bull-ox location profiles; armor; shield and weapon HP; normal, impaling, slashing, crushing, and critical damage; Eiríkur's half mortal-weapon damage; his sword ignoring armor; and unique destruction warnings.

```javascript
const result = aov.applyDamagePlan(
  { curHp: 15, locations: [{ key: "abdomen", curHp: 5, maxHp: 5, armor: 3 }] },
  { location: "abdomen", rawDamage: 8, ignoreArmor: false }
);
assert.equal(result.values["data.curHp"], 10);
assert.equal(result.values["data.locations.0.data.curHp"], 0);
```

- [ ] **Step 5: Implement pure damage planning and Realm adapters**

`damage-apply.js` consumes Realm's damage callback variables, builds a plan, previews it with `api.showPrompt`, and commits with one `api.setValues(values, callback)` call. `healing-apply.js` uses the same location-aware pipeline without exceeding maxima. Permanent POW is never changed by these scripts.

- [ ] **Step 6: Add Wyrd tests and implementation**

Wyrd is eligible only for a failed combat ability roll when `wyrdUsedToday !== true` and POW is at least 1. Application sets `data.pow` to `pow - 1`, `data.wyrdUsedToday` to true, and the result tier to success after explicit confirmation.

- [ ] **Step 7: Run tests and commit**

Run: `npm test --prefix Source/realmvtt-age-of-vikings-main`

Expected: PASS.

```bash
git add Source/realmvtt-age-of-vikings-main
git commit -m "feat: add Age of Vikings combat and damage engine"
```

### Task 4: Realm Record Tabs and Embedded Lists

**Files:**
- Create: `Source/realmvtt-age-of-vikings-main/character-main.html`
- Create: `Source/realmvtt-age-of-vikings-main/character-skills.html`
- Create: `Source/realmvtt-age-of-vikings-main/character-combat.html`
- Create: `Source/realmvtt-age-of-vikings-main/character-gear.html`
- Create: `Source/realmvtt-age-of-vikings-main/character-magic.html`
- Create: `Source/realmvtt-age-of-vikings-main/character-family.html`
- Create: `Source/realmvtt-age-of-vikings-main/character-notes.html`
- Create: `Source/realmvtt-age-of-vikings-main/npcs-main.html`
- Create: `Source/realmvtt-age-of-vikings-main/npcs-combat.html`
- Create: `Source/realmvtt-age-of-vikings-main/npcs-gear.html`
- Create: `Source/realmvtt-age-of-vikings-main/npcs-abilities.html`
- Create: `Source/realmvtt-age-of-vikings-main/npcs-description.html`
- Create: `Source/realmvtt-age-of-vikings-main/npcs-rules.html`
- Create: `Source/realmvtt-age-of-vikings-main/items-main.html`
- Create: `Source/realmvtt-age-of-vikings-main/items-combat.html`
- Create: `Source/realmvtt-age-of-vikings-main/items-rules.html`
- Create: `Source/realmvtt-age-of-vikings-main/abilities-main.html`
- Create: `Source/realmvtt-age-of-vikings-main/abilities-rules.html`
- Create: `Source/realmvtt-age-of-vikings-main/runes-main.html`
- Create: `Source/realmvtt-age-of-vikings-main/runes-rules.html`
- Create: `Source/realmvtt-age-of-vikings-main/magic-main.html`
- Create: `Source/realmvtt-age-of-vikings-main/magic-rules.html`
- Create: `Source/realmvtt-age-of-vikings-main/lists/*.html`
- Create: `Source/realmvtt-age-of-vikings-main/tests/test-tabs.js`

**Interfaces:**
- Consumes: `aov.calculateDerived`, `aov.classifyPercentile`, `aov.dexRanks`, `aov.applyDamagePlan`.
- Produces: Realm fields named exactly as documented in `docs/field-schema.md`.

- [ ] **Step 1: Write structural tab tests**

`test-tabs.js` asserts the seven character tabs, six NPC tabs, item/ability/rune/magic tabs, required field names, every list type, and that every standard roll calls `api.promptRoll`.

- [ ] **Step 2: Run and verify failure**

Run: `node --test Source/realmvtt-age-of-vikings-main/tests/test-tabs.js`

Expected: FAIL because the HTML files do not exist.

- [ ] **Step 3: Implement compact Sean-style sheets**

Use confirmed components (`numberfield`, `stringfield`, `richtextfield`, `dropdown`, `checkbox`, `button`, `list`, `label`, `progressbar`) and confirmed API calls (`getValue`, `setValues`, `promptRoll`, `showNotification`). Keep JavaScript in `<script>` blocks and use data-path-safe embedded-list access.

- [ ] **Step 4: Implement embedded lists**

Create focused list tabs for `skill_list`, `passion_list`, `devotion_list`, `attack_list`, `hit_location_list`, `inventory_list`, `armor_layer_list`, `ability_list`, `known_rune_list`, `magic_action_list`, and `family_list`. Each row exposes its `_id`-backed data and no file owns unrelated calculations.

- [ ] **Step 5: Run parse and tab tests**

Run: `npm test --prefix Source/realmvtt-age-of-vikings-main`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add Source/realmvtt-age-of-vikings-main
git commit -m "feat: build Age of Vikings Realm record sheets"
```

### Task 5: Character Wizard, Importer, Ruleset Configuration, and Compile

**Files:**
- Create: `Source/realmvtt-age-of-vikings-main/wizards/characters/step-01.html` through `step-10.html`
- Create: `Source/realmvtt-age-of-vikings-main/importers/character-json.js`
- Create: `Source/realmvtt-age-of-vikings-main/importers/post-character-json.js`
- Create: `Source/realmvtt-age-of-vikings-main/ruleset.config.json`
- Create: `Source/realmvtt-age-of-vikings-main/docs/field-schema.md`
- Create: `Source/realmvtt-age-of-vikings-main/tests/test-config.js`
- Create: `Source/realmvtt-age-of-vikings-main/tests/test-importer.js`

**Interfaces:**
- Produces: ruleset compiler input with version `0.1.0` represented as numeric config version `1` and semantic version in `otherSettings.rulesetVersion`.
- Produces: character JSON import contract `{ schemaVersion, sourceKey, name, data }`.

- [ ] **Step 1: Write config and importer tests**

Assert all record/list definitions, seven character tabs, ten wizard steps, roll types, DEX combat tracker, damage scripts, effect types, themes, and the semantic version field. Importer fixtures reject unknown schema versions and duplicate list IDs.

- [ ] **Step 2: Run and verify failure**

Run: `node --test Source/realmvtt-age-of-vikings-main/tests/test-config.js Source/realmvtt-age-of-vikings-main/tests/test-importer.js`

Expected: FAIL because the files do not exist.

- [ ] **Step 3: Implement wizard and importer**

Wizard steps match the approved sequence. Family history is editable summary data; full random-table generation is absent. The importer validates first, then returns one `api.setValues()` object and runs derived recalculation in the post script.

- [ ] **Step 4: Implement config**

Define Characters, NPCs, Items, Abilities, Runes, Magic, all embedded lists, health indicator, descending DEX combat tracker, roll types, damage/healing scripts, effects, default 1-meter units, token sizes, and Age of Vikings light/dark themes.

- [ ] **Step 5: Compile dry-run**

Run: `node src/cli.js rulesets Source/realmvtt-age-of-vikings-main --output Source/realmvtt-age-of-vikings-main/build/ruleset.json`

Expected: compiler exits 0 and writes a payload with no `{ "file": ... }` references.

- [ ] **Step 6: Test and commit**

Run: `npm test --prefix Source/realmvtt-age-of-vikings-main`

Expected: PASS.

```bash
git add Source/realmvtt-age-of-vikings-main
git commit -m "feat: configure compilable Age of Vikings ruleset"
```

### Task 6: Private Cursed Farm Package and Corrected Fixtures

**Files:**
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\bundle.json`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\characters\*.json`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\npcs\*.json`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\items\*.json`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\abilities\*.json`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\journals\cursed-farm.json`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\assets\manifest.json`
- Create: `Source/realmvtt-age-of-vikings-main/tools/validate-private-bundle.mjs`
- Create: `Source/realmvtt-age-of-vikings-main/tests/test-private-bundle.js`

**Interfaces:**
- Consumes: character import schema `aov-character-1` and ruleset semantic version `0.1.0`.
- Produces: `bundle.json` with `packageVersion`, `rulesetRange`, `sourceHashes`, `records`, `assets`, and `deployment`.

- [ ] **Step 1: Extract source facts and hashes**

Use pypdf to extract core pages 46-57, all four corrections pages, and the complete 12-page demo. Render pregen sheets and scenario stat pages for visual cross-check. Record SHA-256 hashes for all source PDFs.

- [ ] **Step 2: Write failing private-bundle validator tests**

Tests require six distinct hero source keys, the corrected spirit animals/skill values/attacks named in errata, bull ox, outlaws, Eiríkur, referenced items/abilities, unique source keys, valid cross-record references, and matching ruleset range.

- [ ] **Step 3: Create corrected private fixtures**

Create the six hero payloads from the corrected sheets. Create compact scenario records using only information needed for private play. Mark every file with source title/page and private-package identity.

- [ ] **Step 4: Validate separation**

Run: `node Source/realmvtt-age-of-vikings-main/tools/validate-private-bundle.mjs C:/Projects/AgeOfVikings/private/cursed-farm`

Expected: `validated private bundle: 6 heroes, required scenario records present, 0 broken references`.

Scan tracked ruleset files for scenario-specific journal text, asset paths, and private source keys; require zero matches outside tests that name acceptance fixtures.

- [ ] **Step 5: Commit tracked validator only**

```bash
git add Source/realmvtt-age-of-vikings-main/tools Source/realmvtt-age-of-vikings-main/tests
git commit -m "test: validate private Cursed Farm bundle"
```

### Task 7: Local End-to-End Verification and Documentation

**Files:**
- Modify: `Source/realmvtt-age-of-vikings-main/README.md`
- Create: `Source/realmvtt-age-of-vikings-main/docs/verification.md`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\evidence\local-verification.json`

**Interfaces:**
- Consumes: compiled ruleset payload and validated private bundle.
- Produces: reproducible command log and machine-readable local verification summary.

- [ ] **Step 1: Run the complete local suite**

```bash
npm test --prefix Source/realmvtt-age-of-vikings-main
node src/cli.js rulesets Source/realmvtt-age-of-vikings-main --output Source/realmvtt-age-of-vikings-main/build/ruleset.json
node Source/realmvtt-age-of-vikings-main/tools/validate-private-bundle.mjs C:/Projects/AgeOfVikings/private/cursed-farm
```

Expected: all tests pass, compiler exits 0, and private validation reports zero broken references.

- [ ] **Step 2: Inspect compiled output**

Assert no unresolved file references, no private source paths, no Cursed Farm journal prose, unique record/list types, all roll handler scripts present, and ruleset version `0.1.0`.

- [ ] **Step 3: Document use and verification**

README documents local compile, private package validation, unpublished deployment, and the public/private boundary. `verification.md` lists exact gates and expected outputs.

- [ ] **Step 4: Commit**

```bash
git add Source/realmvtt-age-of-vikings-main/README.md Source/realmvtt-age-of-vikings-main/docs
git commit -m "docs: add Age of Vikings verification workflow"
```

### Task 8: Unpublished Realm Deployment and Live Acceptance

**Files:**
- Update locally: `C:\Projects\AgeOfVikings\private\cursed-farm\bundle.json`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\evidence\ruleset-upload.json`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\evidence\record-write-results.json`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\evidence\full-readback.json`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\evidence\campaign-audit.json`
- Create locally: `C:\Projects\AgeOfVikings\private\cursed-farm\evidence\live-acceptance.json`

**Interfaces:**
- Consumes: clean local Gate 1-3 evidence.
- Produces: unpublished ruleset ID, dedicated test campaign ID, stable record IDs, full readback, audit, and acceptance results.

- [ ] **Step 1: Reconfirm live identity and target exclusion**

Call Realm `whoami` and list campaigns. Record that ROT, Blood Lords, and Malleus are excluded. Do not select or write to them.

- [ ] **Step 2: Dry-run through Realm MCP**

Call `realm_compile_ruleset` with `apply:false`, `create:true`, the Age of Vikings source directory, and the compiler checkout. Require compile success and review the reported payload.

- [ ] **Step 3: Create unpublished ruleset**

Call `realm_compile_ruleset` with `apply:true`, `create:true` only after Step 2 succeeds. Record the new ruleset ID and full response.

- [ ] **Step 4: Create or obtain dedicated test campaign**

Create `Age of Vikings - Cursed Farm Test` through the Realm UI using the unpublished ruleset. If Realm does not expose campaign creation to the authenticated automation surface, pause only for the user to perform this UI action, then resume automatically after the campaign appears.

- [ ] **Step 5: Import private records serially**

Select only the dedicated campaign. Upsert records in dependency order: items/abilities/runes/magic, NPCs, heroes, journals/pages, assets/maps. After each write, record source key and Realm ID. Stop on validation or write failure; do not delete partial successes.

- [ ] **Step 6: Full readback and audit**

Read every imported record in full and compare normalized data to the bundle. Run `realm_audit_campaign` report-only with broken links, duplicate names, missing art, empty folders, and orphaned folder items.

- [ ] **Step 7: Live acceptance cases**

Verify through Realm readbacks and controlled rollhandler tests: investigation rolls, bull ox locations/damage, outlaw weapons/armor, Eiríkur modifiers and unique destruction state, duel threshold tracking, and Wyrd permanent POW confirmation. Record pass/fail per case.

- [ ] **Step 8: Final verification and commit checkpoint**

Re-run the complete local suite, confirm worktree cleanliness except intended evidence-excluded files, and commit any tracked fixes discovered during live acceptance.

```bash
git status --short
npm test --prefix Source/realmvtt-age-of-vikings-main
git log --oneline --decorate -10
```

Expected: all local tests pass, live readback matches, zero unexpected audit errors, and no existing campaign changed.
