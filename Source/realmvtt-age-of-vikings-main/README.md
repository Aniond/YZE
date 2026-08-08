# Age of Vikings for Realm VTT

This directory contains the reusable Age of Vikings ruleset source. It is kept separate from the private Cult of Chaos scenario package used to run The Cursed Farm.

The ruleset follows Realm VTT patterns from Sean's 5E implementation while implementing Age of Vikings mechanics from the core rulebook and current Chaosium corrections.

The reusable package owns Realm record types, sheets, percentile and combat mechanics, the character wizard/importer, themes, effects, and tests. It deliberately contains no scenario prose, private maps, handouts, or scenario record payloads.

## Local verification

```powershell
npm test --prefix Source/realmvtt-age-of-vikings-main
node src/cli.js rulesets Source/realmvtt-age-of-vikings-main --output Source/realmvtt-age-of-vikings-main/build/ruleset.json
node Source/realmvtt-age-of-vikings-main/tools/validate-private-bundle.mjs C:/Projects/AgeOfVikings/private/cursed-farm
```

Run these commands from the ruleset compiler checkout. The compiled JSON beneath `build/` is intentionally ignored.

## Private package boundary

The companion package lives at `C:\Projects\AgeOfVikings\private\cursed-farm` and is not tracked by this repository. Its `bundle.json` pins a compatible ruleset range, hashes the three source PDFs, assigns stable source keys to all records, and stores live deployment IDs only after readback. The validator checks six corrected heroes, scenario dependencies, source-key uniqueness, cross-record references, and map presence.

Keep the ruleset and private package separately versioned even when deploying them together. Upload the ruleset as unpublished, create or select only a dedicated Age of Vikings test campaign, then import the private records in the dependency order recorded in the bundle. Do not point the import at an existing campaign.

See [docs/verification.md](docs/verification.md) and [docs/field-schema.md](docs/field-schema.md) for the complete gates and data contract.
