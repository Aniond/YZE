# Player Sheet Redesign — Claude Code Implementation Spec

> **Target:** Port `design/Player Sheet.html` + `player-sheet.css` + `player-sheet.js`
> (the visual mockup) into the four Realm VTT player-sheet tabs:
> `YZE/character-main.html`, `character-skills.html`, `character-gear.html`,
> `character-notes.html` — plus add a new `character-combat.html` tab.
>
> **Reference for API rules:** `YZE/CLAUDE.md` (the *Realm VTT API Reference*
> section at the bottom). ES5 only — no `const`/`let`, no arrow functions, no
> template literals, no `Object.assign`, no spread.
>
> **NPC spec:** `design/NPC_REDESIGN_SPEC.md` — same tokens, same components.
> The two sheets should feel identical in vocabulary.

---

## 1 · Goals

| | Old | New |
|---|---|---|
| **Tabs** | 4 (Main / Skills / Gear / Notes) | 5 (Sheet / Skills / Combat / Gear / Notes) |
| **Persistent state** | Each tab handles its own header | Single header strip on every tab: portrait, name, archetype, XP, Health, Resolve, Phys/Ment conditions |
| **Skills layout** | Long 12-row list | 4 sections grouped by attribute (STR/AGI/WIT/EMP), 3 skills each |
| **Combat** | Mixed into Gear tab | Dedicated tab: equipped weapon + weapon cards + collapsible mods + defense |
| **Inventory** | Canvas-rendered grouped list with weapons mixed in | Weapons live in Combat as cards; Gear is for armor / equipment / other |
| **Attack mods** | Always-visible row of checkboxes | Collapsible panel with live summary |
| **Conditions** | 6 named checkboxes | Phys 0/3 and Ment 0/3 counter cards (parity with NPC) |
| **Notes** | One big textarea + a "conditions" text input | Bio · Relationships · Secrets · XP log · Free notes |

Aesthetic identical to the NPC redesign: dark amber, refined typography
(Spectral display / Inter UI / JetBrains Mono numbers), tight section labels.

---

## 2 · Tokens

Use the same `:root` token block from `NPC_REDESIGN_SPEC.md §2`, **plus**:

```css
:root {
  /* New for player sheet */
  --resolve: #9a7ad4;
  --resolve-soft: rgba(154,122,212,0.15);
  --resolve-glow: rgba(154,122,212,0.30);

  --attr-str: #b85050;
  --attr-agi: #5a8ac8;
  --attr-wit: #6aa07a;
  --attr-emp: #a070c8;
}
```

