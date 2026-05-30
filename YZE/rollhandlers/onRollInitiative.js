// YZE onRollInitiative — Card draw initiative
// Fires from Combat Tracker Menu > Roll Initiative
// SRD: Cards 1-10, lowest acts first, fixed for whole combat.

var token = api.getToken(record);

var callback = function(item) {
  if (!item) return;
  var cardName = item.name || '';
  var cardNum  = parseInt(cardName, 10);
  var chatDisplay = isNaN(cardNum) ? cardName : cardNum;
  // Store the dealt CARD OBJECT (not the parsed number) so the combat tracker
  // renders the card face in the Init column. Realm sorts on the card's own
  // value (order: "asc" → card #1 acts first, per SRD). The chat line still
  // shows the numeric value for readability.
  api.setValue('data.initiative', item, function() {
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
