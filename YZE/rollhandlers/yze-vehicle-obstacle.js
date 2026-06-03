// YZE yze_vehicle_obstacle — Vehicle Chase Obstacle (D10), SRD p.29.
// Structure matches yze-crit.js exactly.

var dice   = (data && data.roll && data.roll.dice) || [];
var result = dice.length > 0 ? parseInt(dice[0].value, 10) : 1;
if (isNaN(result) || result < 1)  result = 1;
if (result > 10) result = 10;

var VEHICLE = {
  1:  { name: 'Dead End',
        effect: 'If the prey has chosen to Pursue/Flee, Hide, or Block, the maneuver fails automatically.' },
  2:  { name: 'Downpour',
        effect: 'A sudden downpour makes it difficult to see and the pavement slippery. Pursue/Flee maneuver gets a disadvantage, but Hide gets an advantage.' },
  3:  { name: 'Vehicle/Cart',
        effect: 'A car or cart pulls in and blocks the way. Block gets an advantage. Pursue/Flee gets a disadvantage, and any failed such maneuver inflicts D3 points of damage to the driver\'s vehicle.' },
  4:  { name: 'Red Lights',
        effect: 'The traffic lights turn red and a throng of people cross the street. Cut Off gets an advantage. Pursue/Flee and Stand and Shoot get a disadvantage. Any failed such maneuver results in collateral damage.' },
  5:  { name: 'Patrol Car',
        effect: 'A police patrol car joins the fray, sirens blaring. Pursue/Flee, Hide, and Stand and Shoot all get a disadvantage. Anyone who performs the Stand and Shoot maneuver will be fired upon by the police.' },
  6:  { name: 'Freeway',
        effect: 'The vehicles move onto a wide freeway with multiple lanes, traffic clearing. Pursue/Flee and Stand and Shoot get an advantage. Hide and Block get a disadvantage.' },
  7:  { name: 'Roadworks',
        effect: 'A major roadworks is up ahead. Hide, Block, and Cut Off get an advantage. Pursue/Flee and Stand and Shoot get a disadvantage. A failed Pursue/Flee roll inflicts D3 points of damage to the vehicle.' },
  8:  { name: 'Cyclists',
        effect: 'A group of dozens of cyclists forms a noisy, clanking, almost impenetrable barrier. Block gets an advantage. Pursue/Flee and Stand and Shoot get a disadvantage. Any failed such maneuver results in collateral damage.' },
  9:  { name: 'Truck',
        effect: 'A massive truck blocks the way. Cut Off gets an advantage. Pursue/Flee gets a disadvantage. A failed Pursue/Flee roll inflicts D6 points of damage to the vehicle.' },
  10: { name: 'Alleyway',
        effect: 'The chase enters a narrow alley. A separate skill roll (no action) is required before any maneuver is resolved — failure means the vehicle is wrecked and the chase is over. The driver can cancel their maneuver and navigate the alley slowly and carefully (no roll required).' }
};

var entry = VEHICLE[result] || { name: 'Unknown', effect: 'No table entry for result ' + result + '.' };

var msg = '**[center][color=orange]CHASE OBSTACLE[/color][/center]**';
msg += '\n[center]Vehicle Chase — D10: ' + result + '[/center]';
msg += '\n**[center]' + result + '. ' + entry.name + '[/center]**';
msg += '\n[center]' + entry.effect + '[/center]';

data.roll.total = result;
api.sendMessage(msg, data.roll, [], [{ name: entry.name, tooltip: entry.effect }]);
