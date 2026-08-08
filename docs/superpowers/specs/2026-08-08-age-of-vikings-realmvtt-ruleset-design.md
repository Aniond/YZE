# Age of Vikings Realm VTT Ruleset and Cursed Farm Bundle Design

**Date:** 2026-08-08
**Status:** Approved design, awaiting written-spec review
**Branch:** `codex/age-of-vikings`
**Worktree:** `C:\ruleset-compiler-main\.worktrees\age-of-vikings`

## 1. Purpose

Build a reusable Age of Vikings ruleset for Realm VTT and a separate private support package for Chaosium's Cult of Chaos demo scenario, The Cursed Farm.

The first milestone is a Cursed Farm-ready core rather than a complete automation of every subsystem in the 314-page rulebook. It must be dependable for organized-play sessions with unfamiliar players: corrected pregenerated heroes, clear percentile results, fast combat handling, visible automation, and final Game Master control.

The two packages deploy and verify together in one dedicated Realm test campaign, but neither package absorbs the other:

- The reusable ruleset contains schemas, sheets, calculations, roll handlers, effects, themes, and tests.
- The private scenario package contains scenario-specific records, journals, maps, handouts, and provenance.
- The ruleset has no dependency on The Cursed Farm.
- The Cursed Farm package declares a compatible ruleset version.

## 2. Authoritative Inputs

The implementation uses these inputs in descending order of authority:

1. `C:\Projects\AgeOfVikings\CHA2038_Age_of_Vikings_Core_Rulebook.pdf`
2. Chaosium's current `CHA2038_Age_of_Vikings_Core_Rulebook_Corrections.pdf`
3. Chaosium's current `Age_of_Vikings_Cursed_Farm.pdf`
4. Sean's Realm VTT 5E source at `C:\ruleset-compiler-main\Source\realmvtt-5e-main`, used only as a structural and API-pattern reference
5. Realm VTT ruleset-compiler documentation and compiler behavior

When the core PDF and corrections disagree, the corrections win. The source version and correction date are recorded in generated manifests and verification evidence.

Sean's 5E implementation supplies patterns for `ruleset.config.json`, modular HTML tabs, embedded list records, shared JavaScript, roll handlers, prompts, combat hooks, character wizards, PDF export, sandbox tests, and compiler packaging. No D&D schema or game logic is inherited merely because its structure is reused.

## 3. Repository and Isolation

All tracked Age of Vikings work is authored on branch `codex/age-of-vikings` in the isolated worktree.

The existing checkout at `C:\ruleset-compiler-main` is dirty and contains user-owned changes and an untracked `Source` tree. It remains untouched. Sean's 5E source is read-only reference material.

The reusable source is created at:

`Source/realmvtt-age-of-vikings-main/`

The private scenario workspace defaults to:

