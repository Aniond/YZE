// YZE onRollInitiative — Card draw initiative
// Fires from Combat Tracker Menu > Roll Initiative
// SRD: Cards 1-10, lowest acts first, fixed for whole combat.

var token = api.getToken(record);

var callback = function(item) {
  if (!item) return;
  // api.dealFromDeck() delivers the card value as a scalar (number or string),
  // not an object — item.name would be undefined. Treat item directly as the value.
  var cardNum     = parseInt(item, 10);
  var chatDisplay = isNaN(cardNum) ? String(item) : String(cardNum);
  api.setValue('data.initiative', item, function() {
    var name = token ? token.name : (record.name || 'Unknown');
    api.sendMessage(
      name + ' draws initiative ' + chatDisplay,
      undefined, [], []
    );
  });
};

if (!token) {
  api.dealFromDeck('YZE', record, '', true, true, callback);
} else {
  api.dealFromDeck('YZE', token._id, '', true, true, callback);
}
