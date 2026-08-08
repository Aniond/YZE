import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadScript(relativePath, globals = {}) {
  const context = vm.createContext({ console, ...globals });
  const paths = Array.isArray(relativePath) ? relativePath : [relativePath];
  for (const scriptPath of paths) {
    const source = fs.readFileSync(path.join(root, scriptPath), "utf8");
    vm.runInContext(source, context, { filename: scriptPath });
  }
  return context;
}
