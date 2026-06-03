// YZE onTurnStart
var token = data && data.token;
if (!token) return;

var tokenName = token.name || 'Unknown';

// Announce turn start
api.sendMessage(
  '**[center]' + tokenName + '\'s turn[/center]**',
  undefined,
  [],
  []
);

// Reset push state at start of each turn.
// api.setValueOnToken(token, path, val) is unconfirmed — use the confirmed form:
// api.setValueOnTokenById(id, recordType, path, value)
if (parseInt((token.data && token.data.canPush) || '0', 10) > 0) {
  api.setValueOnTokenById(token._id, token.recordType || 'characters', 'data.canPush', 0);
}
