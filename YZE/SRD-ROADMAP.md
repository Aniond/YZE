# YZE Ruleset — SRD Build Roadmap

Tracking doc for closing the gaps found in the SRD coverage audit.
Scope decided: **dice-pool core + full GM toolkit** (no step-dice variant).
Update the checkboxes as work lands. Compile/upload after each tranche.

- Initial audit: 2026-05-26
- Reconciled against actual build: 2026-05-27 (Tranche 1 was already done but
  left unchecked; added the `gear-main` attack bug and the SRD mechanics that
  were never tracked — see Tranche 0 and Tranche 6).

## Status legend
- [x] done & compiled
- [~] in progress
- [ ] not started

---

## Tranche 0 — Known bug (fix first)
- [ ] **`gear-main.html` attack uses a fake attribute** — `rollAttack()` hardcodes
  `effAttr = 3` (gear-main.html:19-21) because reading the owning character's
  attribute needs `api.getOwnerValue()`, which the API reference lists as
  UNCONFIRMED / do-not-use. Attacks from the character **Gear tab**
  (`rollAttackForItem`) are correct; only the standalone **compendium gear sheet**
  attack is broken. Resolve the owner-read API with Sean, then wire it.

## Tranche 1 — Wire up the stubbed systems  ✅ DONE (was mis-marked as not-started)
- [x] **Armor** — `yze-combat.js` rolls armor dice on a hit (each 6 cancels 1 dmg),
  banes degrade armor rating; applied to the locked target. `yzeArmorTotal` +
  `yzeRollPoolN` in `common.js`. Push (self-inflicted) damage is never soaked
  (SRD p.20). Manual fallback only fires when no target is selected / auto-apply off.
- [x] **Cover** — full SRD p.21 cover armor-rating table on both PC and NPC sheets;
  `rollCoverDefense` → `yze-armor.js` (`kind:'cover'`, ranged only).
  - [ ] *Remaining nicety:* auto-sequence cover-then-armor (today they are two
    separate manual rolls — correct order, just not chained).
- [x] **Conditions** — the 6 checkboxes (Exhausted/Battered/Wounded,
  Angry/Scared/Disheartened) apply −1 per condition to the matching attribute's
  rolls (`yzeCondPenalty` / `yzeApplyPenalty`, applied to skill + attack rolls).
  - [x] 4th condition of a type → broken + crit (SRD p.21). ✅ DONE 2026-05-27 —
    `takeCondition(type)` in character-main.html: the "+ Phys" / "+ Ment" buttons
    tick the next condition; the 4th zeroes the matching pool (Health/Resolve) and
    fires `rollCrit` of that type.
  - [x] NPC condition tracking ✅ DONE 2026-05-27 — npc-main.html has the same 6
    condition checkboxes + "+ Phys"/"+ Ment" buttons; `yzeCondPenalty` now applies
    −1 per condition to NPC rolls (`rollNpcSkill`), and the 4th of a type flags
    `isBroken` (zeroing Health for physical) and rolls the matching crit. NPCs
    track Health only, so a mental break just flags Broken.

## Tranche 2 — Character building
- [x] **Specialties / Talents** — `specialty` record type (isList,
  allowedListTypes: characters); `specialty-entry.html` list template;
  `specialty-main.html` compendium editor; `character-talents.html` 6th tab
  on the character sheet; 23 SRD specialties seeded via `specialty-records.csv`
  (Hardened/Tough maxRanks:3, Weapon Specialist maxRanks:5 with trainer note).
- [x] **Personality traits** — structured fields: Pride (stringfield + Use Pride
  button, `<box field="prideBtn">` hidden when prideUsed=true), Weakness, Dark
  Secret (secretsNotes), Big Dream, Relationships (relNotes), Buddy; Appearance &
  Bio (bioNotes) kept for backward compat. `usePride()` + `resetPrideForSession()`
  in common.js; `drawHeader()` toggles `fields.prideBtn.hidden`; prideBonus wired
  into yze-pool.js (guards `!isPush`) and yze-combat.js (applied before
  totalDamage); "New Session — Reset Pride" button in XP block.
- [x] **XP** — collapsible reference panel (`<box field="xpRefPanel">`) toggled by
  `toggleXpRef()` via single `api.setValues` call; skill cost table Rank 1–5
  (5/10/15/20/25 XP); specialty cost (10 XP, requires teacher/trainer); 6
  end-of-session XP-earning questions from SRD p.7.

