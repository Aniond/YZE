import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function registerTabTests(test) {
  const recordTabs = {
    character: ["main", "skills", "combat", "gear", "magic", "family", "notes"],
    npcs: ["main", "combat", "gear", "abilities", "description", "rules"],
    items: ["main", "combat", "rules"],
    abilities: ["main", "rules"],
    runes: ["main", "rules"],
    magic: ["main", "rules"]
  };

  test("all approved record tabs exist and contain Realm components", () => {
    for (const [recordType, tabs] of Object.entries(recordTabs)) {
      for (const tab of tabs) {
        const file = path.join(root, `${recordType}-${tab}.html`);
        assert.equal(fs.existsSync(file), true, `${recordType}-${tab}.html`);
        assert.match(fs.readFileSync(file, "utf8"), /<(?:numberfield|stringfield|richtextfield|dropdown|checkbox|button|list|label|progressbar)\b/i);
      }
    }
  });

  test("character sheets expose corrected core fields and standard prompt rolls", () => {
    const source = ["character-main.html", "character-skills.html", "character-combat.html"]
      .map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
    for (const field of ["str", "con", "siz", "dex", "int", "pow", "cha", "curHp", "maxHp", "curMagicPoints", "maxMagicPoints", "movement", "healingRate", "damageModifier", "maxEnc", "wyrdUsedToday"]) {
      assert.match(source, new RegExp(`field=["']${field}["']`), field);
    }
    assert.match(source, /api\.promptRoll\(/);
  });

  test("every approved embedded list has a focused list sheet", () => {
    const listTypes = ["skill_list", "passion_list", "devotion_list", "attack_list", "hit_location_list", "inventory_list", "armor_layer_list", "ability_list", "known_rune_list", "magic_action_list", "family_list"];
    for (const listType of listTypes) {
      const file = path.join(root, "lists", `${listType}.html`);
      assert.equal(fs.existsSync(file), true, `${listType}.html`);
      assert.match(fs.readFileSync(file, "utf8"), /field=["'](?:name|key)["']/);
    }
  });
}
