# YZE Status Effects — Manual Build Reference

Same workflow as Difficulty 1-6.
For each effect: open the Effects panel → Create New → fill in these values.

## Rule elements used
- **Alter a Data Field** → targets `strMod` (STR/AGI penalty) or `witMod` (WIT/EMP penalty)
- **Override Data (Complex)** → JSON for the category (`effectType`) plus any
  healing-block / damage-per-round flags. The native effect editor has no
  category dropdown, so `effectType` is carried here.

Category → accent intent: Physical=red · Mental=purple · Environmental=green · Combat=amber

---

## 1. Hypothermic  (Environmental)

| Setting | Value |
|---|---|
| **Effect name** | Hypothermic |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Hypothermic |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-1` |
| **Rule 2 — Override Data (Complex)** | `{ "effectType": "Environmental", "blockPhysHeal": true }` |

---

## 2. Starving  (Environmental)

| Setting | Value |
|---|---|
| **Effect name** | Starving |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Starving |
| **Rule 1 — Override Data (Complex)** | `{ "effectType": "Environmental", "blockPhysHeal": true }` |

---

## 3. Sick  (Environmental)

| Setting | Value |
|---|---|
| **Effect name** | Sick |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Sick |
| **Rule 1 — Override Data (Complex)** | `{ "effectType": "Environmental", "blockPhysHeal": true }` |

---

## 4. On Fire  (Environmental)

| Setting | Value |
|---|---|
| **Effect name** | On Fire |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Rounds |
| **Duration** | 1 |
| **Rule 1 — Type** | On Fire |
| **Rule 1 — Override Data (Complex)** | `{ "effectType": "Environmental", "damagePerRound": 6 }` |

---

## 5. Poisoned (Lethal)  (Environmental)

| Setting | Value |
|---|---|
| **Effect name** | Poisoned (Lethal) |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Poisoned (Lethal) |
| **Rule 1 — Override Data (Complex)** | `{ "effectType": "Environmental", "damagePerRound": 1 }` |

---

## 6. Poisoned (Paralyzing)  (Environmental)

| Setting | Value |
|---|---|
| **Effect name** | Poisoned (Paralyzing) |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Poisoned (Paralyzing) |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-3` |
| **Rule 2 — Override Data (Complex)** | `{ "effectType": "Environmental" }` |

---

## 7. Poisoned (Sleeping)  (Environmental)

| Setting | Value |
|---|---|
| **Effect name** | Poisoned (Sleeping) |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Poisoned (Sleeping) |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-3` |
| **Rule 2 — Alter a Data Field → field** | `witMod` |
| **Rule 2 — Value** | `-3` |
| **Rule 3 — Override Data (Complex)** | `{ "effectType": "Environmental" }` |

---

## 8. Entangled  (Combat)

| Setting | Value |
|---|---|
| **Effect name** | Entangled |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Entangled |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-1` |
| **Rule 2 — Override Data (Complex)** | `{ "effectType": "Combat" }` |

---

## 9. Prone  (Combat)

| Setting | Value |
|---|---|
| **Effect name** | Prone |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Prone |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-1` |
| **Rule 2 — Override Data (Complex)** | `{ "effectType": "Combat" }` |

---

## 10. Tremble  (Mental)

| Setting | Value |
|---|---|
| **Effect name** | Tremble |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Tremble |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-2` |
| **Rule 2 — Override Data (Complex)** | `{ "effectType": "Mental" }` |

---

## 11. Frozen  (Mental)

| Setting | Value |
|---|---|
| **Effect name** | Frozen |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Rounds |
| **Duration** | 1 |
| **Rule 1 — Type** | Frozen |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-3` |
| **Rule 2 — Override Data (Complex)** | `{ "effectType": "Mental" }` |

---

## 12. Sleep Deprived  (Environmental)

| Setting | Value |
|---|---|
| **Effect name** | Sleep Deprived |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Sleep Deprived |
| **Rule 1 — Alter a Data Field → field** | `witMod` |
| **Rule 1 — Value** | `-1` |
| **Rule 2 — Override Data (Complex)** | `{ "effectType": "Environmental", "blockMentHeal": true }` |
