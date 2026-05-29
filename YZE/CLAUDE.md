# Year Zero Engine — Realm VTT Ruleset
## Claude Code Project Context

## Project Overview
A Realm VTT implementation of the Year Zero Engine (YZE) using the official
Free Tabletop License from Free League Publishing.

**License:** Year Zero Engine Free Tabletop License (FTL) v1.1
**SRD:** https://freeleaguepublishing.com/wp-content/uploads/2023/11/YZE-Standard-Reference-Document.pdf
**License URL:** https://freeleaguepublishing.com/wp-content/uploads/2026/03/Year-Zero-Engine-License-Agreement-version-1.1.pdf

This ruleset implements the CORE YZE mechanics only — no setting content,
no Free League brand names, no copyrighted material beyond the SRD.
Players bring their own setting (Electric State, Tales from the Loop, etc.)

## Key Paths
- Ruleset folder: `YZE/` (relative to workspace root)
- Compile command (run from YZE/ folder):
  `node ../src/cli.js rulesets -e YOUR_EMAIL -p YOUR_PASSWORD .`
- Credentials: stored in YZE/.env only — never hardcoded

## Critical Realm VTT Rules

PRIMARY REFERENCE: The Realm VTT API Reference section below.
Read it before writing ANY Realm VTT code.
It contains every confirmed API pattern, canvas rules,
ES5 requirements, gotchas, and unconfirmed methods.

Key rules at a glance:
- ES5 only — no const/let, no arrow functions, no template literals
- api.getCanvas() returns the context directly — no .getContext('2d')
- Canvas: setter methods only — c.setFillStyle() not c.fillStyle
- Canvas: c.width/c.height as properties, clearRect not clear()
- No roundRect() — use manual arc corners (see API reference)
- api.setValues() with callback for any canvas that redraws after write
- isList:true records do NOT appear in compendium
- Canvas in list-item templates does NOT work — one canvas on main sheet
- Infinite loop guard: never call api.setValues() in onrecordchanged
  unless value actually changed
- UNCONFIRMED methods — see Section 11 of API reference before using

SESSION START: Read YZE/CLAUDE.md before every session.
It contains both project context and the full API reference.

---

## Year Zero Engine Core Mechanics

### Two Variants — Both Supported
1. **Dice Pool** — pools of D6s (Mutant: Year Zero, Forbidden Lands style)
2. **Step Dice** — polyhedral dice A/B/C/D rating (Electric State, Blade Runner style)

### Attributes (4 total)
- **Strength** — raw muscle power and brawn
- **Agility** — body control, speed, motor skills
- **Wits** — perception, intelligence, sanity
- **Empathy** — charisma, manipulation

**Dice Pool scores:** 1-5 (distribute 14 points, min 2 max 5, key attribute max 5)
**Step Dice ratings:** A(D12) / B(D10) / C(D8) / D(D6) — start all C, 3 increases

### Health & Resolve
**Dice Pool:**
- Health = average(Strength + Agility) rounded up + 1
- Resolve = average(Wits + Empathy) rounded up + 1

**Step Dice:**
- Health = (Strength die size + Agility die size) / 4 rounded up
- Resolve = (Wits die size + Empathy die size) / 4 rounded up

### Skills (12 core)
Level 0-5 (dice pool) or same A-D scale (step dice)
SRD core skill names (p. 8) — use these exact names, not Free League
setting-specific names like Might/Fight/Shoot/Manipulate:
1. Force — Strength — lift, push, break (feats of strength)
2. Melee — Strength — close-combat attacks
3. Stamina — Strength — endurance, resist poison, death saves
4. Marksmanship — Agility — ranged attacks
5. Mobility — Agility — climb, jump, dodge, foot chases
6. Stealth — Agility — sneak, hide, pick pockets
7. Crafting — Wits — repair/build, operate mechanisms
8. Observation — Wits — spot, search, detect threats
9. Survival — Wits — endure hazardous environments
10. Healing — Empathy — treat wounds, revive the broken
11. Insight — Empathy — read people, see through lies
12. Persuasion — Empathy — convince, deceive, interrogate

### Rolling Dice (Dice Pool)
- Roll Attribute dice + Skill dice (D6s)
- Each 6 = 1 success
- 1+ successes = task succeeds
- More successes = better outcome
- 0 successes = failure (can Push)

### Pushing
- Re-roll all dice that did NOT show a 1 (6s are kept in practice). 1s are locked.
- After the push, the FULL pool counts (kept 6s + locked 1s + re-rolls).
- A 1 on an **attribute** die is a bane → 1 damage (Str/Agi → Health) or stress
  (Wits/Emp → Resolve). Skill 1s do nothing. A 1 on a **gear** die degrades that
  weapon's bonus by 1. Banes only matter on a push, not the initial roll.
- Can only push once per roll.

**Implementation (one unified push):**
- `common.js` holds the shared push logic: `yzeParseInitial` (tag dice + per-type
  counts), `yzeRebuildPool` / `yzeCountPool` (reconstruct & score the full pool
  after a push from scalar counts — no arrays through roll metadata), and
  `yzePushRoll()` — the PUSH button on any tab calls this; it reads the stored
  roll context and routes a skill roll to `yze_push` or an attack to `yze_combat`.
