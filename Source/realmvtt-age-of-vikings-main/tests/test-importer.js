import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function registerImporterTests(test) {
  const source = fs.readFileSync(path.join(root, "importers", "character-json.js"), "utf8");
  const aovImportCharacter = new Function(source + "\nreturn aovImportCharacter;")();

  test("character importer accepts schema one and returns one Realm values object", () => {
    const result = aovImportCharacter({
      schemaVersion: "aov-character-1", sourceKey: "hero-test", name: "Test Hero",
      data: { str: 14, skills: [{ _id: "skill-one", data: { name: "Dodge", value: 45 } }] }
    });
    assert.equal(result.ok, true);
    assert.equal(result.values["data.name"], "Test Hero");
    assert.equal(result.values["data.sourceKey"], "hero-test");
  });

  test("character importer rejects unknown schemas and duplicate embedded IDs", () => {
    assert.equal(aovImportCharacter({ schemaVersion: "aov-character-2", sourceKey: "x", name: "X", data: {} }).ok, false);
    const duplicate = aovImportCharacter({
      schemaVersion: "aov-character-1", sourceKey: "x", name: "X",
      data: { skills: [{ _id: "same", data: {} }, { _id: "same", data: {} }] }
    });
    assert.equal(duplicate.ok, false);
    assert.match(duplicate.errors.join(" "), /duplicate/i);
  });
}
