# Age of Vikings Realm field schema

Ruleset semantic version: `0.1.0`. Character imports use schema `aov-character-1`.

## Core character and NPC fields

`str`, `con`, `siz`, `dex`, `int`, `pow`, and `cha` store characteristics. `curHp` and `maxHp` store total hit points; `curMagicPoints` and `maxMagicPoints` store magic points. `movement`, `healingRate`, `damageModifier`, and `maxEnc` are deterministic derived values. `wyrdUsedToday` records the once-per-day Wyrd state; using Wyrd also permanently lowers `pow` after confirmation.

Skill-category modifiers use `category_agility`, `category_communication`, `category_knowledge`, `category_manipulation`, `category_weapons`, `category_mythic`, `category_perception`, and `category_stealth`.

## Embedded list fields

- `skills`: `skill_list` entries with `name`, `category`, and `value`.
- `passions`: `passion_list`; `devotions`: `devotion_list`.
- `attacks`: `attack_list` with `name`, `value`, `damage`, and `reach`.
- `locations`: `hit_location_list` with stable `key`, D20 `min`/`max`, `curHp`, `maxHp`, and `armor`.
- `inventory`: `inventory_list`; `armorLayers`: `armor_layer_list`.
- `abilities`: `ability_list`; `knownRunes`: `known_rune_list`; `magicActions`: `magic_action_list`.
- `family`: `family_list`.

Every private-package record also carries a stable `sourceKey`. Embedded entries must have unique `_id` values within an import payload.
