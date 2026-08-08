function aovImportCharacter(payload) {
  var errors = [];
  if (!payload || payload.schemaVersion !== "aov-character-1") errors.push("Unsupported schemaVersion; expected aov-character-1.");
  if (!payload || typeof payload.sourceKey !== "string" || !payload.sourceKey.trim()) errors.push("sourceKey is required.");
  if (!payload || typeof payload.name !== "string" || !payload.name.trim()) errors.push("name is required.");
  var inputData = payload && payload.data && typeof payload.data === "object" ? payload.data : {};
  var seenIds = {};
  Object.keys(inputData).forEach(function (key) {
    if (!Array.isArray(inputData[key])) return;
    inputData[key].forEach(function (entry) {
      if (!entry || !entry._id) return;
      if (seenIds[entry._id]) errors.push("Duplicate embedded list ID: " + entry._id);
      seenIds[entry._id] = true;
    });
  });
  var values = { "data.name": payload && payload.name, "data.sourceKey": payload && payload.sourceKey };
  Object.keys(inputData).forEach(function (key) { values["data." + key] = inputData[key]; });
  return { ok: errors.length === 0, errors: errors, values: values };
}

if (typeof value !== "undefined") {
  var importedCharacter = aovImportCharacter(value);
  if (!importedCharacter.ok) throw new Error(importedCharacter.errors.join(" "));
  var importedData = {};
  Object.keys(importedCharacter.values).forEach(function (path) { importedData[path.replace(/^data\./, "")] = importedCharacter.values[path]; });
  return { name: value.name, data: importedData };
}
