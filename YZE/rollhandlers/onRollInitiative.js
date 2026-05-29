// YZE onRollInitiative — Card draw initiative
// Fires from Combat Tracker Menu > Roll Initiative
// SRD: Cards 1-10, lowest acts first, fixed for whole combat.

var token = api.getToken(record);

var callback = function(item) {
  if (!item) return;
  var cardName = item.name || '';
  var cardNum  = parseInt(cardName, 10);
  var chatDisplay = isNaN(cardNum) ? cardName : cardNum;
  // Store the numeric card value so the combat tracker can sort on it
  // (order: "asc" → card #1 acts first, per SRD).
  var initVal = isNaN(cardNum) ? item : cardNum;
  api.setValue('data.initiative', initVal, function() {
    var name = token ? token.name : (record.name || 'Unknown');
    api.sendMessage(
      name + ' draws initiative ' + chatDisplay + ' (' + cardName + ')',
      undefined, [], []
    );
  });
};

if (!token) {
  api.dealFromDeck('YZE', record, '', true, true, callback);
} else {
  api.dealFromDeck('YZE', token._id, '', true, true, callback);
}
