// Tests for YZE common.js — the pure dice-pool / push math and roll modifiers.
// Run: node tests/test-common.js   (or via tests/run-all.js)

const { createSandbox } = require("./sandbox");
const { assert, section, summary } = require("./test-helpers");

const ctx = createSandbox();
const {
  yzeParseInitial,
  yzeRebuildPool,
  yzeCountPool,
  yzeApplyPenalty,
  yzeApplyModifier,
  yzeVerdict,
  yzePoolForAttr,
  yzePoolFieldForRecord,
  yzeAutoApply,
  yzeFormatDifficulty,
  yzeArmorTotal,
} = ctx;

// Helper: build a dice array from raw values.
function dice() {
  return Array.prototype.slice.call(arguments).map((v) => ({ value: v }));
}

section("yzeParseInitial — tag dice [attr][skill][gear] + per-type counts");
{
  // attr: 6,1,3  skill: 6,2  gear: 1
  const o = yzeParseInitial(dice(6, 1, 3, 6, 2, 1), 3, 2);
  assert("typed length = 6", o.typed.length, 6);
  assert("successes (two 6s)", o.successes, 2);
  assert("rerollCount (the 3 and the 2)", o.rerollCount, 2);
  assert("s6Attr", o.s6Attr, 1);
  assert("s6Skill", o.s6Skill, 1);
  assert("s6Gear", o.s6Gear, 0);
  assert("b1Attr (the attr 1)", o.b1Attr, 1);
  assert("b1Skill", o.b1Skill, 0);
  assert("b1Gear (the gear 1)", o.b1Gear, 1);
  assert("rerollAttr (the 3)", o.rerollAttr, 1);
  assert("rerollSkill (the 2)", o.rerollSkill, 1);
  assert("rerollGear", o.rerollGear, 0);
  assert("first die typed base_attr", o.typed[0].type, "base_attr");
  assert("skill die typed base_skill", o.typed[3].type, "base_skill");
  assert("gear die typed gear", o.typed[5].type, "gear");
}

section("yzeParseInitial — gear 1s are tracked but never count as successes");
{
  const o = yzeParseInitial(dice(1, 1), 0, 0); // both gear, both 1s
  assert("no successes", o.successes, 0);
  assert("both gear banes", o.b1Gear, 2);
  assert("nothing to reroll (1s are locked)", o.rerollCount, 0);
}

section("yzeCountPool — score a typed pool (6 = success, 1 = bane by source)");
{
  const all = [
    { value: 6, type: "base_attr" },
    { value: 1, type: "base_attr" },
    { value: 1, type: "gear" },
    { value: 1, type: "base_skill" }, // skill 1s do nothing
    { value: 5, type: "base_skill" },
  ];
  const r = yzeCountPool(all);
  assert("successes", r.successes, 1);
  assert("attrBanes", r.attrBanes, 1);
  assert("gearBanes", r.gearBanes, 1);
}

section("yzeRebuildPool — kept dice + re-rolled, re-tagged by position");
{
  const meta = {
    s6Attr: 1, s6Skill: 1, s6Gear: 0,
    b1Attr: 1, b1Skill: 0, b1Gear: 1,
    rerollAttr: 1, rerollSkill: 1, rerollGear: 0,
  };
  const all = yzeRebuildPool(meta, dice(6, 4)); // reroll: 1 attr then 1 skill
  assert("pool size = 2 kept-6 + 2 kept-1 + 2 reroll", all.length, 6);
  // round-trip through the scorer
  const r = yzeCountPool(all);
  assert("successes (two kept 6s + one rerolled 6)", r.successes, 3);
  assert("attrBanes (kept attr 1)", r.attrBanes, 1);
  assert("gearBanes (kept gear 1)", r.gearBanes, 1);
  // the rerolled 6 was at index 0 -> tagged base_attr; the 4 -> base_skill
  const rerolledAttrSix = all.filter((d) => d.value === 6 && d.type === "base_attr").length;
  assert("rerolled 6 re-tagged as attr", rerolledAttrSix, 2);
}

section("yzeApplyPenalty — remove dice skill -> gear -> attr (SRD p.10)");
{
  assert("penalty 1 hits skill first",
    yzeApplyPenalty({ attr: 3, skill: 2, gear: 1 }, 1), { attr: 3, skill: 1, gear: 1 });
  assert("penalty 4 drains skill, then gear, then attr",
    yzeApplyPenalty({ attr: 3, skill: 2, gear: 1 }, 4), { attr: 2, skill: 0, gear: 0 });
  assert("penalty 0 is a no-op",
    yzeApplyPenalty({ attr: 3, skill: 2, gear: 1 }, 0), { attr: 3, skill: 2, gear: 1 });
}

