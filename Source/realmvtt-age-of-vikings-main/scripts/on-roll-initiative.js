var initiativeToken = data && data.token;
var initiativeDex = Number(initiativeToken && initiativeToken.data && initiativeToken.data.dex) || 0;
var initiativeName = (initiativeToken && (initiativeToken.name || (initiativeToken.record && initiativeToken.record.name))) || "Combatant";
api.promptRollForToken(
  initiativeToken,
  "DEX rank for " + initiativeName,
  "1d1 + " + Math.max(0, initiativeDex - 1),
  [],
  { rollName: "DEX Rank", tooltip: "Descending DEX combat rank", dexRank: initiativeDex },
  "initiative"
);