> **Where to put the token block:** Realm sheets don't share a stylesheet —
> each tab file is parsed independently. Repeat the token block at the top of
> every tab file (Sean's 5e ruleset does this). Or extract into a shared file
> imported via `common.js`-style helper if that pattern is available.

---

## 3 · Persistent Header (every tab)

Because every tab is a separate file, the persistent header markup needs to
be repeated at the top of all five tab files. Keep its field bindings IDENTICAL
across tabs so a value typed on one tab persists everywhere.

```html
<!-- Persistent header — copy at top of every tab file -->
<div style="padding:14px 18px 12px; background:#15110b;
  border-bottom:1px solid #2a2015; position:relative;">

  <!-- Identity row -->
  <div style="display:flex; gap:14px; align-items:flex-start;">
    <portrait field="portrait" width="60" height="60"
      style="border-radius:3px; border:1px solid #3a2e1c;
        flex-shrink:0; cursor:pointer;"></portrait>

    <div style="flex:1; min-width:0; padding-top:2px;">
      <namefield field="name" placeholder="Character name…"
        style="font-family:Georgia,serif; font-size:22px;
          color:#f0d9b5; font-weight:500;"></namefield>

      <div style="display:flex; align-items:center; gap:10px; margin-top:3px;">
        <stringfield field="archetype" placeholder="Archetype / Role…"
          style="flex:1; color:#c8902a; font-size:12px;"></stringfield>
        <span style="font-size:10px; color:#e8b85a;
          background:rgba(200,144,42,0.10);
          border:1px solid #7a571c; padding:3px 8px; border-radius:2px;
          font-family:Consolas,monospace; letter-spacing:0.08em;">
          <span style="color:#524535; margin-right:4px; font-weight:400;">XP</span>
          <calculated field="xpAvailable"></calculated>
        </span>
      </div>
    </div>
  </div>

  <!-- Vitals row -->
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;
    margin-top:12px;">

    <!-- Health -->
    <div style="background:#1c1610; border:1px solid rgba(200,144,42,0.20);
      border-radius:5px; padding:8px 12px; display:flex;
      align-items:center; gap:10px;">
      <span style="font-size:9px; font-weight:700; letter-spacing:0.18em;
        text-transform:uppercase; color:#c8902a; width:56px;">Health</span>
      <canvas field="healthCanvas" width="180" height="14"
        style="flex:1; width:100%; height:14px; display:block;"
        onload="drawHeader();"
        onrecordchanged="drawHeader();"
        onclick="onHealthPipClick();"></canvas>
      <span style="font-family:Consolas,monospace; font-size:13px;
        font-weight:600; color:#f0d9b5;">
        <numberfield field="curHealth" minvalue="0" defaultvalue="0"
          style="width:22px; background:transparent; border:none;
            color:inherit; text-align:right; font:inherit;"></numberfield>
        <span style="color:#524535;">/</span>
        <span style="color:#7d6b54;"><calculated field="maxHealth"></calculated></span>
      </span>
    </div>

    <!-- Resolve — same structure, purple accents -->
    <div style="background:#1c1610; border:1px solid rgba(154,122,212,0.20);
      border-radius:5px; padding:8px 12px; display:flex;
      align-items:center; gap:10px;">
      <span style="font-size:9px; font-weight:700; letter-spacing:0.18em;
        text-transform:uppercase; color:#9a7ad4; width:56px;">Resolve</span>
      <canvas field="resolveCanvas" width="180" height="14"
        style="flex:1; width:100%; height:14px; display:block;"
        onload="drawHeader();"
        onrecordchanged="drawHeader();"
        onclick="onResolvePipClick();"></canvas>
      <span style="font-family:Consolas,monospace; font-size:13px;
        font-weight:600; color:#f0d9b5;">
        <numberfield field="curResolve" minvalue="0" defaultvalue="0"
          style="width:22px; background:transparent; border:none;
            color:inherit; text-align:right; font:inherit;"></numberfield>
        <span style="color:#524535;">/</span>
        <span style="color:#7d6b54;"><calculated field="maxResolve"></calculated></span>
      </span>
    </div>
  </div>

  <!-- Conditions strip -->
  <div style="display:flex; gap:12px; margin-top:10px;">
    <!-- Phys card — see NPC spec §6 for the counter recipe -->
    <!-- Ment card — same as Phys, swap the field group + colour -->
  </div>
</div>
```

**Field bindings used by the header:**

| Field | Type | Notes |
|---|---|---|
| `portrait` | portrait | existing |
| `name` | namefield | existing |
| `archetype` | stringfield | existing |
| `xp` | numberfield | existing |
| `xpSpent` | numberfield | existing |
| `xpAvailable` | calculated `xp - xpSpent` | NEW — see §10 |
| `curHealth` / `maxHealth` | existing | drawn as a tiny pip strip in the canvas |
| `curResolve` / `maxResolve` | existing | same |
| `cond_*` × 6 | existing | hidden under the counter UI (NPC spec pattern) |
| `condPhysDisplay` / `condMentDisplay` | NEW string fields | for the `0/3` text |

> The header's H/R canvas replaces the bigger one on the old Main tab. The
> drawing function `drawHeader()` lives in `common.js` (see §5 below) so every
> tab can call it on load and on `onrecordchanged`.

---

## 4 · Tabs

### 4.1 — `character-main.html` → renamed conceptually to **Sheet**

Keep the existing file but strip out the H/R bar canvas (now in the header)
and the conditions row (now in the header). What remains in the body:

1. **Attributes** — 4 cards in a `grid-template-columns:repeat(4,1fr)` layout,
   each card containing the attribute label, big number, 5-pip strip
   (existing pip click handler), and "Tap to roll" hint. The card itself rolls
   the attribute (no skill). Keep the existing `attrCanvas` — but redraw
   in a 4-column layout (not 2×2) to match the mockup. Hit detection updates
   in `onAttrClick()`.
2. **Critical Injury** — keep the existing two buttons, restyled as a row inside
   a card: label, [Physical] [Mental], help text.
3. **Next Roll** — `rollMod` + `opposed` + `autoApply` toggle, in a 3-column
   card (the existing Skills tab's modifier row).
4. **Push banner** — keep the existing `pushSection` box.

> **The 4-column attribute layout requires updating `drawAttrs()` and
> `onAttrClick()`** in `character-main.html` — change `AC.colW = W / 2` to
> `AC.colW = W / 4`, drop the row math, and re-layout per-cell so the
> attribute number + pip column fits inside a quarter of the width. The pip
> strip needs to be narrower (5 pips in ~80px) — reduce `pipGap` from 16 to ~12
> and `pipR` to 5.

### 4.2 — `character-skills.html`

Replace the existing 12-row canvas with **4 grouped sections** drawn by a
single canvas, or DOM-rendered for easier styling. Recommended: keep the
canvas but draw section headers and only 3 rows each between them.

```
┌─ STRENGTH       base 3d6      [Roll STR] ─┐  ← red-tinted bar
│   Force           ○○○○○        ROLL        │
│   Melee           ●●○○○        ROLL        │
│   Stamina         ●○○○○        ROLL        │
└────────────────────────────────────────────┘
┌─ AGILITY       base 4d6      [Roll AGI] ─┐  ← blue-tinted bar
│   …                                        │
…
```

**Section header colours** (match `--attr-str/agi/wit/emp` tokens):
- STR → `#b85050` accent bar + tinted background
- AGI → `#5a8ac8`
- WIT → `#6aa07a`
- EMP → `#a070c8`

**Each row:** name on the left (with a tiny faint `STR` tag in mono after the
name), 5 pips in the middle, [Roll] button on the right. Identical to the old
row shape, just darker styling and the section grouping.

Existing `rollSkill(skill)` function stays unchanged.

> **Canvas layout maths:** 4 section heads × ~22px + 12 rows × 38px + section
> gaps ≈ 530px. Bump the `<canvas height>` accordingly. Or split into 4
> separate canvases (one per attribute) — simpler maths, but four `onload`
> handlers. Pick one — recommend one canvas with a `LAYOUT` array so hit
> detection can stay linear.

### 4.3 — `character-combat.html` (NEW)

This is a new file. Add to `ruleset.config.json` under the character
record's `tabs` array (or wherever Realm tabs are declared — check Sean's PTA
project).

Content:

1. **Equipped Weapon banner** — big amber-bordered card showing equipped
   weapon name, attr·skill·bonus/dmg/range, and a prominent `[Roll Attack]`
   button. Empty state: `"No weapon equipped — tap the pip on a weapon below"`.
2. **Weapons grid** — 2-column card grid. Each card: portrait, name, meta
   (attr·skill·range), equip pip (top right), Bonus/Dmg stats, [Roll Attack]
   + delete `×`.
3. **Attack Modifiers** (collapsible) — header `[▸] Attack Modifiers   +5 · Aim / short`
   - When collapsed, the summary string shows the net modifier and active
     toggles. Use the existing `yzeAttackMod()` math from `character-gear.html`.
   - When open: 2 mod toggles (Aim +2, Defenseless +3) + 3 selects/inputs
     (Range, Light, Other).
4. **Defense block** — `[Roll Armor]` button + cover dropdown + `[Roll Cover]`.
5. **Push banner** — same `pushSection` `<box>` as elsewhere.

The Combat tab needs its own `<list field="weaponsView" listtype="gear_slot">`
filtered to weapons, OR it can read from the same `data.gearList` and filter
in JS (see existing `buildGearLayout()` which already partitions by
`gearType`). Recommend: keep one `data.gearList`, draw a weapon-only grid here
via a canvas (DOM is harder because gear is a list, not fixed fields).

```javascript
// In character-combat.html
function drawWeaponsGrid() {
  var c = api.getCanvas('weaponsCanvas');
  if (!c) return;
  var list = getGearList();   // helper from character-gear.html — extract to common.js
  var weapons = [];
  for (var i = 0; i < list.length; i++) {
    if ((list[i].data && list[i].data.gearType) === 'weapon') {
      weapons.push({ item: list[i], idx: i });
    }
  }
  // Draw a 2-col grid of cards…
}
```

Move the following functions OUT of `character-gear.html` and into `common.js`
so the Combat tab can call them:

```
getGearList()
getEquippedItem()
rollAttackForItem(item)
rollAttackFromSheet()
yzeAttackMod()
rollArmorDefense()
rollCoverDefense()
```

> All these functions already exist — they just need to move from the gear
> tab's `<script>` block into `common.js`. The gear tab keeps the same
> behaviour because Realm injects `common.js` on every tab.

**Attack-mod collapse:**

```html
<numberfield field="modsOpen" defaultvalue="0" style="display:none;"></numberfield>

<box field="modsCollapseHead">
  <div style="cursor:pointer;" onclick="toggleMods();">
    ▸ Attack Modifiers  <calculated field="modsSummary"></calculated>
  </div>
</box>

<box field="modsCollapseBody">
  <!-- aim, defenseless, range, light, other — same fields as today -->
</box>
```

```javascript
function toggleMods() {
  var on = parseInt(api.getValue('data.modsOpen') || '0', 10);
  api.setValues({
    'data.modsOpen': on ? 0 : 1,
    'fields.modsCollapseBody.hidden': !!on
  });
}
```

`modsSummary` is a `calculated` field that runs the same math as `yzeAttackMod()`
and formats `"+5 · Aim / Defenseless / short"` — easiest to compute in JS
inside a redraw function rather than a calculated field, since Realm
calculated fields don't easily reach the `cond_*` boolean fields.

### 4.4 — `character-gear.html`

Strip weapons OUT (they live in Combat now). Keep three sections: **Armor**,
**Equipment**, **Other**. The existing grouped canvas `drawGearCanvas()` already
partitions — drop the "weapons" partition and render the remaining three.

Replace the grouped canvas with **DOM rows** instead — the existing canvas is
fine, but DOM rows are easier to restyle to match the mockup's card look. Use
`<list field="gearList" listtype="gear_slot">` with a custom row template (see
Sean's character-inventory.html in 5e ruleset for the pattern).

If keeping the canvas: simply remove the WEAPONS section and lighten the
weapon-specific draw logic from `drawGearItemRow()`.

The current attack-mod row and defense row at the top of the file MUST be
removed (they moved to Combat tab).

Keep:
- `gearNotes` richtextfield
- Drop zone
- `onDrop` handler — unchanged

### 4.5 — `character-notes.html`

Replace the current "1 textarea + 1 conditions input" with **5 blocks** in
a 2-column grid:

| Block | Field | Notes |
|---|---|---|
| Appearance & Bio | `bioNotes` (new richtext) | left col, ~120px tall |
| Relationships | `relNotes` (new richtext) | right col |
| Secrets | `secretsNotes` (new richtext) | left col |
| Experience | uses existing `xp` + `xpSpent` + new `xpLog` richtext | right col, with the 3 stat boxes inside |
| Session Notes | existing `notes` field, repurposed | full-width row |

The "Conditions" textarea on the old notes tab is removed (Phys/Ment counters
live in the header now). The named-condition checkboxes still exist (hidden)
to back the −1 group penalty.

XP block:

```html
<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
  <div><label>Earned</label> <numberfield field="xp" minvalue="0"></numberfield></div>
  <div><label>Spent</label>  <numberfield field="xpSpent" minvalue="0"></numberfield></div>
  <div><label>Available</label> <calculated field="xpAvailable"></calculated></div>
</div>
<richtextfield field="xpLog" height="80px"
  placeholder="Session log of XP gains and purchases…"></richtextfield>
```

---

## 5 · Shared `common.js` Additions

```javascript
// ── PERSISTENT HEADER ────────────────────────────────────────────────────

// One H/R drawer used by every tab. Each tab has two tiny canvases
// (healthCanvas, resolveCanvas) — both repaint here.
function drawHeader() {
  drawTinyPips('healthCanvas',  'curHealth',  'maxHealth',  '#c8902a', '#e8b85a');
  drawTinyPips('resolveCanvas', 'curResolve', 'maxResolve', '#9a7ad4', '#c8a8e8');
  refreshCondMini();
  refreshXp();
}

function drawTinyPips(canvasField, curField, maxField, fillCol, edgeCol) {
  var c = api.getCanvas(canvasField);
  if (!c) return;
  var W = c.width, H = c.height;
  c.clearRect(0, 0, W, H);
  c.clearTooltips();
  var cur = parseInt(api.getValue('data.' + curField) || '0', 10);
  var max = parseInt(api.getValue('data.' + maxField) || '1', 10);
  if (max <= 0) return;

  var gap = 2;
  var pipW = Math.floor((W - gap * (max - 1)) / max);
  if (pipW < 4) pipW = 4;

  for (var i = 0; i < max; i++) {
    var x = i * (pipW + gap);
    var filled = i < cur;
    var crit   = (cur > 0 && i === cur - 1 && cur < max);
    c.setFillStyle(crit ? '#cc3333' : (filled ? fillCol : 'rgba(200,144,42,0.10)'));
    c.fillRect(x, 0, pipW, H);
    if (filled) {
      c.setStrokeStyle(edgeCol);
      c.setLineWidth(1);
      c.strokeRect(x + 0.5, 0.5, pipW - 1, H - 1);
    }
    c.tooltip(x, 0, pipW, H, filled ? 'Remove' : 'Add');
  }
}

// Header H/R pip click — call from every tab via onHealthPipClick / onResolvePipClick.
function onHealthPipClick()  { onPipClickGeneric('healthCanvas',  'curHealth',  'maxHealth'); }
function onResolvePipClick() { onPipClickGeneric('resolveCanvas', 'curResolve', 'maxResolve'); }

function onPipClickGeneric(canvasField, curField, maxField) {
  var c = api.getCanvas(canvasField);
  if (!c) return;
  var W = c.width;
  var cur = parseInt(api.getValue('data.' + curField) || '0', 10);
  var max = parseInt(api.getValue('data.' + maxField) || '1', 10);
  var gap = 2;
  var pipW = Math.floor((W - gap * (max - 1)) / max);
  if (pipW < 4) pipW = 4;
  var idx = Math.floor(event.x / (pipW + gap));
  if (idx < 0 || idx >= max) return;
  var next = (idx + 1 === cur) ? idx : idx + 1;
  next = Math.max(0, Math.min(max, next));
  var upd = {};
  upd['data.' + curField] = next;
  api.setValues(upd, function() { drawHeader(); });
}

function refreshXp() {
  var xp     = parseInt(api.getValue('data.xp')      || '0', 10);
  var spent  = parseInt(api.getValue('data.xpSpent') || '0', 10);
  var avail  = xp - spent;
  api.setValues({ 'data.xpAvailable': String(avail) });
}

// Cond counters from NPC spec — see §5 of NPC_REDESIGN_SPEC.md.
// refreshCondMini() updates condPhysDisplay / condMentDisplay strings.
```

Then every tab's `onload` / `onrecordchanged` calls `drawHeader()` in
addition to its own draw fn.

---

## 6 · Field Bindings — Complete Summary

All existing fields keep their names. **NEW fields** (must be added):

| Field | Type | Default | Purpose |
|---|---|---|---|
| `xpAvailable` | string | "0" | Computed `xp - xpSpent` for display |
| `condPhysDisplay` | string | "0/3" | Counter display |
| `condMentDisplay` | string | "0/3" | Counter display |
| `bioNotes` | richtext | "" | Appearance & bio |
| `relNotes` | richtext | "" | Relationships |
| `secretsNotes` | richtext | "" | Secrets |
| `xpLog` | richtext | "" | XP log |
| `modsOpen` | number | 0 | Attack-mod collapse state |
| `modsSummary` | string | "No modifiers" | Computed |
| `activeTab` | string | "sheet" | Persist active tab |

The old `notes` field is repurposed as "Session Notes" — same behaviour, new
label.

---

## 7 · Acceptance Criteria

- [ ] All 5 tabs render in Realm VTT without console errors.
- [ ] Persistent header appears identical on every tab (portrait, name,
  archetype, XP chip, Health bar, Resolve bar, Phys/Ment counters).
- [ ] Editing `name` / `archetype` / `xp` on one tab updates the header on
  every other tab on next focus.
- [ ] Health & Resolve pip strips click to set the pool.
- [ ] Conditions +/- update both the visible counter and the underlying named
  checkboxes; the Break button still fires `takeCondition()` and rolls a crit.
- [ ] Attribute rolls (Sheet tab cards) work via existing `rollSkill()` /
  attribute-only path.
- [ ] All 12 skill rolls work (existing `rollSkill(skill)`).
- [ ] Combat tab: weapons grid renders weapon-only items; equip pip works;
  Roll Attack works for each weapon; collapsible modifiers compute the same
  modifier as today.
- [ ] Gear tab: only Armor / Equipment / Other; no weapons; drop zone still
  accepts compendium drops.
- [ ] Notes tab: 5 blocks render; XP earned/spent/available updates live.
- [ ] Push banner appears in all 5 tabs when a push-eligible roll fires.
- [ ] No legacy field names dropped — existing roll handlers (`yze-pool.js`,
  `yze-combat.js`, `yze-crit.js`, `yze-armor.js`, `yze-push.js`) untouched.

---

## 8 · Files Touched

| File | Change |
|---|---|
| `YZE/character-main.html` | Strip H/R bar canvas + conditions row from body (now in header); restyle attribute grid to 4 columns; new section labels. |
| `YZE/character-skills.html` | Restructure into 4 attribute-grouped sections; canvas math update. |
| `YZE/character-combat.html` | NEW FILE. Equipped banner + weapons grid + collapsible mods + defense. |
| `YZE/character-gear.html` | Remove weapons section + attack-mod row + defense row (moved to Combat). Keep armor / equipment / other + gear notes. |
| `YZE/character-notes.html` | Replace single textarea with 5-block grid. Add new richtext fields. |
| `YZE/common.js` | Add `drawHeader()`, `drawTinyPips()`, `onPipClickGeneric()`, `refreshXp()`, condition counter helpers, and move gear/attack helpers in. |
| `YZE/ruleset.config.json` | Add new `character-combat.html` tab entry. |
| `YZE/rollhandlers/*.js` | No changes. |

---

## 9 · Implementation Order

1. **Tokens** — add the `:root` token block to the top of every tab file.
2. **Header** — add the persistent header markup to all five tab files (copy/paste).
   Wire `drawHeader()` into each tab's `onload` + `onrecordchanged`.
3. **Sheet tab (main.html)** — strip H/R + conditions; restyle attribute grid
   to 4 cols; update `drawAttrs()` / `onAttrClick()`.
4. **Skills tab** — restructure into 4 grouped sections.
5. **Combat tab** — NEW file. Most work is in this step.
6. **Gear tab** — strip out weapons + attack-mod + defense rows.
7. **Notes tab** — replace with 5-block grid.
8. **common.js** — add the new helpers; move the gear functions in.
9. **Register the new tab** in `ruleset.config.json`.
10. **Test** — every roll, every counter, every pip, every tab.

---

## 10 · Open Questions

- **Realm `calculated` fields:** Confirm with Sean that calculated fields can
  reference other fields on the same record. If not, the `xpAvailable` and
  `modsSummary` strings need to be written by JS on every change.
- **Tab registration:** Confirm how `character-combat.html` is added to the
  character record's tab list. Sean's PTA project should have the pattern.
- **Per-tab repeat of the header:** Realm doesn't have shared layouts that I
  know of — each tab file is independent. If that's wrong, hoist the header
  into a parent layout. Otherwise copy-paste is unavoidable.

---

*Reference: `design/Player Sheet.html` (single-page mockup with all 5 tabs
inlined) — diff against the rendered Realm sheet at 680px to catch drift.*
