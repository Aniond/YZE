# YZE Status Effects — Manual Build Reference

Same workflow as Difficulty 1-6.
For each effect: open the Effects panel → Create New → fill in these values.

## Rule element fields used
- **Alter a Data Field** → targets `strMod` (STR/AGI penalty) or `witMod` (WIT/EMP penalty)
- **Override Data (Complex)** → for effects that block healing or deal damage

---

## 1. Hypothermic

| Setting | Value |
|---|---|
| **Effect name** | Hypothermic |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Hypothermic |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-1` |
| **Rule 2 — Override Data (Complex)** | `{ "blockPhysHeal": true }` |

---

## 2. Starving

| Setting | Value |
|---|---|
| **Effect name** | Starving |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Starving |
| **Rule 1 — Override Data (Complex)** | `{ "blockPhysHeal": true }` |

---

## 3. Sick

| Setting | Value |
|---|---|
| **Effect name** | Sick |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Sick |
| **Rule 1 — Override Data (Complex)** | `{ "blockPhysHeal": true }` |

---

## 4. On Fire

| Setting | Value |
|---|---|
| **Effect name** | On Fire |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Rounds |
| **Duration** | 1 |
| **Rule 1 — Type** | On Fire |
| **Rule 1 — Override Data (Complex)** | `{ "damagePerRound": 6 }` |

---

## 5. Poisoned (Lethal)

| Setting | Value |
|---|---|
| **Effect name** | Poisoned (Lethal) |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Poisoned (Lethal) |
| **Rule 1 — Override Data (Complex)** | `{ "damagePerRound": 1 }` |

---

## 6. Poisoned (Paralyzing)

| Setting | Value |
|---|---|
| **Effect name** | Poisoned (Paralyzing) |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Poisoned (Paralyzing) |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-3` |

---

## 7. Poisoned (Sleeping)

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

---

## 8. Entangled

| Setting | Value |
|---|---|
| **Effect name** | Entangled |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Entangled |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-1` |

---

## 9. Prone

| Setting | Value |
|---|---|
| **Effect name** | Prone |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Prone |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-1` |

---

## 10. Tremble

| Setting | Value |
|---|---|
| **Effect name** | Tremble |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Tremble |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-2` |

---

## 11. Frozen

| Setting | Value |
|---|---|
| **Effect name** | Frozen |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Rounds |
| **Duration** | 1 |
| **Rule 1 — Type** | Frozen |
| **Rule 1 — Alter a Data Field → field** | `strMod` |
| **Rule 1 — Value** | `-3` |

---

## 12. Sleep Deprived

| Setting | Value |
|---|---|
| **Effect name** | Sleep Deprived |
| **Token Menu** | ✓ checked |
| **Duration Unit** | Indefinite |
| **Rule 1 — Type** | Sleep Deprived |
| **Rule 1 — Alter a Data Field → field** | `witMod` |
| **Rule 1 — Value** | `-1` |
| **Rule 2 — Override Data (Complex)** | `{ "blockMentHeal": true }` |
