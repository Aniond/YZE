# Year Zero Engine — Realm VTT Ruleset

A full-featured Year Zero Engine ruleset for Realm VTT. Supports dice
pool rolls, push mechanics, conditions, gear inventory, magic, vehicles,
chases, and NPC sheets — all styled in a dark fantasy aesthetic faithful
to the SRD.

Built against the YZE Standard Reference Document v1.0 (Free Tabletop License).

---

## Features

### Character Sheet (6 tabs)

**Sheet tab**
- Attributes (Strength, Agility, Wits, Empathy) in a 4-column card grid with colour-coded accents
- Health & Resolve pip strips with click-to-set
- Critical Injury buttons (Physical / Mental) and Next Roll card
- Pride mechanic — one free success per session

**Skills tab**
- 12 skills grouped by attribute (STR / AGI / WIT / EMP)
- Colour-coded section headers with per-section attribute roll buttons
- Pip-click to set skill rank (0–5)
- Roll buttons fire the full pool (attr + skill + conditions + modifiers)

**Combat tab**
- Weapons grid (drag from compendium to add)
- Equipped weapon banner with Roll Attack
- Collapsible Attack Modifiers (Aim, Defenseless, Range, Light, Moving Target, Cover, Mounted, Helpless Target, Difficulty)
- Defense block — Roll Armor and Roll Cover
- Recovery card — Heal Broken Ally, Death Save, Self-Heal
- Turn Tracker — Slow/Fast action toggles with New Turn reset
- Stress counter with Relieve Stress and Panic Roll buttons
- Collapsible Special Actions reference (Sneak Attack, Grapple, Block, Full Auto, Diving Blow, Overwatch, Surprise/Ambush)

**Gear tab**
- Gear list canvas — Armor, Equipment, Other sections (weapons moved to Combat)
- Encumbrance tracking — carry limit = 2 × Strength, backpack doubles limit, -2 Mobility
- Gear repair — maxBonus tracking, Crafting roll button on individual items
- Drop zone for compendium gear

**Magic tab**
- Willpower Points (0–10)
- 7 disciplines with checkboxes and rank (1–3): Awareness, Healing, Shapeshifting (amber), Blood Magic, Death Magic, Elementalism, Symbolism (purple)
- Known Spells list (drag from compendium)
- Mishap Roll button

**Notes tab**
- Personality traits — Pride, Buddy, Weakness, Big Dream, Dark Secret, Relationships
- Appearance & Bio
- Experience block with collapsible skill-cost reference and 6 end-of-session XP questions
- Consumables — 4 supply slots with D6 supply roll buttons
- Session Notes

**Talents tab**
- Drag-from-compendium specialty list

---

### NPC Sheet

- 3-tab layout: Stats, Actions, Notes
- Attribute cards with tap-to-roll
- Health pip strip
- 4 collapsible action slots with linked attack rolls
- Condition counter cards (Physical / Mental) with Break
- Floating FAB roll dock
- Modifier + Difficulty + Opposed fields, cleared after each roll

---

### Dice System

- YZE dice pool rolls (attribute + skill + gear dice)
- Push mechanic with bane tracking, attribute damage, and gear degradation
- Stress dice with inline panic trigger on banes
- Pride bonus (+1 free success, once per session)
- Difficulty dropdown (Trivial +3 → Formidable -3) stacking with manual modifier
- Dice coloured by source type: blue = attribute, orange = skill, yellow = gear, purple = stress

---

### Roll Handlers

| Handler | Description |
|---|---|
| `yze_pool` | Skill rolls, attribute-only rolls, healing, death saves, gear repair |
| `yze_push` | Pushed rolls — banes apply, stress panic checked |
| `yze_combat` | Attack rolls with armor soak, damage application, push |
| `yze_crit` | D66 physical and mental critical injury tables |
| `yze_armor` | Armor and cover soak rolls |
| `yze_spell` | Spellcasting — overcharge (6s) and mishap (1s) |
| `yze_mishap` | D12 magic mishap table |
| `yze_panic` | D6+stress panic table |
| `yze_vehicle_crit` | D12 component damage table |
| `yze_foot_obstacle` | D10 foot chase obstacle table |
| `yze_vehicle_obstacle` | D10 vehicle chase obstacle table |

---

### Compendium Records

| Type | Description |
|---|---|
| `specialty` | 23 SRD general specialties |
| `spells` | 68 spells across 7 disciplines + 6 general spells |
| `gear` / `gear_slot` | Weapons, armor, equipment |
| `vehicles` | Vehicle stat sheets with ram/component damage/repair |
| `chase_ref` | Chase maneuver reference with obstacle roll buttons |
| `hazards_ref` | Environmental hazards reference (8 types) and mounts rules |

---

### GM Toolkit

- **Chase Reference** — 5-maneuver cards, range track, D10 obstacle roll buttons
- **Hazards Reference** — Fire, Falling, Drowning, Poison, Disease, Cold, Starvation, Sleep Deprivation, Explosions with Stamina roll buttons
- **Mounts** — combat and movement rules
- **Vehicle Sheet** — 8 stats, wrecked checkbox, SRD reference table, ram / component damage / repair buttons

---

## Installation

1. Clone or download this repository
2. Install dependencies: `npm install`
3. Compile and upload the YZE ruleset to Realm VTT:

```bash
cd YZE
node ../src/cli.js rulesets -i <RULESET_ID> -e <EMAIL> -p <PASSWORD> .
```

To seed specialties and spells into a campaign:

```bash
node ../src/cli.js records specialty-records.csv -i <INVITE_CODE> -e <EMAIL> -p <PASSWORD>
node ../src/cli.js records spells.csv -i <INVITE_CODE> -e <EMAIL> -p <PASSWORD>
```

---

## License

Ruleset mechanics are derived from the **Year Zero Engine Standard Reference Document v1.0**,
used under the [Year Zero Engine Free Tabletop License v1.1](https://freeleaguepublishing.com/community-content/free-tabletop-licenses/).

The compiler source code (`src/`) is original work by the contributors.

*Powered by Year Zero Engine*
