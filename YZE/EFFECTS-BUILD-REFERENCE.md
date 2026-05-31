# YZE Status Effects — Manual Build Reference

Same workflow as Difficulty 1-6. Build each effect once in the Effects panel.

## How to build each one
1. **Create New** effect, set the **Effect name** exactly as shown.
2. **Token Menu:** ✓ checked.
3. **Duration Unit:** as listed (Indefinite for most; Rounds = 1 for On Fire & Frozen).
4. **Add Rules Element** → set **Type = `Override Data (Complex)`**.
5. Paste the JSON into the **Override Structure (JSON)** box.
6. Save. (No "Alter a Data Field" rule and no marker type needed — the one
   Override Data rule does everything.)

## What the JSON keys do
- `strMod` — dice removed from STR/AGI rolls (negative). Read by the roll handlers.
- `witMod` — dice removed from WIT/EMP rolls (negative). Read by the roll handlers.
- `damagePerRound` — ongoing damage per round (display).
- `blockPhysHeal` / `blockMentHeal` — flags that healing is blocked (display).
- `effectType` — category: Physical / Mental / Environmental / Combat.

---

## 1. Hypothermic
- **Duration Unit:** Indefinite
- **Override Structure (JSON):**
```json
{ "strMod": -1, "blockPhysHeal": true, "effectType": "Environmental" }
```

## 2. Starving
- **Duration Unit:** Indefinite
- **Override Structure (JSON):**
```json
{ "blockPhysHeal": true, "effectType": "Environmental" }
```

## 3. Sick
- **Duration Unit:** Indefinite
- **Override Structure (JSON):**
```json
{ "blockPhysHeal": true, "effectType": "Environmental" }
```

## 4. On Fire
- **Duration Unit:** Rounds — **Duration: 1**
- **Override Structure (JSON):**
```json
{ "damagePerRound": 6, "effectType": "Environmental" }
```

## 5. Poisoned (Lethal)
- **Duration Unit:** Indefinite
- **Override Structure (JSON):**
```json
{ "damagePerRound": 1, "effectType": "Environmental" }
```

## 6. Poisoned (Paralyzing)
- **Duration Unit:** Indefinite
- **Override Structure (JSON):**
```json
{ "strMod": -3, "effectType": "Environmental" }
```

## 7. Poisoned (Sleeping)
- **Duration Unit:** Indefinite
- **Override Structure (JSON):**
```json
{ "strMod": -3, "witMod": -3, "effectType": "Environmental" }
```

## 8. Entangled
- **Duration Unit:** Indefinite
- **Override Structure (JSON):**
```json
{ "strMod": -1, "effectType": "Combat" }
```

## 9. Prone
- **Duration Unit:** Indefinite
- **Override Structure (JSON):**
```json
{ "strMod": -1, "effectType": "Combat" }
```

## 10. Tremble
- **Duration Unit:** Indefinite
- **Override Structure (JSON):**
```json
{ "strMod": -2, "effectType": "Mental" }
```

## 11. Frozen
- **Duration Unit:** Rounds — **Duration: 1**
- **Override Structure (JSON):**
```json
{ "strMod": -3, "effectType": "Mental" }
```

## 12. Sleep Deprived
- **Duration Unit:** Indefinite
- **Override Structure (JSON):**
```json
{ "witMod": -1, "blockMentHeal": true, "effectType": "Environmental" }
```
