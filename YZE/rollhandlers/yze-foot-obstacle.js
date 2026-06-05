// YZE yze_foot_obstacle — Foot Chase Obstacle (D10), SRD p.29.
// Structure matches yze-crit.js exactly.

const dice   = (data && data.roll && data.roll.dice) || [];
let result = dice.length > 0 ? parseInt(dice[0].value, 10) : 1;
if (isNaN(result) || result < 1)  result = 1;
if (result > 10) result = 10;

const FOOT = {
  1:  { name: 'Dead End',
        effect: 'If the prey has chosen to Pursue/Flee, Hide, or Block, the maneuver fails automatically.' },
  2:  { name: 'Food Stall',
        effect: 'A food stall or market stand blocks the way. If the prey has chosen to Flee, Hide, or Block, they must first make a Force roll (no action) to crash through. If it fails, the maneuver is canceled and the prey suffers D3 points of damage.' },
  3:  { name: 'Vehicle/Cart',
        effect: 'A car or cart pulls in and blocks the way. +2 modifier to Pursue/Flee and Stand and Shoot maneuvers, but -2 to Cut Off.' },
  4:  { name: 'Crowd',
        effect: 'Crowds provide cover for the prey. Hide gets a +2 modifier. Even if the prey does not Hide, the pursuer must roll Observation (no action) or their maneuver fails. Any failed Stand and Shoot maneuver means a bystander is hit.' },
  5:  { name: 'Monks',
        effect: 'A throng of robed, chanting monks blocks the road. The prey must roll Persuasion (no action) to convince them to move. Success gives +2 to any Hide maneuver. A failed roll means the prey\'s maneuver fails automatically.' },
  6:  { name: 'Guards/Police',
        effect: 'A pair of guards or police try to block the chase, weapons drawn. -2 modifier to Pursue/Flee, Hide, and Stand and Shoot. Anyone who performs the Stand and Shoot maneuver will be attacked by the guards.' },
  7:  { name: 'Old Man',
        effect: 'An old man grabs at the pursuer and starts chattering away, clearly after money. The pursuer must give the man some money or push him away with Force. If it fails, their maneuver for the round fails automatically.' },
  8:  { name: 'Garbage',
        effect: 'There is garbage and debris all over the street, making the ground slippery. Pursue/Flee maneuvers get a -2 modifier this round, while Block gets +2.' },
  9:  { name: 'Open Space',
        effect: 'The chasers suddenly find themselves in an open space. +2 modifier to Stand and Shoot, but -2 to Hide.' },
  10: { name: 'Thugs',
        effect: 'D6 street thugs block the road, threatening violence. The prey must roll Persuasion (no action) to be allowed to pass. A failed roll means the thugs attack — the chosen maneuver fails and one thug attacks in close combat. If the Persuasion roll succeeds, the thugs will attack the pursuer instead.' }
};

const entry = FOOT[result] || { name: 'Unknown', effect: `No table entry for result ${result}.` };

let msg = '**[center][color=orange]CHASE OBSTACLE[/color][/center]**';
msg += `\n[center]Foot Chase — D10: ${result}[/center]`;
msg += `\n**[center]${result}. ${entry.name}[/center]**`;
msg += `\n[center]${entry.effect}[/center]`;

data.roll.total = result;
api.sendMessage(msg, data.roll, [], [{ name: entry.name, tooltip: entry.effect }]);
