# YZE Status Effects — Manual Build Reference

Same as the Difficulty effects: the **exact effect NAME** is what does the work.
The roll handler recognizes these names and removes the right dice automatically —
you do NOT need to put strMod/witMod in a rule. (Realm's Override Data applies to
the token instance, not the record, so the sheet can't read it — the name is the
reliable link.)

## How to build each one
1. **Create New** effect. Set the **Effect name EXACTLY** as written below
   (capitalisation and punctuation matter — `Poisoned (Lethal)` etc.).
2. **Token Menu:** ✓ checked (so you can apply it from the token's right-click menu).
3. **Duration Unit:** as listed (Indefinite for most; Rounds = 1 for On Fire & Frozen).
4. Save. That's all that's required for the dice penalty.
5. **Optional** — add one **Override Data (Complex)** rule with the JSON shown, only
   to record the category / healing-block / damage flags for reference. Not needed
   for the dice penalty.

## Dice penalty applied automatically by name
| Effect name (exact) | Duration | Auto dice penalty | Optional Override JSON (reference only) |
|---|---|---|---|
| Hypothermic | Indefinite | **-1 STR/AGI** | `{ "effectType": "Environmental", "blockPhysHeal": true }` |
| Starving | Indefinite | none | `{ "effectType": "Environmental", "blockPhysHeal": true }` |
| Sick | Indefinite | none | `{ "effectType": "Environmental", "blockPhysHeal": true }` |
| On Fire | Rounds: 1 | none | `{ "effectType": "Environmental", "damagePerRound": 6 }` |
| Poisoned (Lethal) | Indefinite | none | `{ "effectType": "Environmental", "damagePerRound": 1 }` |
| Poisoned (Paralyzing) | Indefinite | **-3 STR/AGI** | `{ "effectType": "Environmental" }` |
| Poisoned (Sleeping) | Indefinite | **-3 STR/AGI, -3 WIT/EMP** | `{ "effectType": "Environmental" }` |
| Entangled | Indefinite | **-1 STR/AGI** | `{ "effectType": "Combat" }` |
| Prone | Indefinite | **-1 STR/AGI** | `{ "effectType": "Combat" }` |
| Tremble | Indefinite | **-2 STR/AGI** | `{ "effectType": "Mental" }` |
| Frozen | Rounds: 1 | **-3 STR/AGI** | `{ "effectType": "Mental" }` |
| Sleep Deprived | Indefinite | **-1 WIT/EMP** | `{ "effectType": "Environmental", "blockMentHeal": true }` |

## Notes
- Effects with "none" (Starving, Sick, On Fire, Poisoned Lethal) impose no dice
  penalty — they block healing or deal ongoing damage; that's GM-tracked for now.
- The handler's penalty list lives in `common.js` → `YZE_EFFECT_PENALTIES`. If you
  rename an effect or add a new one with a dice penalty, tell me the name + values
  and I'll add it there.
- Apply an effect from the token's right-click menu, then roll the matching
  attribute/skill — the pool drops by the listed amount.