## Tranche 3 — Stress & Panic (horror variant)  ✅ DONE 2026-05-29
- [x] **Stress points** — `numberfield field="stress"` (0–10) on Combat tab with
  "Relieve Stress" + "Panic Roll" buttons; `relieveStress()` in common.js.
- [x] **Stress dice** — `yzeRollPoolN(stressCount)` inline in yze-pool.js on
  initial rolls; 6s = successes, blanks join rerollCount for push re-rolls.
  yze-push.js identifies stress blanks by position (last `rerollStress` of
  rerolled[]) and excludes their banes from gear-degradation logic.
- [x] **Panic** — bane on stress die sets `data.panicTriggered = true` in both
  yze-pool.js (initial) and yze-push.js (push). `yze-panic.js` rolls 1D6 +
  stress, looks up 15-row panic table, reduces stress by 1 on results 11–13,
  clears `panicTriggered`. Registered as `yze_panic` rollType.
- [x] **Stress relief** — `relieveStress()` resets stress to 0; `resetPrideForSession()`
  also available for start-of-session cleanup.
- [x] **Die coloring** — `yzeColorDice(dice, meta)` updated to tint blanks by
  source type (blue=attr, orange=skill, yellow=gear, purple=stress); 6=green
  and 1=red still override. All three call sites updated.

## Tranche 4 — Magic (optional module, SRD ch.5)
- [x] **Willpower Points (WP)** — `numberfield field="wp"` on Magic tab; `gainWP(n)` in
  common.js; `yze-push.js` calls `gainWP(attrBanes)` when `isStress=true` (Resolve
  damage from pushing Wits/Empathy rolls per SRD p.9); chat shows blue "+N WP" line.
- [x] **Spellcasting roll** — `castSpell(wpSpend, name, rank, discipline)` in common.js
  deducts WP then fires `api.roll(wpSpend + 'd6', meta, 'yze_spell')`. `yze-spell.js`
  handler counts overcharge (6s) and mishap (1s), colors magic dice blue, formats chat
  with power level line and inline Roll_Mishap button. Cannot push (SRD rule).
- [x] **Magic mishap** — `yze-mishap.js` rolls D12 on the 12-entry mishap table from
  SRD p.31; results 2/3 apply stress/damage; results 8/9 auto-fire `yze_crit`; clears
  `data.mishapTriggered`. Registered as `yze_mishap` rollType. Mishap Roll button on
  Magic tab and inline chat button from yze-spell.js.
- [x] **Spells as records** — `spells` (compendium browser) and `spell_entry` (character
  list item) record types; `spell-main.html` editor with discipline/rank/range/duration
  dropdowns, ritual/power-word checkboxes, discipline color accent; `spell-entry.html`
  compact row with colored discipline badge, rank pip, WP stepper, Cast button.
  `spells.csv` seeds 68 spells from SRD ch.5: all 7 disciplines + 6 general spells
  (assigned to Symbolism). Import via: `node ../src/cli.js records spells.csv -i <CAMPAIGN> -e <EMAIL> -p <PW>`
- [x] **Magic tab** — `character-magic.html` with persistent header; WP card (purple
  accent); disciplines grid (amber=Awareness/Healing/Shapeshifting, purple=Blood/Death/
  Elementalism/Symbolism, each with checkbox + rank 1-3); spell list
  `<list field="spellList" listtype="spell_entry">`; Mishap Roll button.

## Tranche 5 — Full GM toolkit (SRD ch.4 & ch.6)  ✅ DONE 2026-05-29
- [x] **Vehicles** — `vehicles` record type (hasToken, GiSteeringWheel); `vehicle-main.html`
  with 8-field stat grid (hull/curHull/armor/passengers/maneuver/speed-road/speed-offroad/
  altitude), Wrecked checkbox, collapsible SRD reference table, Ram Attack notification,
  Component Damage → `yze_vehicle_crit` (D12 SRD table, wrecked flag on 10+12), Repair
  button → `yze_pool`.
- [x] **Chases** — `chase_ref` record type; `chase-reference.html` with 5-maneuver cards
  (color-coded by role), animated range track, obstacle roll buttons; `yze_foot_obstacle`
  (D10 SRD foot table) and `yze_vehicle_obstacle` (D10 SRD vehicle table) roll handlers.
