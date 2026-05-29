# Year Zero Engine — Realm VTT Ruleset

A full-featured Year Zero Engine ruleset for Realm VTT. Supports dice
pool rolls, push mechanics, conditions, gear inventory, magic, vehicles,
chases, and NPC sheets — all styled in a dark fantasy aesthetic faithful
to the SRD.

Built against the YZE Standard Reference Document v1.0.

---

## Features

**Character Sheet (5 tabs)**
- Attributes (Strength, Agility, Wits, Empathy) with pip tracking
- 12 skills grouped by attribute with roll buttons
- Health & Resolve pip strips with click-to-set
- Physical & Mental conditions with Break mechanic
- Gear inventory with equip pip, attack rolls, and armor tracking
- Combat tab with weapons grid, attack modifiers, defense, and stress
- Magic tab with Willpower Points, disciplines, and known spells
- Talents tab with drag-from-compendium specialties
- Notes tab with personality traits, Pride mechanic, XP tracking,
  and consumables

**Dice System**
- YZE dice pool rolls (attribute + skill + gear dice)
- Push mechanic with attribute damage and bane tracking
- Stress dice with panic trigger on banes
- Difficulty dropdown (Trivial +3 to Formidable -3)
- Ranged attack modifiers (Aim, Defenseless, Range, Light)
- Opposed rolls
- Color-coded dice by source type (blue/orange/yellow/purple)

**Roll Handlers**
- `yze_pool` — standard skill rolls
- `yze_combat` — attack rolls with armor soak and damage application
- `yze_push` — push mechanic with degradation and WP gain
- `yze_crit` — D66 physical and mental critical injury tables
- `yze_panic` — D6+stress panic table (15 rows)
- `yze_spell` — spellcasting with overcharge and mishap detection
- `yze_mishap` — D12 magic mishap table
- `yze_vehicle_crit` — D12 vehicle critical damage table
- `yze_foot_obstacle` — D10 foot chase obstacle table
- `yze_vehicle_obstacle` — D10 vehicle chase obstacle table

**Compendium Content**
- 24 SRD specialties (Bodyguard through Weapon Specialist)
- 68 spells across 7 disciplines (Awareness, Healing, Shapeshifting,
  Blood Magic, Death Magic, Elementalism, Symbolism)

**NPC Sheet**
- Attributes, skills, and 4 action slots with attack rolls
- Conditions, push support, and Broken badge
- Collapsible action cards

**GM Toolkit**
- Vehicle record type with combat, ramming, and repair
- Chase reference with 5 maneuvers and range track
- Environmental hazards reference (9 types with quick-roll buttons)
- Mounts reference
- Difficulty and modifier system shared across all rolls

---

## Installation

1. In Realm VTT, create a new ruleset
2. Upload all files from this repository
3. Import compendium records:
