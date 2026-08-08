import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptDirectories = ["rollhandlers", "scripts", "importers", "wizards"];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

export function parseAllScripts() {
  const failures = [];
  const allFiles = walk(root);
  for (const file of allFiles.filter((item) => item.endsWith(".html"))) {
    const html = fs.readFileSync(file, "utf8");
    for (const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        new Function(match[1]);
      } catch (error) {
        failures.push(`${path.relative(root, file)}: ${error.message}`);
      }
    }
  }
  for (const directory of scriptDirectories) {
    for (const file of walk(path.join(root, directory)).filter((item) => item.endsWith(".js"))) {
      try {
        new Function(fs.readFileSync(file, "utf8"));
      } catch (error) {
        failures.push(`${path.relative(root, file)}: ${error.message}`);
      }
    }
  }
  return failures;
}
