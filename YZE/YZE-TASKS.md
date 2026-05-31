# YZE Realm VTT — Remaining Build Tasks

Last updated: 2026-05-30
All prompts referenced below are pre-written and available from the project assistant.
Task status is mirrored to the Notion "YZE Realm VTT — Build Tracker" via notion-sync.js.

---

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done
- [-] Deferred

---

## Completed — Additional Systems (outside the original tranches)

- [x] **Status Effects system** — `effects` + `effect_entry` record types;
  effect-main.html (type-tinted compendium view) + effect-entry.html (list row);
  effects.csv seeds 12 SRD effects; `yzeEffectPenalty` folded into
  `yzeCondPenalty` so all rolls honor active effects; Active Effects list on the
  Combat tab and NPC sheet.

---

## Tranche 0 — Known Bug (fix first)

- [x] **gear-main.html attack hardcodes effAttr = 3** — HIGH PRIORITY
  - Sean confirmed API pattern (2026-05-29):
    - `api.getValue('data.X')` always reads the TOP-LEVEL owning record
    - To read list item's OWN fields, use `dataPath`:
      ```js
      function getNearestParentDataPath(dataPath) {
        var parts = dataPath.split('.data');
        return parts.length > 1 ? parts.slice(0, -1).join('.data') : '';
      }
      var itemDataPath = getNearestParentDataPath(dataPath);
      var dataPrefix = itemDataPath ? itemDataPath + '.data' : 'data';
      // api.getValue(dataPrefix + '.fieldName') reads list item field
      // api.getValue('data.strength') reads owning character field
      ```
  - Fix: replace hardcoded `effAttr = 3` in `gear-main.html` with:
    ```js
    var linkedAttr = api.getValue(dataPrefix + '.linkedAttr') || 'strength';
    var dmgKey = 'dmg' + linkedAttr.charAt(0).toUpperCase() + linkedAttr.slice(1);
    var attrVal = parseInt(api.getValue('data.' + linkedAttr) || '0', 10);
    var dmgVal  = parseInt(api.getValue('data.' + dmgKey) || '0', 10);
    var effAttr = Math.max(0, attrVal - dmgVal);
    ```
  - Also add the confirmed pattern to CLAUDE.md under the list item / api section
  - ES5 only. No other changes.
  - Push: `git add gear-main.html CLAUDE.md && git commit -m "Tranche 0: fix hardcoded effAttr using confirmed Sean API pattern" && git push`

---

## Tranche 6 — Untracked SRD Mechanics

### Phase 1 — Healing + Gear Repair — HIGH/MEDIUM PRIORITY

- [x] **Healing the broken** — HIGH
  - Add to `common.js`:
    - `rollHealBroken()` — Healing skill roll; successes restore Health to broken target via `isHeal` flag in `yze-pool.js`
    - `rollDeathSave()` — Stamina roll, cannot push, lethal crit timer
    - `selfHealShift()` — restores 1 Health or Resolve after a shift of rest (not broken, not starving)
  - Update `yze-pool.js`: if `meta.isHeal` and successes > 0 and target selected, apply successes as Health recovery via `api.setValuesOnRecord`
  - Add Recovery card to `character-combat.html` with 3 buttons: Heal Broken Ally (green), Death Save (red), Self-Heal 1/shift (default outline)
  - ES5 only.

- [x] **Gear repair** — MEDIUM
  - Add `rollGearRepair(itemIdx)` to `common.js` — Crafting roll; successes restore gear bonus capped at `maxBonus`
  - Add Repair button to `gear-entry.html` — hidden when `bonus === maxBonus`
  - ES5 only.

- Push: `git add common.js character-combat.html gear-entry.html yze-pool.js && git commit -m "Tranche 6 Phase 1: healing the broken + gear repair" && git push`

---

### Phase 2 — Encumbrance + Consumables — MEDIUM PRIORITY

- [x] **Encumbrance / carry limit**
  - Add to `common.js`:
    - `yzeCarryLimit()` — returns `2 * strength`
    - `yzeCurrentLoad()` — sums `weight` of all items in `data.gearList` (tiny = 0)
    - `yzeEncumbranceCheck()` — sets `data.overEncumbered`, applies -2 to physical rolls when over limit
  - Add to `character-gear.html`: encumbrance display card showing Carry N/M, Backpack checkbox (`hasBackpack` field, doubles limit, -2 Mobility), over-limit warning badge
  - Wire `onrecordchanged` on gear list to call `yzeEncumbranceCheck()`
  - ES5 only.

