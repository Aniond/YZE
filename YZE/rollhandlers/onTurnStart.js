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

// Reset push state at start of each turn
if (parseInt((token.data && token.data.canPush) || '0', 10) > 0) {
  api.setValueOnToken(token, 'data.canPush', 0);
}
