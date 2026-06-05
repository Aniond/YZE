#!/usr/bin/env node
// Syntax-checks every ruleset JS file + every HTML <script> block in SCRIPT mode
// (the mode Realm evaluates them in). Reports any parse error. Temporary helper
// for the ES6 migration — safe to delete afterwards.
//
// Run from YZE/:  node tests/parse-check.cjs
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.join(__dirname, "..");
let failures = 0;
let checked = 0;

// Realm runs handlers in script (sloppy) mode and some end with a top-level
// `return`. Wrap source in a function so a legal top-level return still parses;
// this does not mask real syntax errors elsewhere.
function checkScript(label, code) {
  checked++;
  try {
    new vm.Script(code, { filename: label });
  } catch (e1) {
    // retry wrapped (for handlers that legitimately use a top-level return)
    try {
      new vm.Script("(function(){" + code + "\n})", { filename: label });
    } catch (e2) {
      failures++;
      console.error(`  ✗  ${label}\n       ${e2.message}`);
      return;
    }
  }
}

function checkJsFile(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return;
  checkScript(rel, fs.readFileSync(full, "utf8"));
}

function checkHtmlFile(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return;
  const html = fs.readFileSync(full, "utf8");
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m, i = 0;
  while ((m = re.exec(html)) !== null) {
    checkScript(`${rel} <script#${i}>`, m[1]);
    i++;
  }
  if (i === 0) console.log(`  -   ${rel} (no <script> block)`);
}

const jsFiles = [
  "common.js",
  "rollhandlers/yze-pool.js", "rollhandlers/yze-combat.js", "rollhandlers/yze-push.js",
  "rollhandlers/yze-crit.js", "rollhandlers/yze-panic.js", "rollhandlers/yze-spell.js",
  "rollhandlers/yze-mishap.js", "rollhandlers/yze-vehicle-crit.js",
  "rollhandlers/yze-foot-obstacle.js", "rollhandlers/yze-vehicle-obstacle.js",
  "rollhandlers/yze-armor.js", "rollhandlers/onRollInitiative.js", "rollhandlers/onTurnStart.js",
];

const htmlFiles = [
  "character-main.html", "character-skills.html", "character-combat.html",
  "character-gear.html", "character-magic.html", "character-notes.html",
  "character-talents.html", "npc-main.html", "vehicle-main.html",
  "gear-entry.html", "spell-entry.html", "specialty-entry.html", "effect-entry.html",
  "gear-main.html", "spell-main.html", "specialty-main.html", "skills-main.html",
  "effect-main.html", "gear-slot.html",
  "chase-reference.html", "hazards-reference.html", "travel-reference.html",
];

console.log("JS files:");
jsFiles.forEach(checkJsFile);
console.log("HTML <script> blocks:");
htmlFiles.forEach(checkHtmlFile);

console.log(`\n${"-".repeat(40)}`);
console.log(`${checked} scripts checked, ${failures} parse error(s)`);
process.exit(failures ? 1 : 0);