- `data.canPush` (1/0) shows/hides each tab's `pushSection`. Initial roll stores
  `yzeLastRoll` (session) with `mode: 'pool' | 'combat'` + the counts.
- **Attack pushes** (`yze_combat`, `meta.isPush`): recompute damage, apply the
  *delta* to the target, apply attribute banes to the attacker's Health/Resolve,
  and degrade the firing weapon's `bonus` by the gear banes (breaks at 0).
- **Target locking:** the initial hit records each target's `{id, recordType, hp}`
  (post-hit Health) in `yzeLastRoll.targets`. The push re-applies the extra damage
  to those same tokens via `api.setValueOnTokenById(id, recordType, 'data.curHealth', n)`
  — tracking the absolute value, so it lands on the originally-hit foe regardless of
  the current selection. (`setValueOnTokenById` is confirmed in Sean's 5e attack.js.)
- **Auto-apply toggle** (`data.autoApply`, Gear tab, default OFF/opt-in): gates
  ONLY writing damage to a *target's* token. The attacker's own banes and weapon
  wear always apply. `yzeAutoApply(record)` reads it.

### Opposed Rolls
Both sides roll — most successes wins
Ties go to the active party

### Combat
**Initiative:** Draw cards 1-10, lowest acts first, fixed for whole fight

### Initiative — Card System
- Initiative uses api.dealFromDeck('YZE', token._id, '', true, true, callback)
- Deck named "YZE" must exist in Realm VTT campaign with cards valued 1-10
- Callback receives the drawn card value as item
- api.getToken(record) gets the scene token for the current record
- initiativeMode in config is "standard" — the deck draw sets data.initiative directly, order: "asc" handles sort
- SURPRISE: GM manually sets initiative to 0 for surprising attacker (acts before card #1)
- EXCHANGE: GM manually swaps two tokens' initiative values in the tracker
- HIDDEN INITIATIVE: Not implemented — optional rule, can be added later
- NPC GROUPS: GM draws one card for the group, sets all group members to same value
**Actions per turn:** 1 slow action OR 2 fast actions
- Fast: move short distance, draw weapon, aimed shot prep
- Slow: attack, reload, first aid, retreat

**Attack roll:** Melee or Marksmanship skill
**Damage:** Weapon damage rating + extra successes

**Armor:** Reduces damage — roll armor dice, each 6 cancels 1 damage

**Broken:** Reach 0 Health or Resolve
- Immediately roll for critical injury (D66 — see below)
- Can be stabilized by ally (Healing roll)

### Critical Injuries (D66)
- Rolled as **2d6**: first die = tens, second = ones → 11-66 (digits 1-6 only).
- Handler: `rollhandlers/yze-crit.js`, rollType `yze_crit`,
  metadata `{ critType: 'physical' | 'mental' }`.
- Physical table is keyed by exact D66; mental table uses ranges (e.g. 11-16
  Trembling). Both transcribed verbatim from the SRD physical/mental tables.
- Physical 44-62 are lethal (death save vs Stamina after the listed time limit,
  with a -1/-2 save modifier on 52-62); 63-66 are instant kills. Mental 66
  (Heart attack) is also instant death.
- Triggered from buttons on the character sheet (Physical / Mental) and the NPC
  sheet (Phys Crit / Mental Crit). The crit table lookup is the result — there is
  no separate `critical_injuries` record type.

### Conditions (damage variant)
Each damage point = 1 condition (some games use this instead of HP)
Broken when conditions reach threshold (varies by game)

### Specialties (Talents)
Purchased with XP, give special abilities
Each skill can have specialties attached
Some are passive, some activated

---

## Record Types Planned

| Type | Purpose |
|------|---------|
| characters | Player characters |
| npcs | Non-player characters |
| skills | The 12 core skills + custom |
| specialties | Talents and special abilities |
| gear | Weapons, armor, equipment |
| critical_injuries | Critical hit results table |
| conditions | Status conditions |

---

## Sheet Architecture Plan

### Character Sheet Tabs
1. **Character** — name, archetype, attributes, health/resolve
2. **Skills** — all 12 skills with levels and roll buttons
3. **Specialties** — purchased talents
4. **Gear** — inventory with gear dice
5. **Journal** — notes, experience, relationships

### Key UI Features
- Dice pool builder — click attribute + skill to auto-build roll
- Push button — appears after a failed roll
- Bane tracker — shows attribute damage from pushing
- Condition tracker — for games using conditions variant
- Gear condition pips — track wear on equipment

---

## Pending Work
- [ ] Initial ruleset.config.json setup
- [ ] Character sheet (dice pool variant first)
- [ ] Roll handler for YZE dice pool mechanic
- [ ] Push mechanic handler
- [ ] Combat tracker integration
- [ ] Step dice variant (second pass)

---

## License Compliance Checklist
- [ ] YZE FTL logo included in module
- [ ] No Free League brand names used
- [ ] No setting-specific content (no Electric State, Loop, etc.)
- [ ] Credit line: "Powered by Year Zero Engine"
- [ ] Link to FTL license in module description
- [ ] No copyrighted material beyond the SRD

---

## Reference
- Sean's 5e ruleset (most complex, best reference):
  `C:\Users\david\OneDrive\Desktop\ruleset-compiler-main\Source\realmvtt-5e-main\`
- Sean's PF2e ruleset (second reference):
  `C:\Users\david\OneDrive\Desktop\ruleset-compiler-main\Source\realmvtt-pf2e-main\`
- All confirmed API patterns are in the Realm VTT API Reference section below

---

# Realm VTT API Reference
## Confirmed patterns from SEAN_CODE_EXAMPLES.md + PTA/character-main.html + PTA/common.js

> **Rule:** Only use patterns listed here or patterns you can find in the 5e Source files.
> If a method isn't in this document, it is unconfirmed — leave a TODO and ask Sean.

---

## 1. Canvas API

### Getting the canvas context
```javascript
// api.getCanvas() returns the 2D context directly — NO .getContext('2d')
var c = api.getCanvas('myCanvas');
if (!c) return;
```

### Dimensions — properties, not methods
```javascript
var w = c.width;   // NOT c.getWidth()
var h = c.height;  // NOT c.getHeight()
// c.height is a getter ONLY — assigning throws "only a getter" error
// Use a fixed height="N" attribute on the canvas element instead
```

### All drawing calls use SETTER METHODS — property assignment silently fails
```javascript
// CORRECT
c.setFillStyle('#C8902A');
c.setStrokeStyle('rgba(200,144,42,0.4)');
c.setLineWidth(2);
c.setFont('bold 14px serif');
c.setTextAlign('left');        // 'left' | 'center' | 'right'
c.setTextBaseline('top');      // 'top' | 'middle' | 'bottom'
c.setShadowColor('#C8902A');
c.setShadowBlur(8);
c.setShadowOffsetX(0);
c.setShadowOffsetY(0);

// WRONG — silently fails
c.fillStyle = '#C8902A';
c.strokeStyle = 'rgba(...)';
```

### Drawing primitives
```javascript
c.clearRect(0, 0, w, h);     // clear — NOT c.clear()
c.fillRect(x, y, w, h);
c.strokeRect(x, y, w, h);
c.fillText(text, x, y);

// Paths
c.beginPath();
c.moveTo(x, y);
c.lineTo(x2, y2);
c.arc(cx, cy, radius, startAngle, endAngle);
c.closePath();
c.fill();
c.stroke();
```

### Rounded rectangles — NO roundRect(), use manual arcs
```javascript
// Draw a rounded rect with radius r
c.beginPath();
c.moveTo(x + r, y);
c.lineTo(x + w - r, y);
c.arc(x + w - r, y + r,     r, -Math.PI/2, 0);
c.lineTo(x + w, y + h - r);
c.arc(x + w - r, y + h - r, r, 0,          Math.PI/2);
c.lineTo(x + r, y + h);
c.arc(x + r,     y + h - r, r, Math.PI/2,  Math.PI);
c.lineTo(x, y + r);
c.arc(x + r,     y + r,     r, Math.PI,    -Math.PI/2);
c.closePath();
c.fill();
```

### Gradients
```javascript
var grad = c.createLinearGradient(x1, y1, x2, y2, [
  [0, '#1a0a00'],
  [1, '#3d1a00']
]);
c.setFillStyle(grad);
```

### Tooltips
```javascript
c.clearTooltips();                         // call at top of every repaint
c.tooltip(x, y, width, height, 'text');    // hover tooltip over region
```

### Images
```javascript
c.drawImage(imageUrl, x, y, w, h);   // auto-preloads by URL; no Image() needed
// Tabler icon: 'IconBackpack' (NOT 'ti-backpack')
// GameIcons: 'GiSword'
```

### Canvas element attributes
```html
<canvas field="myCanvas" width="460" height="200"
  style="width:100%; display:block;"
  onload="init();"
  onresize="repaint();"
  onrecordchanged="repaint();"
  onclick="handleClick();">
</canvas>
```
- `onrecordchanged` and `onrecordchange` both work
- **Canvas onclick:** use `onclick="handler();"` (no args) — read coordinates via `event.x` / `event.y` inside the handler. Do NOT pass `x, y` as arguments; they are not reliably pre-bound (confirmed from Sean's SWRPG/CPR source files).
- **Click coords vs. drawing coords — CSS-scaling trap:** `event.x` / `event.y` are in CSS *display* pixels, but you draw in the buffer coordinate space set by the `width`/`height` HTML attributes. If CSS stretches the canvas (e.g. `style="width:100%"` on a `width="460"` buffer), `event.x` is scaled by `displayWidth/460` and your hit-test zones silently miss. (The y-axis is unaffected if CSS doesn't set a height — it stays 1:1 with the `height` attribute.) Fix: cap the element to its buffer width so it never stretches — `style="width:100%; max-width:460px"` — which keeps `event.x` 1:1 with drawing coords. Alternatively use `autosize="true"` (CPR pattern), which makes `c.width`/`c.height` report the live display size so you draw and hit-test in the same space.
- Canvas in list-item templates does NOT work (Sean's gotcha #4)

### Canvas-in-list pattern (confirmed)
One canvas on the MAIN sheet reads `record.data.myList[]` and draws all rows.
```javascript
function paintCanvas() {
  var c = api.getCanvas('myCanvas');
  if (!c) return;
  var list = (record && record.data && record.data.myList) || [];
  var ROW_H = 40;
  // NOTE: c.height is read-only — set height="N" on the HTML element, not here
  c.clearRect(0, 0, c.width, c.height);
  c.clearTooltips();

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var y = i * ROW_H;
    // draw row...
    c.tooltip(0, y, c.width, ROW_H, item.name || '');
  }
}

function handleClick() {
  var x    = event.x;
  var y    = event.y;
  var list = (record && record.data && record.data.myList) || [];
  var ROW_H = 40;
  var idx = Math.floor(y / ROW_H);
  if (idx < 0 || idx >= list.length) return;
  var item = list[idx];
  // handle click on item...
}
```

### Opening a list record from canvas (confirmed)
```javascript
// Opens the editor sheet for a list-item record
// listPath: dot-path to the item (e.g. 'data.gearList.0')
// recordType: the record's type string (e.g. 'gear_slot')
api.openListRecord('data.myList.' + idx, item.recordType);
```

---

## 2. Data / Values API

### Set values on CURRENT record
```javascript
api.setValues({
  'data.hp_current': newHp,
  'data.myList.0.data.isEquipped': true
});

// With callback
api.setValues({ 'data.foo': 'bar' }, function() {
  // runs after save
});
```

### Append one item to an array field (confirmed — Sean's character-inventory.html)
```javascript
api.addValue('data.myList', newItem, function() {
  // runs after save
});
// NOTE: do NOT use api.setValues({ 'data.myList': fullArray }) to append —
// use api.addValue for single-item appends; full-array replacement may silently fail
```

### Hide / show boxes and sections from init code
```javascript
// api.setHidden() does NOT reliably work from canvas onload or trailing <script>.
// Use api.setValues with fields paths instead (confirmed — Sean's npcs-main.html):
api.setValues({
  'fields.myBox.hidden':    true,
  'fields.otherBox.hidden': false
});
```

### Set values on a DIFFERENT record
```javascript
api.setValuesOnRecord(targetRecord, {
  'data.hp_current': newHp
}, function(updatedRecord) {
  // optional callback
});
```

### Set a single value
```javascript
api.setValue('data.initiative', value, function() {
  // optional callback
});
```

### Show / hide UI elements
```javascript
api.setHidden('fieldName', true);   // hide
api.setHidden('fieldName', false);  // show
```

### Read a value off a record (confirmed in PTA)
```javascript
var hp = api.getValueOnRecord(targetRecord, 'data.hp_current');
```

### Remove an item from an array field (confirmed — 5e/PF2e/SWRPG)
```javascript
// removeValue(dataPath, index, callback) — deletes list[index] from the array
api.removeValue('data.gearList', rowIdx, function() {
  // runs after save — repaint canvas / recompute totals here
});
// On a different record: api.removeValueFromRecord(record, dataPath, index, cb)
```

### Confirmation dialog before destructive actions (confirmed — PF2e)
```javascript
// showConfirm(title, message, yesText, noText, callback)
// callback fires only if the user clicks the "yes" button
api.showConfirm('Remove Item', 'Remove ' + name + '?', 'Remove', 'Cancel',
  function() { api.removeValue('data.gearList', idx); });
```

### Dot-path notation for nested updates
```javascript
// Array index in path
'data.gearList.2.data.isEquipped'

// Numeric segments build arrays in CSV import
// header 'actions.0.name' → data.actions[0].name
```

---

## 3. Rolling API

### promptRoll — shows dice pool prompt to player (PTA pattern)
```javascript
api.promptRoll(
  'Roll Name',            // display name
  '2d6',                  // dice notation
  [{ label: 'Bonus', value: 1 }],  // modifiers array (can be [])
  { myMeta: 'value' },    // metadata passed to roll handler
  'my_roll_type'          // rollType string matching ruleset.config.json
);
```

### api.roll — direct roll without prompt (YZE pattern)
```javascript
api.roll(
  '3d6',                  // dice notation
  {                       // metadata passed to roll handler
    skillName: 'Fight',
    attrCount: 3,
    gearCount: 1,
    isAttack: true
  },
  'yze_combat'            // rollType
);
```

### Roll handler structure
```javascript
// rollhandlers/my-handler.js — top-level script, NO function wrapper
// data.roll contains the full roll result
var dice = data.roll && data.roll.dice || [];
var meta = data.roll && data.roll.metadata || {};

for (var i = 0; i < dice.length; i++) {
  var val  = parseInt(dice[i].value, 10);
  var type = dice[i].type || 'base_attr';
  // type values: 'base_attr', 'base_skill', 'gear', 'base'
}
```

### api.dealFromDeck — card draw initiative
```javascript
// Signature: dealFromDeck(deckName, target, slot, faceUp, exclusive, callback)
var token  = api.getToken(record);
var target = token ? token._id : record;  // pass record directly if no token

api.dealFromDeck('DeckName', target, '', true, true, function(item) {
  if (!item) return;
  api.setValue('data.initiative', item, function() {
    api.sendMessage(record.name + ' draws: ' + item, undefined, [], []);
  });
});
```

---

## 4. Chat / Messaging API

### Send a chat message
```javascript
// Full signature: sendMessage(message, roll, whisperTargets, tags)
api.sendMessage(
  'Hello world',         // message string
  undefined,             // roll object (from data.roll) or undefined
  [],                    // whisper targets array ([] = public)
  [{ name: 'Roll Name', tooltip: 'Optional tooltip' }]  // roll card tags
);

// With roll result attached
api.sendMessage(msg, data.roll, [], [{ name: skillName }]);
```

### Chat message formatting
Confirmed against Sean's 5e/CPR/SWRPG roll handlers. Use these forms only:
```
**bold**                       bold goes OUTSIDE center/color
[center]centered[/center]
[color=green]text[/color]      green | red | orange | olive | blue
[gm]GM-only text[/gm]
\n   \n\n                       line breaks
```
Sean's exact verdict pattern: `**[center][color=green]SUCCESS[/color] - 2 successes[/center]**`
- Do NOT use `## Heading` markdown or `_italic_` inside other tags — they render as
  literal text. Use `**[center]Title[/center]**` for a heading instead.
- Keep it plain ASCII (no em dashes `—`, no `×`/`→`, no emoji) — those can render raw.

### Showing the dice rolled (DO NOT hand-format dice as text)
Realm renders the dice itself when you pass the **roll object** as the 2nd arg of
sendMessage. To tint individual dice, set `die.customColor` on the roll's dice — do
NOT build a text string of `[color]`-wrapped numbers (that was tried and failed).
```javascript
// 6 = success (green), 1 = bane (red) — see yzeColorDice() in common.js
for (var i = 0; i < data.roll.dice.length; i++) {
  var v = parseInt(data.roll.dice[i].value, 10);
  if (v === 6) data.roll.dice[i].customColor = 'green';
  else if (v === 1) data.roll.dice[i].customColor = 'red';
}
api.sendMessage(verdictText, data.roll, [], [{ name: 'Fight', tooltip: 'Fight roll' }]);
```
`die.isNegative = true` renders a die as a subtracted/negative result (CPR pattern).
The message text should carry only the verdict; the dice come from the roll object.

### Inline chat action buttons (confirmed — Sean's 5e/CPR roll handlers)

Chat messages can contain clickable buttons via triple-backtick code blocks embedded
in the message string. The button label is the text on the opening backtick line; the
code runs when the player clicks it.

```javascript
// ES5 — construct with string concatenation (no template literals in roll handlers)
var btn = '```Button_Label\n' +
  'var _s = api.getSession(\'myKey\');\n' +
  'if (_s) { api.roll(_s.count + \'d6\', _s.meta, \'my_rolltype\'); }\n' +
  '```';
msg += '\n' + btn;
```

- The button code runs in Realm's global context — `api.*` is available.
- Custom sheet functions (e.g. `yzePushRoll()`) are **not** reliably available;
  use `api.roll()`, `api.getSession()`, `api.addEffect()` etc. directly.
- `api.setValues()` without an explicit record ID targets the **current record**
  of the clicking user — safe for self-rolls, avoid for cross-record writes.
- The button renders as a clickable chip in the chat card.
- Use underscores in the button label, not spaces.

### Notification (toast popup)
```javascript
api.showNotification(
  'Message text',
  'red',          // 'red' | 'green' | 'blue' | 'orange'
  'Title'
);
```

---

## 5. Targeting & Tokens API

### Get current scene token
```javascript
var token = api.getToken(record);
// Returns null if record is not placed on a scene
// Safe pattern: var name = token ? token.name : (record.name || 'Unknown');
```

### Get targeted tokens
```javascript
// Returns [{token, distance}] wrappers — always unwrap via .token
var targets = api.getTargets();
for (var i = 0; i < targets.length; i++) {
  var token = targets[i].token;
  var dist  = targets[i].distance;
  var id    = token._id;
  var data  = token.data;
}
```

### Get a record by type and ID
```javascript
// Confirmed in PTA/character-main.html
api.getRecord('pokemon', someId, function(rec) {
  if (!rec) return;
  var d = rec.data;
});
// Returns null if ID is a token-instance (not a compendium record)
```

---

## 6. Effects API

### Add / remove effects
```javascript
api.addEffect('Burn', targetToken);
api.addEffect('Burn', targetToken, 3);                    // override duration
api.addEffect('Burn', targetToken, { value: 3, unit: 'rounds' });
api.addEffect('Burn', targetToken, undefined, attackerToken);  // caster ref
api.addEffects(['Burn', 'Paralyzed'], targetToken);
api.addEffectById('effect-id', targetToken);
api.removeEffectById('effect-id', targetToken);
api.deductEffectById('effect-id', targetToken);           // remove one stack
```

### Duration unit values
`rounds` `seconds` `minutes` `hours` `days`
`end_turn` `start_turn` `end_applier_turn` `start_applier_turn`

### Reading effects on a token (turn handler)
```javascript
var effects = (token && token.effects) || [];
for (var i = 0; i < effects.length; i++) {
  var effect = effects[i];
  var rules  = effect.rules || [];
  for (var j = 0; j < rules.length; j++) {
    var rule = rules[j];
    if (rule.type === 'ongoingDamage') { /* ... */ }
  }
}
```

### Effect predicate evaluator (PTA3 version)
```javascript
function evaluateEffectPredicate(predicate, traitsSet) {
  if (!predicate || !Array.isArray(predicate)) return true;
  for (var i = 0; i < predicate.length; i++) {
    var cond = predicate[i];
    if (typeof cond === 'string') {
      if (!traitsSet.has(cond)) return false;
    } else if (cond && cond.not && Array.isArray(cond.not)) {
      for (var j = 0; j < cond.not.length; j++) {
        if (traitsSet.has(cond.not[j])) return false;
      }
    }
  }
  return true;
}
```

### Defining effect rule types in ruleset.config.json
```json
"settings": {
  "effects": [
    {
      "label": "Ongoing Damage",
      "type": "ongoingDamage",
      "fields": [{ "label": "Damage Roll", "field": "damage" }]
    }
  ]
}
```

---

## 7. HTML Fields / UI Elements

### Common input fields
```html
<textfield    field="myField"  label="Label"  size="xs|sm|md|lg" />
<numberfield  field="myNum"    label="Num"    minvalue="0" maxvalue="10" defaultvalue="0" />
<checkbox     field="myBool"   label="Check"  size="xs" />
<dropdown     field="myDrop"   label="Type"   options='[{"label":"A","value":"a"}]' />
<namefield    field="name"     label=""       placeholder="Name..." bold="true" />
<richtextfield field="notes"   label=""       height="120px" placeholder="..." />
```

### Styling input fields — Mantine child class targeting (confirmed by Sean)

Realm VTT's `numberfield` / `stringfield` / etc. render as:
```
<div class="YOUR-CLASS">          ← class= attribute lands here (the wrapper div)
  <div class="mantine-NumberInput-root">
    <input class="mantine-NumberInput-input">   ← the actual input element
    <div class="mantine-NumberInput-controls">  ← +/- steppers
      <button class="mantine-NumberInput-control"> ...
    </div>
  </div>
</div>
```

CSS `<style>` block selectors targeting `.mantine-NumberInput-input` alone are too
low-specificity to beat Mantine's defaults. The fix is to add `class="yze-input"` (or
any name) to the field element, which Realm forwards onto the outer wrapper `<div>`,
then use a descendant selector from that wrapper to reach the Mantine child:

```html
<numberfield field="hp" class="yze-input" label="HP" size="sm"></numberfield>
```

```css
/* In the <style> block — scoped via the wrapper class we own */
.yze-input .mantine-NumberInput-input {
  background-color: #1a140d !important;
  border-color:     #3a2e1c !important;
  color:            #f0d9b5 !important;
}
.yze-input .mantine-NumberInput-control {
  background-color: transparent !important;
  color:            #c8902a !important;
  border-color:     #3a2e1c !important;
}
```

**Mantine NumberInput CSS classes** (from https://mantine.dev/core/number-input/?t=styles-api):

| Class | Targets |
|---|---|
| `mantine-NumberInput-root` | Root element |
| `mantine-NumberInput-wrapper` | Input wrapper |
| `mantine-NumberInput-input` | The `<input>` element |
| `mantine-NumberInput-section` | Left / right sections |
| `mantine-NumberInput-controls` | +/− stepper buttons wrapper |
| `mantine-NumberInput-control` | Individual +/− stepper button |
| `mantine-NumberInput-label` | Label element |
| `mantine-NumberInput-error` | Error element |

Same pattern applies to other field types — check the Mantine styles API for each
component's class list (e.g. `mantine-TextInput-input`, `mantine-Select-input`).

### Simpler alternative — variant="unstyled" (recommended by Sean)
If targeting Mantine child classes is too complex, add `variant="unstyled"` to the
field element. Mantine strips all its own CSS, leaving a bare `<input>`. Then wrap
the field in a `<div>` and apply your styles to the div — or use `.yze-sheet input`
which now wins unopposed:

```html
<div class="yze-input-wrap">
  <numberfield field="hp" variant="unstyled" label="HP" size="sm"></numberfield>
</div>
```

```css
.yze-input-wrap {
  background: #1a140d;
  border: 1px solid #3a2e1c;
  border-radius: 4px;
}
/* Or globally once Mantine is out of the way */
.yze-sheet input {
  background-color: #1a140d !important;
  border-color: #3a2e1c !important;
  color: #f0d9b5 !important;
}
```

### Use Mantine color variables, not hardcoded hex (recommended by Sean)
Hardcoded hex colors break when a user switches the Realm VTT theme. Use Mantine's
CSS color variables so your sheet recolors automatically:

```css
/* Instead of: background-color: #1a0a00 */
background-color: var(--mantine-color-dark-8);

/* Instead of: color: #f0d9b5 */
color: var(--mantine-color-gray-2);

/* Instead of: border-color: #3a2e1c */
border-color: var(--mantine-color-dark-4);
```

Common dark-theme variables (light→dark: 0=lightest, 9=darkest for gray; reversed for dark):
`--mantine-color-dark-0` … `--mantine-color-dark-9`
`--mantine-color-gray-0` … `--mantine-color-gray-9`
Full palette: https://mantine.dev/theming/colors/

### Button with onclick
```html
<!-- Confirmed in PTA/character-main.html -->
<button field="myBtn" label="Click Me" onclick="myFunction();" size="sm" />
```

### Button colors — use color= attribute, NOT CSS
Confirmed from Sean's 5e/PF2e source files (`attack-list.html`, `npc-actions-list.html`,
`character-features-list.html`). The `color=` prop is the only reliable way to override
Mantine's default indigo/purple. CSS `<style>` block selectors do NOT reach Mantine's
rendered button elements.

```html
<!-- Filled red button — omit variant="filled", let color= drive the style -->
<button field="critBtn" label="Critical" color="red" size="xs" onclick="roll();"></button>

<!-- Outline orange button -->
<button field="plusBtn" label="+" color="orange" variant="outline" size="xs" onclick="add();"></button>

<!-- Primary color (uses ruleset primary) -->
<button field="sendBtn" color="primary" variant="filled" onclick="send();"></button>

<!-- Default/neutral -->
<button field="rollBtn" color="default" variant="subtle" onclick="roll();"></button>
```

**Critical rule:** Do NOT combine `variant="filled"` with `color=` — `variant="filled"`
conflicts with the `color` prop and the button renders in Mantine's default indigo instead.
Omit `variant` entirely when using `color=`, or use `variant="outline"` (outline is safe).

Confirmed Mantine color names: `red`, `orange`, `yellow`, `green`, `blue`, `primary`, `default`

**Unconfirmed:** custom hex values via `color="#c8902a"` or CSS variable overrides
via `style="--button-bg:#cc3333"` — pending Sean confirmation.

### Box (show/hide container)
```html
<box field="myBox">
  <!-- content shown/hidden via api.setHidden('myBox', bool) -->
</box>
```

### Accordion
```html
<!-- Confirmed in PTA/character-main.html -->
<accordion field="mySection" label="Section Title">
  <!-- collapsible content -->
</accordion>
```

### List (drag-drop list of sub-records)
```html
<!-- listtype must be an isList:true record type -->
<list field="myList" listtype="my_entry" lazy="false" scroll="auto" height="300px">
</list>
```
- `lazy="false"` — load all items, not lazily
- List-item templates do NOT support canvas (gotcha #4)

### List item context — reading item vs owner fields (confirmed by Sean)

Inside a list-item template, `api.getValue('data.X')` always reads the
**TOP-LEVEL owning record** (e.g. the character), NOT the list item itself.
Use `dataPath` + the helpers below to read the **item's own fields**:

```javascript
// ES5 — add these to every list-item template's <script> block
function getNearestParentDataPath(dp) {
  var parts = dp.split('.data');
  return parts.length > 1 ? parts.slice(0, -1).join('.data') : '';
}

function getItemContext() {
  var itemDataPath = getNearestParentDataPath(dataPath);
  var item         = itemDataPath ? api.getValue(itemDataPath) : record;
  var dp           = itemDataPath ? itemDataPath + '.data'     : 'data';
  var fp           = itemDataPath ? itemDataPath + '.fields'   : 'fields';
  return { item: item, dataPrefix: dp, fieldsPath: fp };
}

// Usage:
var ctx       = getItemContext();
var itemField = api.getValue(ctx.dataPrefix + '.myField'); // reads the LIST ITEM
var charField = api.getValue('data.strength');             // reads the CHARACTER
```

Key rules:
- `api.getValue('data.X')` → **top-level** record (correct for owner attributes)
- `api.getValue(ctx.dataPrefix + '.X')` → **this list item's** own field
- `record.data.X` also reads the top-level record (same as `api.getValue`)
- `dataPath` is the path to the current item's position in the parent record tree
- Both reads are useful: item fields via `dataPrefix`, owner fields via `'data.X'`

### recordselectlist (compendium picker)
```html
<recordselectlist
  field="picker"
  width="100%"
  height="400px"
  size="sm"
  label="Select Item"
  onchange="onSelect(value);"
  query='{"type": "items", "query": {}}'
  filters='[{"label":"Type","field":"type","options":[{"label":"Armor","value":"armor"}]}]'
  searchable="true"
  selectable="true">
</recordselectlist>
```
- Inner `query` field filtering does NOT work — use `filters` for filtering

### Drop zone (drag record onto sheet)
```javascript
// onDrop fires when a record is dropped on the sheet
function onDrop(type, recordLink, sourceInfo) {
  if (type !== 'myType') return;
  var rec = recordLink.value;    // full record — no api.getRecord() needed
  if (!rec || !rec.data) return;
  api.setValues({ 'data.myField': rec.data.someField });
}
```

### Portrait field (confirmed per Sean)
```html
<portrait field="portrait" width="56" height="56"
  style="border-radius:3px; border:1px solid #3a2e22;
    flex-shrink:0; cursor:pointer;">
</portrait>
```
- Renders the record's portrait image
- Clicking it opens the record sheet automatically — no JS needed
- Use on all record types for image + click-to-open behavior
- In canvas rows, portrait URL is at `item.portraitUrl || item.portrait`
  (TODO: verify exact field name with Sean)
- Canvas draw: `c.drawImage(portraitUrl, x, y, w, h)` — auto-preloads, no Image() needed

---

## 8. Record Config Patterns

### isList: false — standalone compendium record
```json
{
  "name": "Items",
  "type": "items",
  "isList": false,
  "hasToken": false,
  "hideFromCompendium": false,
  "icon": "GiBackpack"
}
```

### isList: true — list-item row template (embedded in other records)
```json
{
  "name": "Item Entry",
  "type": "item_entry",
  "isList": true,
  "allowedListTypes": ["characters"],
  "hideFromCompendium": true
}
```
- `isList: true` records do NOT appear in the compendium regardless of `hideFromCompendium`
- `allowedListTypes` — which parent record types this can be dragged into

### Combat tracker config
```json
"settings": {
  "combatTracker": {
    "initiative": "initiative",
    "initiativeMode": "standard",
    "order": "desc",
    "onTurnStart":      { "file": "rollhandlers/onTurnStart.js" },
    "onRollInitiative": { "file": "rollhandlers/onRollInitiative.js" }
  }
}
```

### Roll types
```json
"rollTypes": [
  { "name": "my_roll", "file": "rollhandlers/my-roll.js" }
]
```

### Common script (shared JS loaded on all tabs)
```json
"otherSettings": {
  "commonScript": { "file": "common.js" }
}
```

### damageScript / healingScript
```json
"settings": {
  "damageScript":  { "file": "rollhandlers/onDamage.js" },
  "healingScript": { "file": "rollhandlers/onHeal.js" }
}
```

---

## 9. ES5 Rules (Realm VTT uses ES5)

```javascript
// NO const/let — use var
// NO arrow functions — use function(){}
// NO template literals — use string concatenation
// NO .map()/.filter()/.forEach() — use for loops
// NO Set/Map — use plain objects for lookups
// NO ...spread — use explicit assignment
// NO default parameters — check args inside function
// NO Object.assign — build objects manually

// CORRECT patterns
var x = 5;
var arr = [];
for (var i = 0; i < arr.length; i++) { /* ... */ }
function handler() { /* ... */ }
var str = 'Hello ' + name + '!';
```

---

## 10. Confirmed Gotchas

1. `c.getWidth()` / `c.getHeight()` — do not exist; use `c.width` / `c.height`
2. `c.clear()` — does not exist; use `c.clearRect(0, 0, c.width, c.height)`
3. `c.fillStyle = '...'` — silently fails; use `c.setFillStyle('...')`
4. Canvas in list-item templates — does NOT work; use one canvas on the main sheet
5. `c.height = newH` — throws "only a getter" error; height is READ-ONLY. Set a fixed `height="N"` on the canvas HTML element instead. Use `autosize="true"` if you need it to fill available space.
6. `api.getRecord(type, id)` returns null if the ID is a token-instance (not compendium)
7. `recordselectlist` inner query field filtering does NOT work; use `filters` attribute
8. `onrecordchanged` vs `onrecordchange` — both spellings appear to work
9. Effect rules do nothing on their own — code must read `token.effects` and apply mechanics
10. `<list listtype="myType">` silently ignores drops if `myType` has `isList: false`
11. Infinite loop risk: canvas `onrecordchanged` calling `api.setValues()` triggers itself — only write if values actually changed
12. `api.getTargets()` returns `{token, distance}` wrappers, NOT bare records — unwrap via `.token`
13. `onDrop(type, recordLink)` requires a `<list>` element on the same tab to act as the visual drop target — without one the user has no droppable surface and the function never fires
14. `api.setHidden()` does not reliably work from canvas `onload` or trailing `<script>` blocks — use `api.setValues({'fields.fieldName.hidden': bool})` instead
15. **Canvas empty-state trap:** always build the filtered layout first, THEN check if `layout.rows.length === 0`. Checking `list.length === 0` before filtering will skip the empty state for lists that have items of the wrong type (e.g. a gear list with only weapons when the canvas filters to armor/equipment only). The empty state should also distinguish between a truly empty list and a list with items that were filtered out.
16. `<style>` block CSS selectors targeting bare Mantine elements (e.g. `button[field="..."]`, `.mantine-NumberInput-input` alone) lose the specificity battle against Mantine's defaults — scope them via a wrapper class you own (see Section 7 input and button notes)
16. `variant="filled"` conflicts with `color=` on buttons — omit `variant` when using `color=`, otherwise the button renders in Mantine's default indigo
17. `class=` on a field element (numberfield, stringfield, etc.) is forwarded to the outer wrapper `<div>`, NOT to the inner Mantine component — use it as a scope anchor: `.your-class .mantine-NumberInput-input { ... }`

---

## 11. Unconfirmed — Do NOT Use Without Asking Sean

- `api.openRecord(recordType, id)` — found in one SWRPG wizard file but inconsistent signature; prefer `api.openListRecord` for list items
- `api.getOwnerValue(field)` — not found; to read parent character data from a gear item, ask Sean
- `api.setFieldValue(field, value)` — not found; use `api.setValues({...})` instead
- `fields.myField.hidden = true` — fragile; prefer `api.setHidden('myField', bool)`

---

*Sources: SEAN_CODE_EXAMPLES.md, PTA/character-main.html, PTA/common.js — May 2026*
