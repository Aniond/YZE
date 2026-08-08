var importedCore = record && record.data ? record.data : {};
var importedDerived = aov.calculateDerived(importedCore);
var importedCategories = aov.calculateSkillCategoryModifiers(importedCore);
var importedValues = {};
Object.keys(importedDerived).forEach(function (key) { importedValues["data." + key] = importedDerived[key]; });
Object.keys(importedCategories).forEach(function (key) { importedValues["data.category_" + key] = importedCategories[key]; });
api.setValues(importedValues);