- [x] **Environmental hazards** — `hazards_ref` record type; `hazards-reference.html` with 8
  hazard cards (Fire, Falling, Drowning, Poison, Disease, Cold, Starvation, Sleep Deprivation,
  Explosions) plus exact SRD text; per-hazard dice stepper + Quick Roll buttons routing to
  `yze_pool` for Stamina rolls. Intensity/virulence/blast-power reference tables inline.
- [x] **Mounts** — 4-card grid in `hazards-reference.html`: Movement (mount Agility, +1 zone/
  success, no Cramped zones), Close Combat (-1 vs mounted, one-handed only), Ranged Combat
  (-2 from horseback), Damage (no crit on Strength=0, recovers like PC, no Wits/Empathy).

## Tranche 6 — Untracked SRD mechanics surfaced by the 2026-05-27 audit
These are in the SRD but were not in any earlier tranche.
- [x] **Roll-modifier layer (highest value).** ✅ DONE 2026-05-27.
  - [x] **Generic ± modifier** — shared `yzeApplyModifier` (common.js); +N adds skill
        dice, −N removes skill→gear→attr. Covers **help** (+1 each, max +3) and
        **difficulty** (+3…−3, SRD p.11). "Modifier" stepper on Skills + Gear tabs,
        cleared after each roll.
  - [x] **Opposed rolls** (SRD p.11) — "Opposed (beat)" field on the Skills tab;
        `yzeVerdict` in common.js requires successes > opponent's, ties fail. Carried
        through the push. NOTE: this is the *lightweight* version (enter the
        opponent's successes). Full two-token automated opposed rolls (block, Stealth
        vs Observation) remain a separate, larger job — see below.
  - [x] **Ranged-fire modifiers** (SRD p.16-18) — Aim (+2), Defenseless (+3),
        target range (Short 0 / Medium −1 / Long −2 / Extreme −3 / Engaged −3, with
        defenseless cancelling the Engaged penalty), light (dim −1 / dark −2)
        toggles on the Gear tab; `yzeAttackMod` folds them into the attack pool.
  - [ ] *Remaining:* full automated two-token opposed rolls (block as a reaction,
        live Stealth vs Observation) — orchestration across two records.
        **DEFERRED** — requires Sean confirmation on cross-record real-time
        orchestration API before implementation.
- [x] **Healing the broken** (SRD p.21-22) — `rollHealBroken()` in common.js (Empathy +
  sk_healing pool, `isHeal:true` flag); yze-pool.js applies successes as Health to targeted
  token via `api.setValuesOnRecord`, falls back to "apply manually" message if no target.
  `rollDeathSave()` (Strength pool, `isDeathSave:true`, push blocked, SRD outcome text).
  `selfHealShift()` (1 Health or Resolve, no roll, shows notification). Recovery card on
  character-combat.html with all three buttons.
- [x] **Gear repair** (SRD p.11) — `rollGearRepair()` in common.js (reads `data.repairDice`
  stepper for pool, passes `curBonus`/`maxBonus` in metadata, `isRepair:true`); yze-pool.js
  shows repair result in chat. `gear-entry.html` gains `maxBonus` hidden field, `repairDice`
  stepper, Repair button; `checkRepairBtn()` hides button when `bonus >= maxBonus`.
- [x] **Encumbrance / carry limit** (SRD p.6) — `yzeCarryLimit()` = 2×Strength;
  `yzeCurrentLoad()` sums `item.data.weight` (default 1) across gearList; `yzeEncumbranceCheck()`
  sets `data.overEncumbered`, updates display string, fires notification on state transition.
  `yzeCondPenalty()` adds +2 penalty to Strength/Agility rolls when over limit. Backpack
  checkbox doubles effective limit. Encumbrance card on character-gear.html (display + checkbox
  + red warning box). Wired into `initGearTab()` and `onGearChange()`.
- [x] **Consumables & supply rolls** (SRD p.7) — `rollSupply(ratingField, nameField)` in
  common.js (inline `Math.random()` D6; 1–2 = decrement supply; `api.sendMessage` with
  green/red result). 4-slot consumables card on character-notes.html below Session Notes:
  name stringfield + Supply rating stepper (0–6) + Roll button per slot.