- [x] **Consumables & supply rolls**
  - Add `rollSupply(supplyField, label)` to `common.js` — rolls D6; result 1-2 decrements supply by 1
  - Add 4-slot consumables card to `character-notes.html` with name + supply rating + Roll Supply button per slot
  - Fields: `supply1Name/Rating`, `supply2Name/Rating`, `supply3Name/Rating`, `supply4Name/Rating`
  - ES5 only.

- Push: `git add common.js character-gear.html character-notes.html && git commit -m "Tranche 6 Phase 2: encumbrance + consumables" && git push`

---

### Phase 3 — Action Economy + Extra Combat Actions — MEDIUM PRIORITY

- [x] **Action economy tracking**
  - Add Turn Tracker card to `character-combat.html`:
    - Checkboxes: `usedSlowAction`, `usedFast1`, `usedFast2`
    - "New Turn" button resets all three to false
    - Static reference: "1 Slow OR 2 Fast per turn. Free actions: draw weapon, talk, drop item."
  - ES5 only.

- [x] **Extra combat actions** (reference + roll buttons)
  - Add collapsible Special Actions section to `character-combat.html` (`toggleSpecialActions()`, state in `data.specialActionsOpen`)
  - 7 action cards with exact SRD text:
    1. Sneak Attack — reference only
    2. Grapple — Roll Melee Combat button
    3. Block — Roll Melee Combat button (costs fast action)
    4. Full Auto — reference + normal attack roll
    5. Diving Blow — Roll Melee Combat + note +1 damage, fall prone
    6. Overwatch — reference only (declared action)
    7. Surprise/Ambush — reference only
  - ES5 only.

- Push: `git add character-combat.html && git commit -m "Tranche 6 Phase 3: action economy + extra combat actions" && git push`

---

### Phase 4 — Roadmap Close-out

- [ ] **Update SRD-ROADMAP.md** — mark all Tranche 6 items as [x] with implementation notes
- Push: `git add SRD-ROADMAP.md && git commit -m "Tranche 6 complete — roadmap updated" && git push`

---

### Deferred

- [-] **Full two-token opposed rolls** — block as reaction, live Stealth vs Observation
  - Requires Sean confirmation on cross-record real-time orchestration API
  - Do not implement until confirmed

---

## Tranche 7 — Travel System (SRD ch.6)

Grid support confirmed available in Realm VTT (Sean, 2026-05-29):
- Hex (flat-topped + pointy-topped), square, isometric all supported
- Configure via Scene Settings: units + amount per square
- 1 hex = 10km for overworld travel maps
- Range bands remain GM-judgment — handled via existing Attack Modifiers panel

- [ ] **Update SRD-ROADMAP.md Tranche 7 header** — remove "FUTURE/blocked", note grids unblocked
  - Push: `git add SRD-ROADMAP.md && git commit -m "Tranche 7: unblocked — grid support confirmed in Realm VTT" && git push`

- [ ] **Travel maps** — hex grid movement, terrain speed modifiers (Road x1, Open x1, Woods x1/2, Hills x1/2, Mountains x1/3, Lake/River x1**, Swamp x1/4, Ruins x1/2)
- [ ] **Travel tasks** — Marching, Driving, Foraging, Hunting, Keeping Watch, Gathering, Fishing, Making Camp, Sleeping
- [ ] **Journey rolls** — Foraging (Survival), Hunting (Survival/Marksmanship), Keeping Watch (Scouting), Fishing (Survival)
- [ ] **Encounter distance by terrain type** — SRD p.41 table
- [ ] **River/lake travel** — boat, raft, swimming rules

---

## Backlog

- [ ] **Grimoire / Safe Casting / Chance Casting** — LOW
  - Optional advanced spellcasting rules from SRD
  - Add if players are using magic heavily; skip if magic is rare in campaign

- [ ] **Auto-sequence cover then armor** — LOW
  - Currently two separate manual rolls in correct order
  - Chaining them is a nicety, not a bug

- [ ] **Sean QA pass** — HIGH
  - Sean offered a QA pass before publish
  - Take him up on it before making the ruleset publicly available in Realm VTT

- [ ] **Tag v1.0 release on GitHub** — MEDIUM
  - Once testing and Tranche 6 are done
  - https://github.com/Aniond/YZE → Releases → Draft new release → Tag v1.0

---

## Recommended Order

1. Tranche 0 bug fix (small, high impact)
2. Tranche 6 Phase 1 (healing + gear repair)
3. Tranche 6 Phase 2 (encumbrance + consumables)
4. Tranche 6 Phase 3 (action economy + combat actions)
5. Tranche 6 Phase 4 (roadmap update)
6. Tranche 7 roadmap header update
7. Sean QA pass
8. Tag v1.0
9. Tranche 7 travel system
10. Backlog items as needed
