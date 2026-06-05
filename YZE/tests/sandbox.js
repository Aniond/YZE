// Shared sandbox setup for loading YZE ruleset scripts in a VM context.
// Adapted from Sean's 5e tests/sandbox.js. Loads YZE/common.js (the ruleset's
// commonScript) into a vm context with a stubbed `api`, so the pure helpers
// (dice/push math, modifiers, verdicts) can be unit-tested under plain `node`.
//
// Run: node tests/run-all.js   (or node tests/test-common.js)
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const rollhandlersDir = path.join(rootDir, "rollhandlers");

// Stubs for globals that ruleset scripts reference. Pure helpers never call
// these, but anything loaded into the context must find `api.*` defined if it
// touches it at load time. Each is a harmless no-op returning a sane default.
const api = {
  getValue: () => null,
  setValue: () => {},
  setValues: () => {},
  setHidden: () => {},
  getRecord: () => {},
  getCanvas: () => null,
  getToken: () => null,
  getTargets: () => [],
  getSelectedTokens: () => [],
  getSession: () => null,
  getSetting: () => null,
  getValueOnRecord: () => null,
  setValueOnTokenById: () => {},
  showNotification: () => {},
  showConfirm: () => {},
  showPrompt: () => {},
  sendMessage: () => {},
  roll: () => {},
  promptRoll: () => {},
  rollInstant: () => ({ total: 0 }),
  addEffect: () => {},
  removeEffectById: () => {},
  addValue: () => {},
  removeValue: () => {},
  openListRecord: () => {},
  dealFromDeck: () => {},
};

function createSandbox() {
  const record = { data: {}, fields: {}, recordType: "characters", _id: "test" };
  const sandbox = {
    api,
    record,
    console,
    event: { x: 0, y: 0 },
    dataPath: "",
  };
  const ctx = vm.createContext(sandbox);

  // Load common.js (the ruleset's shared script — defines the pure helpers).
  const commonCode = fs.readFileSync(path.join(rootDir, "common.js"), "utf8");
  new vm.Script(commonCode, { filename: "common.js" }).runInContext(ctx);

  return ctx;
}

// Load an additional rollhandler into the same context (e.g. "yze-pool.js").
function loadScript(ctx, filename) {
  const code = fs.readFileSync(path.join(rollhandlersDir, filename), "utf8");
  new vm.Script(code, { filename }).runInContext(ctx);
}

module.exports = { createSandbox, loadScript };
