import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function findNamed(list, name) {
  return (list || []).find((entry) => (entry.data || entry).name === name);
}

function collectRefs(value, refs = []) {
  if (!value || typeof value !== "object") return refs;
  if (typeof value.sourceKeyRef === "string") refs.push(value.sourceKeyRef);
  Object.values(value).forEach((child) => collectRefs(child, refs));
  return refs;
}

export function validatePrivateBundle(bundleRoot) {
  const root = path.resolve(bundleRoot);
  const errors = [];
  const bundleFile = path.join(root, "bundle.json");
  if (!fs.existsSync(bundleFile)) return { errors: ["Missing bundle.json"], heroCount: 0, recordKeys: [] };
  const bundle = readJson(bundleFile);
  if (bundle.rulesetRange !== ">=0.1.0 <0.2.0") errors.push("rulesetRange must target the 0.1.x ruleset line");
  if (!bundle.packageVersion) errors.push("packageVersion is required");

  const records = [];
  const keys = new Set();
  for (const descriptor of bundle.records || []) {
    const recordFile = path.join(root, descriptor.file);
    if (!fs.existsSync(recordFile)) { errors.push(`Missing record file: ${descriptor.file}`); continue; }
    const record = readJson(recordFile);
    const fullKey = `${descriptor.type}:${descriptor.sourceKey}`;
    if (keys.has(fullKey)) errors.push(`Duplicate source key: ${fullKey}`);
    keys.add(fullKey);
    if (record.sourceKey !== descriptor.sourceKey) errors.push(`Source key mismatch: ${descriptor.file}`);
    records.push({ ...descriptor, fullKey, record });
  }

  const required = ["npc:bull-ox", "npc:outlaw", "npc:eirikur-draugur", "item:eirikurs-blade", "journal:cursed-farm"];
  required.forEach((key) => { if (!keys.has(key)) errors.push(`Missing required record: ${key}`); });

  const heroes = records.filter((entry) => entry.type === "character");
  if (heroes.length !== 6) errors.push(`Expected 6 heroes, found ${heroes.length}`);
  const heroByKey = Object.fromEntries(heroes.map((entry) => [entry.sourceKey, entry.record]));
  const correctionChecks = [
    ["hero-njall", "Gyrfalcon", "manipulation", 20], ["hero-isgerdur", "Arctic tern", "communication", 20],
    ["hero-thrymur", "Cat", "mythic", 20], ["hero-birna", "Wolf", "knowledge", 20],
    ["hero-sigmundur", "Snow fox", "perception", 20], ["hero-hrund", "Bear", "agility", 20]
  ];
  for (const [key, animal, category, bonus] of correctionChecks) {
    const hero = heroByKey[key];
    if (!hero) { errors.push(`Missing corrected hero: ${key}`); continue; }
    if (hero.data?.spiritAnimal?.name !== animal || hero.data?.spiritAnimal?.bonuses?.[category] !== bonus) errors.push(`Incorrect spirit animal correction: ${key}`);
  }
  const njall = heroByKey["hero-njall"];
  for (const [name, value] of [["Shield",80],["Broadsword",75],["Long Spear",45],["Bow",35],["Fist",55],["Grapple",55],["Kick",45]]) {
    if ((findNamed(njall?.data?.attacks, name)?.data || findNamed(njall?.data?.attacks, name))?.value !== value) errors.push(`Njall corrected attack missing: ${name} ${value}`);
  }
  const requiredSkills = [
    ["hero-isgerdur","Boat",20],["hero-isgerdur","Dodge",35],["hero-isgerdur","Hide",20],["hero-isgerdur","Move Quietly",10],
    ["hero-thrymur","Hide",30],["hero-thrymur","Move Quietly",30],["hero-sigmundur","Hide",55],["hero-sigmundur","Move Quietly",70],["hero-hrund","Move Quietly",20]
  ];
  for (const [key,name,value] of requiredSkills) {
    const skill = findNamed(heroByKey[key]?.data?.skills, name);
    if ((skill?.data || skill)?.value !== value) errors.push(`Corrected skill missing: ${key} ${name} ${value}`);
  }

  const allSourceKeys = new Set(records.map((entry) => entry.sourceKey));
  for (const entry of records) for (const ref of collectRefs(entry.record)) if (!allSourceKeys.has(ref)) errors.push(`Broken reference ${entry.sourceKey} -> ${ref}`);

  const assetManifestPath = path.join(root, bundle.assets?.manifest || "assets/manifest.json");
  if (!fs.existsSync(assetManifestPath)) errors.push("Missing asset manifest");
  else for (const asset of readJson(assetManifestPath).assets || []) if (!fs.existsSync(path.join(root, asset.file))) errors.push(`Missing asset: ${asset.file}`);

  return { errors, heroCount: heroes.length, recordKeys: [...keys].sort(), recordCount: records.length };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) throw new Error("Usage: validate-private-bundle.mjs <bundle-root>");
  const result = validatePrivateBundle(target);
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`validated private bundle: ${result.heroCount} heroes, required scenario records present, 0 broken references (${result.recordCount} records)`);
  }
}