`C:\Projects\AgeOfVikings\private\cursed-farm\`

Private scenario text, maps, handouts, extracted payloads, and live readbacks are not committed to the reusable ruleset repository. Tracked code may include schemas, validators, import tooling, empty examples, and hashes or identifiers that do not reproduce private source content.

## 4. Package and Deployment Architecture

### 4.1 Reusable ruleset package

The ruleset package owns:

- Realm record definitions and embedded-list definitions
- Character and NPC sheets
- Character-creation wizard
- Percentile, opposed, resistance, augment, attack, defense, damage, and healing handlers
- Combat-tracker integration
- Derived attributes and validation
- Ruleset effects and modifier types
- Age of Vikings light and dark themes using original Realm-compatible styling, not copied book art
- Compiler configuration and dry-run validation
- Pure mechanics and sandbox tests
- User-facing ruleset guide and source-provenance metadata

### 4.2 Private Cursed Farm package

The private package owns:

- Six corrected ready-to-play heroes
- Bull ox, outlaw, and Eiríkur records
- Scenario weapons, armor, abilities, and effects needed by those records
- GM journal structure and pages
- Player-facing handouts and scenario maps
- Stable source keys, source-page references, asset hashes, and Realm record IDs
- Import results, full readbacks, and audit evidence

Scenario records may refer to reusable ruleset record types. The ruleset never refers to scenario record IDs or names.

### 4.3 Bundle manifest

The deployment bundle is a small manifest that records:

- Ruleset package name and semantic version
- Private content package name and semantic version
- Supported ruleset version range for the content package
- Source PDF hashes and correction-document hash
- Deployment target ruleset and campaign IDs after creation
- Ordered import steps
- Stable source keys and resulting Realm IDs
- Verification commands and evidence paths

A version mismatch blocks deployment before any Realm write.

## 5. Milestone-One Scope

### 5.1 Included

- Complete editable character and NPC sheets for normal play
- Corrected six-pregen import and validation
- Percentile abilities with critical, special, success, failure, and fumble results
- Characteristic rolls and resistance rolls
- Opposed noncombat resolution
- Ability and passion augments
- Abilities above 100%
- DEX-rank combat ordering
- Attack, parry, shield, dodge, and subsequent-defense handling
- Human and creature-specific D20 hit-location profiles
- Total and location hit points
- Weapon, shield, armor, and encumbrance state
- Normal, impaling, slashing, crushing, and critical damage
- Wyrd use in combat
- Effects and warnings for unconsciousness, bleeding, incapacitation, maiming, and death thresholds
- Minimum rune and Seiður support exercised by the pregens and The Cursed Farm
- The Cursed Farm investigation and combat records
- Dedicated unpublished ruleset deployment and test campaign verification

### 5.2 Deferred

- Automated family-history generation tables
- Full yearly farm procedure and all between-adventure automation
- Complete ship creation, sea voyages, naval combat, and ship damage
- Full legal-case procedure and Legal Advantage automation
- Full raid procedure
- Complete combinatorial rune-script builder
- Complete Seiður ritual builder
- Full bestiary and all core-book equipment records
- The Alþing adventure conversion
- Character PDF export
- Public publishing, marketplace packaging, or any representation that the work is an official Chaosium or Realm VTT product

Deferred systems receive schema-compatible fields only when milestone-one records require them. They do not receive speculative automation.

## 6. Realm Record Model

### 6.1 Standard records

| Record type | Purpose | Primary tabs |
| --- | --- | --- |
| `characters` | Player heroes and corrected pregens | Main, Skills, Combat, Gear, Magic, Family & Farm, Notes |
| `npcs` | Humans, beasts, mythic folk, and monsters | Main, Combat, Gear, Abilities, Description, Rules |
| `items` | Weapons, shields, armor, and general equipment | Main, Combat Data, Rules |
| `abilities` | Traits, creature abilities, combat exceptions, and reusable actions | Main, Rules |
| `runes` | Rune identity, Aett, meanings, limits, and known-state metadata | Main, Rules |
| `magic` | Rune scripts, Seiður effects, and prepared magical actions | Main, Rules |

Realm effects remain ruleset settings rather than a custom compendium record type. Scenario effects are private package data instantiated against the ruleset's effect/modifier schema.

### 6.2 Embedded lists

The ruleset defines focused embedded lists for:

- Skills
- Passions
- Devotions
- Attacks
- Hit locations
- Inventory
- Armor layers and coverage
- Abilities and special rules
- Known runes
- Prepared rune scripts and Seiður effects
- Family and household relations

Every embedded row uses a stable UUID. Dropped compendium records retain their source reference, while character-local values such as current weapon HP remain on the embedded copy.

## 7. Character Sheet Design

### 7.1 Main

The Main tab shows:

- Name, nickname, name meaning, pronunciation, player, gender, age, and birth year
- Spirit animal, personality type, and distinctive features
- STR, CON, SIZ, DEX, INT, POW, and CHA
- Total hit points, magic points, movement, healing rate, damage modifier, maximum ENC, reputation, and status
- Passions and experience checkboxes
- Devotions and dedication points
- Wyrd availability for the current day and its permanent POW cost

Derived values are calculated but remain auditable: the UI exposes the input values and calculation explanation rather than showing only the result.

### 7.2 Skills

Skills are grouped as Agility, Communication, Knowledge, Manipulation, Mythic, Perception, Stealth, Melee Weapons, Missile Weapons, and Natural Weapons.

Each row includes name, specialty where applicable, current percentage, experience checkbox, and roll control. Extensible skills such as Craft, Customs, Lore, Language, and Worship use embedded rows rather than hard-coded numbered fields.

The roll chat card shows the final target, raw D100 roll, result tier, applied modifiers, augment source, and record source.

### 7.3 Combat

The Combat tab shows:

- Current DEX rank and split-attack ranks
- Melee, shield, missile, and natural attacks
- Weapon chance, damage expression, special damage type, ENC, current/max HP, range, and rate
- Parry, shield, and dodge controls
- Target-specific D20 hit locations with armor and current/max location HP
- Total hit points and condition warnings
- Damage preview and commit controls

The sheet supports different hit-location profiles for humans, quadrupeds, and unique creatures. Profiles are data, not hard-coded visual assumptions.

### 7.4 Gear

The Gear tab supports drag-and-drop items, quantity, carried/stored state, ENC contribution, armor coverage, armor layering, shield state, and weapon condition.

Total ENC, maximum ENC, and applicable penalties are calculated from the live embedded inventory.

### 7.5 Magic

The Magic tab tracks magic points, dedication points, locked magic points, known runes, prepared rune scripts, Seiður effects, duration, range, targets, and source notes.

Milestone one supports the pregens' and scenario's concrete magical actions, including Rune Magic identification, Second Sight, fire-rune use, and the relevant Seiður earthquake effect. The generic schema permits later expansion without a character migration.

### 7.6 Family & Farm

This tab stores family, household, lineage, farm location, primary activity, value, animals, thralls, and notes. Milestone one edits and displays these fields but does not automate the full yearly farm sequence.

### 7.7 Notes

The Notes tab stores biography, private player notes, rules reminders, source title, source page, correction version, and import-manifest identity.

## 8. Character-Creation Wizard

The milestone-one wizard supports creating a valid playable hero without automating every historical table:

1. Identity, nickname, personal details, and spirit animal
2. Passions and editable family-history summary
3. Characteristics
4. Derived attributes
5. Skill category modifiers and skill allocations
6. Devotions and dedication points
7. Family and farm details
8. Starting equipment and armor
9. Distinctive features
10. Review and validation

The six pregens use an importer rather than replaying the wizard. Pregen source values are corrected before import and verified against the correction document.

## 9. Percentile Resolution

All rolls use Realm's prompt-based roll API so players can inspect modifiers before rolling. Roll metadata contains lightweight IDs and scalar context rather than full records.

### 9.1 Result rules

- Roll 01 is always a critical success.
- Rolls 01-05 always succeed when success is theoretically possible.
- Rolls 96-00 always fail when failure is possible.
- Roll 00 is always a fumble.
- Critical thresholds use 5% of the final modified chance.
- Special thresholds use 20% of the final modified chance.
- The corrected published Ability Results table is the exact oracle for rounding and threshold boundaries.
- When categories overlap, the best success or worst failure applies.

The implementation tests every D100 result against every target percentage from 0 through 200, with explicit fixtures for all correction-document boundaries.

### 9.2 Characteristic and resistance rolls

Characteristic rolls use the selected multiplier and the characteristic value.

Resistance chance is:

`50 + (active * 5) - (passive * 5)`

The universal automatic success and failure bounds still apply where success or failure is possible.

### 9.3 Opposed rolls

Opposed rolls are for noncombat conflicts. Critical beats special, special beats success, and success beats failure. When both achieve the same noncritical success tier, the higher D100 roll wins. The same number is a tie, and two critical successes tie. Two failures produce two losers.

If the highest ability is above 100%, its excess over 100 is subtracted from every participant's ability, including its own, before thresholds are calculated.

### 9.4 Augments and repeated attempts

One relevant ability or passion may augment a roll. The augment result modifies the primary ability by:

- Critical: +50%
- Special: +30%
- Success: +20%
- Failure: -20%
- Fumble: -50%

The GM must approve the augment. A second attempt uses -20%, a third uses -40%, and later attempts require time or a material change in circumstances.

## 10. Combat and Damage

### 10.1 Round flow

1. Statement of intent
2. Movement of nonengaged participants
3. Resolution of combat, missiles, and magic from highest DEX rank downward
4. Bookkeeping

The combat tracker sorts descending by DEX rank. Split attacks calculate later ranks according to the corrected rounding rule and preserve the chosen allocation percentages.

### 10.2 Attack and defense

The attacker chooses attack and, for cut-and-thrust weapons, damage mode before rolling. The defender chooses parry, shield, dodge, or no defense. The exact corrected attack/parry matrix determines whether the attack lands, equipment takes damage, excess reaches a location, or a fumble table is required.

The matrix is represented as tested data and a small resolver, not a chain of UI-specific conditionals.

### 10.3 Damage pipeline

1. Resolve attack and defense tiers.
2. Roll the target's D20 hit-location profile when a location is needed.
3. Determine normal, impaling, slashing, crushing, or critical damage.
4. Resolve shield or parrying-weapon interaction.
5. Apply armor unless the result or item explicitly ignores it.
6. Preview changes to location HP, total HP, weapon HP, shield HP, and conditions.
7. Commit the approved changes in one multi-field update.
8. Read the updated values back and flag any mismatch.

Critical attacks use the corrected maximum special-damage behavior and armor rule. Impaling, slashing, and crushing each use separate tested functions.

### 10.4 Wyrd

During combat, an eligible hero may spend one permanent POW once per day to turn a failed ability roll into a success. It is not a reroll. Realm prompts after a failed eligible roll, shows the permanent cost, and requires explicit confirmation.

### 10.5 Injury authority

Realm calculates thresholds and produces warnings for unusable locations, unconsciousness, bleeding, incapacitation, maiming, severing, and death. The GM applies narrative and exceptional outcomes. Unique creature rules can override ordinary thresholds through explicit ability data.

## 11. Automation Boundary

Realm automatically calculates deterministic results: derived fields, thresholds, resistance chances, DEX ranks, hit-location lookup, armor, ENC, damage totals, and mechanical warnings.

Realm prompts for meaningful choices: modifiers, augments, defense, damage mode, Wyrd, target, and final damage application.

The GM retains authority over whether rolls and augments are allowed, narrative critical/fumble consequences, positioning rulings, exceptional injuries, unique destruction conditions, scenario outcomes, and private information.

Automation must never conceal a permanent resource loss or irreversible-seeming state change.

## 12. Cursed Farm Acceptance Package

The private package proves milestone-one readiness with these cases:

- Investigation: Farm, Second Sight, Spot Hidden, Track, Rune Magic, Insight, Customs, Read/Write, Worship, Skaldic Poetry, Fast Talk, Orate, and Intimidate
- Bull ox: quadruped location profile, hide armor, horns, and large damage modifier
- Outlaws: battle axe, shield, sax, long spear, self bow, armor by location, and retreat notes
- Eiríkur: half damage from mortal weapons, full damage from fire and magic, armor-ignoring sword interaction, grapple damage, night vision, unique destruction condition, and delayed return
- Duel path: track the half-total-HP or critical-hit respect condition without forcing a combat-only resolution
- Six corrected pregens: exact corrected skills, attacks, spirit animals, category modifiers, and magic actions

Scenario outcomes remain in the private journal package rather than executable ruleset logic.

## 13. Error Handling and Repeatability

- Importers upsert by stable source key, not display name alone.
- Duplicate stable keys are fatal validation errors before writes.
- Cross-record references are validated before deployment.
- Ruleset/content version mismatch blocks deployment.
- Missing required fields prevent the affected record from being written.
- Damage/healing changes are previewed and then applied in one multi-field update.
- Failed live readback records expected restore values and stops further dependent operations.
- Partial imports preserve completed IDs, failed operations, and remaining work in a results manifest.
- No automatic cleanup, deletion, or rollback deletes Realm records.
- Re-running the same package updates matching source keys and does not create duplicates.
- Logs and evidence never print credentials or authentication tokens.

## 14. Verification Gates

### Gate 1: Pure mechanics

- Exhaustive percentile-result matrix
- Corrected boundary fixtures
- Opposed and above-100% cases
- Resistance and characteristic cases
- Augment and repeated-attempt modifiers
- Derived attributes and ENC
- DEX and split-attack ranks
- Attack/parry matrix
- Hit-location profiles
- Normal and special damage
- Armor, shield, weapon HP, and location/total HP updates
- Wyrd eligibility, once-per-day state, and permanent POW cost
- Unique creature overrides

### Gate 2: Realm source

- `ruleset.config.json` schema validation
- Every referenced file exists
- HTML and embedded scripts parse
- Roll handlers execute in Sean-style sandbox tests
- Compiler dry-run succeeds
- Compiled payload contains no private scenario content

### Gate 3: Private content

- Exactly six corrected pregens
- Expected bull ox, outlaw, and Eiríkur fixtures
- All item, ability, effect, journal, map, and handout references resolve
- Asset hashes match the manifest
- No reusable ruleset file references private paths or Realm scenario IDs

### Gate 4: Live Realm

- Create a new unpublished ruleset named `Age of Vikings`
- Create a dedicated campaign named `Age of Vikings - Cursed Farm Test`
- Compile and upload only after a successful dry run and explicit deployment approval
- Import the private package serially with low concurrency
- Read back the ruleset and every imported record in full
- Exercise investigation, bull ox, outlaw, duel, and Eiríkur paths
- Verify chat cards and live damage state
- Run a report-only campaign audit
- Require zero unexpected errors and document any accepted informational findings

ROT, Blood Lords, and Malleus Monstrorum are not deployment targets.

## 15. Completion Criteria

Milestone one is complete only when:

- All four verification gates pass.
- The six corrected pregens are playable in Realm.
- The Cursed Farm investigation and combat acceptance paths work without manual sheet calculations.
- Permanent POW use, damage, and exceptional creature rules remain visible and GM-controlled.
- The ruleset and private scenario package remain independently versioned and packageable.
- The reusable ruleset contains no scenario journals, maps, handouts, or scenario-specific record dependencies.
- Source, manifests, live IDs, hashes, readbacks, and audit evidence are preserved.

## 16. Approved Decisions

- Use Sean's exact 5E source directory as the primary Realm structural reference.
- Build the Cursed Farm-ready core before full-book automation.
- Deliver a two-package deployment bundle.
- Keep ruleset and scenario content separate even when installed together.
- Apply Chaosium's current corrections as authoritative.
- Automate deterministic calculations while prompting for player choices and retaining GM authority.
- Use a dedicated unpublished ruleset and test campaign.
- Preserve all user-owned changes and avoid writes to existing campaigns during design and development.
