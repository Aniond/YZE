# Verification and deployment gates

## Gate 1 — deterministic mechanics and structure

Run `npm test --prefix Source/realmvtt-age-of-vikings-main`. The suite checks corrected percentile thresholds, universal bounds, opposed/resistance/augment rules, derived characteristics, category modifiers, every dodge/parry matrix cell, hit locations, damage families, Wyrd, required sheets/lists, config structure, importer rejection, and the private-package contract.

The existing compiler repository baseline must also remain green with `node YZE/tests/run-all.js`.

## Gate 2 — compiler payload

Run:

```powershell
node src/cli.js rulesets Source/realmvtt-age-of-vikings-main --output Source/realmvtt-age-of-vikings-main/build/ruleset.json
```

Inspect the result and require:

- name `Age of Vikings`, numeric config version `1`, and semantic version `0.1.0`;
- 17 unique record/list types and one `ability` roll handler;
- every tab, wizard step, importer, damage/healing script, common script, and combat hook inlined;
- no object shaped as an unresolved `{ "file": "..." }` reference;
- no private filesystem path or scenario journal prose.

## Gate 3 — private package

Run:

```powershell
node Source/realmvtt-age-of-vikings-main/tools/validate-private-bundle.mjs C:/Projects/AgeOfVikings/private/cursed-farm
```

Expected summary: `6 heroes`, required scenario records present, `0 broken references`. Confirm that the private bundle source hashes match the local core book, official errata 1.4, and official demo PDF.

## Gate 4 — unpublished Realm deployment

1. Confirm the authenticated Realm identity and list campaigns.
2. Explicitly exclude every existing campaign; use only a newly created `Age of Vikings - Cursed Farm Test` campaign.
3. Dry-run the ruleset compile through Realm before applying it.
4. Create the unpublished ruleset, then the dedicated campaign with that ruleset.
5. Import abilities and items first, then NPCs, heroes, the journal, and maps. Record each stable source key and Realm ID.
6. Read every record back in full and compare normalized data to the private files.
7. Run a report-only campaign audit for broken links, duplicate names, missing art, empty folders, and orphaned folder items.
8. Record acceptance checks for investigation rolls, bull-ox hit locations, outlaw gear, Eiríkur's damage exceptions/destruction state, duel threshold, and Wyrd confirmation.

If campaign creation or ruleset selection is unavailable through the automation surface, stop before importing records and obtain that single UI action. Never redirect a partial deployment into an existing campaign.
