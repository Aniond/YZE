import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function registerConfigTests(test) {
  test("ruleset configuration defines records, lists, wizard, and semantic version", () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, "ruleset.config.json"), "utf8"));
    assert.equal(config.version, 1);
    assert.equal(config.settings.otherSettings.rulesetVersion, "0.1.0");
    const types = config.records.map((record) => record.type);
    for (const type of ["characters", "npcs", "items", "abilities", "runes", "magic", "skill_list", "passion_list", "devotion_list", "attack_list", "hit_location_list", "inventory_list", "armor_layer_list", "ability_list", "known_rune_list", "magic_action_list", "family_list"]) assert.ok(types.includes(type), type);
    const characters = config.records.find((record) => record.type === "characters");
    assert.equal(characters.tabs.length, 7);
    assert.equal(characters.wizard.steps.length, 10);
  });

  test("ruleset configuration wires DEX combat, damage, effects, units, and themes", () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, "ruleset.config.json"), "utf8"));
    assert.equal(config.settings.combatTracker.initiative, "dex");
    assert.equal(config.settings.combatTracker.order, "desc");
    assert.equal(config.settings.damage.damageScript.file, "scripts/damage-apply.js");
    assert.equal(config.settings.damage.healingScript.file, "scripts/healing-apply.js");
    assert.ok(config.settings.rollTypes.some((roll) => roll.name === "ability"));
    assert.ok(config.settings.effects.length >= 5);
    assert.equal(config.settings.otherSettings.defaultUnitsPerSquare, 1);
    assert.equal(config.settings.otherSettings.defaultUnits, "meters");
    assert.equal(config.settings.themes.length, 2);
  });
}