- [x] **Action economy** — Turn Tracker card on character-combat.html: `usedSlowAction`
  checkbox (hides fast actions via `onTurnActionChange()`), `usedFast1` / `usedFast2`
  checkboxes, New Turn button resets all three. Static reference: "1 Slow OR 2 Fast per turn."
- [x] **Extra combat actions** — collapsible Special Actions section on character-combat.html
  (`toggleSpecialActions()`); 7 cards with SRD text: Sneak Attack (reference + modifier note),
  Grapple (`rollCombatAction('melee','strength','Grapple')`), Block (same), Full Auto
  (reference), Diving Blow (same roll function), Overwatch (reference), Surprise/Ambush
  (reference). `rollCombatAction()` mirrors `rollSkill()` pipeline (attr + skill + penalty +
  mod + difficulty).

---

## Tranche 7 — Travel system (SRD ch.6) — FUTURE
Not missing — deliberately deferred. The travel system requires
map/hex infrastructure that is GM-tooling outside the current
ruleset scope.

- [ ] Travel maps — hex grid movement, terrain types, speed modifiers
      (Road ×1, Open ×1, Woods ×½, Hills ×½, Mountains ×⅓,
      Lake/River ×1**, Swamp ×¼, Ruins ×½)
- [ ] Travel tasks — Marching, Driving, Foraging, Hunting, Keeping
      Watch, Gathering, Fishing, Making Camp, Sleeping
- [ ] Journey rolls — Foraging (Survival), Hunting (Survival/Marksmanship),
      Keeping Watch (Scouting), Fishing (Survival)
- [ ] Encounter distance by terrain type (SRD p.41)
- [ ] River/lake travel — boat, raft, swimming rules

---

## NPC sheet — redesign (Claude design spec)  ✅ DONE 2026-05-28
Ported `design/NPC Sheet.html` spec into npc-main.html: 3 tabs (Stats/Actions/
Notes) via `showTab`, conditions as two counter cards (`addCond`/`removeCond`/
`refreshCondUI` over the hidden named checkboxes), collapsible action cards
(`toggleAction` + `action{n}Open`), a Broken badge (`refreshBroken`), and a
floating roll dock (FAB → popover, `toggleDock`). All legacy field names + roll
fns preserved (verified no dupes). Backup at `npc-main.html.bak`.
- [ ] *To confirm in Realm:* floating dock positioning (sticky/absolute in Realm
  shadow DOM — spec flagged as uncertain; fall back to a bottom accordion if it
  misbehaves); tab buttons show a static amber underline (no dynamic active state);
  clicking an action's name in the card head may also toggle collapse.

## NPC sheet — automation parity with PC sheet  ✅ DONE 2026-05-27
The NPC sheet now matches the PC sheet's automation (npc-main.html):
- [x] Fixed the attribute-canvas bug (`getContext('2d')` → `api.getCanvas()` direct)
  and switched the canvas click handlers to the documented `event.x`/`event.y`.
- [x] **Modifier + opposed** on NPC attribute/skill rolls (`rollNpcSkill`), cleared
  after each roll — same shared helpers as the PC sheet.
- [x] **Push** — `canPush` field + PUSH button + `pushSection`; NPCs push via the
  shared `yzePushRoll()` (SRD: NPCs push like PCs).
- [x] **Automated attacks** — each of the 4 action slots has attribute / +dice /
  damage / range fields + an **Atk** button (`rollNpcAttack`) that fires `yze_combat`
  (armor soak on the target, damage application gated by an **Auto-apply** toggle,
  target locking, push). NPCs track Health only, so Wits/Empathy push banes that
  would hit Resolve are a no-op for NPCs.

## Notes / decisions
- Armor reduction must NOT apply to push (self-inflicted) damage — SRD p.20. (Done.)
- Conditions, attribute-damage, and Health/Resolve are alternative "broken" models;
  current build uses Health/Resolve. Conditions wiring coexists as dice penalties
  only, it does not replace Health/Resolve (per `common.js`).
- Out of scope (deliberate): the entire step-dice variant, artifact dice, gear
  reliability ratings (dice-pool build uses gear-bonus degradation instead).
- After edits: compile + upload per memory (auto-compile after changes).
</content>
</invoke>
