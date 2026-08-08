import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function registerConfigTests(test) {
  test("ruleset configuration defines records, lists, wizard, and semantic version", () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, "ruleset.config.json"), "utf8"));
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    assert.equal(config.version, 1);
    assert.equal("published" in config, false, "published is server-managed and rejected on ruleset creation");
    assert.equal(packageJson.version, "0.1.0");
    assert.equal("rulesetVersion" in config.settings.otherSettings, false, "Realm rejects unknown otherSettings keys");
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
    assert.equal("enableSecondaryStat" in config.settings.damage, false, "Realm's live damage schema does not accept this stale example field");
    assert.deepEqual(Object.keys(config.settings.damage.damageTypes).sort(), ["fire", "radiant", "slashing"]);
    assert.ok(config.settings.rollTypes.some((roll) => roll.name === "ability"));
    assert.ok(config.settings.effects.length >= 5);
    assert.equal(config.settings.otherSettings.defaultUnitsPerSquare, 1);
    assert.equal(config.settings.otherSettings.defaultUnits, "meters");
    assert.equal(config.settings.themes.length, 2);
    const allowedPaletteKeys = new Set(["dark", "gray", "red", "pink", "grape", "violet", "indigo", "blue", "cyan", "teal", "green", "lime", "yellow", "orange", "primary", "secondary", "tertiary"]);
    for (const theme of config.settings.themes) for (const key of Object.keys(theme.theme.colors || {})) assert.equal(allowedPaletteKeys.has(key), true, `unsupported Realm theme palette: ${key}`);
  });
}