section("yzeApplyModifier — positive adds skill dice, negative removes");
{
  assert("+2 adds skill dice",
    yzeApplyModifier({ attr: 3, skill: 1, gear: 0 }, 2), { attr: 3, skill: 3, gear: 0 });
  assert("-2 removes via penalty order",
    yzeApplyModifier({ attr: 3, skill: 1, gear: 1 }, -2), { attr: 3, skill: 0, gear: 0 });
  assert("0 is a no-op",
    yzeApplyModifier({ attr: 3, skill: 1, gear: 0 }, 0), { attr: 3, skill: 1, gear: 0 });
}

section("yzeVerdict — unopposed");
{
  assert("2 successes",
    yzeVerdict(2, 0), "**[center][color=green]SUCCESS[/color] - 2 successes[/center]**");
  assert("1 success is singular",
    yzeVerdict(1, 0), "**[center][color=green]SUCCESS[/color] - 1 success[/center]**");
  assert("0 successes = failure",
    yzeVerdict(0, 0), "**[center][color=red]FAILURE[/color][/center]**");
}

section("yzeVerdict — opposed (ties fail as the active party, SRD p.11)");
{
  assert("win by net successes",
    yzeVerdict(3, 1), "**[center][color=green]SUCCESS[/color] - won by 2 (3 vs 1)[/center]**");
  assert("tie fails",
    yzeVerdict(2, 2), "**[center][color=red]TIE - you fail[/color] (2 vs 2)[/center]**");
  assert("fewer successes = failure",
    yzeVerdict(1, 3), "**[center][color=red]FAILURE[/color] (1 vs 3)[/center]**");
}

section("yzePoolForAttr — Str/Agi cost Health, Wits/Emp cost Resolve");
{
  assert("strength -> curHealth", yzePoolForAttr("strength"), "curHealth");
  assert("agility -> curHealth", yzePoolForAttr("agility"), "curHealth");
  assert("wits -> curResolve", yzePoolForAttr("wits"), "curResolve");
  assert("empathy -> curResolve", yzePoolForAttr("empathy"), "curResolve");
}

section("yzePoolFieldForRecord — NPCs are Health-only");
{
  assert("npc wits bane still hits Health",
    yzePoolFieldForRecord({ recordType: "npcs" }, "wits"), "curHealth");
  assert("character wits bane hits Resolve",
    yzePoolFieldForRecord({ recordType: "characters" }, "wits"), "curResolve");
  assert("no record defaults to Health",
    yzePoolFieldForRecord(null, "strength"), "curHealth");
}

section("yzeAutoApply — opt-in, off by default");
{
  assert("true", yzeAutoApply({ data: { autoApply: true } }), true);
  assert("1 (legacy truthy)", yzeAutoApply({ data: { autoApply: 1 } }), true);
  assert("false", yzeAutoApply({ data: { autoApply: false } }), false);
  assert("unset", yzeAutoApply({ data: {} }), false);
  assert("null record", yzeAutoApply(null), false);
}

section("yzeFormatDifficulty — chat labels (blank when Average)");
{
  assert("easy", yzeFormatDifficulty("easy"), "Easy (+1)");
  assert("hard", yzeFormatDifficulty("hard"), "Hard (-2)");
  assert("formidable", yzeFormatDifficulty("formidable"), "Formidable (-3)");
  assert("average -> blank", yzeFormatDifficulty("average"), "");
  assert("blank -> blank", yzeFormatDifficulty(""), "");
}

section("yzeArmorTotal — explicit data.armor wins, else sum worn armorRating");
{
  // Explicit rating (NPC style)
  const direct = (path) => (path === "data.armor" ? 3 : null);
  assert("explicit data.armor = 3", yzeArmorTotal(direct), 3);

  // Sum worn armor from gearList (PC style)
  const worn = (path) => {
    if (path === "data.armor") return "0";
    if (path === "data.gearList")
      return [
        { data: { gearType: "armor", armorRating: 2 } },
        { data: { gearType: "armor", armorRating: 1 } },
        { data: { gearType: "weapon", damage: 2 } }, // ignored
      ];
    return null;
  };
  assert("sum of worn armorRating = 3", yzeArmorTotal(worn), 3);

  // Nothing worn
  const none = (path) => (path === "data.gearList" ? [] : "0");
  assert("no armor = 0", yzeArmorTotal(none), 0);
}

process.exit(summary());
